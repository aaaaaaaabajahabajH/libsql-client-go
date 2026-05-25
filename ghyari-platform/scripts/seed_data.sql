-- ============================================================================
-- GHYARI PLATFORM - Seed Data
-- بيانات أولية لمنصة غياري
-- ============================================================================

-- ============================================================================
-- CAR MODELS (20 most popular in Arab market)
-- ============================================================================

INSERT OR IGNORE INTO car_models (id, make, model, model_ar, generation, year_from, year_to, body_type, engine_options, drive_type, popular_in_ar, tuning_popular) VALUES
-- NISSAN (أكثر السيارات طلباً للتزويد)
('cm_nissan_patrol_y62', 'nissan', 'Patrol Y62', 'نيسان باترول Y62', 'Y62', 2010, NULL, 'SUV', '["5.6L V8 VK56VD", "4.0L V6 VQ40DE"]', '4WD', 1, 1),
('cm_nissan_patrol_y61', 'nissan', 'Patrol Y61', 'نيسان باترول Y61', 'Y61', 1997, 2013, 'SUV', '["4.8L L6 TB48DE", "4.2L L6 TB42E", "3.0L TD ZD30DDTi"]', '4WD', 1, 1),
('cm_nissan_gtr_r35',   'nissan', 'GT-R R35',   'نيسان GTR R35',    'R35', 2007, NULL, 'Coupe',  '["3.8L V6 Twin Turbo VR38DETT"]', 'AWD', 1, 1),
('cm_nissan_350z',      'nissan', '350Z Z33',   'نيسان 350Z',       'Z33', 2002, 2009, 'Coupe',  '["3.5L V6 VQ35DE", "3.5L V6 VQ35HR"]', 'RWD', 1, 1),
('cm_nissan_370z',      'nissan', '370Z Z34',   'نيسان 370Z',       'Z34', 2009, 2021, 'Coupe',  '["3.7L V6 VQ37VHR"]', 'RWD', 1, 1),
('cm_nissan_navara',    'nissan', 'Navara D40', 'نيسان نافارا D40', 'D40', 2005, 2015, 'Pickup', '["2.5L TD YD25DDTi", "4.0L V6 VQ40DE"]', '4WD', 1, 1),

-- TOYOTA (الأكثر انتشاراً في الخليج)
('cm_toyota_lc200',     'toyota', 'Land Cruiser 200', 'تويوتا لاند كروزر 200', '200 Series', 2008, 2021, 'SUV', '["4.6L V8 1UR-FE", "4.5L V8 TD 1VD-FTV"]', '4WD', 1, 1),
('cm_toyota_lc300',     'toyota', 'Land Cruiser 300', 'تويوتا لاند كروزر 300', '300 Series', 2021, NULL, 'SUV', '["3.5L V6 Twin Turbo F33A-FTV", "3.3L V6 TD F33A"]', '4WD', 1, 1),
('cm_toyota_camry_xv70','toyota', 'Camry XV70',       'تويوتا كامري 2018+',     'XV70', 2017, NULL, 'Sedan', '["2.5L 4cyl 2AR-FE", "3.5L V6 2GR-FKS"]', 'FWD', 1, 0),
('cm_toyota_camry_xv50','toyota', 'Camry XV50',       'تويوتا كامري 2012-2017', 'XV50', 2012, 2017, 'Sedan', '["2.5L 4cyl 2AR-FE", "3.5L V6 2GR-FE"]', 'FWD', 1, 0),
('cm_toyota_hilux_gr',  'toyota', 'Hilux GR Sport',   'تويوتا هايلكس GR',      'AN120', 2016, NULL, 'Pickup', '["2.8L TD 1GD-FTV", "2.7L 2TR-FE"]', '4WD', 1, 1),
('cm_toyota_supra_a90', 'toyota', 'GR Supra A90',     'تويوتا سوبرا A90',      'A90', 2019, NULL, 'Coupe', '["3.0L L6 Twin Turbo B58", "2.0L 4cyl B48"]', 'RWD', 1, 1),

-- LEXUS
('cm_lexus_lx570',      'lexus', 'LX 570',  'لكزس LX 570', 'J200', 2007, 2021, 'SUV', '["5.7L V8 3UR-FE"]', '4WD', 1, 0),
('cm_lexus_rc350',      'lexus', 'RC 350',  'لكزس RC 350',  'XC10', 2014, NULL, 'Coupe', '["3.5L V6 2GR-FSE"]', 'RWD', 1, 1),

-- MITSUBISHI
('cm_mitsubishi_evo_x', 'mitsubishi', 'Lancer Evolution X', 'ميتسوبيشي لانسر إيفو X', 'CT9A', 2007, 2016, 'Sedan', '["2.0L 4cyl Turbo 4B11T"]', 'AWD', 1, 1),

-- KIA
('cm_kia_stinger',      'kia', 'Stinger GT',      'كيا ستينجر GT',      'CK', 2017, NULL, 'Sedan', '["3.3L V6 Twin Turbo G6DP", "2.0L T-GDi G4KH"]', 'RWD', 1, 1),

-- GMC
('cm_gmc_yukon_xl',     'gmc', 'Yukon XL',        'جي ام سي يوكون',     'K2XL', 2015, NULL, 'SUV', '["6.2L V8 L86", "5.3L V8 L83"]', '4WD', 1, 0),

-- FORD
('cm_ford_raptor_f150', 'ford', 'F-150 Raptor',   'فورد رابتور F-150',  'Gen3', 2021, NULL, 'Pickup', '["3.5L V6 EcoBoost Twin Turbo", "5.2L V8 Predator"]', '4WD', 1, 1),

-- SUBARU
('cm_subaru_wrx_sti',   'subaru', 'WRX STI',       'سوبارو WRX STI',     'VA', 2014, 2021, 'Sedan', '["2.5L 4cyl Turbo EJ257"]', 'AWD', 1, 1),

-- HONDA
('cm_honda_civic_fk8',  'honda', 'Civic Type R FK8','هوندا سيفيك تايب R FK8', 'FK8', 2017, 2021, 'Hatchback', '["2.0L 4cyl Turbo K20C1"]', 'FWD', 1, 1);

-- ============================================================================
-- CATEGORIES (50 categories)
-- ============================================================================

-- Level 1: Main Categories
INSERT OR IGNORE INTO categories (id, name_ar, name_en, slug, parent_id, type, sort_order) VALUES
('cat_consumables',  'قطع الاستهلاك',     'Consumables',          'consumables',   NULL, 'standard',    1),
('cat_performance',  'قطع الأداء العالي', 'Performance Parts',    'performance',   NULL, 'performance', 2),
('cat_tuning',       'تزويد وتعديل',       'Tuning & Modification','tuning',        NULL, 'tuning',      3),
('cat_suspension',   'تعليق وفرامل',       'Suspension & Brakes',  'suspension',    NULL, 'performance', 4),
('cat_exterior',     'إكسسوارات خارجية',  'Exterior Accessories', 'exterior',      NULL, 'standard',    5),
('cat_interior',     'إكسسوارات داخلية',  'Interior Accessories', 'interior',      NULL, 'standard',    6),
('cat_electronics',  'إلكترونيات السيارة','Car Electronics',       'electronics',   NULL, 'standard',    7),
('cat_engine',       'محرك وناقل الحركة', 'Engine & Drivetrain',  'engine',        NULL, 'performance', 8),
('cat_exhaust',      'عادم ومنفذ العادم', 'Exhaust Systems',      'exhaust',       NULL, 'performance', 9),
('cat_intake',       'سحب الهواء',         'Air Intake',           'intake',        NULL, 'performance', 10);

-- Level 2: Consumables Sub-categories
INSERT OR IGNORE INTO categories (id, name_ar, name_en, slug, parent_id, type, sort_order) VALUES
('cat_tires',        'إطارات',            'Tires',                'tires',         'cat_consumables', 'standard', 1),
('cat_brakes',       'بريكات وفرامل',     'Brake Pads & Rotors',  'brakes',        'cat_consumables', 'standard', 2),
('cat_batteries',    'بطاريات',           'Batteries',            'batteries',     'cat_consumables', 'standard', 3),
('cat_oils',         'زيوت المحرك',       'Engine Oils',          'engine-oils',   'cat_consumables', 'standard', 4),
('cat_filters_air',  'فلاتر الهواء',      'Air Filters',          'air-filters',   'cat_consumables', 'standard', 5),
('cat_filters_oil',  'فلاتر الزيت',       'Oil Filters',          'oil-filters',   'cat_consumables', 'standard', 6),
('cat_spark_plugs',  'شمعات الإشعال',     'Spark Plugs',          'spark-plugs',   'cat_consumables', 'standard', 7),
('cat_coolant',      'سائل التبريد',      'Coolant & Radiator',   'coolant',       'cat_consumables', 'standard', 8),
('cat_belts',        'تيمان وأحزمة',      'Belts & Chains',       'belts',         'cat_consumables', 'standard', 9),
('cat_wiper',        'ممسحات الزجاج',     'Wiper Blades',         'wipers',        'cat_consumables', 'standard', 10);

-- Level 2: Performance Sub-categories
INSERT OR IGNORE INTO categories (id, name_ar, name_en, slug, parent_id, type, sort_order) VALUES
('cat_turbo',        'توربو وشاحن',       'Turbo & Supercharger', 'turbo',         'cat_performance', 'performance', 1),
('cat_intercooler',  'مبرد الشحن',        'Intercooler',          'intercooler',   'cat_performance', 'performance', 2),
('cat_injectors',    'بخاخات الوقود',     'Fuel Injectors',       'injectors',     'cat_performance', 'performance', 3),
('cat_ecu',          'وحدة التحكم ECU',   'ECU & Engine Tuning',  'ecu',           'cat_performance', 'performance', 4),
('cat_headers',      'مجمع العادم',       'Headers & Manifolds',  'headers',       'cat_performance', 'performance', 5),
('cat_brake_perf',   'بريكات أداء',       'Performance Brakes',   'perf-brakes',   'cat_performance', 'performance', 6),
('cat_suspension_perf','تعليق أداء',      'Performance Suspension','perf-suspension','cat_performance','performance', 7),
('cat_fuel_system',  'نظام الوقود',       'Fuel System',          'fuel-system',   'cat_performance', 'performance', 8),
('cat_cooling',      'نظام التبريد',      'Cooling System',       'cooling',       'cat_performance', 'performance', 9),
('cat_wheels_perf',  'جنوط رياضية',       'Performance Wheels',   'perf-wheels',   'cat_performance', 'performance', 10);

-- Level 2: Tuning Sub-categories
INSERT OR IGNORE INTO categories (id, name_ar, name_en, slug, parent_id, type, sort_order) VALUES
('cat_body_kit',     'كيت هيكل',          'Body Kits',            'body-kits',     'cat_tuning', 'tuning', 1),
('cat_wing',         'جناح خلفي',         'Wings & Spoilers',     'wings',         'cat_tuning', 'tuning', 2),
('cat_exhaust_cat',  'كتمان الصوت',       'Exhaust Catback',      'exhaust-catback','cat_exhaust','performance', 1),
('cat_gauges',       'مقاييس أداء',       'Performance Gauges',   'gauges',        'cat_electronics', 'performance', 1),
('cat_steering',     'عجلة القيادة',      'Steering Wheel',       'steering',      'cat_tuning', 'tuning', 3),
('cat_pedals',       'بدالات أداء',       'Performance Pedals',   'pedals',        'cat_tuning', 'tuning', 4),
('cat_harness',      'حزام سلامة',        'Racing Harness',       'harness',       'cat_tuning', 'tuning', 5),
('cat_cage',         'قفص أمان',          'Roll Cage',            'roll-cage',     'cat_tuning', 'tuning', 6),
('cat_seat',         'مقعد رياضي',        'Racing Seats',         'racing-seats',  'cat_tuning', 'tuning', 7),
('cat_shift_knob',   'ذراع ناقل الحركة', 'Shift Knobs',          'shift-knobs',   'cat_tuning', 'tuning', 8);

-- Level 2: Additional categories
INSERT OR IGNORE INTO categories (id, name_ar, name_en, slug, parent_id, type, sort_order) VALUES
('cat_lift_kit',     'كيت رفع السيارة',   'Lift Kits',            'lift-kits',     'cat_suspension', 'performance', 1),
('cat_skid_plate',   'حماية الأسفل',      'Skid Plates',          'skid-plates',   'cat_exterior', 'standard', 1),
('cat_snorkel',      'فلتر هواء الغطس',   'Snorkels',             'snorkels',      'cat_exterior', 'standard', 2),
('cat_roof_rack',    'حامل السقف',        'Roof Racks',           'roof-racks',    'cat_exterior', 'standard', 3),
('cat_running_board','درجة الصعود',       'Running Boards',       'running-boards','cat_exterior', 'standard', 4),
('cat_led',          'إضاءة LED',         'LED Lighting',         'led',           'cat_exterior', 'standard', 5),
('cat_dashcam',      'كاميرا السيارة',    'Dash Cameras',         'dashcam',       'cat_electronics', 'standard', 2),
('cat_android_auto', 'شاشات أندرويد',     'Head Units & Android', 'head-units',    'cat_electronics', 'standard', 3),
('cat_parking',      'حساسات الركن',      'Parking Sensors',      'parking-sensors','cat_electronics', 'standard', 4),
('cat_alarm',        'نظام إنذار',        'Car Alarm & Security', 'security',      'cat_electronics', 'standard', 5),
('cat_floor_mats',   'طرابيل السيارة',    'Floor Mats',           'floor-mats',    'cat_interior', 'standard', 1),
('cat_seat_covers',  'كسوة المقاعد',      'Seat Covers',          'seat-covers',   'cat_interior', 'standard', 2),
('cat_window_tint',  'تصليق الزجاج',      'Window Tint Film',     'window-tint',   'cat_exterior', 'standard', 6),
('cat_air_freshener','معطر السيارة',       'Car Air Fresheners',   'air-freshener', 'cat_interior', 'standard', 3),
('cat_wash_wax',     'غسيل وتلميع',       'Car Wash & Wax',       'wash-wax',      'cat_consumables', 'standard', 11);

-- ============================================================================
-- DISTRIBUTORS (5 sample distributors)
-- ============================================================================

INSERT OR IGNORE INTO distributors (
    id, name_ar, name_en, slug, description_ar, city, region, country,
    phone, whatsapp, commission_rate, is_verified, is_active, rating, review_count
) VALUES

(
    'dist_001_ruh_autozone',
    'أوتوزون الرياض',
    'AutoZone Riyadh',
    'autozone-riyadh',
    'أكبر موزع لقطع السيارات في الرياض، متخصصون في قطع الأداء العالي وتزويد نيسان منذ 2005',
    'الرياض', 'Riyadh', 'SA',
    '+966112345678', '+966501234567',
    10.0, 1, 1, 4.8, 342
),

(
    'dist_002_jed_speedparts',
    'سبيد بارتس جدة',
    'Speed Parts Jeddah',
    'speed-parts-jeddah',
    'متخصصون في قطع التزويد وتحسين الأداء، وكلاء معتمدون لـ HKS و Tomei في جدة',
    'جدة', 'Jeddah', 'SA',
    '+966122345678', '+966551234567',
    11.0, 1, 1, 4.6, 218
),

(
    'dist_003_dmm_gulfparts',
    'قطع الخليج للسيارات',
    'Gulf Auto Parts Dammam',
    'gulf-auto-parts-dammam',
    'خبرة 15 سنة في توريد قطع السيارات الأصلية والبديلة عالية الجودة في الدمام والمنطقة الشرقية',
    'الدمام', 'Eastern Province', 'SA',
    '+966132345678', '+966561234567',
    12.0, 1, 1, 4.4, 156
),

(
    'dist_004_dxb_nissanperf',
    'نيسان بيرفورمنس دبي',
    'Nissan Performance Dubai',
    'nissan-performance-dubai',
    'وكلاء حصريون لـ Nismo و HKS في الإمارات، متخصصون في GT-R والباترول وكل موديلات نيسان',
    'دبي', 'Dubai', 'AE',
    '+971043456789', '+971501234567',
    10.0, 1, 1, 4.9, 512
),

(
    'dist_005_ruh_oem_plus',
    'أوريجينال بلس للقطع الأصلية',
    'Original Plus OEM Parts',
    'original-plus-riyadh',
    'متخصصون في القطع الأصلية لتويوتا ونيسان ولكزس مع ضمان الأصالة ووثيقة المصنع',
    'الرياض', 'Riyadh', 'SA',
    '+966113456789', '+966511234567',
    9.0, 1, 1, 4.7, 289
);

-- ============================================================================
-- SAMPLE PRODUCTS (Performance parts for Nissan tuning scene)
-- ============================================================================

-- Nissan Patrol Y62 - Air Filter K&N
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_001',
    'فلتر هواء عالي الأداء K&N للباترول Y62',
    'K&N High Performance Air Filter - Nissan Patrol Y62',
    'KN-NP-Y62-001',
    'performance', 'intake',
    'K&N', 'nissan',
    385.0, 'SAR', 24,
    1, 1, 1, 1,
    'dist_001_ruh_autozone',
    0.8,
    '["K&N","فلتر هواء","باترول Y62","تزويد","performance","نيسان"]',
    '["فلتر هواء باترول","فلتر كيان باترول","كيان نيسان باترول","فلتر تزويد Y62"]',
    '[{"brand":"nissan","models":["Patrol Y62"],"year_from":2010,"year_to":0,"engine_cc":["5600","4000"],"notes":"Direct replacement, 33% more airflow"}]',
    '["/images/products/kn-patrol-y62-001.jpg","/images/products/kn-patrol-y62-002.jpg"]',
    4.8, 67, 142
);

-- Nissan Patrol Y62 - Brembo Brake Kit
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_002',
    'كيت بريك بريمبو الأداء العالي للباترول Y62',
    'Brembo Performance Brake Kit - Nissan Patrol Y62',
    'BREMBO-NP-Y62-KIT',
    'performance', 'perf-brakes',
    'Brembo', 'nissan',
    2850.0, 'SAR', 8,
    1, 0, 1, 1,
    'dist_001_ruh_autozone',
    12.5,
    '["Brembo","بريمبو","بريك","فرامل","باترول Y62","أداء"]',
    '["بريمبو باترول","كيت بريك باترول","فرامل أداء نيسان"]',
    '[{"brand":"nissan","models":["Patrol Y62"],"year_from":2010,"year_to":0,"engine_cc":["5600","4000"],"notes":"Front + Rear kit, 380mm rotors"}]',
    '["/images/products/brembo-patrol-front.jpg"]',
    4.9, 23, 41
);

-- Toyota Land Cruiser 200 - ARB Lift Kit
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_003',
    'كيت رفع ARB للاند كروزر 200 سيريز - 2 إنش',
    'ARB 2 Inch Lift Kit - Toyota Land Cruiser 200 Series',
    'ARB-LC200-LIFT2',
    'suspension', 'lift_kit',
    'ARB', 'toyota',
    3200.0, 'SAR', 6,
    1, 1, 1, 1,
    'dist_003_dmm_gulfparts',
    18.0,
    '["ARB","كيت رفع","لاند كروزر 200","تعليق","lift kit","offroad"]',
    '["كيت رفع لاند كروزر","ARB لاند كروزر 200","رفع 200 سيريز","تعليق لاند كروزر"]',
    '[{"brand":"toyota","models":["Land Cruiser 200"],"year_from":2008,"year_to":2021,"engine_cc":[],"notes":"Includes springs, shocks, alignment correction"}]',
    '["/images/products/arb-lc200-lift.jpg"]',
    4.7, 38, 67
);

-- Nissan GT-R R35 - HKS Intercooler
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_004',
    'مبرد الشحن HKS للـ GT-R R35 - الإصدار الاحترافي',
    'HKS Intercooler Upgrade Kit - Nissan GT-R R35',
    'HKS-GTR-R35-IC-PRO',
    'performance', 'intercooler',
    'HKS', 'nissan',
    7500.0, 'SAR', 3,
    1, 1, 1, 1,
    'dist_004_dxb_nissanperf',
    8.5,
    '["HKS","مبرد شحن","GTR R35","تزويد GTR","intercooler","VR38DETT"]',
    '["مبرد HKS GTR","إنتركولر جي تي ار","مبرد الشحن GTR","إنتركولر VR38"]',
    '[{"brand":"nissan","models":["GT-R R35"],"year_from":2007,"year_to":0,"engine_cc":["3800"],"notes":"Drop-in upgrade, 30% more cooling capacity"}]',
    '["/images/products/hks-gtr-intercooler.jpg","/images/products/hks-gtr-ic-installed.jpg"]',
    4.9, 12, 28
);

-- Toyota Camry - Castrol Edge Oil
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_consumable, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_005',
    'زيت كاسترول ايدج 5W-30 كامل التخليق - 4 لتر',
    'Castrol Edge 5W-30 Fully Synthetic Engine Oil - 4L',
    'CASTROL-EDGE-5W30-4L',
    'consumables', 'oils',
    'Castrol', 'all',
    95.0, 'SAR', 150,
    1, 1, 1,
    'dist_005_ruh_oem_plus',
    4.2,
    '["Castrol","كاسترول","زيت محرك","5W-30","كامل التخليق","Edge"]',
    '["زيت كاسترول","كاسترول إيدج","زيت سيارة 5W30","زيت تخليق كامل"]',
    '[{"brand":"all","models":[],"year_from":2000,"year_to":0,"engine_cc":[],"notes":"Suitable for all petrol engines requiring 5W-30"}]',
    '["/images/products/castrol-edge-5w30.jpg"]',
    4.8, 234, 1823
);

-- Nissan 350Z - Tomei Exhaust
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_006',
    'عادم توميه برومس للـ 350Z - صوت رياضي كامل',
    'Tomei Expreme Ti Catback Exhaust - Nissan 350Z Z33',
    'TOMEI-350Z-EXPREME-TI',
    'exhaust', 'exhaust_catback',
    'Tomei', 'nissan',
    3200.0, 'SAR', 5,
    1, 1, 1, 1,
    'dist_004_dxb_nissanperf',
    6.2,
    '["Tomei","توميه","عادم","350Z","تزويد","exhaust","Z33","VQ35"]',
    '["عادم 350Z","توميه 350Z","صوت عادم نيسان","عادم رياضي Z33","توميه VQ35"]',
    '[{"brand":"nissan","models":["350Z Z33"],"year_from":2003,"year_to":2009,"engine_cc":["3500"],"notes":"Full titanium, -40% weight vs stock"}]',
    '["/images/products/tomei-350z-exhaust.jpg"]',
    4.9, 34, 52
);

-- Toyota Land Cruiser - Bosch Battery
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_consumable, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_007',
    'بطارية بوش S5 100AH للسيارات الفخمة والرياضية',
    'Bosch S5 100AH Premium Car Battery',
    'BOSCH-S5-100AH',
    'consumables', 'batteries',
    'Bosch', 'all',
    485.0, 'SAR', 45,
    1, 1, 1,
    'dist_005_ruh_oem_plus',
    24.5,
    '["Bosch","بوش","بطارية","S5","100AH","لاند كروزر","باترول"]',
    '["بطارية بوش","بوش S5","بطارية 100 أمبير","بطارية لاند كروزر","بطارية باترول"]',
    '[{"brand":"all","models":[],"year_from":2005,"year_to":0,"engine_cc":[],"notes":"DIN 100 / L5 size, fits most large SUVs and full-size vehicles"}]',
    '["/images/products/bosch-s5-battery.jpg"]',
    4.7, 189, 623
);

-- Nissan Patrol Y61 - Snorkel ARB
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_008',
    'شنكل ARB للباترول Y61 - مقاوم للماء للرحلات البرية',
    'ARB Safari Snorkel - Nissan Patrol Y61',
    'ARB-SNORKEL-NP-Y61',
    'exterior', 'snorkel',
    'ARB', 'nissan',
    650.0, 'SAR', 18,
    1, 1, 1,
    'dist_003_dmm_gulfparts',
    3.5,
    '["ARB","شنكل","snorkel","باترول Y61","رحلات برية","4x4","offroad"]',
    '["شنكل باترول","شنكل ARB Y61","سحب هواء برية باترول","شنكل للبر"]',
    '[{"brand":"nissan","models":["Patrol Y61"],"year_from":1997,"year_to":2013,"engine_cc":["4800","4200","3000"],"notes":"Relocates air intake to roof level for deep water crossings"}]',
    '["/images/products/arb-snorkel-y61.jpg"]',
    4.6, 45, 89
);

-- Michelin Pilot Sport 4 Tires
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_consumable, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_009',
    'إطارات ميشلان بايلوت سبورت 4 - 245/40R18 (الحبة)',
    'Michelin Pilot Sport 4 Tire 245/40R18 (each)',
    'MICHELIN-PS4-24540R18',
    'consumables', 'tires',
    'Michelin', 'all',
    580.0, 'SAR', 32,
    1, 1, 1,
    'dist_002_jed_speedparts',
    9.8,
    '["Michelin","ميشلان","إطارات","Pilot Sport 4","245/40R18","رياضي","performance"]',
    '["ميشلان بايلوت","إطارات رياضية","ميشلان 245/40R18","بايلوت سبورت 4"]',
    '[{"brand":"all","models":[],"year_from":2000,"year_to":0,"engine_cc":[],"notes":"245/40R18 size. Fits many performance sedans and coupes."}]',
    '["/images/products/michelin-ps4-tire.jpg"]',
    4.8, 312, 876
);

-- DEFI Gauge Set
INSERT OR IGNORE INTO products (
    id, name_ar, name_en, sku, category, sub_category, brand, car_brand,
    price, currency, stock, is_performance, is_tuning, is_active, is_featured,
    distributor_id, weight_kg, tags, search_keywords_ar,
    compatibility, images, rating, review_count, sold_count
) VALUES (
    'prod_010',
    'طقم مقاييس ديفي Defi-Link Meter BF الأزرق - 4 مقاييس',
    'Defi-Link Meter BF Blue Gauge Kit - Set of 4',
    'DEFI-BF-BLUE-KIT4',
    'electronics', 'gauges',
    'Defi', 'all',
    1850.0, 'SAR', 12,
    1, 1, 1, 1,
    'dist_004_dxb_nissanperf',
    1.8,
    '["Defi","ديفي","مقاييس","gauges","أداء","تزويد","pressure","temp"]',
    '["مقاييس ديفي","ديفي أزرق","مقاييس أداء سيارة","ديفي BF","مقاييس تزويد"]',
    '[{"brand":"all","models":[],"year_from":1990,"year_to":0,"engine_cc":[],"notes":"Universal fitment. Includes oil pressure, water temp, boost, and exhaust temp gauges."}]',
    '["/images/products/defi-bf-blue-gauges.jpg"]',
    4.9, 78, 195
);

COMMIT;
