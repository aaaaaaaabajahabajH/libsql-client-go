# غياري (Ghyari) - Technical Architecture Document
## نظام الهندسة التقنية - Technical Architecture

**Version:** 1.0.0  
**Date:** 2026-05-25  
**Status:** Production Blueprint

---

## 1. System Overview | نظرة عامة على النظام

**غياري** is a world-class Arabic automotive parts e-commerce platform built on a modern microservices architecture. The system is designed for performance, scalability, and a premium 3D visual experience targeting the Arab automotive market.

---

## 2. High-Level Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         GHYARI PLATFORM ARCHITECTURE                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                        CLIENT LAYER                                  │   ║
║   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐  │   ║
║   │   │  Web (React) │   │ Mobile PWA  │   │  Dealer Admin Portal    │  │   ║
║   │   │  Three.js 3D │   │  RTL Arabic │   │  (React + Arabic UI)   │  │   ║
║   │   └──────┬──────┘   └──────┬──────┘   └───────────┬─────────────┘  │   ║
║   └──────────┼─────────────────┼─────────────────────┼──────────────────┘   ║
║              │                 │                       │                     ║
║   ┌──────────▼─────────────────▼───────────────────────▼──────────────────┐ ║
║   │                     API GATEWAY (Gin + JWT)                            │ ║
║   │              Rate Limiting | CORS | Auth Middleware                    │ ║
║   └───────┬──────────┬──────────┬──────────┬──────────┬────────────────────┘ ║
║           │          │          │          │          │                     ║
║   ┌───────▼──┐ ┌─────▼────┐ ┌──▼──────┐ ┌─▼──────┐ ┌▼───────────────────┐ ║
║   │ Products │ │  Orders  │ │  Users  │ │  AI    │ │   Distributors     │ ║
║   │ Service  │ │ Service  │ │ Service │ │ Radar  │ │   Service          │ ║
║   │  (Go)    │ │  (Go)    │ │  (Go)   │ │Service │ │   (Go)             │ ║
║   └───────┬──┘ └─────┬────┘ └──┬──────┘ └─┬──────┘ └┬───────────────────┘ ║
║           │          │          │          │          │                     ║
║   ┌───────▼──────────▼──────────▼──────────▼──────────▼───────────────────┐ ║
║   │                    DATA LAYER (libsql / Turso)                         │ ║
║   │         Primary DB | Read Replicas | Edge Caching                      │ ║
║   └────────────────────────────────┬──────────────────────────────────────┘ ║
║                                    │                                        ║
║   ┌────────────────────────────────▼──────────────────────────────────────┐ ║
║   │                    EXTERNAL INTEGRATIONS                               │ ║
║   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │ ║
║   │   │ Claude AI API│  │ Media Storage│  │  Payment Gateways        │   │ ║
║   │   │ (Anthropic)  │  │ (Cloudflare) │  │  (Mada, STCPay, Tabby)  │   │ ║
║   │   └──────────────┘  └──────────────┘  └──────────────────────────┘   │ ║
║   └───────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 3. Microservices Breakdown

### 3.1 Products Service (خدمة المنتجات)

**Responsibilities:**
- Full product catalog management (CRUD)
- Advanced search with Arabic/English support
- Car compatibility matrix lookups
- 3D model asset management
- Performance parts categorization
- Price management and multi-currency (SAR, AED, KWD)

**Endpoints:**
```
GET    /api/v1/products              - List products with filters
GET    /api/v1/products/:id          - Get single product
POST   /api/v1/products              - Create product (admin)
PUT    /api/v1/products/:id          - Update product (admin)
DELETE /api/v1/products/:id          - Delete product (admin)
GET    /api/v1/products/search       - Search by name/brand/car
GET    /api/v1/products/compatible   - Get parts for specific car
GET    /api/v1/products/performance  - Filter performance/tuning parts
```

**Tech:** Go + Gin, libsql, Cloudflare R2 for images

---

### 3.2 Orders Service (خدمة الطلبات)

**Responsibilities:**
- Order lifecycle management
- Cart and checkout flow
- Payment gateway integration (Mada, STCPay, Tabby BNPL)
- Order tracking
- Return/refund processing

**Endpoints:**
```
POST   /api/v1/orders                - Create order
GET    /api/v1/orders/:id            - Get order details
GET    /api/v1/orders/user/:userId   - Get user orders
PUT    /api/v1/orders/:id/status     - Update order status
POST   /api/v1/cart/add              - Add to cart
DELETE /api/v1/cart/:itemId          - Remove from cart
GET    /api/v1/cart                  - Get cart
```

---

### 3.3 AI Radar Service (رادار الذكاء الاصطناعي)

**Responsibilities:**
- Capture customer product requests
- Analyze demand patterns using Claude API
- Auto-suggest new inventory to add
- Arabic NLP for request understanding
- Competitive price intelligence
- Trending parts detection

**Endpoints:**
```
POST   /api/v1/ai/request            - Submit customer request
GET    /api/v1/ai/signals            - Get demand signals
GET    /api/v1/ai/suggestions        - Get AI inventory suggestions
POST   /api/v1/ai/analyze            - Trigger demand analysis
GET    /api/v1/ai/trending           - Get trending parts
```

---

### 3.4 Distributors Service (خدمة الموزعين)

**Responsibilities:**
- Local distributor onboarding
- Distributor catalog management
- Price comparison across distributors
- Inventory availability per distributor
- Geographic coverage mapping

**Endpoints:**
```
GET    /api/v1/distributors          - List distributors
GET    /api/v1/distributors/:id      - Get distributor profile
GET    /api/v1/distributors/:id/catalog - Get distributor catalog
POST   /api/v1/distributors/register - Register new distributor
GET    /api/v1/distributors/nearby   - Find nearby distributors
```

---

### 3.5 Users Service (خدمة المستخدمين)

**Responsibilities:**
- User registration and authentication (JWT)
- Profile management (Arabic/English)
- Garage management (user's cars)
- Wishlist and saved searches
- Notification preferences

---

## 4. AI Radar System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI RADAR SYSTEM                                   │
│                    رادار الطلب الذكي لـ غياري                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT STREAMS:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Customer Requests → Search Queries → Browse Patterns → WhatsApp   │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │              SIGNAL AGGREGATOR                                       │   │
│  │   - Deduplication  - Arabic NLP  - Car Model Extraction            │   │
│  │   - Part Category Classification  - Urgency Scoring               │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │              CLAUDE AI ANALYSIS ENGINE                              │   │
│  │   Prompt: "Analyze these automotive demand signals from Arab        │   │
│  │   market. Identify: 1) Top requested parts 2) Car model trends     │   │
│  │   3) Price sensitivity 4) Tuning vs maintenance demand..."         │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │              INVENTORY SUGGESTION ENGINE                            │   │
│  │   Output:                                                           │   │
│  │   - SKUs to add immediately (high demand, low supply)              │   │
│  │   - Parts to watch (growing demand signal)                         │   │
│  │   - Distributor sourcing recommendations                           │   │
│  │   - Price point suggestions per market                             │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │              ADMIN DASHBOARD ALERTS                                 │   │
│  │   Real-time notifications → Add to catalog → Source from distributor│  │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema Design (libsql / Turso)

### Why libsql (Turso)?
- **Edge-native:** Replicas in Riyadh, Dubai, Kuwait edge nodes
- **SQLite-compatible:** Familiar SQL, zero serialization overhead  
- **Embedded replicas:** Each service can embed a local read replica
- **Arabic text:** Full UTF-8 support for Arabic product names
- **Cost-effective:** Pay-per-use pricing ideal for startup scale

### Core Tables Overview:
```
users          → accounts, profiles, garage (cars owned)
products       → full catalog with Arabic/English fields
categories     → hierarchical product categories
car_models     → supported vehicles (Nissan, Toyota, etc.)
compatibility  → product <-> car_model junction
distributors   → local Arab market distributors
orders         → order headers
order_items    → order line items
cart_items     → shopping cart
customer_requests → AI radar input
demand_signals → aggregated demand analytics
```

---

## 6. 3D UI Technology Stack

### Frontend Stack:
```
React 18          → Component framework, RTL support
Three.js r165     → 3D rendering engine
@react-three/fiber → React renderer for Three.js
@react-three/drei  → Three.js helpers (OrbitControls, etc.)
Framer Motion 11  → 2D/3D animation, Arabic text reveal
TailwindCSS 3.4   → Utility-first styling
react-i18next     → Arabic/English internationalization
```

### 3D Visual Strategy:
- **Hero Section:** Rotating high-poly brake caliper or alloy wheel
- **Product Pages:** 360° part viewer with hotspot annotations
- **Category Scenes:** Animated engine bay environment
- **Nissan Tuning Zone:** Complete GT-R/Patrol 3D showcase

### Performance Optimization:
- DRACO compression for 3D models (>80% size reduction)
- Progressive loading with LOD (Level of Detail)
- WebGL 2.0 with instanced rendering for particle systems
- Lazy loading via React Suspense + drei's `<Preload />`

---

## 7. Color Psychology System

### Design Philosophy:
The color palette is engineered to evoke **speed, power, precision, and trust** — the emotional drivers of automotive purchase decisions.

```
PRIMARY PALETTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ████  Deep Space Black   #0A0A0F   → Background, void, premium depth
  ████  Carbon Black       #111118   → Card surfaces, elevated elements
  ████  Dark Surface       #1A1A24   → Input fields, secondary surfaces

  ████  Electric Blue      #0066FF   → Primary brand, trust, technology
  ████  Turbo Blue         #0088FF   → Hover states, interactive elements
  ████  Ice Blue           #4DA6FF   → Highlights, data visualization

  ████  Neon Orange        #FF6B00   → CTAs, urgency, energy, speed
  ████  Flame Orange       #FF8533   → Hover CTAs, warm accent
  ████  Amber Glow         #FFB347   → Ratings, achievements, gold tier

  ████  Success Green      #00FF88   → In stock, success states
  ████  Warning Red        #FF2244   → Out of stock, errors, alerts

NEUTRAL PALETTE:
  ████  Ghost White        #F0F0F8   → Primary text on dark
  ████  Silver             #A0A0B8   → Secondary text, metadata
  ████  Steel              #606078   → Disabled states, borders

SPECIAL EFFECTS:
  ━━━  Carbon Fiber Gradient: repeating-linear-gradient(45deg, #1a1a1a 0%, #2a2a2a 50%)
  ━━━  Electric Glow:         0 0 20px rgba(0, 102, 255, 0.4)
  ━━━  Neon Pulse:            0 0 30px rgba(255, 107, 0, 0.6)
  ━━━  Chrome Reflection:     linear-gradient(135deg, #888 0%, #fff 50%, #888 100%)
```

---

## 8. Security Architecture

- **JWT Authentication:** HS256, 24h access tokens, 30d refresh tokens
- **Rate Limiting:** 100 req/min per IP, 1000 req/min per authenticated user
- **Input Sanitization:** All Arabic text inputs sanitized against XSS/SQLi
- **API Keys:** Claude API key stored in environment variables only
- **HTTPS:** TLS 1.3 enforced, HSTS headers
- **CORS:** Strict origin allowlist (ghyari.sa, ghyari.ae)

---

## 9. Deployment Architecture

```
Production:
  Frontend  → Cloudflare Pages (global CDN, edge caching)
  Backend   → Fly.io (Riyadh + Dubai regions)
  Database  → Turso (primary + edge replicas in MENA region)
  Media     → Cloudflare R2 (images, 3D models, videos)
  AI        → Claude API (Anthropic, US endpoints)

Staging:
  All services on single Fly.io machine
  Turso free tier database
  
Development:
  Docker Compose (all services local)
  libsql local server
```

---

## 10. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Page Load (3G) | < 3s | Critical for KSA mobile users |
| Time to First Byte | < 200ms | Edge-cached responses |
| 3D Scene Load | < 2s | DRACO compressed models |
| Search Latency | < 50ms | libsql indexed queries |
| AI Response | < 3s | Claude API streaming |
| Lighthouse Score | > 90 | All categories |
| Core Web Vitals | Pass | LCP, FID, CLS |

---

## 11. Inter-Service Communication

### Synchronous (REST)
All client-facing requests use REST over HTTPS via the API Gateway. Services communicate with each other via internal REST calls on the private network.

### Asynchronous (Event-Driven)
Background jobs and AI radar processing use an in-process job queue (initially) with a migration path to NATS or Redpanda for scale:

```
demand_signal_created → AI Radar analyzes → suggestion_generated → Admin notified
order_placed         → Inventory decremented → Distributor notified
product_viewed       → Recommendation engine updated
```

### Error Handling Strategy
- **Retries:** Exponential backoff (3 attempts: 1s, 4s, 16s)
- **Circuit Breaker:** After 5 failures in 60s, open circuit for 30s
- **Dead Letter Queue:** Failed jobs stored in `failed_jobs` table for manual review
- **Graceful Degradation:** If Claude AI is unavailable, queue requests; if cache is down, fall through to DB

---

## 12. Observability Stack

```
Logging:   zerolog (structured JSON) → Loki → Grafana
Metrics:   Prometheus client → Prometheus → Grafana dashboards
Tracing:   OpenTelemetry → Tempo → Grafana
Alerts:    Grafana alerting → PagerDuty / WhatsApp
```

### Key Metrics to Track
| Metric | Alert Threshold |
|--------|----------------|
| API p99 latency | > 500ms |
| Error rate | > 1% |
| DB connection pool | > 80% used |
| Claude API failures | > 5% |
| Cache hit rate | < 70% |
| Disk usage (media) | > 80% |

---

*Document maintained by the غياري Engineering Team*  
*آخر تحديث: 2026-05-25*
