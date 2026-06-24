package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PaymentHandler integrates N-Genius (Network International) and Tabby BNPL.
type PaymentHandler struct{ db *sql.DB }

func NewPaymentHandler(db *sql.DB) *PaymentHandler { return &PaymentHandler{db: db} }

// ── N-Genius (Network International) ─────────────────────────────────────────

type ngeniusToken struct {
	AccessToken string `json:"access_token"`
}

func ngeniusAccessToken(ctx context.Context) (string, error) {
	apiURL := getEnvOrDefault("NGENIUS_API_URL", "https://api-gateway.network.global")
	apiKey := os.Getenv("NGENIUS_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("NGENIUS_API_KEY not configured")
	}
	encoded := base64.StdEncoding.EncodeToString([]byte(apiKey))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		apiURL+"/identity/auth/access-token", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Basic "+encoded)
	req.Header.Set("Content-Type", "application/vnd.ni-identity.v1+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ngenius auth failed %d: %s", resp.StatusCode, body)
	}
	var tok ngeniusToken
	json.NewDecoder(resp.Body).Decode(&tok)
	return tok.AccessToken, nil
}

// InitiateNGeniusPayment creates an N-Genius payment order and returns the payment page URL.
// POST /api/v1/payments/ngenius
func (h *PaymentHandler) InitiateNGeniusPayment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		OrderID  string `json:"order_id" binding:"required"`
		Currency string `json:"currency"`  // AED or SAR
		Language string `json:"language"`  // en or ar
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if req.Currency == "" {
		req.Currency = "AED"
	}
	if req.Language == "" {
		req.Language = "ar"
	}

	// Fetch order total from DB (must belong to requesting user)
	row := h.db.QueryRowContext(c.Request.Context(),
		"SELECT total_amount, status FROM orders WHERE id = ? AND user_id = ?",
		req.OrderID, userID)
	var totalAmount float64
	var status string
	if err := row.Scan(&totalAmount, &status); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order_not_found"})
		return
	}
	if status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_not_payable", "status": status})
		return
	}

	outletRef := os.Getenv("NGENIUS_OUTLET_REF")
	if outletRef == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "payment_gateway_not_configured"})
		return
	}

	token, err := ngeniusAccessToken(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "payment_auth_failed"})
		return
	}

	// N-Genius amount is in minor units (fils/halalas)
	amountMinor := int64(totalAmount * 100)
	apiURL := getEnvOrDefault("NGENIUS_API_URL", "https://api-gateway.network.global")
	returnURL := getEnvOrDefault("FRONTEND_URL", "https://ghyari.sa") + "/orders/" + req.OrderID

	payload := map[string]interface{}{
		"action": "SALE",
		"amount": map[string]interface{}{
			"currencyCode": req.Currency,
			"value":        amountMinor,
		},
		"merchantAttributes": map[string]interface{}{
			"redirectUrl":        returnURL,
			"cancelUrl":          returnURL + "?payment=cancelled",
			"skipConfirmationPage": true,
		},
		"merchantOrderReference": req.OrderID,
		"language":              req.Language,
	}
	body, _ := json.Marshal(payload)

	ngReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost,
		fmt.Sprintf("%s/transactions/outlets/%s/orders", apiURL, outletRef),
		bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "request_build_error"})
		return
	}
	ngReq.Header.Set("Authorization", "Bearer "+token)
	ngReq.Header.Set("Content-Type", "application/vnd.ni-payment.v2+json")
	ngReq.Header.Set("Accept", "application/vnd.ni-payment.v2+json")

	resp, err := http.DefaultClient.Do(ngReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "payment_gateway_unreachable"})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated {
		c.JSON(http.StatusBadGateway, gin.H{"error": "payment_order_failed", "detail": string(respBody)})
		return
	}

	var ngResp struct {
		Reference string `json:"reference"`
		Links     struct {
			PaymentAuthorizationURL struct {
				Href string `json:"href"`
			} `json:"payment.authorization_url"`
		} `json:"_links"`
	}
	json.Unmarshal(respBody, &ngResp)

	// Persist gateway reference
	h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET gateway_ref = ?, payment_method = 'ngenius', updated_at = ? WHERE id = ?",
		ngResp.Reference, time.Now(), req.OrderID)

	c.JSON(http.StatusOK, gin.H{
		"payment_url":    ngResp.Links.PaymentAuthorizationURL.Href,
		"gateway_ref":    ngResp.Reference,
		"amount":         totalAmount,
		"currency":       req.Currency,
		"order_id":       req.OrderID,
	})
}

// NGeniusWebhook receives payment outcome callbacks from N-Genius.
// POST /api/v1/payments/ngenius/webhook
func (h *PaymentHandler) NGeniusWebhook(c *gin.Context) {
	secret := os.Getenv("NGENIUS_WEBHOOK_SECRET")
	if secret != "" {
		sig := c.GetHeader("X-Ni-Signature")
		body, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewReader(body))
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write(body)
		expected := hex.EncodeToString(mac.Sum(nil))
		if !hmac.Equal([]byte(sig), []byte(expected)) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_signature"})
			return
		}
	}

	var event struct {
		OrderReference string `json:"orderReference"`
		EventType      string `json:"type"`
		State          string `json:"state"`
	}
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	var newStatus string
	switch event.State {
	case "CAPTURED", "AUTHORISED":
		newStatus = "confirmed"
	case "FAILED", "CANCELLED", "REVERSED":
		newStatus = "pending" // revert so customer can retry
	default:
		c.JSON(http.StatusOK, gin.H{"received": true})
		return
	}

	h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE gateway_ref = ?",
		newStatus, event.State, time.Now(), event.OrderReference)

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// ── Tabby BNPL ────────────────────────────────────────────────────────────────

// InitiateTabbySession creates a Tabby checkout session and returns the web_url.
// POST /api/v1/payments/tabby
func (h *PaymentHandler) InitiateTabbySession(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		OrderID  string `json:"order_id" binding:"required"`
		Currency string `json:"currency"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if req.Currency == "" {
		req.Currency = "AED"
	}

	// Fetch order and buyer info
	row := h.db.QueryRowContext(c.Request.Context(), `
		SELECT o.total_amount, o.status, u.email, u.phone, u.name_ar
		FROM orders o JOIN users u ON u.id = o.user_id
		WHERE o.id = ? AND o.user_id = ?
	`, req.OrderID, userID)
	var totalAmount float64
	var status, email, phone, nameAR string
	if err := row.Scan(&totalAmount, &status, &email, &phone, &nameAR); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order_not_found"})
		return
	}
	if status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_not_payable", "status": status})
		return
	}

	secretKey := os.Getenv("TABBY_SECRET_KEY")
	if secretKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "payment_gateway_not_configured"})
		return
	}

	frontendURL := getEnvOrDefault("FRONTEND_URL", "https://ghyari.sa")
	merchantCode := getEnvOrDefault("TABBY_MERCHANT_CODE", "ghyari")

	// Fetch order items for Tabby
	rows, _ := h.db.QueryContext(c.Request.Context(), `
		SELECT p.sku, p.name_en, p.price, ci.quantity, c.name_en
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE oi.order_id = ?
	`, req.OrderID)
	defer rows.Close()
	type tabbyItem struct {
		Title      string  `json:"title"`
		Quantity   int     `json:"quantity"`
		UnitAmount float64 `json:"unit_price"`
		SKU        string  `json:"reference_id"`
		Category   string  `json:"product_url"`
	}
	var items []tabbyItem
	for rows.Next() {
		var it tabbyItem
		var category string
		rows.Scan(&it.SKU, &it.Title, &it.UnitAmount, &it.Quantity, &category)
		it.Category = category
		items = append(items, it)
	}

	payload := map[string]interface{}{
		"payment": map[string]interface{}{
			"amount":      fmt.Sprintf("%.2f", totalAmount),
			"currency":    req.Currency,
			"description": fmt.Sprintf("غياري - طلب رقم %s", req.OrderID),
			"buyer": map[string]interface{}{
				"phone":  phone,
				"email":  email,
				"name":   nameAR,
				"dob":    "1990-01-01",
			},
			"order": map[string]interface{}{
				"tax_amount":      "0.00",
				"shipping_amount": "0.00",
				"discount_amount": "0.00",
				"updated_at":      time.Now().Format(time.RFC3339),
				"reference_id":    req.OrderID,
				"items":           items,
			},
			"buyer_history": map[string]interface{}{
				"registered_since": time.Now().AddDate(-1, 0, 0).Format(time.RFC3339),
				"loyalty_level":    0,
			},
			"order_history": []interface{}{},
		},
		"lang": "ar",
		"merchant_code": merchantCode,
		"merchant_urls": map[string]string{
			"success":  frontendURL + "/orders/" + req.OrderID + "?payment=success",
			"cancel":   frontendURL + "/orders/" + req.OrderID + "?payment=cancelled",
			"failure":  frontendURL + "/orders/" + req.OrderID + "?payment=failed",
		},
	}
	body, _ := json.Marshal(payload)

	tabbyReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost,
		"https://api.tabby.ai/api/v2/checkout", bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "request_build_error"})
		return
	}
	tabbyReq.Header.Set("Authorization", "Bearer "+secretKey)
	tabbyReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(tabbyReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "tabby_unreachable"})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		c.JSON(http.StatusBadGateway, gin.H{"error": "tabby_session_failed", "detail": string(respBody)})
		return
	}

	var tabbyResp struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Configuration struct {
			AvailableProducts struct {
				Installments []struct {
					WebURL string `json:"web_url"`
				} `json:"installments"`
			} `json:"available_products"`
		} `json:"configuration"`
	}
	json.Unmarshal(respBody, &tabbyResp)

	webURL := ""
	if len(tabbyResp.Configuration.AvailableProducts.Installments) > 0 {
		webURL = tabbyResp.Configuration.AvailableProducts.Installments[0].WebURL
	}
	if webURL == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "tabby_not_available", "message": "BNPL not available for this order"})
		return
	}

	h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET gateway_ref = ?, payment_method = 'tabby', updated_at = ? WHERE id = ?",
		tabbyResp.ID, time.Now(), req.OrderID)

	c.JSON(http.StatusOK, gin.H{
		"payment_url": webURL,
		"session_id":  tabbyResp.ID,
		"amount":      totalAmount,
		"currency":    req.Currency,
		"order_id":    req.OrderID,
		"installments": 4,
	})
}

// TabbyWebhook handles Tabby payment confirmation callbacks.
// POST /api/v1/payments/tabby/webhook
func (h *PaymentHandler) TabbyWebhook(c *gin.Context) {
	var event struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Payment struct {
			OrderID string `json:"id"`
		} `json:"payment"`
	}
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	var newStatus string
	var paymentStatus string
	switch event.Status {
	case "AUTHORIZED", "CLOSED":
		newStatus = "confirmed"
		paymentStatus = event.Status
	case "REJECTED", "EXPIRED":
		newStatus = "pending"
		paymentStatus = event.Status
	default:
		c.JSON(http.StatusOK, gin.H{"received": true})
		return
	}

	h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE gateway_ref = ?",
		newStatus, paymentStatus, time.Now(), event.ID)

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// ── Cash on Delivery ──────────────────────────────────────────────────────────

// ConfirmCOD marks a pending order as COD-confirmed.
// POST /api/v1/payments/cod
func (h *PaymentHandler) ConfirmCOD(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		OrderID string `json:"order_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	result, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE orders
		SET payment_method = 'cod', payment_status = 'pending_collection',
		    status = 'confirmed', updated_at = ?
		WHERE id = ? AND user_id = ? AND status = 'pending'
	`, time.Now(), req.OrderID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order_not_found_or_not_pending"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"order_id": req.OrderID,
		"message":  "تم تأكيد الطلب بالدفع عند الاستلام / Order confirmed for Cash on Delivery",
	})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// idempotencyKey generates a deterministic key to de-duplicate webhook events.
func idempotencyKey(gatewayRef, eventType string) string {
	h := hmac.New(sha256.New, []byte("ghyari-idempotency"))
	h.Write([]byte(gatewayRef + "|" + eventType))
	return hex.EncodeToString(h.Sum(nil))
}

// storeIdempotencyKey saves an event key; returns false if already seen.
func (h *PaymentHandler) storeIdempotencyKey(ctx context.Context, key string) bool {
	id := uuid.New().String()
	_, err := h.db.ExecContext(ctx,
		"INSERT INTO webhook_events (id, idempotency_key, created_at) VALUES (?, ?, ?)",
		id, key, time.Now())
	return err == nil // unique constraint violation means already processed
}
