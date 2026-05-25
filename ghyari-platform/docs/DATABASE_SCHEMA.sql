-- ============================================================
-- Ghyari Platform - libsql/Turso Database Schema
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- Car Models (Reference table)
-- ============================================================
CREATE TABLE car_brands (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    logo_url TEXT,
    is_popular INTEGER DEFAULT 0,  -- 1 = top brand in Arab market
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE car_models (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL REFERENCES car_brands(id),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    year_from INTEGER NOT NULL,
    year_to INTEGER,  -- NULL = still in production
    body_type TEXT,   -- sedan|suv|truck|sports|pickup
    engine_options TEXT,  -- JSON array ["2.5L", "3.5L V6", "5.6L V8"]
    is_popular INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_car_models_brand ON car_models(brand_id);

-- ============================================================
-- Categories
-- ============================================================
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES categories(id),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon_url TEXT,
    banner_url TEXT,
    description_ar TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Distributors (Partner shops)
-- ============================================================
CREATE TABLE distributors (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,  -- Riyadh | Jeddah | Dammam | etc.
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    cover_url TEXT,
    specialties TEXT,  -- JSON: ["nissan_tuning", "tires", "performance"]
    is_verified INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Products
-- ============================================================
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    category_id TEXT REFERENCES categories(id),
    sub_category TEXT,
    brand TEXT NOT NULL,        -- Product brand: Brembo, K&N, HKS, Nismo
    car_brand TEXT,             -- Target car brand: nissan, toyota
    compatibility TEXT,         -- JSON: [{brand, models[], year_from, year_to, engine_cc[]}]
    price REAL NOT NULL,
    sale_price REAL,
    currency TEXT DEFAULT 'SAR',
    stock INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 5,
    images TEXT,                -- JSON array of URLs
    model_3d_url TEXT,
    is_performance INTEGER DEFAULT 0,
    is_tuning INTEGER DEFAULT 0,  -- فتك/تزويد
    is_oem INTEGER DEFAULT 0,
    distributor_id TEXT REFERENCES distributors(id),
    weight_kg REAL,
    dimensions TEXT,
    tags TEXT,                  -- JSON array
    search_keywords_ar TEXT,    -- JSON array for Arabic search
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_car_brand ON products(car_brand);
CREATE INDEX idx_products_distributor ON products(distributor_id);
CREATE INDEX idx_products_is_tuning ON products(is_tuning);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,  -- Primary identifier (KSA market)
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT,
    region TEXT,
    car_models TEXT,             -- JSON: user's registered cars
    is_enthusiast INTEGER DEFAULT 0,  -- Car enthusiast flag
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'pending',  -- pending|confirmed|processing|shipped|delivered|cancelled
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    shipping REAL DEFAULT 0,
    total REAL NOT NULL,
    currency TEXT DEFAULT 'SAR',
    payment_method TEXT,            -- stcpay|apple_pay|credit_card|cod
    payment_status TEXT DEFAULT 'unpaid',
    shipping_address TEXT,          -- JSON
    distributor_id TEXT REFERENCES distributors(id),
    notes_ar TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    product_snapshot TEXT         -- JSON snapshot at time of order
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- AI Radar Tables
-- ============================================================
CREATE TABLE customer_requests (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id),
    query TEXT NOT NULL,
    query_lang TEXT DEFAULT 'ar',
    car_model TEXT,
    category TEXT,
    result_count INTEGER DEFAULT 0,
    fulfilled INTEGER DEFAULT 0,
    ip_country TEXT DEFAULT 'SA',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_customer_requests_session ON customer_requests(session_id);
CREATE INDEX idx_customer_requests_fulfilled ON customer_requests(fulfilled);
CREATE INDEX idx_customer_requests_created ON customer_requests(created_at);

CREATE TABLE demand_signals (
    id TEXT PRIMARY KEY,
    product_name_ar TEXT NOT NULL,
    product_name_en TEXT,
    category TEXT,
    car_brand TEXT,
    car_model TEXT,
    request_count INTEGER DEFAULT 1,
    urgency TEXT DEFAULT 'low',      -- low|medium|high|critical
    confidence REAL DEFAULT 0,
    suggested_action TEXT,
    source_queries TEXT,             -- JSON array of original queries
    is_acted_upon INTEGER DEFAULT 0,
    added_product_id TEXT REFERENCES products(id),
    detected_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_demand_signals_urgency ON demand_signals(urgency);
CREATE INDEX idx_demand_signals_acted ON demand_signals(is_acted_upon);

-- ============================================================
-- Seed: Car Brands
-- ============================================================
INSERT INTO car_brands (id, name_ar, name_en, is_popular, sort_order) VALUES
('nissan',     'نيسان',     'Nissan',     1, 1),
('toyota',     'تويوتا',    'Toyota',     1, 2),
('lexus',      'لكزس',      'Lexus',      1, 3),
('hyundai',    'هيونداي',   'Hyundai',    1, 4),
('kia',        'كيا',       'Kia',        1, 5),
('mitsubishi', 'ميتسوبيشي', 'Mitsubishi', 0, 6),
('gmc',        'جي إم سي',  'GMC',        1, 7),
('ford',       'فورد',      'Ford',       1, 8),
('chevrolet',  'شيفروليه',  'Chevrolet',  0, 9),
('infiniti',   'إنفينيتي',  'Infiniti',   1, 10);

-- ============================================================
-- Seed: Car Models (Nissan focus - top tuning market)
-- ============================================================
INSERT INTO car_models (id, brand_id, name_ar, name_en, year_from, year_to, body_type, is_popular) VALUES
('nissan_patrol_y62',  'nissan', 'باترول Y62',     'Patrol Y62',     2010, NULL, 'suv',    1),
('nissan_patrol_y61',  'nissan', 'باترول Y61',     'Patrol Y61',     1997, 2010, 'suv',    1),
('nissan_gtr_r35',     'nissan', 'جي تي آر R35',   'GT-R R35',       2007, NULL, 'sports', 1),
('nissan_370z',        'nissan', '370Z',            '370Z',           2009, 2020, 'sports', 1),
('nissan_350z',        'nissan', '350Z',            '350Z',           2003, 2009, 'sports', 1),
('nissan_skyline_r34', 'nissan', 'سكايلاين R34',   'Skyline R34',    1998, 2002, 'sports', 1),
('nissan_altima',      'nissan', 'التيما',          'Altima',         2002, NULL, 'sedan',  1),
('nissan_navara',      'nissan', 'نافارا',          'Navara',         2005, NULL, 'pickup', 1),
('toyota_landcruiser', 'toyota', 'لاند كروزر',     'Land Cruiser',   1998, NULL, 'suv',    1),
('toyota_camry',       'toyota', 'كامري',           'Camry',          2002, NULL, 'sedan',  1),
('toyota_hilux',       'toyota', 'هايلكس',          'Hilux',          2005, NULL, 'pickup', 1),
('lexus_lx570',        'lexus',  'LX570',           'LX570',          2008, 2021, 'suv',    1),
('lexus_rx',           'lexus',  'آر إكس',          'RX',             2003, NULL, 'suv',    0),
('gmc_yukon',          'gmc',    'يوكن',            'Yukon',          2000, NULL, 'suv',    1),
('gmc_sierra',         'gmc',    'سييرا',           'Sierra',         2007, NULL, 'pickup', 0);

-- ============================================================
-- Seed: Categories
-- ============================================================
INSERT INTO categories (id, parent_id, name_ar, name_en, slug, sort_order) VALUES
('consumables',   NULL,           'قطع الاستهلاك',      'Consumables',     'consumables',    1),
('tires',         'consumables',  'تواير',               'Tires',           'tires',          1),
('brakes',        'consumables',  'بريكات',              'Brakes',          'brakes',         2),
('batteries',     'consumables',  'بطاريات',             'Batteries',       'batteries',      3),
('filters',       'consumables',  'فلاتر',               'Filters',         'filters',        4),
('oils',          'consumables',  'زيوت وسوائل',         'Oils & Fluids',   'oils',           5),
('performance',   NULL,           'قطع الأداء',          'Performance',     'performance',    2),
('turbo',         'performance',  'تيربو وشاجر',         'Turbo & Charger', 'turbo',          1),
('exhaust',       'performance',  'عوادم',               'Exhaust Systems', 'exhaust',        2),
('suspension',    'performance',  'تعليق',               'Suspension',      'suspension',     3),
('intercooler',   'performance',  'مبردات',              'Intercoolers',    'intercooler',    4),
('injectors',     'performance',  'إنجكتور',             'Injectors',       'injectors',      5),
('tuning',        NULL,           'تزويد وفتك',          'Tuning',          'tuning',         3),
('ecu',           'tuning',       'وحدات ECU',           'ECU & Tuning',    'ecu',            1),
('bodykit',       'tuning',       'كيت هيكل',            'Body Kits',       'body-kit',       2),
('accessories',   NULL,           'إكسسوارات',           'Accessories',     'accessories',    4),
('gauges',        'accessories',  'مقاييس وشاشات',       'Gauges & Displays','gauges',        1),
('lighting',      'accessories',  'إضاءة',               'Lighting',        'lighting',       2),
('interior',      'accessories',  'تفصيل داخلي',         'Interior',        'interior',       3);
