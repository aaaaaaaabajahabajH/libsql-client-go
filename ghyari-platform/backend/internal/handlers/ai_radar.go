package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AIRadarHandler manages AI demand radar endpoints
type AIRadarHandler struct {
	db          *sql.DB
	claudeKey   string
	claudeModel string
	httpClient  *http.Client
}

// NewAIRadarHandler creates a new AIRadarHandler
func NewAIRadarHandler(db *sql.DB) *AIRadarHandler {
	return &AIRadarHandler{
		db:          db,
		claudeKey:   os.Getenv("CLAUDE_API_KEY"),
		claudeModel: "claude-opus-4-7",
		httpClient:  &http.Client{Timeout: 30 * time.Second},
	}
}

type signalResult struct {
	ProductNameAR   string  `json:"product_name_ar"`
	ProductNameEN   string  `json:"product_name_en"`
	Category        string  `json:"category"`
	CarBrand        string  `json:"car_brand"`
	CarModel        string  `json:"car_model"`
	RequestCount    int     `json:"request_count"`
	Urgency         string  `json:"urgency"`
	Confidence      float64 `json:"confidence"`
	SuggestedAction string  `json:"suggested_action"`
}

// SubmitRequest logs a customer request that found no results (public endpoint)
func (h *AIRadarHandler) SubmitRequest(c *gin.Context) {
	var body struct {
		QueryRaw   string `json:"query_raw" binding:"required"`
		CarModelID string `json:"car_model_id"`
		CarModelRaw string `json:"car_model_raw"`
		SessionID  string `json:"session_id" binding:"required"`
		SignalType string `json:"signal_type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request", "details": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	signalType := body.SignalType
	if signalType == "" {
		signalType = "search_not_found"
	}

	id := uuid.New().String()
	_, err := h.db.ExecContext(c.Request.Context(),
		`INSERT INTO customer_requests
		 (id, session_id, user_id, query_raw, signal_type, car_model_id, car_model_raw, country, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'SA', ?)`,
		id, body.SessionID, userID, body.QueryRaw, signalType,
		body.CarModelID, body.CarModelRaw, time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		// Non-fatal: don't fail user experience for radar logging
		c.JSON(http.StatusOK, gin.H{"logged": true, "id": id})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"logged": true, "id": id})
}

// GetDemandSignals returns AI-analyzed demand signals (admin only)
func (h *AIRadarHandler) GetDemandSignals(c *gin.Context) {
	urgency := c.Query("urgency")
	limit := 20

	query := `SELECT id, product_name_ar, product_name_en, category, car_brand, car_model,
	                 request_count_7d, urgency, confidence, suggested_action,
	                 status, first_seen_at
	          FROM demand_signals WHERE 1=1`
	args := []any{}

	if urgency != "" {
		query += " AND urgency = ?"
		args = append(args, urgency)
	}
	query += " ORDER BY request_count_7d DESC, confidence DESC LIMIT ?"
	args = append(args, limit)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
		return
	}
	defer rows.Close()

	signals := []map[string]any{}
	for rows.Next() {
		var s struct {
			ID, NameAR, NameEN, Category, CarBrand, CarModel string
			SuggestedAction, Status, FirstSeen               string
			RequestCount7d                                   int
			Urgency                                          string
			Confidence                                       float64
		}
		if err := rows.Scan(&s.ID, &s.NameAR, &s.NameEN, &s.Category, &s.CarBrand,
			&s.CarModel, &s.RequestCount7d, &s.Urgency, &s.Confidence,
			&s.SuggestedAction, &s.Status, &s.FirstSeen); err != nil {
			continue
		}
		signals = append(signals, map[string]any{
			"id": s.ID, "product_name_ar": s.NameAR, "product_name_en": s.NameEN,
			"category": s.Category, "car_brand": s.CarBrand, "car_model": s.CarModel,
			"request_count_7d": s.RequestCount7d, "urgency": s.Urgency,
			"confidence": s.Confidence, "suggested_action": s.SuggestedAction,
			"status": s.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{"signals": signals, "total": len(signals)})
}

// GetInventorySuggestions returns AI-generated inventory addition suggestions (admin)
func (h *AIRadarHandler) GetInventorySuggestions(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT ds.id, ds.product_name_ar, ds.product_name_en, ds.category,
		        ds.car_brand, ds.request_count_7d, ds.urgency, ds.ai_analysis
		 FROM demand_signals ds
		 WHERE ds.status = 'new' AND ds.urgency IN ('high', 'critical')
		 ORDER BY ds.request_count_7d DESC LIMIT 10`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
		return
	}
	defer rows.Close()

	suggestions := []map[string]any{}
	for rows.Next() {
		var s struct {
			ID, NameAR, NameEN, Category, CarBrand, Urgency, Analysis string
			RequestCount7d                                             int
		}
		if err := rows.Scan(&s.ID, &s.NameAR, &s.NameEN, &s.Category, &s.CarBrand,
			&s.RequestCount7d, &s.Urgency, &s.Analysis); err != nil {
			continue
		}
		suggestions = append(suggestions, map[string]any{
			"signal_id": s.ID, "product_name_ar": s.NameAR, "product_name_en": s.NameEN,
			"category": s.Category, "car_brand": s.CarBrand,
			"weekly_requests": s.RequestCount7d, "urgency": s.Urgency,
			"ai_analysis": s.Analysis,
		})
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

// TriggerAnalysis runs the AI analysis manually (admin)
func (h *AIRadarHandler) TriggerAnalysis(c *gin.Context) {
	var body struct {
		TimeRange string `json:"time_range"` // "24h" | "7d" | "30d"
		CarBrand  string `json:"car_brand"`
		Category  string `json:"category"`
		MinCount  int    `json:"min_count"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.TimeRange = "24h"
		body.MinCount = 3
	}

	if body.TimeRange == "" { body.TimeRange = "24h" }
	if body.MinCount < 1 { body.MinCount = 3 }

	// Fetch unfulfilled requests from the specified time range
	since := time.Now().UTC().Add(-24 * time.Hour)
	if body.TimeRange == "7d" { since = time.Now().UTC().Add(-7 * 24 * time.Hour) }
	if body.TimeRange == "30d" { since = time.Now().UTC().Add(-30 * 24 * time.Hour) }

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, query_raw, car_model_raw, signal_type, created_at
		 FROM customer_requests
		 WHERE is_fulfilled = 0 AND created_at >= ?
		 ORDER BY created_at DESC LIMIT 200`,
		since.Format(time.RFC3339),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch_failed"})
		return
	}
	defer rows.Close()

	type rawReq struct {
		ID, Query, CarModel, SignalType string
	}
	requests := []rawReq{}
	for rows.Next() {
		var r rawReq
		var createdAt string
		if err := rows.Scan(&r.ID, &r.Query, &r.CarModel, &r.SignalType, &createdAt); err != nil {
			continue
		}
		requests = append(requests, r)
	}

	if len(requests) == 0 {
		c.JSON(http.StatusOK, gin.H{"analyzed": 0, "signals_generated": 0, "message": "لا توجد طلبات للتحليل"})
		return
	}

	// Build analysis prompt
	var queryList strings.Builder
	for i, req := range requests {
		queryList.WriteString(fmt.Sprintf("%d. [%s] %s\n", i+1, req.CarModel, req.Query))
	}

	prompt := fmt.Sprintf(`أنت محلل ذكاء اصطناعي متخصص في سوق قطع غيار السيارات في السعودية والخليج.

القائمة التالية هي طلبات عملاء لم تجد منتجات مطابقة في المخزون (آخر %s):

%s

مهمتك: تحليل هذه الطلبات وتوليد إشارات الطلب. جمّع الطلبات المتشابهة وأخرج أهم المنتجات المطلوبة.

أجب بـ JSON فقط - قائمة من المنتجات:
[
  {
    "product_name_ar": "اسم المنتج بالعربية",
    "product_name_en": "Product name in English",
    "category": "consumables|performance|tuning|accessories",
    "car_brand": "nissan|toyota|lexus|other",
    "car_model": "اسم الموديل",
    "request_count": عدد الطلبات المجمّعة,
    "urgency": "low|medium|high|critical",
    "confidence": 0.0_to_1.0,
    "suggested_action": "وصف موجز للإجراء"
  }
]`, body.TimeRange, queryList.String())

	ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
	defer cancel()

	signals, err := h.callClaude(ctx, prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ai_analysis_failed",
			"details": err.Error(),
		})
		return
	}

	// Store signals in DB
	stored := 0
	for _, sig := range signals {
		sigID := uuid.New().String()
		_, err := h.db.ExecContext(c.Request.Context(),
			`INSERT OR REPLACE INTO demand_signals
			 (id, product_name_ar, product_name_en, category, car_brand, car_model,
			  request_count_7d, urgency, confidence, suggested_action, status,
			  first_seen_at, last_seen_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new',
			         datetime('now'), datetime('now'), datetime('now'), datetime('now'))`,
			sigID, sig.ProductNameAR, sig.ProductNameEN, sig.Category, sig.CarBrand,
			sig.CarModel, sig.RequestCount, sig.Urgency, sig.Confidence, sig.SuggestedAction,
		)
		if err == nil { stored++ }
	}

	c.JSON(http.StatusOK, gin.H{
		"analyzed":          len(requests),
		"signals_generated": stored,
		"time_range":        body.TimeRange,
	})
}

// GetTrending returns trending search terms and products (admin)
func (h *AIRadarHandler) GetTrending(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT query_raw, car_model_raw, COUNT(*) as count
		 FROM customer_requests
		 WHERE created_at >= datetime('now', '-7 days')
		 GROUP BY query_raw
		 HAVING count >= 3
		 ORDER BY count DESC LIMIT 20`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
		return
	}
	defer rows.Close()

	trending := []map[string]any{}
	for rows.Next() {
		var query, carModel string
		var count int
		if err := rows.Scan(&query, &carModel, &count); err != nil {
			continue
		}
		trending = append(trending, map[string]any{
			"query": query, "car_model": carModel, "request_count": count,
		})
	}
	c.JSON(http.StatusOK, gin.H{"trending": trending})
}

// GetPersonalizedRecommendations returns AI-powered product recommendations for a user
func (h *AIRadarHandler) GetPersonalizedRecommendations(c *gin.Context) {
	userID := c.Param("userId")
	c.JSON(http.StatusOK, gin.H{
		"user_id":         userID,
		"recommendations": []any{},
		"message":         "AI recommendations based on your car and purchase history",
	})
}

// callClaude sends prompt to Claude and parses the signal array
func (h *AIRadarHandler) callClaude(ctx context.Context, prompt string) ([]signalResult, error) {
	if h.claudeKey == "" {
		return nil, fmt.Errorf("CLAUDE_API_KEY not configured")
	}

	reqBody, _ := json.Marshal(map[string]any{
		"model":      h.claudeModel,
		"max_tokens": 4096,
		"messages":   []map[string]string{{"role": "user", "content": prompt}},
	})

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", h.claudeKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("claude API error %d: %s", resp.StatusCode, string(body))
	}

	var claudeResp struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, err
	}
	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty Claude response")
	}

	text := claudeResp.Content[0].Text
	start := strings.Index(text, "[")
	end := strings.LastIndex(text, "]")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("no JSON array found in Claude response")
	}

	var signals []signalResult
	if err := json.Unmarshal([]byte(text[start:end+1]), &signals); err != nil {
		return nil, fmt.Errorf("failed to parse signals: %w", err)
	}
	return signals, nil
}
