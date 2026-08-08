package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ghyari/api/internal/models"
)

// AIRadarHandler manages AI-powered demand intelligence endpoints
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
		claudeKey:   os.Getenv("ANTHROPIC_API_KEY"),
		claudeModel: getEnvFallback("CLAUDE_MODEL", "claude-opus-4-7"),
		httpClient:  &http.Client{Timeout: 45 * time.Second},
	}
}

// SubmitRequest godoc
// POST /api/v1/ai/requests
// Captures a customer demand signal (product not found, explicit request, etc.)
func (h *AIRadarHandler) SubmitRequest(c *gin.Context) {
	var payload models.SubmitRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_payload",
			"message": "بيانات الطلب غير صحيحة / Invalid request data",
			"details": err.Error(),
		})
		return
	}

	userID, _ := c.Get("user_id")
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	signalType := models.SignalType(payload.SignalType)
	if signalType == "" {
		signalType = models.SignalTypeSearchNotFound
	}

	req := models.CustomerRequest{
		ID:          uuid.New().String(),
		UserID:      fmt.Sprintf("%v", userID),
		SessionID:   sessionID,
		QueryRaw:    payload.QueryRaw,
		SignalType:  signalType,
		CarModelID:  payload.CarModelID,
		CarModelRaw: payload.CarModelRaw,
		IPAddress:   c.ClientIP(),
		Country:     c.GetHeader("CF-IPCountry"),
		City:        c.GetHeader("CF-IPCity"),
		IsFulfilled: false,
		CreatedAt:   time.Now(),
	}

	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO customer_requests (
			id, user_id, session_id, query_raw, signal_type,
			car_model_id, car_model_raw, ip_address, country, city,
			is_fulfilled, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		req.ID, req.UserID, req.SessionID, req.QueryRaw, string(req.SignalType),
		req.CarModelID, req.CarModelRaw, req.IPAddress, req.Country, req.City,
		req.IsFulfilled, formatSQLTime(req.CreatedAt),
	)
	if err != nil {
		log.Printf("⚠️  Failed to save customer request: %v", err)
		// Don't fail the request — this is a background capture
	}

	// Async: check if this pushes a demand signal over threshold
	go h.checkSignalThresholds(req)

	c.JSON(http.StatusCreated, gin.H{
		"message":    "طلبك محفوظ وسنضيف القطعة قريباً / Request saved, we'll add the part soon",
		"request_id": req.ID,
	})
}

// GetDemandSignals godoc
// GET /api/v1/admin/ai/signals
// Returns aggregated demand signals for admin review
func (h *AIRadarHandler) GetDemandSignals(c *gin.Context) {
	status := c.DefaultQuery("status", "new")
	urgency := c.Query("urgency")
	limit := 50

	args := []interface{}{status}
	where := "WHERE status = ?"

	if urgency != "" {
		where += " AND urgency = ?"
		args = append(args, urgency)
	}

	args = append(args, limit)

	rows, err := h.db.QueryContext(c.Request.Context(), fmt.Sprintf(`
		SELECT
			id, product_name_ar, product_name_en, category, car_brand, car_model,
			request_count_7d, request_count_30d, unique_users, urgency, confidence,
			ai_analysis, suggested_action, status, created_at
		FROM demand_signals
		%s
		ORDER BY
			CASE urgency
				WHEN 'critical' THEN 1
				WHEN 'high' THEN 2
				WHEN 'medium' THEN 3
				ELSE 4
			END,
			request_count_7d DESC
		LIMIT ?
	`, where), args...)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer func() { _ = rows.Close() }()

	var signals []models.DemandSignal
	for rows.Next() {
		var s models.DemandSignal
		var createdAt dbTime
		err := rows.Scan(
			&s.ID, &s.ProductNameAR, &s.ProductNameEN, &s.Category, &s.CarBrand, &s.CarModel,
			&s.RequestCount7d, &s.RequestCount30d, &s.UniqueUsers, &s.Urgency, &s.Confidence,
			&s.AIAnalysis, &s.SuggestedAction, &s.Status, &createdAt,
		)
		if err != nil {
			continue
		}
		s.CreatedAt = createdAt.Time()
		signals = append(signals, s)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   signals,
		"count":  len(signals),
		"filter": gin.H{"status": status, "urgency": urgency},
	})
}

// GetInventorySuggestions godoc
// GET /api/v1/admin/ai/suggestions
// Returns AI-generated inventory suggestions from AutoPullJobs
func (h *AIRadarHandler) GetInventorySuggestions(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT
			apj.id, apj.product_name_ar, apj.product_name_en, apj.category,
			apj.target_price_sar, apj.priority, apj.status, apj.ai_briefing,
			apj.created_at,
			ds.request_count_7d, ds.urgency, ds.confidence
		FROM auto_pull_jobs apj
		JOIN demand_signals ds ON ds.id = apj.demand_signal_id
		WHERE apj.status = 'pending'
		ORDER BY apj.priority DESC, apj.created_at DESC
		LIMIT 30
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	type Suggestion struct {
		ID            string              `json:"id"`
		ProductNameAR string              `json:"product_name_ar"`
		ProductNameEN string              `json:"product_name_en"`
		Category      string              `json:"category"`
		TargetPrice   float64             `json:"target_price_sar"`
		Priority      int                 `json:"priority"`
		Status        string              `json:"status"`
		AIBriefing    string              `json:"ai_briefing"`
		CreatedAt     time.Time           `json:"created_at"`
		RequestCount  int                 `json:"request_count_7d"`
		Urgency       models.UrgencyLevel `json:"urgency"`
		Confidence    float64             `json:"confidence"`
	}

	var suggestions []Suggestion
	for rows.Next() {
		var s Suggestion
		var createdAt dbTime
		if err := rows.Scan(
			&s.ID, &s.ProductNameAR, &s.ProductNameEN, &s.Category,
			&s.TargetPrice, &s.Priority, &s.Status, &s.AIBriefing,
			&createdAt, &s.RequestCount, &s.Urgency, &s.Confidence,
		); err != nil {
			continue
		}
		s.CreatedAt = createdAt.Time()
		suggestions = append(suggestions, s)
	}

	c.JSON(http.StatusOK, gin.H{"data": suggestions, "count": len(suggestions)})
}

// TriggerAnalysis godoc
// POST /api/v1/admin/ai/analyze
// Manually triggers a demand analysis run
func (h *AIRadarHandler) TriggerAnalysis(c *gin.Context) {
	var req models.AnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = models.AnalyzeRequest{TimeRange: "7d", MinCount: 3}
	}

	if req.TimeRange == "" {
		req.TimeRange = "7d"
	}

	startTime := time.Now()

	// Fetch unanalyzed requests
	timeFilter := "-7 days"
	switch req.TimeRange {
	case "24h":
		timeFilter = "-1 day"
	case "30d":
		timeFilter = "-30 days"
	}

	queryStr := fmt.Sprintf(`
		SELECT id, user_id, session_id, query_raw, car_model_raw, created_at
		FROM customer_requests
		WHERE is_fulfilled = 0
		  AND created_at >= datetime('now', '%s')
	`, timeFilter)

	if req.CarBrand != "" {
		queryStr += fmt.Sprintf(` AND (LOWER(car_model_raw) LIKE '%%%s%%' OR query_raw LIKE '%%%s%%')`,
			strings.ToLower(req.CarBrand), req.CarBrand)
	}
	queryStr += " ORDER BY created_at DESC LIMIT 200"

	rows, err := h.db.QueryContext(c.Request.Context(), queryStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer func() { _ = rows.Close() }()

	var requests []models.CustomerRequest
	for rows.Next() {
		var r models.CustomerRequest
		var createdAt dbTime
		if err := rows.Scan(&r.ID, &r.UserID, &r.SessionID, &r.QueryRaw, &r.CarModelRaw, &createdAt); err != nil {
			continue
		}
		r.CreatedAt = createdAt.Time()
		requests = append(requests, r)
	}

	if len(requests) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":           "لا توجد طلبات جديدة للتحليل / No new requests to analyze",
			"analyzed_requests": 0,
			"signals_generated": 0,
		})
		return
	}

	// Send to Claude for analysis
	signals, err := h.analyzeWithClaude(c.Request.Context(), requests, req.CarBrand)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "claude_error",
			"message": fmt.Sprintf("خطأ في تحليل الذكاء الاصطناعي / AI analysis error: %v", err),
		})
		return
	}

	// Save signals to DB and create AutoPullJobs
	jobsCreated := 0
	topSignals := []models.DemandSignal{}

	for i := range signals {
		signals[i].ID = uuid.New().String()
		signals[i].Status = "new"
		signals[i].CreatedAt = time.Now()
		signals[i].UpdatedAt = time.Now()
		signals[i].FirstSeenAt = time.Now()
		signals[i].LastSeenAt = time.Now()

		_, err := h.db.ExecContext(c.Request.Context(), `
			INSERT OR IGNORE INTO demand_signals (
				id, product_name_ar, product_name_en, category, car_brand, car_model,
				request_count_7d, urgency, confidence, ai_analysis, suggested_action,
				status, created_at, updated_at, first_seen_at, last_seen_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
		`,
			signals[i].ID, signals[i].ProductNameAR, signals[i].ProductNameEN,
			signals[i].Category, signals[i].CarBrand, signals[i].CarModel,
			signals[i].RequestCount7d, string(signals[i].Urgency), signals[i].Confidence,
			signals[i].AIAnalysis, signals[i].SuggestedAction,
			formatSQLTime(signals[i].CreatedAt), formatSQLTime(signals[i].UpdatedAt),
			formatSQLTime(signals[i].FirstSeenAt), formatSQLTime(signals[i].LastSeenAt),
		)
		if err != nil {
			log.Printf("Failed to save demand signal: %v", err)
			continue
		}

		// Create AutoPullJob for high/critical urgency
		if signals[i].Urgency == models.UrgencyHigh || signals[i].Urgency == models.UrgencyCritical {
			priority := 7
			if signals[i].Urgency == models.UrgencyCritical {
				priority = 10
			}

			jobID := uuid.New().String()
			deadline := time.Now().AddDate(0, 0, 14) // 2 weeks

			briefing := h.generateSourcingBriefing(signals[i])

			_, err := h.db.ExecContext(c.Request.Context(), `
				INSERT INTO auto_pull_jobs (
					id, demand_signal_id, priority, status,
					product_name_ar, product_name_en, category,
					target_price_sar, deadline_at, ai_briefing, created_at, updated_at
				) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
			`,
				jobID, signals[i].ID, priority,
				signals[i].ProductNameAR, signals[i].ProductNameEN, signals[i].Category,
				signals[i].EstimatedPrice, formatSQLTime(deadline), briefing,
				formatSQLTime(time.Now()), formatSQLTime(time.Now()),
			)
			if err == nil {
				jobsCreated++
			}
		}

		if len(topSignals) < 5 {
			topSignals = append(topSignals, signals[i])
		}
	}

	duration := time.Since(startTime).Milliseconds()

	c.JSON(http.StatusOK, gin.H{
		"data": models.AnalyzeResponse{
			AnalyzedRequests: len(requests),
			SignalsGenerated: len(signals),
			JobsCreated:      jobsCreated,
			TopSignals:       topSignals,
			RunAt:            time.Now(),
			DurationMs:       duration,
		},
	})
}

// GetTrending godoc
// GET /api/v1/admin/ai/trending
// Returns trending demand patterns
func (h *AIRadarHandler) GetTrending(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT
			query_raw,
			car_model_raw,
			COUNT(*) as search_count,
			COUNT(DISTINCT user_id) as unique_users,
			MAX(created_at) as last_seen
		FROM customer_requests
		WHERE created_at >= datetime('now', '-7 days')
		  AND is_fulfilled = 0
		GROUP BY query_raw, car_model_raw
		HAVING search_count >= 3
		ORDER BY search_count DESC
		LIMIT 20
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	type TrendItem struct {
		Query       string    `json:"query"`
		CarModel    string    `json:"car_model"`
		SearchCount int       `json:"search_count"`
		UniqueUsers int       `json:"unique_users"`
		LastSeen    time.Time `json:"last_seen"`
	}

	var trends []TrendItem
	for rows.Next() {
		var t TrendItem
		var lastSeen dbTime
		if err := rows.Scan(&t.Query, &t.CarModel, &t.SearchCount, &t.UniqueUsers, &lastSeen); err != nil {
			continue
		}
		t.LastSeen = lastSeen.Time()
		trends = append(trends, t)
	}

	c.JSON(http.StatusOK, gin.H{"data": trends, "period": "7d"})
}

// GetPersonalizedRecommendations godoc
// GET /api/v1/ai/recommendations/:userId
// Returns personalized product recommendations for a user
func (h *AIRadarHandler) GetPersonalizedRecommendations(c *gin.Context) {
	userID := c.Param("userId")

	// Auth check: users can only get their own recommendations
	authedUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if fmt.Sprintf("%v", authedUserID) != userID && fmt.Sprintf("%v", userRole) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// Get user's car models from garage
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT DISTINCT cm.brand, cm.model, cm.year_from
		FROM user_garage ug
		JOIN car_models cm ON cm.id = ug.car_model_id
		WHERE ug.user_id = ?
	`, userID)

	var userCars []string
	if err == nil {
		defer func() { _ = rows.Close() }()
		for rows.Next() {
			var brand, model string
			var year int
			if err := rows.Scan(&brand, &model, &year); err != nil {
				continue
			}
			userCars = append(userCars, fmt.Sprintf("%s %s %d", brand, model, year))
		}
	}

	// Get recommendations from pre-computed table, or generate on-the-fly
	recRows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT ar.product_id, ar.score, ar.reason_ar, p.name_ar, p.name_en, p.price, p.images
		FROM ai_recommendations ar
		JOIN products p ON p.id = ar.product_id
		WHERE ar.user_id = ?
		  AND ar.expires_at > datetime('now')
		  AND p.is_active = 1
		ORDER BY ar.score DESC
		LIMIT 12
	`, userID)

	type RecommendedProduct struct {
		ProductID string  `json:"product_id"`
		Score     float64 `json:"score"`
		ReasonAR  string  `json:"reason_ar"`
		NameAR    string  `json:"name_ar"`
		NameEN    string  `json:"name_en"`
		Price     float64 `json:"price"`
		Images    string  `json:"images"`
	}

	var recommendations []RecommendedProduct
	if err == nil {
		defer func() { _ = recRows.Close() }()
		for recRows.Next() {
			var r RecommendedProduct
			if err := recRows.Scan(&r.ProductID, &r.Score, &r.ReasonAR, &r.NameAR, &r.NameEN, &r.Price, &r.Images); err != nil {
				continue
			}
			recommendations = append(recommendations, r)
		}
	}

	// If no pre-computed recommendations, return popular products in user's car category
	if len(recommendations) == 0 {
		popularRows, _ := h.db.QueryContext(c.Request.Context(), `
			SELECT id, name_ar, name_en, price, images
			FROM products
			WHERE is_active = 1
			ORDER BY sold_count DESC, rating DESC
			LIMIT 12
		`)
		if popularRows != nil {
			defer func() { _ = popularRows.Close() }()
			for popularRows.Next() {
				var r RecommendedProduct
				if err := popularRows.Scan(&r.ProductID, &r.NameAR, &r.NameEN, &r.Price, &r.Images); err != nil {
					continue
				}
				r.Score = 0.5
				r.ReasonAR = "الأكثر مبيعاً"
				recommendations = append(recommendations, r)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      recommendations,
		"user_cars": userCars,
	})
}

// ─── Claude Integration ───────────────────────────────────────────────────────

type claudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	System    string          `json:"system,omitempty"`
	Messages  []claudeMessage `json:"messages"`
}

type claudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type claudeResponse struct {
	Content []struct {
		Text string `json:"text"`
		Type string `json:"type"`
	} `json:"content"`
	StopReason string `json:"stop_reason"`
}

// analyzeWithClaude sends demand signals to Claude for analysis
func (h *AIRadarHandler) analyzeWithClaude(ctx context.Context, requests []models.CustomerRequest, carBrandFilter string) ([]models.DemandSignal, error) {
	if h.claudeKey == "" {
		return h.mockAnalysis(requests), nil
	}

	// Build request list for the prompt
	var requestLines strings.Builder
	for i, r := range requests {
		carInfo := r.CarModelRaw
		if carInfo == "" {
			carInfo = "غير محدد"
		}
		requestLines.WriteString(fmt.Sprintf(
			"%d. \"%s\" | سيارة: %s | التاريخ: %s\n",
			i+1, r.QueryRaw, carInfo, r.CreatedAt.Format("2006-01-02"),
		))
	}

	systemPrompt := `أنت محلل متخصص في سوق قطع غيار السيارات في السعودية والخليج العربي.
تتمتع بخبرة عميقة في:
- سوق قطع الاستهلاك السريع (تواير، بريكات، زيوت، فلاتر، بطاريات)
- قطع التزويد والأداء العالي (تربو، إنتركولر، عادم، تعليق)
- ثقافة التزويد الخليجية وخاصة نيسان فتك (باترول، GTR، 350Z)
- الموردين والعلامات التجارية الرائجة في المنطقة

مهمتك: تحليل الطلبات وإعادة JSON نظيف بدون أي نص إضافي.`

	userPrompt := fmt.Sprintf(`حلل هذه الطلبات من عملاء منصة غياري لقطع السيارات:

%s

أعد JSON مصفوفة من demand signals:
[
  {
    "product_name_ar": "اسم القطعة بالعربي",
    "product_name_en": "Part name in English",
    "category": "consumables|performance|tuning|accessories|suspension|exhaust|electronics",
    "sub_category": "فئة فرعية محددة",
    "car_brand": "nissan|toyota|lexus|hyundai|kia|etc أو all",
    "car_model": "موديل السيارة المحدد أو all",
    "request_count_7d": عدد الطلبات المشابهة هذا الأسبوع (رقم),
    "request_count_30d": عدد الطلبات المشابهة هذا الشهر (رقم),
    "unique_users": عدد المستخدمين الفريدين (رقم),
    "urgency": "low|medium|high|critical",
    "confidence": ثقتك من 0 إلى 1,
    "estimated_price_sar": السعر التقريبي بالريال (رقم),
    "ai_analysis": "تحليل موجز لهذا الطلب وسبب الأهمية",
    "suggested_action": "الإجراء المقترح في جملة واحدة"
  }
]

اجمع الطلبات المتشابهة، ولا تكرر. ركز على القطع ذات الطلب الأعلى.`, requestLines.String())

	if carBrandFilter != "" {
		userPrompt += fmt.Sprintf("\n\nملاحظة: ركز تحديداً على سيارات %s.", carBrandFilter)
	}

	reqBody := claudeRequest{
		Model:     h.claudeModel,
		MaxTokens: 4096,
		System:    systemPrompt,
		Messages:  []claudeMessage{{Role: "user", Content: userPrompt}},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST",
		"https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", h.claudeKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := h.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("claude http error: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("claude API returned %d: %s", resp.StatusCode, string(body))
	}

	var claudeResp claudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty claude response")
	}

	rawText := claudeResp.Content[0].Text

	// Extract JSON array from response
	start := strings.Index(rawText, "[")
	end := strings.LastIndex(rawText, "]")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("no JSON array found in claude response: %s", rawText[:min(200, len(rawText))])
	}

	jsonStr := rawText[start : end+1]

	var signals []models.DemandSignal
	if err := json.Unmarshal([]byte(jsonStr), &signals); err != nil {
		return nil, fmt.Errorf("unmarshal error: %w (json: %s)", err, jsonStr[:min(300, len(jsonStr))])
	}

	return signals, nil
}

// generateSourcingBriefing creates a Claude-powered sourcing brief for a demand signal
func (h *AIRadarHandler) generateSourcingBriefing(signal models.DemandSignal) string {
	if h.claudeKey == "" {
		return fmt.Sprintf("Source %s (%s) for %s market. Estimated price: SAR %.0f. Check Japanese imports and local distributors.",
			signal.ProductNameEN, signal.Category, signal.CarModel, signal.EstimatedPrice)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	prompt := fmt.Sprintf(`أنت متخصص في توريد قطع غيار السيارات في السوق الخليجي.

المنتج المطلوب: %s (%s)
الفئة: %s
السيارة: %s %s
عدد الطلبات (أسبوعي): %d
الإلحاحية: %s
السعر المتوقع: %d ريال

اكتب ملاحظة توريد مختصرة (3-4 أسطر) تشمل:
1. المصادر المقترحة للتوريد
2. العلامات التجارية المناسبة
3. نقاط السعر
4. الجدول الزمني المقترح`,
		signal.ProductNameAR, signal.ProductNameEN,
		signal.Category, signal.CarBrand, signal.CarModel,
		signal.RequestCount7d, string(signal.Urgency),
		int(signal.EstimatedPrice),
	)

	reqBody := claudeRequest{
		Model:     h.claudeModel,
		MaxTokens: 512,
		Messages:  []claudeMessage{{Role: "user", Content: prompt}},
	}
	bodyBytes, _ := json.Marshal(reqBody)

	httpReq, err := http.NewRequestWithContext(ctx, "POST",
		"https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return signal.SuggestedAction
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", h.claudeKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := h.httpClient.Do(httpReq)
	if err != nil {
		return signal.SuggestedAction
	}
	defer func() { _ = resp.Body.Close() }()

	var claudeResp claudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil || len(claudeResp.Content) == 0 {
		return signal.SuggestedAction
	}

	return claudeResp.Content[0].Text
}

// checkSignalThresholds increments signal counters and triggers analysis if threshold met
func (h *AIRadarHandler) checkSignalThresholds(req models.CustomerRequest) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Count similar requests in last 24 hours
	var count24h int
	if err := h.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM customer_requests
		WHERE query_raw LIKE ?
		  AND created_at >= datetime('now', '-1 day')
		  AND is_fulfilled = 0
	`, "%"+getKeywords(req.QueryRaw)+"%").Scan(&count24h); err != nil {
		log.Printf("⚠️  Failed to check signal threshold: %v", err)
		return
	}

	// If > 10 similar requests in 24h, this is high urgency
	if count24h >= 10 {
		log.Printf("🚨 High demand detected: '%s' (%d requests in 24h)", req.QueryRaw, count24h)
		// In production: trigger async analysis job
	}
}

// mockAnalysis returns a mock analysis when Claude API is not configured
func (h *AIRadarHandler) mockAnalysis(requests []models.CustomerRequest) []models.DemandSignal {
	if len(requests) == 0 {
		return nil
	}
	return []models.DemandSignal{
		{
			ProductNameAR:   "فلتر هواء عالي الأداء للباترول",
			ProductNameEN:   "High Performance Air Filter for Patrol",
			Category:        "performance",
			CarBrand:        "nissan",
			CarModel:        "Patrol Y62",
			RequestCount7d:  len(requests),
			Urgency:         models.UrgencyMedium,
			Confidence:      0.75,
			EstimatedPrice:  350,
			AIAnalysis:      "Mock analysis - configure ANTHROPIC_API_KEY for real analysis",
			SuggestedAction: "Source K&N or aFe Performance air filter for Patrol Y62 VK56",
		},
	}
}

// ─── helpers ──────────────────────────────────────────────────────────────────

func getEnvFallback(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getKeywords(query string) string {
	// Extract first 20 chars as keyword for LIKE matching
	words := strings.Fields(query)
	if len(words) > 0 {
		return words[0]
	}
	return query
}
