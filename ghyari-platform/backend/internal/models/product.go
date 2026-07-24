package models

// Category constants
const (
	CategoryConsumables = "consumables" // تواير، بريكات، بطاريات
	CategoryPerformance = "performance" // قطع الأداء العالي
	CategoryTuning      = "tuning"      // تزويد - نيسان فتك
	CategoryAccessories = "accessories" // إكسسوارات
	CategoryBodyKit     = "body_kit"    // كيتات هيكل
	CategorySuspension  = "suspension"  // تعليق
	CategoryElectronics = "electronics" // إلكترونيات السيارة
	CategoryExhaust     = "exhaust"     // عادم
)

// Popular Arab market car brands
const (
	BrandNissan     = "nissan"  // نيسان - الأكثر طلباً للتزويد
	BrandToyota     = "toyota"  // تويوتا
	BrandLexus      = "lexus"   // لكزس
	BrandHyundai    = "hyundai" // هيونداي
	BrandKia        = "kia"     // كيا
	BrandMitsubishi = "mitsubishi"
	BrandFord       = "ford"
	BrandGMC        = "gmc"
)

// CarCompatibility defines which cars a part fits
type CarCompatibility struct {
	Brand    string   `json:"brand"`
	Models   []string `json:"models"` // e.g. ["Patrol Y62", "Patrol Y61"]
	YearFrom int      `json:"year_from"`
	YearTo   int      `json:"year_to"`   // 0 = still current
	EngineCC []string `json:"engine_cc"` // e.g. ["4000", "5600"]
	Notes    string   `json:"notes"`
}

// Product is the core entity
type Product struct {
	ID               string             `json:"id" db:"id"`
	NameAR           string             `json:"name_ar" db:"name_ar"`
	NameEN           string             `json:"name_en" db:"name_en"`
	DescriptionAR    string             `json:"description_ar" db:"description_ar"`
	DescriptionEN    string             `json:"description_en" db:"description_en"`
	SKU              string             `json:"sku" db:"sku"`
	Barcode          string             `json:"barcode,omitempty" db:"barcode"`
	Category         string             `json:"category" db:"category"`
	SubCategory      string             `json:"sub_category" db:"sub_category"`
	Brand            string             `json:"brand" db:"brand"`         // Product brand (Brembo, K&N, etc.)
	CarBrand         string             `json:"car_brand" db:"car_brand"` // Car it fits
	Compatibility    []CarCompatibility `json:"compatibility" db:"compatibility"`
	Price            float64            `json:"price" db:"price"`
	SalePrice        float64            `json:"sale_price,omitempty" db:"sale_price"`
	Currency         string             `json:"currency" db:"currency"` // SAR
	Stock            int                `json:"stock" db:"stock"`
	LowStockAlert    int                `json:"low_stock_alert" db:"low_stock_alert"`
	Images           []string           `json:"images" db:"images"`
	Model3DURL       string             `json:"model_3d_url,omitempty" db:"model_3d_url"`
	IsPerformance    bool               `json:"is_performance" db:"is_performance"`
	IsTuning         bool               `json:"is_tuning" db:"is_tuning"`
	IsOEM            bool               `json:"is_oem" db:"is_oem"` // Original OEM part
	DistributorID    string             `json:"distributor_id" db:"distributor_id"`
	Weight           float64            `json:"weight_kg" db:"weight_kg"`
	Dimensions       string             `json:"dimensions" db:"dimensions"` // LxWxH cm
	Tags             []string           `json:"tags" db:"tags"`
	SearchKeywordsAR []string           `json:"search_keywords_ar" db:"search_keywords_ar"`
	Rating           float64            `json:"rating" db:"rating"`
	ReviewCount      int                `json:"review_count" db:"review_count"`
	SoldCount        int                `json:"sold_count" db:"sold_count"`
	ViewCount        int                `json:"view_count" db:"view_count"`
	IsActive         bool               `json:"is_active" db:"is_active"`
	IsFeatured       bool               `json:"is_featured" db:"is_featured"`
	CreatedAt        string             `json:"created_at" db:"created_at"`
	UpdatedAt        string             `json:"updated_at" db:"updated_at"`
}

// ProductFilter for search/filter API
type ProductFilter struct {
	Query    string   `form:"q"`
	Category string   `form:"category"`
	CarBrand string   `form:"car_brand"`
	CarModel string   `form:"car_model"`
	YearFrom int      `form:"year_from"`
	YearTo   int      `form:"year_to"`
	MinPrice float64  `form:"min_price"`
	MaxPrice float64  `form:"max_price"`
	Brands   []string `form:"brands"`
	IsTuning bool     `form:"is_tuning"`
	InStock  bool     `form:"in_stock"`
	SortBy   string   `form:"sort_by"` // price_asc|price_desc|rating|newest|popular
	Page     int      `form:"page"`
	Limit    int      `form:"limit"`
}

// Distributor is a partner shop or authorized reseller
type Distributor struct {
	ID          string   `json:"id" db:"id"`
	NameAR      string   `json:"name_ar" db:"name_ar"`
	NameEN      string   `json:"name_en" db:"name_en"`
	City        string   `json:"city" db:"city"`
	Region      string   `json:"region" db:"region"`
	Phone       string   `json:"phone" db:"phone"`
	WhatsApp    string   `json:"whatsapp" db:"whatsapp"`
	Address     string   `json:"address" db:"address"`
	Specialties []string `json:"specialties" db:"specialties"` // ["nissan_tuning", "tires", etc.]
	IsVerified  bool     `json:"is_verified" db:"is_verified"`
	Rating      float64  `json:"rating" db:"rating"`
	JoinedAt    string   `json:"joined_at" db:"joined_at"`
}
