package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
)

// Migrate runs all schema migrations in order
func Migrate(ctx context.Context, db *sql.DB) error {
	migrations := []struct {
		name string
		sql  string
	}{
		{"create_car_brands", schemaCarsAndModels},
		{"create_categories", schemaCategories},
		{"create_distributors", schemaDistributors},
		{"create_products", schemaProducts},
		{"create_users", schemaUsers},
		{"create_orders", schemaOrders},
		{"create_ai_radar", schemaAIRadar},
		{"create_reviews", schemaReviews},
		{"create_cart_items", schemaCartItems},
		{"create_payment_columns", schemaPaymentColumns},
		{"create_webhook_events", schemaWebhookEvents},
		{"create_migrations_table", schemaMigrationsTable},
	}

	// Ensure migrations table exists first
	if _, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS _migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			applied_at TEXT DEFAULT (datetime('now'))
		)
	`); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	for _, m := range migrations {
		var exists int
		db.QueryRowContext(ctx, `SELECT COUNT(*) FROM _migrations WHERE name = ?`, m.name).Scan(&exists)
		if exists > 0 {
			continue
		}

		if _, err := db.ExecContext(ctx, m.sql); err != nil {
			return fmt.Errorf("migration %q failed: %w", m.name, err)
		}
		db.ExecContext(ctx, `INSERT INTO _migrations (name) VALUES (?)`, m.name)
		log.Printf("✅ Migration applied: %s", m.name)
	}
	return nil
}

const schemaCarsAndModels = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS car_brands (
	id   TEXT PRIMARY KEY,
	name_ar   TEXT NOT NULL,
	name_en   TEXT NOT NULL,
	logo_url  TEXT,
	is_popular INTEGER DEFAULT 0,
	sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS car_models (
	id          TEXT PRIMARY KEY,
	brand_id    TEXT NOT NULL REFERENCES car_brands(id),
	name_ar     TEXT NOT NULL,
	name_en     TEXT NOT NULL,
	year_from   INTEGER NOT NULL,
	year_to     INTEGER,
	body_type   TEXT,
	engine_options TEXT,
	is_popular  INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_car_models_brand ON car_models(brand_id);
`

const schemaCategories = `
CREATE TABLE IF NOT EXISTS categories (
	id          TEXT PRIMARY KEY,
	parent_id   TEXT REFERENCES categories(id),
	name_ar     TEXT NOT NULL,
	name_en     TEXT NOT NULL,
	slug        TEXT UNIQUE NOT NULL,
	icon_url    TEXT,
	description_ar TEXT,
	sort_order  INTEGER DEFAULT 0,
	is_active   INTEGER DEFAULT 1
);
`

const schemaDistributors = `
CREATE TABLE IF NOT EXISTS distributors (
	id           TEXT PRIMARY KEY,
	name_ar      TEXT NOT NULL,
	name_en      TEXT NOT NULL,
	description_ar TEXT,
	city         TEXT NOT NULL,
	region       TEXT NOT NULL,
	address      TEXT,
	phone        TEXT,
	whatsapp     TEXT,
	email        TEXT,
	logo_url     TEXT,
	specialties  TEXT,
	is_verified  INTEGER DEFAULT 0,
	is_active    INTEGER DEFAULT 1,
	rating       REAL DEFAULT 0,
	review_count INTEGER DEFAULT 0,
	joined_at    TEXT DEFAULT (datetime('now')),
	updated_at   TEXT DEFAULT (datetime('now'))
);
`

const schemaProducts = `
CREATE TABLE IF NOT EXISTS products (
	id              TEXT PRIMARY KEY,
	name_ar         TEXT NOT NULL,
	name_en         TEXT NOT NULL,
	description_ar  TEXT,
	description_en  TEXT,
	sku             TEXT UNIQUE NOT NULL,
	barcode         TEXT,
	category_id     TEXT REFERENCES categories(id),
	sub_category    TEXT,
	brand           TEXT NOT NULL,
	car_brand       TEXT,
	compatibility   TEXT,
	price           REAL NOT NULL CHECK(price > 0),
	sale_price      REAL,
	currency        TEXT DEFAULT 'SAR',
	stock           INTEGER DEFAULT 0,
	low_stock_alert INTEGER DEFAULT 5,
	images          TEXT DEFAULT '[]',
	model_3d_url    TEXT,
	is_performance  INTEGER DEFAULT 0,
	is_tuning       INTEGER DEFAULT 0,
	is_oem          INTEGER DEFAULT 0,
	distributor_id  TEXT REFERENCES distributors(id),
	weight_kg       REAL,
	dimensions      TEXT,
	tags            TEXT DEFAULT '[]',
	search_keywords_ar TEXT DEFAULT '[]',
	rating          REAL DEFAULT 0,
	review_count    INTEGER DEFAULT 0,
	sold_count      INTEGER DEFAULT 0,
	view_count      INTEGER DEFAULT 0,
	is_active       INTEGER DEFAULT 1,
	is_featured     INTEGER DEFAULT 0,
	created_at      TEXT DEFAULT (datetime('now')),
	updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_car_brand   ON products(car_brand);
CREATE INDEX IF NOT EXISTS idx_products_distributor ON products(distributor_id);
CREATE INDEX IF NOT EXISTS idx_products_is_tuning   ON products(is_tuning);
CREATE INDEX IF NOT EXISTS idx_products_price       ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured, is_active);

CREATE TABLE IF NOT EXISTS product_compatibility (
	product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	car_model_id TEXT NOT NULL REFERENCES car_models(id),
	year_from    INTEGER,
	year_to      INTEGER,
	notes        TEXT,
	PRIMARY KEY (product_id, car_model_id)
);

CREATE INDEX IF NOT EXISTS idx_compat_car ON product_compatibility(car_model_id);
`

const schemaUsers = `
CREATE TABLE IF NOT EXISTS users (
	id             TEXT PRIMARY KEY,
	phone          TEXT UNIQUE NOT NULL,
	email          TEXT UNIQUE,
	name           TEXT NOT NULL,
	avatar_url     TEXT,
	city           TEXT,
	region         TEXT,
	car_models     TEXT DEFAULT '[]',
	is_enthusiast  INTEGER DEFAULT 0,
	role           TEXT DEFAULT 'customer',
	total_orders   INTEGER DEFAULT 0,
	total_spent    REAL DEFAULT 0,
	loyalty_points INTEGER DEFAULT 0,
	is_active      INTEGER DEFAULT 1,
	password_hash  TEXT,
	refresh_token  TEXT,
	created_at     TEXT DEFAULT (datetime('now')),
	updated_at     TEXT DEFAULT (datetime('now'))
);
`

const schemaOrders = `
CREATE TABLE IF NOT EXISTS orders (
	id               TEXT PRIMARY KEY,
	order_number     TEXT UNIQUE,
	user_id          TEXT REFERENCES users(id),
	status           TEXT DEFAULT 'pending',
	subtotal         REAL NOT NULL,
	discount         REAL DEFAULT 0,
	shipping         REAL DEFAULT 0,
	total            REAL NOT NULL,
	currency         TEXT DEFAULT 'SAR',
	payment_method   TEXT,
	payment_status   TEXT DEFAULT 'unpaid',
	shipping_address TEXT,
	distributor_id   TEXT REFERENCES distributors(id),
	notes_ar         TEXT,
	created_at       TEXT DEFAULT (datetime('now')),
	updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
	id               TEXT PRIMARY KEY,
	order_id         TEXT NOT NULL REFERENCES orders(id),
	product_id       TEXT NOT NULL REFERENCES products(id),
	quantity         INTEGER NOT NULL CHECK(quantity > 0),
	unit_price       REAL NOT NULL,
	total_price      REAL NOT NULL,
	product_snapshot TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`

const schemaAIRadar = `
CREATE TABLE IF NOT EXISTS customer_requests (
	id            TEXT PRIMARY KEY,
	user_id       TEXT,
	session_id    TEXT NOT NULL,
	query_raw     TEXT NOT NULL,
	signal_type   TEXT DEFAULT 'search_not_found',
	car_model_id  TEXT,
	car_model_raw TEXT,
	ip_address    TEXT,
	country       TEXT DEFAULT 'SA',
	city          TEXT,
	is_fulfilled  INTEGER DEFAULT 0,
	fulfilled_at  TEXT,
	fulfilled_sku TEXT,
	created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_req_session   ON customer_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_req_fulfilled ON customer_requests(is_fulfilled);
CREATE INDEX IF NOT EXISTS idx_req_created   ON customer_requests(created_at);

CREATE TABLE IF NOT EXISTS demand_signals (
	id               TEXT PRIMARY KEY,
	product_name_ar  TEXT NOT NULL,
	product_name_en  TEXT,
	category         TEXT,
	sub_category     TEXT,
	car_brand        TEXT,
	car_model        TEXT,
	request_count_24h INTEGER DEFAULT 0,
	request_count_7d  INTEGER DEFAULT 0,
	request_count_30d INTEGER DEFAULT 0,
	unique_users      INTEGER DEFAULT 0,
	urgency           TEXT DEFAULT 'low',
	confidence        REAL DEFAULT 0,
	estimated_price   REAL,
	ai_analysis       TEXT,
	suggested_action  TEXT,
	supplier_hints    TEXT,
	status            TEXT DEFAULT 'new',
	reviewed_by       TEXT,
	reviewed_at       TEXT,
	review_notes      TEXT,
	first_seen_at     TEXT DEFAULT (datetime('now')),
	last_seen_at      TEXT DEFAULT (datetime('now')),
	created_at        TEXT DEFAULT (datetime('now')),
	updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auto_pull_jobs (
	id                TEXT PRIMARY KEY,
	demand_signal_id  TEXT NOT NULL REFERENCES demand_signals(id),
	priority          INTEGER DEFAULT 5,
	status            TEXT DEFAULT 'pending',
	product_name_ar   TEXT NOT NULL,
	product_name_en   TEXT,
	category          TEXT,
	target_brands     TEXT,
	target_price_sar  REAL,
	supplier_contacts TEXT,
	assigned_to       TEXT,
	assigned_at       TEXT,
	deadline_at       TEXT,
	completed_at      TEXT,
	result_sku        TEXT,
	ai_briefing       TEXT,
	created_at        TEXT DEFAULT (datetime('now')),
	updated_at        TEXT DEFAULT (datetime('now'))
);
`

const schemaReviews = `
CREATE TABLE IF NOT EXISTS reviews (
	id          TEXT PRIMARY KEY,
	product_id  TEXT NOT NULL REFERENCES products(id),
	user_id     TEXT NOT NULL REFERENCES users(id),
	order_id    TEXT REFERENCES orders(id),
	rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
	title_ar    TEXT,
	body_ar     TEXT,
	is_verified INTEGER DEFAULT 0,
	is_active   INTEGER DEFAULT 1,
	created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, is_active);
`

const schemaCartItems = `
CREATE TABLE IF NOT EXISTS cart_items (
	id         TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	quantity   INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
	added_at   TEXT DEFAULT (datetime('now')),
	UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
`

const schemaPaymentColumns = `
ALTER TABLE orders ADD COLUMN gateway_ref TEXT;
`

const schemaWebhookEvents = `
CREATE TABLE IF NOT EXISTS webhook_events (
	id               TEXT PRIMARY KEY,
	idempotency_key  TEXT UNIQUE NOT NULL,
	created_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_idem ON webhook_events(idempotency_key);
`

const schemaMigrationsTable = `SELECT 1;` // already created above, placeholder
