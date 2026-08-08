package models

import "time"

// SignalType represents the source of a demand signal
type SignalType string

const (
	SignalTypeSearchNotFound  SignalType = "search_not_found" // User searched, got 0 results
	SignalTypeSearchAbandoned SignalType = "search_abandoned" // User searched, didn't click results
	SignalTypeChatRequest     SignalType = "chat_request"     // User explicitly requested via chat
	SignalTypeWishlistMissing SignalType = "wishlist_missing" // User tried to wishlist but product missing
	SignalTypeWhatsApp        SignalType = "whatsapp"         // Request via WhatsApp business
	SignalTypeCompatCheck     SignalType = "compat_check"     // Compatibility check with no matching product
)

// Urgency levels for demand signals
type UrgencyLevel string

const (
	UrgencyLow      UrgencyLevel = "low"      // < 5 requests/week
	UrgencyMedium   UrgencyLevel = "medium"   // 5-20 requests/week
	UrgencyHigh     UrgencyLevel = "high"     // 20-50 requests/week
	UrgencyCritical UrgencyLevel = "critical" // 50+ requests/week
)

// CustomerRequest captures a raw, unstructured customer need
// This is the raw input to the AI Radar system
type CustomerRequest struct {
	ID           string     `json:"id" db:"id"`
	UserID       string     `json:"user_id" db:"user_id"`
	SessionID    string     `json:"session_id" db:"session_id"` // For anonymous tracking
	QueryRaw     string     `json:"query_raw" db:"query_raw"`   // Original query text
	QueryAR      string     `json:"query_ar" db:"query_ar"`     // Arabic version (normalized)
	QueryEN      string     `json:"query_en" db:"query_en"`     // English translation (if applicable)
	SignalType   SignalType `json:"signal_type" db:"signal_type"`
	CarModelID   string     `json:"car_model_id" db:"car_model_id"`   // FK to car_models
	CarModelRaw  string     `json:"car_model_raw" db:"car_model_raw"` // Raw text before normalization
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	UserAgent    string     `json:"user_agent" db:"user_agent"`
	Country      string     `json:"country" db:"country"` // SA, AE, KW, etc.
	City         string     `json:"city" db:"city"`
	IsFulfilled  bool       `json:"is_fulfilled" db:"is_fulfilled"` // Did we eventually add this product?
	FulfilledAt  *time.Time `json:"fulfilled_at,omitempty" db:"fulfilled_at"`
	FulfilledSKU string     `json:"fulfilled_sku,omitempty" db:"fulfilled_sku"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// DemandSignal is an aggregated, AI-analyzed demand pattern
// Created by the AI Radar after analyzing multiple CustomerRequests
type DemandSignal struct {
	ID              string       `json:"id" db:"id"`
	ProductNameAR   string       `json:"product_name_ar" db:"product_name_ar"`
	ProductNameEN   string       `json:"product_name_en" db:"product_name_en"`
	Category        string       `json:"category" db:"category"`
	SubCategory     string       `json:"sub_category" db:"sub_category"`
	CarBrand        string       `json:"car_brand" db:"car_brand"`
	CarModel        string       `json:"car_model" db:"car_model"`
	RequestCount24h int          `json:"request_count_24h" db:"request_count_24h"`
	RequestCount7d  int          `json:"request_count_7d" db:"request_count_7d"`
	RequestCount30d int          `json:"request_count_30d" db:"request_count_30d"`
	UniqueUsers     int          `json:"unique_users" db:"unique_users"`
	Urgency         UrgencyLevel `json:"urgency" db:"urgency"`
	Confidence      float64      `json:"confidence" db:"confidence"` // 0.0 - 1.0
	EstimatedPrice  float64      `json:"estimated_price_sar" db:"estimated_price_sar"`

	// AI-generated analysis
	AIAnalysis      string `json:"ai_analysis" db:"ai_analysis"`           // Full Claude analysis text
	SuggestedAction string `json:"suggested_action" db:"suggested_action"` // Short action item
	SupplierHints   string `json:"supplier_hints" db:"supplier_hints"`     // JSON: suggested suppliers

	// Status tracking
	Status      string     `json:"status" db:"status"` // new | reviewed | sourcing | listed | dismissed
	ReviewedBy  string     `json:"reviewed_by" db:"reviewed_by"`
	ReviewedAt  *time.Time `json:"reviewed_at,omitempty" db:"reviewed_at"`
	ReviewNotes string     `json:"review_notes" db:"review_notes"`

	// Timestamps
	FirstSeenAt time.Time `json:"first_seen_at" db:"first_seen_at"`
	LastSeenAt  time.Time `json:"last_seen_at" db:"last_seen_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// AutoPullJob represents a sourcing task generated from a DemandSignal
// The AI creates these to assign sourcing work to the team
type AutoPullJob struct {
	ID             string `json:"id" db:"id"`
	DemandSignalID string `json:"demand_signal_id" db:"demand_signal_id"` // FK
	Priority       int    `json:"priority" db:"priority"`                 // 1-10 (10 = highest)
	Status         string `json:"status" db:"status"`                     // pending | in_progress | completed | cancelled

	// What to source
	ProductNameAR    string  `json:"product_name_ar" db:"product_name_ar"`
	ProductNameEN    string  `json:"product_name_en" db:"product_name_en"`
	Category         string  `json:"category" db:"category"`
	TargetBrands     string  `json:"target_brands" db:"target_brands"` // JSON array
	TargetPriceSAR   float64 `json:"target_price_sar" db:"target_price_sar"`
	SupplierContacts string  `json:"supplier_contacts" db:"supplier_contacts"` // JSON array

	// Assignment
	AssignedTo  string     `json:"assigned_to" db:"assigned_to"` // user_id
	AssignedAt  *time.Time `json:"assigned_at,omitempty" db:"assigned_at"`
	DeadlineAt  *time.Time `json:"deadline_at,omitempty" db:"deadline_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	ResultSKU   string     `json:"result_sku" db:"result_sku"` // SKU added if completed

	// Notification
	NotifyUsers string `json:"notify_users" db:"notify_users"` // JSON array of user_ids to notify on completion

	// AI context
	AIBriefing string `json:"ai_briefing" db:"ai_briefing"` // Full Claude-generated sourcing brief

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// AIRecommendation is a personalized product recommendation for a user
type AIRecommendation struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	ProductID  string    `json:"product_id" db:"product_id"`
	Score      float64   `json:"score" db:"score"`   // 0.0 - 1.0
	Reason     string    `json:"reason" db:"reason"` // Why this was recommended
	ReasonAR   string    `json:"reason_ar" db:"reason_ar"`
	AlgorithmV string    `json:"algorithm_version" db:"algorithm_version"`
	Shown      bool      `json:"shown" db:"shown"`
	Clicked    bool      `json:"clicked" db:"clicked"`
	Converted  bool      `json:"converted" db:"converted"` // Resulted in purchase
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	ExpiresAt  time.Time `json:"expires_at" db:"expires_at"`
}

// AnalyzeRequest is the payload for the AI analysis endpoint
type AnalyzeRequest struct {
	TimeRange string `json:"time_range"` // "24h" | "7d" | "30d"
	Category  string `json:"category,omitempty"`
	CarBrand  string `json:"car_brand,omitempty"`
	MinCount  int    `json:"min_count,omitempty"` // Minimum request count to analyze
}

// AnalyzeResponse is the result of an AI analysis run
type AnalyzeResponse struct {
	AnalyzedRequests int            `json:"analyzed_requests"`
	SignalsGenerated int            `json:"signals_generated"`
	JobsCreated      int            `json:"jobs_created"`
	TopSignals       []DemandSignal `json:"top_signals"`
	RunAt            time.Time      `json:"run_at"`
	DurationMs       int64          `json:"duration_ms"`
}

// SubmitRequestPayload is the JSON body for POST /ai/requests
type SubmitRequestPayload struct {
	QueryRaw    string `json:"query" binding:"required,min=2,max=500"`
	CarModelID  string `json:"car_model_id,omitempty"`
	CarModelRaw string `json:"car_model_raw,omitempty"`
	SignalType  string `json:"signal_type,omitempty"` // Defaults to "search_not_found"
}
