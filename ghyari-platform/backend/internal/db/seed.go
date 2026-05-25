package db

import (
	"context"
	"database/sql"
	"log"
)

// Seed inserts initial reference data if the database is empty
func Seed(ctx context.Context, db *sql.DB) error {
	var count int
	db.QueryRowContext(ctx, `SELECT COUNT(*) FROM car_brands`).Scan(&count)
	if count > 0 {
		return nil // already seeded
	}

	log.Println("🌱 Seeding database with initial data...")

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// ── Car Brands ────────────────────────────────────────────────────────────
	brands := []struct{ id, ar, en string; popular int }{
		{"nissan", "نيسان", "Nissan", 1},
		{"toyota", "تويوتا", "Toyota", 1},
		{"lexus", "لكزس", "Lexus", 1},
		{"hyundai", "هيونداي", "Hyundai", 1},
		{"kia", "كيا", "Kia", 1},
		{"gmc", "جي إم سي", "GMC", 1},
		{"ford", "فورد", "Ford", 1},
		{"chevrolet", "شيفروليه", "Chevrolet", 0},
		{"infiniti", "إنفينيتي", "Infiniti", 1},
		{"mitsubishi", "ميتسوبيشي", "Mitsubishi", 0},
	}
	for i, b := range brands {
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO car_brands (id,name_ar,name_en,is_popular,sort_order) VALUES (?,?,?,?,?)`,
			b.id, b.ar, b.en, b.popular, i+1)
	}

	// ── Car Models ────────────────────────────────────────────────────────────
	models := []struct {
		id, brandID, ar, en, body string
		from, to                  int
		popular                   int
	}{
		{"nissan_patrol_y62", "nissan", "باترول Y62", "Patrol Y62", "suv", 2010, 0, 1},
		{"nissan_patrol_y61", "nissan", "باترول Y61", "Patrol Y61", "suv", 1997, 2010, 1},
		{"nissan_gtr_r35", "nissan", "جي تي آر R35", "GT-R R35", "sports", 2007, 0, 1},
		{"nissan_370z", "nissan", "370Z", "370Z", "sports", 2009, 2020, 1},
		{"nissan_350z", "nissan", "350Z", "350Z", "sports", 2003, 2009, 1},
		{"nissan_skyline_r34", "nissan", "سكايلاين R34", "Skyline R34", "sports", 1998, 2002, 1},
		{"nissan_altima", "nissan", "التيما", "Altima", "sedan", 2002, 0, 1},
		{"nissan_navara", "nissan", "نافارا", "Navara", "pickup", 2005, 0, 0},
		{"toyota_lc200", "toyota", "لاند كروزر 200", "Land Cruiser 200", "suv", 2008, 2021, 1},
		{"toyota_lc300", "toyota", "لاند كروزر 300", "Land Cruiser 300", "suv", 2021, 0, 1},
		{"toyota_camry", "toyota", "كامري", "Camry", "sedan", 2002, 0, 1},
		{"toyota_hilux", "toyota", "هايلكس", "Hilux", "pickup", 2005, 0, 1},
		{"toyota_fortuner", "toyota", "فورتشنر", "Fortuner", "suv", 2015, 0, 1},
		{"lexus_lx570", "lexus", "LX570", "LX570", "suv", 2008, 2021, 1},
		{"lexus_rx", "lexus", "آر إكس", "RX", "suv", 2003, 0, 0},
		{"gmc_yukon", "gmc", "يوكن", "Yukon", "suv", 2000, 0, 1},
		{"infiniti_qx80", "infiniti", "QX80", "QX80", "suv", 2010, 0, 1},
		{"hyundai_elantra", "hyundai", "إيلانترا", "Elantra", "sedan", 2006, 0, 1},
		{"hyundai_tucson", "hyundai", "توسان", "Tucson", "suv", 2004, 0, 1},
		{"kia_sportage", "kia", "سبورتاج", "Sportage", "suv", 2004, 0, 1},
	}
	for _, m := range models {
		yearTo := interface{}(nil)
		if m.to != 0 { yearTo = m.to }
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO car_models (id,brand_id,name_ar,name_en,body_type,year_from,year_to,is_popular)
			 VALUES (?,?,?,?,?,?,?,?)`,
			m.id, m.brandID, m.ar, m.en, m.body, m.from, yearTo, m.popular)
	}

	// ── Categories ────────────────────────────────────────────────────────────
	categories := []struct {
		id, parent, ar, en, slug string
		order                    int
	}{
		{"consumables", "", "قطع الاستهلاك", "Consumables", "consumables", 1},
		{"tires", "consumables", "تواير", "Tires", "tires", 1},
		{"brakes", "consumables", "بريكات", "Brakes", "brakes", 2},
		{"batteries", "consumables", "بطاريات", "Batteries", "batteries", 3},
		{"filters", "consumables", "فلاتر", "Filters", "filters", 4},
		{"oils", "consumables", "زيوت وسوائل", "Oils & Fluids", "oils", 5},
		{"performance", "", "قطع الأداء", "Performance", "performance", 2},
		{"turbo", "performance", "تيربو وشاجر", "Turbo & Supercharger", "turbo", 1},
		{"exhaust", "performance", "عوادم", "Exhaust Systems", "exhaust", 2},
		{"suspension", "performance", "تعليق", "Suspension", "suspension", 3},
		{"intercooler", "performance", "مبردات", "Intercoolers", "intercooler", 4},
		{"injectors", "performance", "إنجكتور", "Fuel Injectors", "injectors", 5},
		{"engine", "performance", "قطع محرك", "Engine Parts", "engine", 6},
		{"tuning", "", "تزويد وفتك", "Tuning", "tuning", 3},
		{"ecu", "tuning", "وحدات ECU", "ECU & Tuning", "ecu", 1},
		{"bodykit", "tuning", "كيت هيكل", "Body Kits", "body-kit", 2},
		{"intake", "tuning", "مداخل هواء", "Air Intake", "intake", 3},
		{"accessories", "", "إكسسوارات", "Accessories", "accessories", 4},
		{"gauges", "accessories", "مقاييس وشاشات", "Gauges & Displays", "gauges", 1},
		{"lighting", "accessories", "إضاءة", "Lighting", "lighting", 2},
		{"interior", "accessories", "تفصيل داخلي", "Interior", "interior", 3},
		{"exterior", "accessories", "تعديلات خارجية", "Exterior", "exterior", 4},
	}
	for _, c := range categories {
		parent := interface{}(nil)
		if c.parent != "" { parent = c.parent }
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO categories (id,parent_id,name_ar,name_en,slug,sort_order,is_active)
			 VALUES (?,?,?,?,?,?,1)`,
			c.id, parent, c.ar, c.en, c.slug, c.order)
	}

	// ── Distributors ──────────────────────────────────────────────────────────
	distributors := []struct {
		id, ar, en, city, region, phone, whatsapp, specialties string
	}{
		{
			"dist_riyadh_performance", "ريم للأداء", "Reem Performance",
			"الرياض", "منطقة الرياض", "+966501234567", "+966501234567",
			`["nissan_tuning","performance","exhaust","suspension"]`,
		},
		{
			"dist_jeddah_tires", "الجبر للإطارات", "Aljabar Tires",
			"جدة", "منطقة مكة المكرمة", "+966512345678", "+966512345678",
			`["tires","brakes","batteries"]`,
		},
		{
			"dist_dammam_oem", "الخليج للقطع الأصلية", "Gulf OEM Parts",
			"الدمام", "المنطقة الشرقية", "+966523456789", "+966523456789",
			`["oem","filters","oils","batteries"]`,
		},
		{
			"dist_riyadh_nissan", "متخصص نيسان الرياض", "Nissan Specialist Riyadh",
			"الرياض", "منطقة الرياض", "+966534567890", "+966534567890",
			`["nissan_tuning","ecu","bodykit","intake","gauges"]`,
		},
		{
			"dist_jeddah_luxury", "تيربو موتورز", "Turbo Motors",
			"جدة", "منطقة مكة المكرمة", "+966545678901", "+966545678901",
			`["turbo","intercooler","injectors","performance"]`,
		},
	}
	for _, d := range distributors {
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO distributors
			 (id,name_ar,name_en,city,region,phone,whatsapp,specialties,is_verified,is_active,rating)
			 VALUES (?,?,?,?,?,?,?,?,1,1,4.8)`,
			d.id, d.ar, d.en, d.city, d.region, d.phone, d.whatsapp, d.specialties)
	}

	// ── Sample Products ───────────────────────────────────────────────────────
	products := []struct {
		id, nameAR, nameEN, sku, brand, carBrand, catID string
		price                                            float64
		isTuning, isPerformance, isFeatured              int
		distID                                           string
		images                                           string
	}{
		{
			"prod_brembo_patrol", "بريكات بريمبو - نيسان باترول Y62",
			"Brembo Brakes - Nissan Patrol Y62",
			"BRK-BREMBO-PATROL-Y62", "Brembo", "nissan", "brakes",
			1850, 0, 1, 1, "dist_jeddah_tires",
			`["/images/brembo-patrol.jpg"]`,
		},
		{
			"prod_hks_intercooler", "مبرد HKS - نيسان باترول",
			"HKS Intercooler Kit - Nissan Patrol",
			"PERF-HKS-IC-PATROL", "HKS", "nissan", "intercooler",
			3200, 1, 1, 1, "dist_riyadh_performance",
			`["/images/hks-intercooler.jpg"]`,
		},
		{
			"prod_kn_filter_patrol", "فلتر هواء K&N - باترول V8",
			"K&N Air Filter - Patrol VK56",
			"FILT-KN-PATROL-V8", "K&N", "nissan", "filters",
			280, 1, 1, 1, "dist_riyadh_nissan",
			`["/images/kn-filter.jpg"]`,
		},
		{
			"prod_tomei_exhaust", "عادم Tomei - نيسان 350Z",
			"Tomei Expreme Exhaust - Nissan 350Z",
			"EXH-TOMEI-350Z", "Tomei", "nissan", "exhaust",
			2800, 1, 1, 1, "dist_riyadh_performance",
			`["/images/tomei-350z.jpg"]`,
		},
		{
			"prod_optima_battery", "بطارية Optima RedTop",
			"Optima RedTop Battery",
			"BATT-OPTIMA-RED", "Optima", "", "batteries",
			650, 0, 0, 1, "dist_jeddah_tires",
			`["/images/optima-battery.jpg"]`,
		},
		{
			"prod_yokohama_tires", "إطارات يوكوهاما 275/60R20",
			"Yokohama Geolandar Tires 275/60R20",
			"TIRE-YOK-275-60-20", "Yokohama", "", "tires",
			420, 0, 0, 1, "dist_jeddah_tires",
			`["/images/yokohama.jpg"]`,
		},
		{
			"prod_defi_gauges", "مقاييس Defi - ضغط زيت وحرارة",
			"Defi Gauges Kit - Oil Pressure & Temp",
			"GAUGE-DEFI-KIT-2", "Defi", "nissan", "gauges",
			950, 1, 0, 0, "dist_riyadh_nissan",
			`["/images/defi-gauges.jpg"]`,
		},
		{
			"prod_tein_suspension", "تعليق Tein - نيسان 370Z",
			"Tein Street Advance Z Coilovers - 370Z",
			"SUSP-TEIN-370Z", "Tein", "nissan", "suspension",
			4500, 1, 1, 1, "dist_riyadh_performance",
			`["/images/tein-370z.jpg"]`,
		},
		{
			"prod_gtr_hks_turbo", "كيت تيربو HKS - GTR R35",
			"HKS GT1000+ Turbine Kit - GT-R R35",
			"TURBO-HKS-GTR-R35", "HKS", "nissan", "turbo",
			28000, 1, 1, 1, "dist_jeddah_luxury",
			`["/images/hks-gtr-turbo.jpg"]`,
		},
		{
			"prod_castrol_oil", "زيت كاسترول EDGE 5W-40",
			"Castrol EDGE 5W-40 Full Synthetic 5L",
			"OIL-CAST-EDGE-5W40", "Castrol", "", "oils",
			185, 0, 0, 0, "dist_dammam_oem",
			`["/images/castrol-edge.jpg"]`,
		},
	}
	for _, p := range products {
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO products
			 (id,name_ar,name_en,sku,brand,car_brand,category_id,price,currency,
			  is_tuning,is_performance,is_featured,distributor_id,images,
			  stock,rating,review_count,sold_count,is_active)
			 VALUES (?,?,?,?,?,?,?,?,'SAR',?,?,?,?,?,?,4.7,12,45,1)`,
			p.id, p.nameAR, p.nameEN, p.sku, p.brand, p.carBrand, p.catID,
			p.price, p.isTuning, p.isPerformance, p.isFeatured,
			p.distID, p.images, 10+p.isFeatured*20,
		)
	}

	// ── Product Compatibility ─────────────────────────────────────────────────
	compat := []struct{ prodID, modelID string }{
		{"prod_brembo_patrol", "nissan_patrol_y62"},
		{"prod_hks_intercooler", "nissan_patrol_y62"},
		{"prod_hks_intercooler", "nissan_patrol_y61"},
		{"prod_kn_filter_patrol", "nissan_patrol_y62"},
		{"prod_kn_filter_patrol", "nissan_patrol_y61"},
		{"prod_tomei_exhaust", "nissan_350z"},
		{"prod_gtr_hks_turbo", "nissan_gtr_r35"},
		{"prod_tein_suspension", "nissan_370z"},
		{"prod_defi_gauges", "nissan_patrol_y62"},
		{"prod_defi_gauges", "nissan_gtr_r35"},
		{"prod_defi_gauges", "nissan_350z"},
	}
	for _, c := range compat {
		tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO product_compatibility (product_id,car_model_id) VALUES (?,?)`,
			c.prodID, c.modelID)
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Println("✅ Seed data inserted successfully")
	return nil
}
