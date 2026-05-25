package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// DemandSignal represents a detected customer demand pattern
type DemandSignal struct {
	ID           string    `json:"id"`
	ProductName  string    `json:"product_name"`
	ProductNameAR string   `json:"product_name_ar"`
	Category     string    `json:"category"`
	CarModel     string    `json:"car_model"`
	RequestCount int       `json:"request_count"`
	Urgency      string    `json:"urgency"` // low | medium | high | critical
	Confidence   float64   `json:"confidence"`
	DetectedAt   time.Time `json:"detected_at"`
	SuggestedAction string `json:"suggested_action"`
}

// CustomerRequest captures what customers are searching/asking for
type CustomerRequest struct {
	ID        string    `json:"id"`
	Query     string    `json:"query"`      // raw customer query (Arabic/English)
	UserID    string    `json:"user_id"`
	SessionID string    `json:"session_id"`
	CarModel  string    `json:"car_model"`
	CreatedAt time.Time `json:"created_at"`
	Fulfilled bool      `json:"fulfilled"`
}

// ClaudeMessage for the Claude API
type ClaudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ClaudeRequest for Claude API
type ClaudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []ClaudeMessage `json:"messages"`
}

// ClaudeResponse from Claude API
type ClaudeResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
}

// AIRadar is the core intelligence engine
type AIRadar struct {
	claudeAPIKey string
	claudeModel  string
	httpClient   *http.Client
	scanInterval time.Duration
}

// NewAIRadar creates a new AI radar instance
func NewAIRadar() *AIRadar {
	interval := 300 * time.Second
	if v := os.Getenv("SCAN_INTERVAL"); v != "" {
		if secs, err := time.ParseDuration(v + "s"); err == nil {
			interval = secs
		}
	}
	return &AIRadar{
		claudeAPIKey: os.Getenv("CLAUDE_API_KEY"),
		claudeModel:  "claude-opus-4-7",
		httpClient:   &http.Client{Timeout: 30 * time.Second},
		scanInterval: interval,
	}
}

// AnalyzeDemand sends unmet customer requests to Claude for analysis
func (r *AIRadar) AnalyzeDemand(ctx context.Context, requests []CustomerRequest) ([]DemandSignal, error) {
	if len(requests) == 0 {
		return nil, nil
	}

	// Build prompt with all unmet requests
	var queryList strings.Builder
	for i, req := range requests {
		queryList.WriteString(fmt.Sprintf("%d. [%s] %s (سيارة: %s)\n", i+1, req.CreatedAt.Format("2006-01-02"), req.Query, req.CarModel))
	}

	prompt := fmt.Sprintf(`أنت محلل ذكاء اصطناعي متخصص في سوق قطع غيار السيارات في السعودية والخليج.

لديك القائمة التالية من طلبات العملاء التي لم تجد منتجات مطابقة في المخزون:

%s

مهمتك:
1. تحليل هذه الطلبات واستخراج أنماط الطلب
2. تجميع الطلبات المتشابهة
3. تحديد القطع ذات الطلب الأعلى
4. اقتراح المنتجات التي يجب إضافتها للمخزون

أجب بتنسيق JSON فقط، قائمة من DemandSignals:
[
  {
    "product_name": "اسم المنتج بالإنجليزية",
    "product_name_ar": "اسم المنتج بالعربية",
    "category": "consumables|performance|tuning|accessories",
    "car_model": "موديل السيارة إن وجد",
    "request_count": عدد الطلبات المشابهة,
    "urgency": "low|medium|high|critical",
    "confidence": نسبة الثقة من 0 إلى 1,
    "suggested_action": "وصف موجز للإجراء المقترح"
  }
]`, queryList.String())

	signals, err := r.askClaude(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("claude analysis failed: %w", err)
	}

	var demandSignals []DemandSignal
	if err := json.Unmarshal([]byte(signals), &demandSignals); err != nil {
		return nil, fmt.Errorf("failed to parse claude response: %w", err)
	}

	// Add metadata
	for i := range demandSignals {
		demandSignals[i].ID = fmt.Sprintf("sig_%d_%d", time.Now().Unix(), i)
		demandSignals[i].DetectedAt = time.Now()
	}

	return demandSignals, nil
}

// AnalyzeNissanTuningDemand specifically focuses on the Nissan tuning vertical
func (r *AIRadar) AnalyzeNissanTuningDemand(ctx context.Context, requests []CustomerRequest) ([]DemandSignal, error) {
	nissanRequests := filterByCarBrand(requests, "nissan")
	if len(nissanRequests) == 0 {
		return nil, nil
	}

	var queryList strings.Builder
	for i, req := range nissanRequests {
		queryList.WriteString(fmt.Sprintf("%d. %s\n", i+1, req.Query))
	}

	prompt := fmt.Sprintf(`أنت خبير متخصص في تزويد وتطوير أداء سيارات نيسان في السوق السعودي.
تشمل خبرتك: نيسان باترول، GTR، 350Z/370Z، Skyline، وكل موديلات نيسان.

طلبات العملاء المتعلقة بنيسان التي لم تجد إجابة:
%s

حلل هذه الطلبات وأجب بـ JSON قائمة من المنتجات المطلوبة، مع التركيز على:
- قطع التزويد (Turbo, Intercooler, Injectors)
- تطوير الأداء (ECU Tune, Exhaust, Suspension)
- الإكسسوارات (Body Kits, Interior, Gauges)
- القطع النادرة والأصيلة

تنسيق الإجابة: نفس تنسيق DemandSignal JSON السابق`, queryList.String())

	signals, err := r.askClaude(ctx, prompt)
	if err != nil {
		return nil, err
	}

	var demandSignals []DemandSignal
	if err := json.Unmarshal([]byte(signals), &demandSignals); err != nil {
		return nil, err
	}

	for i := range demandSignals {
		demandSignals[i].ID = fmt.Sprintf("nissan_sig_%d_%d", time.Now().Unix(), i)
		demandSignals[i].DetectedAt = time.Now()
	}

	return demandSignals, nil
}

// askClaude sends a prompt to Claude and returns the text response
func (r *AIRadar) askClaude(ctx context.Context, prompt string) (string, error) {
	reqBody := ClaudeRequest{
		Model:     r.claudeModel,
		MaxTokens: 4096,
		Messages: []ClaudeMessage{
			{Role: "user", Content: prompt},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", r.claudeAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("claude API error %d: %s", resp.StatusCode, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
		return "", err
	}

	if len(claudeResp.Content) == 0 {
		return "", fmt.Errorf("empty response from claude")
	}

	// Extract JSON from response (Claude might wrap it in markdown)
	text := claudeResp.Content[0].Text
	start := strings.Index(text, "[")
	end := strings.LastIndex(text, "]")
	if start != -1 && end != -1 && end > start {
		return text[start : end+1], nil
	}
	return text, nil
}

// Run starts the continuous radar scanning loop
func (r *AIRadar) Run(ctx context.Context) {
	log.Printf("🚀 Ghyari AI Radar started - scanning every %v", r.scanInterval)
	ticker := time.NewTicker(r.scanInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("AI Radar shutting down...")
			return
		case <-ticker.C:
			r.scan(ctx)
		}
	}
}

func (r *AIRadar) scan(ctx context.Context) {
	log.Println("🔍 AI Radar scanning for demand patterns...")

	// In production: fetch from database
	// For now: demonstrate the structure
	mockRequests := []CustomerRequest{
		{ID: "1", Query: "فلتر هواء K&N للباترول Y62", CarModel: "Nissan Patrol Y62", CreatedAt: time.Now()},
		{ID: "2", Query: "مبرد بنزين فتك للباترول", CarModel: "Nissan Patrol Y62", CreatedAt: time.Now()},
		{ID: "3", Query: "بريك Brembo لكامري 2023", CarModel: "Toyota Camry 2023", CreatedAt: time.Now()},
	}

	signals, err := r.AnalyzeDemand(ctx, mockRequests)
	if err != nil {
		log.Printf("❌ Demand analysis error: %v", err)
		return
	}

	for _, sig := range signals {
		log.Printf("📊 Demand Signal: [%s] %s (urgency: %s, confidence: %.0f%%)",
			sig.Category, sig.ProductNameAR, sig.Urgency, sig.Confidence*100)
	}

	log.Printf("✅ Radar scan complete - found %d demand signals", len(signals))
}

func filterByCarBrand(requests []CustomerRequest, brand string) []CustomerRequest {
	var filtered []CustomerRequest
	brandLower := strings.ToLower(brand)
	for _, req := range requests {
		if strings.Contains(strings.ToLower(req.CarModel), brandLower) ||
			strings.Contains(strings.ToLower(req.Query), brandLower) ||
			strings.Contains(req.Query, "نيسان") {
			filtered = append(filtered, req)
		}
	}
	return filtered
}

func main() {
	ctx := context.Background()
	radar := NewAIRadar()
	radar.Run(ctx)
}
