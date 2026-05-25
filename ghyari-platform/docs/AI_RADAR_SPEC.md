# غياري AI Radar System — Full Technical Specification
## مواصفات نظام الرادار الذكي

**Version:** 1.0.0  
**Date:** 2026-05-25  
**Status:** Implementation Ready

---

## 1. System Overview / نظرة عامة

The AI Radar is the competitive core of the غياري platform. It transforms customer frustration (unfulfilled product searches) into business intelligence by:

1. **Capturing** every unfulfilled search, request, or signal
2. **Aggregating** similar signals into patterns
3. **Analyzing** patterns using Claude AI
4. **Generating** inventory recommendations with priority scores
5. **Notifying** customers when their requested products arrive

This creates a **virtuous feedback loop**: more requests → better inventory → more sales → more customers → more requests.

---

## 2. Signal Types & Data Sources / أنواع الإشارات

### 2.1 Primary Signals

| Signal Type | Arabic | Description | Weight |
|------------|--------|-------------|--------|
| `search_not_found` | بحث بدون نتائج | User searched and got 0 results | 3x |
| `search_abandoned` | بحث مهجور | User searched, saw results but left quickly (< 5 sec) | 1x |
| `chat_request` | طلب مباشر | User explicitly asked via chat/WhatsApp | 5x |
| `wishlist_missing` | رغبة بدون منتج | User clicked wishlist but product doesn't exist | 4x |
| `compat_check_fail` | توافق غير موجود | Car compatibility check returned no products | 3x |
| `whatsapp_request` | طلب واتساب | Inbound WhatsApp message requesting a part | 5x |

### 2.2 Secondary Signals (Phase 2)
- Instagram/TikTok comment mentions
- Google Search Console queries landing on 404
- Abandoned cart items (distributor out of stock)
- Return reason: "Wrong part - correct part not available"

---

## 3. Signal Capture Architecture / معمارية التقاط الإشارات

```
╔══════════════════════════════════════════════════════════════════════╗
║                    SIGNAL CAPTURE FLOW                               ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Frontend Events (React)                                             ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                                                             │    ║
║  │  User Types Search Query                                    │    ║
║  │        │                                                    │    ║
║  │        ▼                                                    │    ║
║  │  API call → GET /products/search?q={query}                  │    ║
║  │        │                                                    │    ║
║  │        ▼                                                    │    ║
║  │  results.length === 0 ?                                     │    ║
║  │     YES → POST /ai/requests {query, car_model, signal_type} │    ║
║  │     NO  → Log search (async, no blocking)                   │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  Backend Processing (Go)                                             ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                                                             │    ║
║  │  POST /ai/requests                                          │    ║
║  │        │                                                    │    ║
║  │        ▼                                                    │    ║
║  │  Validate & Sanitize (Arabic + English input)               │    ║
║  │        │                                                    │    ║
║  │        ▼                                                    │    ║
║  │  Store in customer_requests table                           │    ║
║  │        │                                                    │    ║
║  │        ▼                                                    │    ║
║  │  async: checkSignalThresholds()                             │    ║
║  │    → COUNT similar queries in last 24h                      │    ║
║  │    → If > threshold: trigger analysis job                   │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 4. Arabic NLP Pipeline / معالجة اللغة العربية

### 4.1 The Arabic Challenge

Arabic automotive queries present unique NLP challenges:

**Dialect Variation:**
- Gulf (Saudi/Emirati): "بريك" = brakes, "إطار" = tire
- Egyptian: "فرامل" = brakes, "كاوتش" = tire
- Levantine: "فرملة" = brakes, "دولاب" = tire

**Transliteration Mixing:**
- "GTR" and "جي تي ار" and "جتر" all mean the same thing
- "Patrol" and "باترول" and "بترول"
- "Brembo" and "بريمبو" and "بريمبوه"

**Shorthand and Slang:**
- "Y62" = Nissan Patrol Y62
- "فتك" (fatak) = fast/aggressive modification
- "مود" (mod) = modification
- "تزويد" (tazweed) = performance upgrade/tuning

### 4.2 Normalization Strategy

```go
// Phase 1: Character normalization
func normalizeArabic(query string) string {
    // Normalize Arabic characters
    // ا/أ/إ/آ → ا (alef variations)
    // ة → ه (taa marbuta)
    // ى → ي (alef maqsura)
    // Remove diacritics (harakat)
    // Normalize lamedh-alef forms
    return normalized
}

// Phase 2: Term extraction
func extractCarTerms(query string) CarTerms {
    // Match against known car model dictionary
    // nissan_models: [باترول, باترل, patrol, y62, y61, gtr, r35, ...]
    // toyota_models: [لاند كروزر, landcruiser, LC200, كامري, camry, ...]
    // Match against part category dictionary
    // brakes: [بريك, فرامل, فرملة, بريكات, brake, brakes, ...]
    // tires: [إطار, تاير, كاوتش, دولاب, tire, tyre, tires, ...]
}

// Phase 3: Intent classification
func classifyIntent(query string) Intent {
    // Performance: contains [تزويد, فتك, أداء, تعديل, performance, mod, upgrade]
    // Consumable: contains [استبدال, تغيير, توقف, replacement, change, worn]
    // Price check: contains [كم سعر, بكم, price, how much, كم ثمنه]
    // Availability: contains [موجود, متوفر, عندكم, in stock, available]
}
```

### 4.3 Arabic Car Term Dictionary

```json
{
  "car_makes": {
    "nissan": ["نيسان", "نيسن", "nissan"],
    "toyota": ["تويوتا", "تيوتا", "toyota"],
    "lexus": ["لكزس", "لكسوس", "lexus"],
    "mitsubishi": ["ميتسوبيشي", "ميتسوبيشى", "mitsubishi"]
  },
  "car_models": {
    "patrol_y62": ["باترول Y62", "باترول واي62", "patrol y62", "باترول الجديد", "باترول 2010+"],
    "land_cruiser_200": ["لاند كروزر 200", "LC200", "لاند كروزر ٢٠٠", "كروزر 200"],
    "gtr_r35": ["GTR", "جي تي ار", "جتر", "R35", "GT-R", "غي تي ار"]
  },
  "part_categories": {
    "brakes": ["بريك", "بريكات", "فرامل", "فرملة", "brake", "brakes"],
    "tires": ["إطار", "إطارات", "تاير", "تايرات", "كاوتش", "دولاب", "tire", "tires"],
    "air_filter": ["فلتر هواء", "فيلتر هواء", "air filter", "فلتر K&N", "كيان"],
    "intercooler": ["مبرد شحن", "إنتركولر", "intercooler", "مبرد تورو"],
    "exhaust": ["عادم", "بروز", "شكمان", "exhaust", "catback", "downpipe"]
  }
}
```

---

## 5. Claude API Integration Flow / تدفق تكامل Claude API

### 5.1 Analysis Trigger Conditions

The AI analysis runs in three modes:

| Mode | Trigger | Frequency |
|------|---------|-----------|
| **Real-time threshold** | > 10 identical queries in 1 hour | Immediate async |
| **Scheduled batch** | Cron: every 6 hours | Every 6h |
| **Manual trigger** | Admin clicks "Analyze Now" | On-demand |

### 5.2 Prompt Engineering

#### System Prompt (Cached — saves tokens)
```
You are an AI analyst specialized in the Arab automotive aftermarket, 
particularly in the Gulf Cooperation Council countries (Saudi Arabia, UAE, 
Kuwait, Bahrain, Qatar, Oman).

Your deep expertise covers:
1. Arab car culture and popular vehicles (Nissan Patrol, Toyota Land Cruiser, 
   Nissan GT-R/350Z/370Z, Lexus LX, GMC Yukon)
2. The Nissan tuning scene ("نيسان فتك" culture) including JDM parts
3. GCC market pricing (SAR, AED), import costs, and margins
4. Arabic automotive terminology across Gulf and Egyptian dialects
5. Distributor networks in Riyadh, Jeddah, Dammam, Dubai, Abu Dhabi

When analyzing demand signals, consider:
- Seasonal patterns (Eid holiday shopping, summer travel preparation)
- Social media trends (Instagram car culture, TikTok modifications)
- JDM import availability and costs
- Local vs. imported part economics
- Urban (city driving) vs. desert/offroad use cases

Always respond with valid JSON only, no markdown or explanations outside the JSON structure.
```

#### User Prompt Template
```
Analyze these {{count}} unmet customer requests from our automotive parts platform 
(Arab market, primarily Saudi Arabia):

REQUESTS:
{{formatted_request_list}}

Generate demand signals for inventory recommendations.

Required JSON format (array):
[
  {
    "product_name_ar": "اسم المنتج بالعربي",
    "product_name_en": "Product name in English",
    "category": "consumables|performance|tuning|accessories|suspension|exhaust|electronics",
    "sub_category": "specific subcategory",
    "car_brand": "nissan|toyota|lexus|hyundai|kia|all",
    "car_model": "Specific model or 'all'",
    "request_count_7d": <integer>,
    "request_count_30d": <integer>,
    "unique_users": <integer>,
    "urgency": "low|medium|high|critical",
    "confidence": <float 0.0-1.0>,
    "estimated_price_sar": <float>,
    "ai_analysis": "2-3 sentence analysis in Arabic and English",
    "suggested_action": "One-line action item",
    "supplier_hints": ["Supplier1", "Supplier2"]
  }
]

Rules:
- Group similar requests into single signals
- Only include items not commonly found in Arab market
- Mark Nissan tuning parts as "critical" if > 5 requests
- Estimate prices in SAR based on import costs + 30% margin
```

### 5.3 Response Processing

```go
func processClaudeResponse(rawText string) ([]DemandSignal, error) {
    // Step 1: Extract JSON from response
    // Claude sometimes wraps in markdown code blocks
    jsonStart := strings.Index(rawText, "[")
    jsonEnd := strings.LastIndex(rawText, "]")
    
    if jsonStart == -1 || jsonEnd <= jsonStart {
        // Try object wrapper: {"signals": [...]}
        start := strings.Index(rawText, "{")
        if start != -1 {
            // Parse as object and extract signals array
        }
        return nil, ErrNoJSONFound
    }
    
    // Step 2: Validate and unmarshal
    var signals []DemandSignal
    if err := json.Unmarshal([]byte(rawText[jsonStart:jsonEnd+1]), &signals); err != nil {
        // Log raw response for debugging
        // Attempt partial parse
        return nil, fmt.Errorf("unmarshal: %w", err)
    }
    
    // Step 3: Post-processing
    for i := range signals {
        // Validate urgency
        signals[i].Urgency = normalizeUrgency(signals[i].Urgency)
        
        // Clamp confidence
        if signals[i].Confidence > 1.0 { signals[i].Confidence = 1.0 }
        if signals[i].Confidence < 0.0 { signals[i].Confidence = 0.0 }
        
        // Validate category
        if !isValidCategory(signals[i].Category) {
            signals[i].Category = "accessories"
        }
        
        // Add metadata
        signals[i].ID = uuid.New().String()
        signals[i].DetectedAt = time.Now()
        signals[i].Status = "new"
    }
    
    return signals, nil
}
```

---

## 6. Auto-Pull Job Generation / إنشاء وظائف الجلب التلقائي

When a DemandSignal with urgency `high` or `critical` is created, the system automatically generates an AutoPullJob:

### 6.1 Job Priority Scoring

```
Base Score from Urgency:
  critical → 9
  high     → 7
  medium   → 4
  low      → 1

Modifiers:
  + 1 if car_brand = "nissan" (strategic priority)
  + 1 if unique_users > 20
  + 1 if confidence > 0.85
  - 1 if similar SKU exists within 70% string match
  
Final Priority: clamped 1-10
```

### 6.2 Sourcing Brief Generation

The system calls Claude again with a focused prompt to generate a sourcing brief:

```
You are an automotive parts sourcing specialist for the Arab Gulf market.

SOURCING REQUEST:
Product: {product_name_ar} ({product_name_en})
Category: {category}
Target Vehicle: {car_brand} {car_model}
Weekly demand signals: {request_count_7d}
Urgency: {urgency}
Target price: SAR {estimated_price_sar}

Generate a brief sourcing guide (max 200 words) covering:
1. Top 3 recommended suppliers/brands
2. Typical import cost range (SAR)
3. Local distributors who may already stock this
4. Timeline to source and list (optimistic / realistic)
5. Potential challenges (import restrictions, availability)

Write in Arabic first, then English summary.
```

---

## 7. Customer Notification System / نظام إشعار العملاء

When a demand signal results in a product being listed, all users who submitted matching requests receive a notification:

### 7.1 Notification Channels

| Channel | When Used | Open Rate |
|---------|-----------|-----------|
| **WhatsApp** | Primary — all users with phone | ~60-70% |
| **Push Notification** | Users with app installed | ~35-45% |
| **Email** | Fallback for users without WhatsApp | ~25-30% |
| **In-App** | Always, shown on next visit | ~80% |

### 7.2 Notification Templates

**WhatsApp Message (Arabic):**
```
مرحباً {name}! 👋

القطعة اللي طلبتها وصلت على منصة غياري 🎉

📦 {product_name_ar}
💰 السعر: {price} ريال
🚗 مناسبة لـ: {car_model}
✅ متوفرة في المخزون

🛒 اشتري الآن: ghyari.sa/p/{sku}

فريق غياري
```

**Push Notification:**
```
Title: "القطعة اللي طلبتها وصلت! 🎉"
Body: "{product_name_ar} - {price} ريال"
Icon: product image
Action URL: /products/{product_id}
```

---

## 8. Analytics Dashboard / لوحة التحليلات

The admin dashboard shows:

### 8.1 Demand Overview
- **Top 10 unmet queries this week** (sorted by request count)
- **Demand heatmap** by car model × category
- **Geographic demand** (Riyadh vs. Jeddah vs. UAE)
- **Trend chart** of daily unfulfilled searches

### 8.2 Signal Status Funnel
```
Customer Requests (raw)    ████████████████  1,240
Grouped Signals           ████████████       847  (68%)
Analyzed by AI            ████████           612  (72%)
Demand Signals Created    ██████             256  (42%)
Auto-Pull Jobs Created     ████              89   (35%)
Products Listed            ██               34   (38%)
Customers Notified         ██               34 signals → 567 notifications
Re-purchase Conversions    █                128  (23% of notified)
```

### 8.3 AI Accuracy Metrics
- **Signal → Purchase rate:** % of demand signals that result in product purchase within 30 days
- **Urgency calibration:** Track if critical signals actually have high conversion
- **Confidence calibration:** Correlation between confidence score and actual demand

---

## 9. Performance & Scale / الأداء والتوسع

### 9.1 Resource Costs

| Operation | Frequency | Claude tokens used | Monthly cost (est.) |
|-----------|-----------|-------------------|---------------------|
| Batch demand analysis | 4x/day | ~2,000 input + 1,500 output | $18 |
| Sourcing briefs | 20/month | ~500 input + 400 output | $3 |
| Real-time threshold alerts | ~10/day | ~800 input + 600 output | $8 |
| **Total** | | | **~$29/month** |

*Note: Using Claude claude-opus-4-7. Costs scale linearly with request volume.*

### 9.2 Optimization Strategies

1. **Prompt Caching:** System prompt is static → cache with Anthropic's 5-minute cache → 90% token savings on system prompt
2. **Request Batching:** Accumulate requests for 6 hours, analyze in bulk rather than individually
3. **Deduplication:** Before sending to Claude, deduplicate similar queries using fuzzy matching (Levenshtein distance < 3)
4. **Result Caching:** Cache Claude's analysis for similar signal groups for 24 hours

### 9.3 Fallback Behavior (No Claude API)

If `ANTHROPIC_API_KEY` is not set or API is unavailable:
1. Log all customer requests normally to database
2. Return a simple frequency-sorted top-10 list from database queries
3. Alert admin that AI analysis is degraded
4. Queue requests for when API returns

---

## 10. Privacy & Compliance / الخصوصية والامتثال

### PDPL Compliance (Saudi Arabia Personal Data Protection Law)

1. **IP Address:** Stored only for rate limiting, auto-deleted after 30 days
2. **User ID:** Linked to requests for personalization, anonymized in AI prompts
3. **Query Data:** Used for demand analysis only, not shared with third parties
4. **WhatsApp Notifications:** Require explicit opt-in during registration
5. **Data Retention:** Customer requests older than 12 months are anonymized

### What We NEVER Send to Claude API
- User names or emails
- Phone numbers
- Order history
- Payment information
- Full IP addresses (we send country only)

---

*Specification authored by غياري Engineering Team*  
*آخر تحديث: مايو 2026*
