# API Reference

**Base URL** — `https://api.ghyari.sa/api/v1` (prod) or `http://localhost:8080/api/v1` (local)

**Content-Type** — `application/json` on every request and response.

**Authentication** — most endpoints are public. Cart, orders, and user data require a JWT sent as `Authorization: Bearer <token>`. Obtain a token via [`/auth/login`](#login) or [`/auth/register`](#register).

**Rate limits** — 100 req/min per IP (unauth), 300 req/min per user (auth). `429` on exceed.

---

## Table of contents

- [Health](#health)
- [Auth](#auth)
  - [Register](#register)
  - [Login](#login)
- [Products](#products)
  - [List](#list-products)
  - [Search](#search-products)
  - [Get one](#get-product)
  - [By car compatibility](#compatible-products)
  - [Barcode lookup](#barcode-lookup)
  - [Performance parts](#performance-parts)
- [Categories](#categories)
- [Cars](#cars)
- [Cart](#cart)
- [Orders](#orders)
- [Distributors](#distributors)
- [AI Radar](#ai-radar)
- [Errors](#errors)

---

## Health

Check if the API is up and the DB is reachable.

```bash
curl -s https://api.ghyari.sa/health
```

```json
{
  "status": "healthy",
  "db": "ok",
  "uptime": "12h 34m 56s",
  "version": "1.2.0"
}
```

---

## Auth

### Register

```bash
curl -X POST https://api.ghyari.sa/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "SecurePass123",
    "name": "أحمد الغامدي",
    "phone": "+966501234567"
  }'
```

Response:

```json
{
  "user": {
    "id": "usr_a4c5b8e9",
    "email": "ahmed@example.com",
    "name": "أحمد الغامدي",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
}
```

### Login

```bash
curl -X POST https://api.ghyari.sa/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@example.com","password":"SecurePass123"}'
```

Same shape as register.

**Token lifetime** — 24 hours. Refresh by re-logging in.

---

## Products

### List products

```bash
curl "https://api.ghyari.sa/api/v1/products?page=1&limit=20&sort=newest"
```

**Query params** — all optional.

| Param | Type | Notes |
|-------|------|-------|
| `page` | int | Default `1` |
| `limit` | int | Default `20`, max `100` |
| `category` | string | Category ID or slug |
| `car_brand` | string | Brand ID (e.g. `nissan`) |
| `car_model` | string | Model ID (e.g. `patrol`) |
| `brand` | string | Part brand (e.g. `brembo`) |
| `is_featured` | bool | `true` for featured only |
| `is_performance` | bool | `true` for performance parts |
| `is_tuning` | bool | `true` for tuning parts |
| `sort` | enum | `newest` (default) · `price_asc` · `price_desc` · `rating` · `sold_count` |

Response:

```json
{
  "data": [
    {
      "id": "prd_a1b2c3",
      "name_ar": "بريكات فرامل أمامية",
      "name_en": "Front Brake Pads",
      "sku": "BR-4523",
      "brand": "Brembo",
      "price": 1200,
      "sale_price": 1000,
      "currency": "SAR",
      "stock": 42,
      "images": ["https://cdn.ghyari.sa/…"],
      "rating": 4.8,
      "review_count": 127,
      "is_performance": true,
      "is_oem": true
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 342, "total_pages": 18 }
}
```

### Search products

Full-text search across Arabic + English names, descriptions, and tags.

```bash
curl "https://api.ghyari.sa/api/v1/products/search?q=فرامل&car_brand=nissan&limit=10"
```

**Special behavior** — if `count === 0`, the query is automatically sent to [AI Radar](#ai-radar) for demand analysis.

Response:

```json
{ "data": [ … ], "count": 5, "query": "فرامل" }
```

### Get product

```bash
curl https://api.ghyari.sa/api/v1/products/prd_a1b2c3
```

Full product object with `description_ar`, `description_en`, `compatibility[]`, `tags[]`, and all metadata.

### Compatible products

Filter by car compatibility.

```bash
curl "https://api.ghyari.sa/api/v1/products/compatible?car_brand=nissan&car_model=patrol&year=2024"
```

### Barcode lookup

Used by the mobile barcode scanner.

```bash
curl https://api.ghyari.sa/api/v1/products/barcode/1234567890128
```

Returns `data: null` if the barcode is unknown.

### Performance parts

```bash
curl "https://api.ghyari.sa/api/v1/products/performance?car_brand=nissan"
```

---

## Categories

```bash
curl https://api.ghyari.sa/api/v1/categories
```

```json
{
  "categories": [
    { "id": "cat_brakes",    "slug": "brakes",    "name_ar": "الفرامل",    "name_en": "Brakes" },
    { "id": "cat_engine",    "slug": "engine",    "name_ar": "المحرك",     "name_en": "Engine" },
    …
  ]
}
```

---

## Cars

### List brands

```bash
curl https://api.ghyari.sa/api/v1/cars
```

### Models for a brand

```bash
curl https://api.ghyari.sa/api/v1/cars/nissan/models
```

Returns `[{ id, name_ar, name_en, year_from, year_to, body_type, is_popular }]`.

---

## Cart

> All cart endpoints require `Authorization: Bearer <token>`.

### Get cart

```bash
curl -H "Authorization: Bearer $TOKEN" https://api.ghyari.sa/api/v1/cart
```

### Add item

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"prd_a1b2c3","quantity":2}' \
  https://api.ghyari.sa/api/v1/cart
```

### Remove item

```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://api.ghyari.sa/api/v1/cart/prd_a1b2c3
```

---

## Orders

> All order endpoints require `Authorization: Bearer <token>`.

### Create order

Turns the current cart into an order. Server calculates `subtotal`, adds shipping (25 SAR unless subtotal ≥ 500), and clears the cart on success.

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address_ar": "الرياض، حي العليا، شارع العروبة",
    "notes_ar": "الاتصال قبل التوصيل بساعة"
  }' \
  https://api.ghyari.sa/api/v1/orders
```

Response:

```json
{
  "order": {
    "id": "ord_x8y9z0",
    "order_number": "GHY-24X891F",
    "status": "pending",
    "subtotal": 3690,
    "shipping_cost": 0,
    "total": 3690,
    "currency": "SAR"
  }
}
```

### List orders

```bash
curl -H "Authorization: Bearer $TOKEN" https://api.ghyari.sa/api/v1/orders
```

Order status progression:

```
pending → confirmed → processing → shipped → delivered
                                         ↓
                                     cancelled
```

---

## Distributors

```bash
curl https://api.ghyari.sa/api/v1/distributors
```

```json
{
  "distributors": [
    {
      "id": "dst_ryd001",
      "name_ar": "قطع غيار الرياض المتحدة",
      "city": "الرياض",
      "region": "الرياض",
      "phone": "+966501234567",
      "is_verified": true,
      "rating": 4.7
    }
  ]
}
```

---

## AI Radar

Submit a demand signal — used when a customer searches for a part that doesn't exist. The signal is queued for AI analysis and potential auto-cataloging.

```bash
curl -X POST https://api.ghyari.sa/api/v1/ai/requests \
  -H "Content-Type: application/json" \
  -d '{
    "query_raw": "بوجيهات NGK Iridium لباترول 2024",
    "car_model_raw": "Patrol 2024",
    "signal_type": "search_not_found"
  }'
```

Response is fire-and-forget: `{ "message": "recorded" }`.

More: [`docs/AI_RADAR_SPEC.md`](AI_RADAR_SPEC.md).

---

## Errors

All errors follow the same shape:

```json
{ "error": "human-readable message", "code": "product_not_found" }
```

| HTTP | Meaning | Example `code` |
|------|---------|---------------|
| `400` | Bad request / validation failed | `invalid_email` |
| `401` | Missing or invalid token | `unauthorized` |
| `403` | Authenticated but not allowed | `forbidden` |
| `404` | Resource not found | `product_not_found` |
| `409` | Conflict | `email_taken`, `insufficient_stock` |
| `429` | Rate limited | `rate_limited` |
| `500` | Server error (logged with request ID) | `internal` |

Every error response includes an `X-Request-ID` header. Include it when reporting issues to `support@ghyari.sa`.

---

## Client SDKs

- **TypeScript** — [`frontend/src/api/client.ts`](../frontend/src/api/client.ts) (web)
- **TypeScript** — [`mobile/src/api/client.ts`](../mobile/src/api/client.ts) (React Native)
- **Go** — coming soon

---

## OpenAPI

An OpenAPI 3.1 spec is on the roadmap. In the meantime this document is the authoritative source.
