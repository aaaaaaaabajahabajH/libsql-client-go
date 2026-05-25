-- ============================================================================
-- GHYARI PLATFORM - Complete Database Schema
-- قاعدة بيانات منصة غياري
-- Database: libSQL (Turso) - SQLite-compatible
-- Version: 1.0.0
-- Date: 2026-05-25
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA encoding = 'UTF-8';

-- ============================================================================
-- USERS & AUTHENTICATION
-- المستخدمون والمصادقة
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    phone           TEXT,
    name_ar         TEXT NOT NULL,                  -- الاسم بالعربي
    name_en         TEXT,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'customer', -- customer | admin | distributor
    avatar_url      TEXT,
    preferred_lang  TEXT NOT NULL DEFAULT 'ar',     -- ar | en
    is_verified     INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    last_login_at   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================================================
-- USER GARAGE (owned cars)
-- مرآب المستخدم - سياراته
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_garage (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_model_id    TEXT NOT NULL REFERENCES car_models(id),
    year            INTEGER NOT NULL,
    nickname        TEXT,                           -- e.g. "باترولي الأبيض"
    is_primary      INTEGER NOT NULL DEFAULT 0,
    added_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_garage_user ON user_garage(user_id);

-- ============================================================================
-- CAR MODELS
-- موديلات السيارات
-- ============================================================================

CREATE TABLE IF NOT EXISTS car_models (
    id              TEXT PRIMARY KEY,
    make            TEXT NOT NULL,                  -- nissan, toyota, lexus, etc.
    model           TEXT NOT NULL,                  -- Patrol, Land Cruiser, etc.
    model_ar        TEXT NOT NULL,                  -- باترول، لاند كروزر
    generation      TEXT,                           -- Y62, 200 Series, etc.
    year_from       INTEGER NOT NULL,
    year_to         INTEGER,                        -- NULL = current production
    body_type       TEXT,                           -- SUV, Sedan, Pickup, Coupe
    engine_options  TEXT,                           -- JSON: ["4.0L V6", "5.6L V8"]
    transmission    TEXT,                           -- AT, MT, CVT
    drive_type      TEXT,                           -- 4WD, RWD, FWD, AWD
    popular_in_ar   INTEGER NOT NULL DEFAULT 1,     -- Popular in Arab market
    tuning_popular  INTEGER NOT NULL DEFAULT 0,     -- Popular in tuning scene
    image_url       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_car_make ON car_models(make);
CREATE INDEX IF NOT EXISTS idx_car_model ON car_models(model);
CREATE INDEX IF NOT EXISTS idx_car_popular ON car_models(popular_in_ar);

-- ============================================================================
-- CATEGORIES
-- فئات المنتجات
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id              TEXT PRIMARY KEY,
    name_ar         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    parent_id       TEXT REFERENCES categories(id),
    type            TEXT NOT NULL DEFAULT 'standard', -- standard | performance | tuning
    description_ar  TEXT,
    description_en  TEXT,
    icon_url        TEXT,
    banner_url      TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    product_count   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- DISTRIBUTORS
-- الموزعون المعتمدون
-- ============================================================================

CREATE TABLE IF NOT EXISTS distributors (
    id                  TEXT PRIMARY KEY,
    name_ar             TEXT NOT NULL,
    name_en             TEXT NOT NULL,
    slug                TEXT UNIQUE NOT NULL,
    description_ar      TEXT,
    description_en      TEXT,
    city                TEXT NOT NULL,
    region              TEXT NOT NULL,              -- Riyadh, Jeddah, Dammam, Dubai, etc.
    country             TEXT NOT NULL DEFAULT 'SA', -- ISO 3166-1 alpha-2
    address             TEXT,
    lat                 REAL,
    lng                 REAL,
    phone               TEXT NOT NULL,
    whatsapp            TEXT,
    email               TEXT,
    website             TEXT,
    commercial_reg      TEXT,                       -- رقم السجل التجاري
    specialties         TEXT,                       -- JSON: ["nissan_tuning", "tires", "performance"]
    brands_carried      TEXT,                       -- JSON: ["K&N", "Brembo", "HKS"]
    commission_rate     REAL NOT NULL DEFAULT 12.0, -- Percentage
    is_verified         INTEGER NOT NULL DEFAULT 0,
    is_premium          INTEGER NOT NULL DEFAULT 0, -- Premium placement
    is_active           INTEGER NOT NULL DEFAULT 1,
    rating              REAL NOT NULL DEFAULT 0.0,
    review_count        INTEGER NOT NULL DEFAULT 0,
    total_sales         INTEGER NOT NULL DEFAULT 0,
    logo_url            TEXT,
    cover_url           TEXT,
    joined_at           TEXT NOT NULL DEFAULT (datetime('now')),
    verified_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_dist_city ON distributors(city);
CREATE INDEX IF NOT EXISTS idx_dist_country ON distributors(country);
CREATE INDEX IF NOT EXISTS idx_dist_verified ON distributors(is_verified);

-- ============================================================================
-- PRODUCTS
-- المنتجات
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id                  TEXT PRIMARY KEY,
    name_ar             TEXT NOT NULL,              -- اسم المنتج بالعربية
    name_en             TEXT NOT NULL,              -- Product name in English
    description_ar      TEXT,
    description_en      TEXT,
    sku                 TEXT UNIQUE NOT NULL,        -- Stock Keeping Unit
    barcode             TEXT,
    part_number         TEXT,                       -- OEM part number
    category_id         TEXT REFERENCES categories(id),
    category            TEXT NOT NULL,              -- Denormalized for query speed
    sub_category        TEXT,
    brand               TEXT NOT NULL,              -- Product brand (Brembo, K&N, etc.)
    car_brand           TEXT,                       -- Car brand it fits (nissan, toyota, etc.)
    compatibility       TEXT,                       -- JSON: CarCompatibility[]
    price               REAL NOT NULL,
    sale_price          REAL,
    cost_price          REAL,                       -- Internal cost (admin only)
    currency            TEXT NOT NULL DEFAULT 'SAR',
    stock               INTEGER NOT NULL DEFAULT 0,
    low_stock_alert     INTEGER NOT NULL DEFAULT 5,
    warehouse_location  TEXT,
    images              TEXT,                       -- JSON: string[]
    model_3d_url        TEXT,                       -- GLB file URL for 3D viewer
    video_url           TEXT,
    is_performance      INTEGER NOT NULL DEFAULT 0, -- Performance upgrade part
    is_tuning           INTEGER NOT NULL DEFAULT 0, -- Tuning/modification part
    is_oem              INTEGER NOT NULL DEFAULT 0, -- Original Equipment Manufacturer
    is_consumable       INTEGER NOT NULL DEFAULT 0, -- Regular maintenance item
    distributor_id      TEXT REFERENCES distributors(id),
    weight_kg           REAL,
    dimensions          TEXT,                       -- "LxWxH cm"
    warranty_months     INTEGER NOT NULL DEFAULT 12,
    tags                TEXT,                       -- JSON: string[]
    search_keywords_ar  TEXT,                       -- JSON: Arabic search terms
    rating              REAL NOT NULL DEFAULT 0.0,
    review_count        INTEGER NOT NULL DEFAULT 0,
    sold_count          INTEGER NOT NULL DEFAULT 0,
    view_count          INTEGER NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    is_featured         INTEGER NOT NULL DEFAULT 0,
    meta_title          TEXT,
    meta_description    TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prod_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_prod_car_brand ON products(car_brand);
CREATE INDEX IF NOT EXISTS idx_prod_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_prod_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_prod_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_prod_performance ON products(is_performance, is_tuning);
CREATE INDEX IF NOT EXISTS idx_prod_featured ON products(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_prod_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_prod_distributor ON products(distributor_id);

-- Full-Text Search index (FTS5) for Arabic + English search
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name_ar,
    name_en,
    brand,
    car_brand,
    tags,
    search_keywords_ar,
    sku,
    content='products',
    content_rowid='rowid',
    tokenize='unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS products_fts_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, name_ar, name_en, brand, car_brand, tags, search_keywords_ar, sku)
    VALUES (new.rowid, new.name_ar, new.name_en, new.brand, new.car_brand, new.tags, new.search_keywords_ar, new.sku);
END;

CREATE TRIGGER IF NOT EXISTS products_fts_update AFTER UPDATE ON products BEGIN
    UPDATE products_fts SET
        name_ar = new.name_ar,
        name_en = new.name_en,
        brand = new.brand,
        car_brand = new.car_brand,
        tags = new.tags,
        search_keywords_ar = new.search_keywords_ar,
        sku = new.sku
    WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS products_fts_delete AFTER DELETE ON products BEGIN
    DELETE FROM products_fts WHERE rowid = old.rowid;
END;

-- ============================================================================
-- PRODUCT COMPATIBILITY MATRIX
-- مصفوفة توافق المنتجات مع السيارات
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_compatibility (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    car_model_id    TEXT NOT NULL REFERENCES car_models(id),
    year_from       INTEGER,                        -- NULL = inherit from car_model
    year_to         INTEGER,
    engine_specific TEXT,                           -- Specific engine variant
    notes           TEXT,                           -- Installation notes
    UNIQUE(product_id, car_model_id)
);

CREATE INDEX IF NOT EXISTS idx_compat_product ON product_compatibility(product_id);
CREATE INDEX IF NOT EXISTS idx_compat_car ON product_compatibility(car_model_id);

-- ============================================================================
-- PRODUCT REVIEWS
-- تقييمات المنتجات
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id),
    rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    title           TEXT,
    body            TEXT NOT NULL,
    car_model_used  TEXT,                           -- "نيسان باترول 2021"
    is_verified_purchase INTEGER NOT NULL DEFAULT 0,
    helpful_count   INTEGER NOT NULL DEFAULT 0,
    images          TEXT,                           -- JSON: image URLs
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- ============================================================================
-- SHOPPING CART
-- سلة التسوق
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    added_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ============================================================================
-- ORDERS
-- الطلبات
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id                  TEXT PRIMARY KEY,
    order_number        TEXT UNIQUE,                -- Human-readable: GHY-2026-001234
    user_id             TEXT NOT NULL REFERENCES users(id),
    status              TEXT NOT NULL DEFAULT 'pending',
                                                    -- pending | confirmed | processing |
                                                    -- shipped | delivered | cancelled | refunded
    subtotal            REAL NOT NULL DEFAULT 0,
    shipping_fee        REAL NOT NULL DEFAULT 0,
    discount_amount     REAL NOT NULL DEFAULT 0,
    total_amount        REAL NOT NULL DEFAULT 0,
    currency            TEXT NOT NULL DEFAULT 'SAR',
    payment_method      TEXT,                       -- mada | stcpay | tabby | apple_pay | cod
    payment_status      TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
    payment_ref         TEXT,                       -- Payment gateway reference
    shipping_address    TEXT NOT NULL,              -- JSON: {name, phone, street, city, region, zip}
    shipping_method     TEXT DEFAULT 'standard',    -- standard | express | same_day
    tracking_number     TEXT,
    estimated_delivery  TEXT,
    notes               TEXT,
    coupon_code         TEXT,
    distributor_id      TEXT REFERENCES distributors(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    delivered_at        TEXT,
    cancelled_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Auto-generate order number
CREATE TRIGGER IF NOT EXISTS orders_set_number AFTER INSERT ON orders BEGIN
    UPDATE orders SET order_number = 'GHY-' || strftime('%Y', 'now') || '-' || printf('%06d', new.rowid)
    WHERE id = new.id AND order_number IS NULL;
END;

-- ============================================================================
-- ORDER ITEMS
-- بنود الطلبات
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      TEXT NOT NULL REFERENCES products(id),
    distributor_id  TEXT REFERENCES distributors(id),
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      REAL NOT NULL,
    total_price     REAL NOT NULL,
    product_name_ar TEXT NOT NULL,                  -- Snapshot at time of order
    product_name_en TEXT NOT NULL,
    product_sku     TEXT NOT NULL,
    product_image   TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================================
-- AI RADAR - CUSTOMER REQUESTS
-- رادار الذكاء الاصطناعي - طلبات العملاء
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_requests (
    id              TEXT PRIMARY KEY,
    user_id         TEXT,                           -- NULL for anonymous
    session_id      TEXT NOT NULL,
    query_raw       TEXT NOT NULL,                  -- Original query text
    query_ar        TEXT,                           -- Arabic normalized version
    query_en        TEXT,                           -- English translation
    signal_type     TEXT NOT NULL DEFAULT 'search_not_found',
                                                    -- search_not_found | chat_request |
                                                    -- wishlist_missing | whatsapp | compat_check
    car_model_id    TEXT REFERENCES car_models(id),
    car_model_raw   TEXT,                           -- Raw car name before normalization
    ip_address      TEXT,
    country         TEXT DEFAULT 'SA',
    city            TEXT,
    user_agent      TEXT,
    is_fulfilled    INTEGER NOT NULL DEFAULT 0,
    fulfilled_at    TEXT,
    fulfilled_sku   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_creq_user ON customer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_creq_created ON customer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_creq_fulfilled ON customer_requests(is_fulfilled);
CREATE INDEX IF NOT EXISTS idx_creq_query ON customer_requests(query_raw);
CREATE INDEX IF NOT EXISTS idx_creq_car ON customer_requests(car_model_id);

-- ============================================================================
-- AI RADAR - DEMAND SIGNALS
-- رادار الذكاء الاصطناعي - إشارات الطلب
-- ============================================================================

CREATE TABLE IF NOT EXISTS demand_signals (
    id                  TEXT PRIMARY KEY,
    product_name_ar     TEXT NOT NULL,
    product_name_en     TEXT NOT NULL,
    category            TEXT NOT NULL,
    sub_category        TEXT,
    car_brand           TEXT,
    car_model           TEXT,
    request_count_24h   INTEGER NOT NULL DEFAULT 0,
    request_count_7d    INTEGER NOT NULL DEFAULT 0,
    request_count_30d   INTEGER NOT NULL DEFAULT 0,
    unique_users        INTEGER NOT NULL DEFAULT 0,
    urgency             TEXT NOT NULL DEFAULT 'low', -- low | medium | high | critical
    confidence          REAL NOT NULL DEFAULT 0.0,  -- 0.0 to 1.0
    estimated_price_sar REAL,
    ai_analysis         TEXT,                       -- Full Claude analysis
    suggested_action    TEXT,
    supplier_hints      TEXT,                       -- JSON: suggested suppliers
    status              TEXT NOT NULL DEFAULT 'new',
                                                    -- new | reviewed | sourcing | listed | dismissed
    reviewed_by         TEXT REFERENCES users(id),
    reviewed_at         TEXT,
    review_notes        TEXT,
    first_seen_at       TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at        TEXT NOT NULL DEFAULT (datetime('now')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dsig_urgency ON demand_signals(urgency);
CREATE INDEX IF NOT EXISTS idx_dsig_status ON demand_signals(status);
CREATE INDEX IF NOT EXISTS idx_dsig_car ON demand_signals(car_brand, car_model);
CREATE INDEX IF NOT EXISTS idx_dsig_category ON demand_signals(category);

-- ============================================================================
-- AI RADAR - AUTO PULL JOBS
-- رادار الذكاء الاصطناعي - وظائف الجلب التلقائي
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_pull_jobs (
    id                  TEXT PRIMARY KEY,
    demand_signal_id    TEXT NOT NULL REFERENCES demand_signals(id),
    priority            INTEGER NOT NULL DEFAULT 5,  -- 1-10 (10 = highest)
    status              TEXT NOT NULL DEFAULT 'pending',
                                                    -- pending | in_progress | completed | cancelled
    product_name_ar     TEXT NOT NULL,
    product_name_en     TEXT NOT NULL,
    category            TEXT NOT NULL,
    target_brands       TEXT,                       -- JSON: string[]
    target_price_sar    REAL,
    supplier_contacts   TEXT,                       -- JSON: contact objects
    assigned_to         TEXT REFERENCES users(id),
    assigned_at         TEXT,
    deadline_at         TEXT,
    completed_at        TEXT,
    result_sku          TEXT,                       -- SKU of added product on completion
    notify_users        TEXT,                       -- JSON: user_ids to notify
    ai_briefing         TEXT,                       -- Claude-generated sourcing brief
    notes               TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_apj_status ON auto_pull_jobs(status);
CREATE INDEX IF NOT EXISTS idx_apj_priority ON auto_pull_jobs(priority DESC);

-- ============================================================================
-- AI RECOMMENDATIONS
-- توصيات الذكاء الاصطناعي الشخصية
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id          TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    score               REAL NOT NULL DEFAULT 0.0,
    reason              TEXT,
    reason_ar           TEXT,
    algorithm_version   TEXT NOT NULL DEFAULT 'v1',
    shown               INTEGER NOT NULL DEFAULT 0,
    clicked             INTEGER NOT NULL DEFAULT 0,
    converted           INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rec_user ON ai_recommendations(user_id, expires_at);

-- ============================================================================
-- WISHLIST
-- قائمة المفضلة
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

-- ============================================================================
-- COUPONS & DISCOUNTS
-- قسائم الخصم
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
    id              TEXT PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,
    description_ar  TEXT,
    discount_type   TEXT NOT NULL,                  -- percentage | fixed | free_shipping
    discount_value  REAL NOT NULL,                  -- Percentage (20) or SAR amount (50)
    min_order_amount REAL NOT NULL DEFAULT 0,
    max_uses        INTEGER,
    used_count      INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    valid_from      TEXT NOT NULL DEFAULT (datetime('now')),
    valid_until     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- SEARCH ANALYTICS
-- تحليلات البحث
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_logs (
    id              TEXT PRIMARY KEY,
    user_id         TEXT,
    session_id      TEXT,
    query           TEXT NOT NULL,
    results_count   INTEGER NOT NULL DEFAULT 0,
    clicked_product_id TEXT,
    country         TEXT DEFAULT 'SA',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_search_created ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_query ON search_logs(query);

-- ============================================================================
-- NOTIFICATIONS
-- الإشعارات
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,                  -- order_update | part_arrived | promotion | system
    title_ar        TEXT NOT NULL,
    body_ar         TEXT NOT NULL,
    data            TEXT,                           -- JSON: additional data
    is_read         INTEGER NOT NULL DEFAULT 0,
    sent_via        TEXT,                           -- push | email | whatsapp | sms
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version         TEXT PRIMARY KEY,
    applied_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_migrations(version) VALUES ('1.0.0');
