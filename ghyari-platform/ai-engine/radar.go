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
	"os/signal"
	"strings"
	"syscall"
	"time"
)

// DemandSignal represents a detected customer demand pattern
type DemandSignal struct {
	ID              string    `json:"id"`
	ProductName     string    `json:"product_name"`
	ProductNameAR   string    `json:"product_name_ar"`
	Category        string    `json:"category"`
	CarModel        string    `json:"car_model"`
	RequestCount    int       `json:"request_count"`
	Urgency         string    `json:"urgency"` // low | medium | high | critical
	Confidence      float64   `json:"confidence"`
	DetectedAt      time.Time `json:"detected_at"`
	SuggestedAction string    `json:"suggested_action"`
}

// CustomerRequest captures what customers are searching/asking for
type CustomerRequest struct {
	ID        string    `json:"id"`
	Query     string    `json:"query"` // raw customer query (Arabic/English)
	UserID    string    `json:"user_id"`
	SessionID string    `json:"session_id"`
	CarModel  string    `json:"car_model"`
	CreatedAt time.Time `json:"created_at"`
	Fulfilled bool      `json:"fulfilled"`
}

// ClaudeMessage for the Claude API. Content is either a plain string (a
// simple user prompt) or a []ContentBlock (assistant tool_use echoes and
// tool_result turns), matching what the Messages API accepts in either
// position.
type ClaudeMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

// ContentBlock is one block of a Claude message: text, a tool_use request
// from Claude, or a tool_result we're feeding back to it.
type ContentBlock struct {
	Type string `json:"type"`

	// type: "text"
	Text string `json:"text,omitempty"`

	// type: "tool_use" (from Claude)
	ID    string          `json:"id,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`

	// type: "tool_result" (to Claude)
	ToolUseID string `json:"tool_use_id,omitempty"`
	Content   string `json:"content,omitempty"`
	IsError   bool   `json:"is_error,omitempty"`
}

// ClaudeTool describes one callable tool in Claude Messages API format.
type ClaudeTool struct {
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	InputSchema json.RawMessage `json:"input_schema"`
}

// ClaudeRequest for Claude API
type ClaudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []ClaudeMessage `json:"messages"`
	Tools     []ClaudeTool    `json:"tools,omitempty"`
}

// ClaudeResponse from Claude API
type ClaudeResponse struct {
	Content    []ContentBlock `json:"content"`
	StopReason string         `json:"stop_reason"`
}

// maxToolRounds bounds how many Claude <-> MCP tool round-trips askClaude
// will run before giving up, so a misbehaving tool loop can't run forever.
const maxToolRounds = 5

// AIRadar is the core intelligence engine
type AIRadar struct {
	claudeAPIKey string
	claudeModel  string
	httpClient   *http.Client
	scanInterval time.Duration
	mcpRegistry  *MCPToolRegistry
}

// NewAIRadar creates a new AI radar instance and connects to any MCP
// servers configured via MCP_SERVERS.
func NewAIRadar(ctx context.Context) *AIRadar {
	interval := 300 * time.Second
	if v := os.Getenv("SCAN_INTERVAL"); v != "" {
		if secs, err := time.ParseDuration(v + "s"); err == nil {
			interval = secs
		}
	}

	mcpConfigs, err := LoadMCPServersFromEnv()
	if err != nil {
		log.Printf("⚠️  Invalid MCP_SERVERS config, continuing without MCP tools: %v", err)
	}

	return &AIRadar{
		claudeAPIKey: os.Getenv("ANTHROPIC_API_KEY"),
		claudeModel:  "claude-opus-4-7",
		httpClient:   &http.Client{Timeout: 30 * time.Second},
		scanInterval: interval,
		mcpRegistry:  NewMCPToolRegistry(ctx, mcpConfigs),
	}
}

// Close releases resources held by the radar, including any MCP server
// subprocesses started by NewAIRadar.
func (r *AIRadar) Close() {
	r.mcpRegistry.Close()
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

// askClaude sends a prompt to Claude and returns its final text response.
// When MCP servers are configured, Claude may request one or more tool
// calls in between — those are executed against the connected MCP servers
// and fed back as tool_results until Claude produces a final answer or
// maxToolRounds is hit.
func (r *AIRadar) askClaude(ctx context.Context, prompt string) (string, error) {
	messages := []ClaudeMessage{{Role: "user", Content: prompt}}
	tools := r.mcpRegistry.ClaudeTools()

	for round := 0; round < maxToolRounds; round++ {
		resp, err := r.callClaude(ctx, messages, tools)
		if err != nil {
			return "", err
		}
		if len(resp.Content) == 0 {
			return "", fmt.Errorf("empty response from claude")
		}
		if resp.StopReason != "tool_use" {
			return extractJSONArray(textFromContent(resp.Content)), nil
		}

		messages = append(messages, ClaudeMessage{Role: "assistant", Content: resp.Content})

		var results []ContentBlock
		for _, block := range resp.Content {
			if block.Type != "tool_use" {
				continue
			}
			log.Printf("🔧 Claude requested MCP tool %q", block.Name)
			output, callErr := r.mcpRegistry.CallTool(ctx, block.Name, block.Input)
			isErr := callErr != nil
			if callErr != nil {
				output = callErr.Error()
			}
			results = append(results, ContentBlock{
				Type:      "tool_result",
				ToolUseID: block.ID,
				Content:   output,
				IsError:   isErr,
			})
		}
		messages = append(messages, ClaudeMessage{Role: "user", Content: results})
	}

	return "", fmt.Errorf("exceeded %d tool-use rounds without a final answer", maxToolRounds)
}

// callClaude makes one Messages API request and returns the raw response.
func (r *AIRadar) callClaude(ctx context.Context, messages []ClaudeMessage, tools []ClaudeTool) (*ClaudeResponse, error) {
	reqBody := ClaudeRequest{
		Model:     r.claudeModel,
		MaxTokens: 4096,
		Messages:  messages,
		Tools:     tools,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", r.claudeAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("claude API error %d: %s", resp.StatusCode, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
		return nil, err
	}
	return &claudeResp, nil
}

// textFromContent concatenates the text blocks of a Claude response.
func textFromContent(blocks []ContentBlock) string {
	var sb strings.Builder
	for _, b := range blocks {
		if b.Type == "text" {
			sb.WriteString(b.Text)
		}
	}
	return sb.String()
}

// extractJSONArray pulls out the first top-level JSON array in text, since
// Claude sometimes wraps the requested JSON in markdown or commentary.
func extractJSONArray(text string) string {
	start := strings.Index(text, "[")
	end := strings.LastIndex(text, "]")
	if start != -1 && end != -1 && end > start {
		return text[start : end+1]
	}
	return text
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
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	radar := NewAIRadar(ctx)
	defer radar.Close()

	radar.Run(ctx)
}
