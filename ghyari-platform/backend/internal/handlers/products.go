package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ghyari/api/internal/models"
)

// ProductHandler manages product CRUD and search
type ProductHandler struct {
	db *sql.DB
}

// NewProductHandler creates a ProductHandler
func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

// productColumns lists the products table columns in the exact order
// scanProductRows expects them. Queries must select these explicitly
// (never `SELECT *`) so column order stays decoupled from the table's
// physical layout in the schema.
const productColumns = `id, name_ar, name_en, description_ar, description_en,
	sku, barcode, category_id, sub_category, brand, car_brand,
	price, sale_price, currency, stock, low_stock_alert,
	images, model_3d_url, is_performance, is_tuning, is_oem,
	distributor_id, weight_kg, dimensions,
	tags, search_keywords_ar, compatibility,
	rating, review_count, sold_count, view_count,
	is_active, is_featured, created_at, updated_at`

// productColumnsAliased is productColumns with a "p." table alias prefix,
// for queries that join products under the alias p.
const productColumnsAliased = `p.id, p.name_ar, p.name_en, p.description_ar, p.description_en,
	p.sku, p.barcode, p.category_id, p.sub_category, p.brand, p.car_brand,
	p.price, p.sale_price, p.currency, p.stock, p.low_stock_alert,
	p.images, p.model_3d_url, p.is_performance, p.is_tuning, p.is_oem,
	p.distributor_id, p.weight_kg, p.dimensions,
	p.tags, p.search_keywords_ar, p.compatibility,
	p.rating, p.review_count, p.sold_count, p.view_count,
	p.is_active, p.is_featured, p.created_at, p.updated_at`

// List godoc
// GET /api/v1/products
// Query params: category, car_brand, car_model, year_from, year_to, min_price, max_price,
//
//	is_tuning, in_stock, sort_by, page, limit
func (h *ProductHandler) List(c *gin.Context) {
	filter := &models.ProductFilter{
		Page:  1,
		Limit: 20,
	}

	if err := c.ShouldBindQuery(filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_params",
			"message": "معاملات الطلب غير صحيحة / Invalid query parameters",
			"details": err.Error(),
		})
		return
	}

	// Clamp pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}
	offset := (filter.Page - 1) * filter.Limit

	// Build dynamic query
	query, args := buildProductListQuery(filter)
	countQuery := buildProductCountQuery(filter)

	// Get total count
	var total int
	countRow := h.db.QueryRowContext(c.Request.Context(), countQuery, args...)
	if err := countRow.Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}

	// Append LIMIT/OFFSET to main query
	query += fmt.Sprintf(" LIMIT %d OFFSET %d", filter.Limit, offset)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_query_error", "message": err.Error()})
		return
	}
	defer func() { _ = rows.Close() }()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"pagination": gin.H{
			"page":        filter.Page,
			"limit":       filter.Limit,
			"total":       total,
			"total_pages": (total + filter.Limit - 1) / filter.Limit,
		},
	})
}

// GetByID godoc
// GET /api/v1/products/:id
func (h *ProductHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_id"})
		return
	}

	product, err := h.fetchProductByID(c.Request.Context(), id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "product_not_found",
			"message": "المنتج غير موجود / Product not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}

	// Increment view count (non-blocking)
	go func() {
		if _, err := h.db.Exec("UPDATE products SET view_count = view_count + 1 WHERE id = ?", id); err != nil {
			log.Printf("⚠️  Failed to increment view count for product %s: %v", id, err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"data": product})
}

// Search godoc
// GET /api/v1/products/search?q=بريك+باترول
func (h *ProductHandler) Search(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "query_too_short",
			"message": "يجب أن يكون البحث حرفين على الأقل / Search query must be at least 2 characters",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}
	offset := (page - 1) * limit

	// FTS5 search on Arabic + English fields + SKU
	searchQuery := `
		SELECT ` + productColumnsAliased + `
		FROM products p
		JOIN products_fts ON products_fts.rowid = p.rowid
		WHERE products_fts MATCH ?
		  AND p.is_active = 1
		ORDER BY rank
		LIMIT ? OFFSET ?
	`

	// FTS5 match string — search Arabic and English
	ftsQuery := fmt.Sprintf(`"%s"`, strings.ReplaceAll(q, `"`, ``))

	rows, err := h.db.QueryContext(c.Request.Context(), searchQuery, ftsQuery, limit, offset)
	if err != nil {
		// Fallback to LIKE search if FTS fails (e.g. products_fts unavailable)
		rows, err = h.db.QueryContext(c.Request.Context(), `
			SELECT `+productColumns+`
			FROM products
			WHERE is_active = 1
			  AND (name_ar LIKE ? OR name_en LIKE ? OR sku LIKE ? OR brand LIKE ?)
			ORDER BY sold_count DESC, rating DESC
			LIMIT ? OFFSET ?
		`, "%"+q+"%", "%"+q+"%", "%"+q+"%", "%"+q+"%", limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "search_error", "message": err.Error()})
			return
		}
	}
	defer func() { _ = rows.Close() }()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error", "message": err.Error()})
		return
	}

	// Log this search for AI Radar. Values are captured here (not inside the
	// goroutine) because gin recycles *gin.Context via a sync.Pool once the
	// handler returns, so reading from c after that point is unsafe.
	if len(products) == 0 {
		userID, _ := c.Get("user_id")
		sessionID := c.GetHeader("X-Session-ID")
		country := c.GetHeader("CF-IPCountry")
		go func() {
			// Zero results = strong demand signal
			if _, err := h.db.Exec(`
				INSERT INTO customer_requests
				(id, user_id, session_id, query_raw, signal_type, country, created_at)
				VALUES (?, ?, ?, ?, 'search_not_found', ?, ?)
			`,
				uuid.New().String(),
				fmt.Sprintf("%v", userID),
				sessionID,
				q,
				country,
				formatSQLTime(time.Now()),
			); err != nil {
				log.Printf("⚠️  Failed to log search-not-found signal: %v", err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  products,
		"query": q,
		"count": len(products),
	})
}

// Compatible godoc
// GET /api/v1/products/compatible?car_brand=nissan&car_model=Patrol+Y62&year=2022
func (h *ProductHandler) Compatible(c *gin.Context) {
	carBrand := c.Query("car_brand")
	carModel := c.Query("car_model")
	yearStr := c.Query("year")
	category := c.Query("category")

	if carBrand == "" || carModel == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_car_info",
			"message": "يجب تحديد ماركة وموديل السيارة / car_brand and car_model are required",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "24"))
	offset := (page - 1) * limit

	args := []interface{}{carBrand, "%" + carModel + "%"}

	// yearClause filters the compatibility rows themselves (inside the
	// subquery, where pc is in scope); categoryClause filters the outer
	// product query (where p is in scope). Keeping them as two separate
	// clauses — rather than one string spliced into a single %s slot —
	// avoids nesting a boolean AND expression inside a LOWER(...) call.
	yearClause := ""
	if yearStr != "" {
		year, err := strconv.Atoi(yearStr)
		if err == nil {
			yearClause = " AND (pc.year_from <= ? AND (pc.year_to = 0 OR pc.year_to >= ?))"
			args = append(args, year, year)
		}
	}

	categoryClause := ""
	if category != "" {
		categoryClause = " AND p.category_id = ?"
		args = append(args, category)
	}

	args = append(args, limit, offset)

	query := fmt.Sprintf(`
		SELECT DISTINCT %s
		FROM products p
		JOIN (
			SELECT DISTINCT pc.product_id
			FROM product_compatibility pc
			JOIN car_models cm ON cm.id = pc.car_model_id
			WHERE LOWER(cm.brand_id) = LOWER(?)
			  AND LOWER(cm.name_en) LIKE LOWER(?)
			  %s
		) comp ON comp.product_id = p.id
		WHERE p.is_active = 1
		  %s
		ORDER BY p.is_featured DESC, p.sold_count DESC
		LIMIT ? OFFSET ?
	`, productColumnsAliased, yearClause, categoryClause)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer func() { _ = rows.Close() }()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"filter": gin.H{
			"car_brand": carBrand,
			"car_model": carModel,
			"year":      yearStr,
			"category":  category,
		},
		"count": len(products),
	})
}

// ListPerformanceParts godoc
// GET /api/v1/products/performance
func (h *ProductHandler) ListPerformanceParts(c *gin.Context) {
	carBrand := c.DefaultQuery("car_brand", "")
	sortBy := c.DefaultQuery("sort_by", "popular")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "24"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	offset := (page - 1) * limit

	orderClause := "sold_count DESC"
	switch sortBy {
	case "newest":
		orderClause = "created_at DESC"
	case "price_asc":
		orderClause = "price ASC"
	case "price_desc":
		orderClause = "price DESC"
	case "rating":
		orderClause = "rating DESC"
	}

	args := []interface{}{}
	brandFilter := ""
	if carBrand != "" {
		brandFilter = "AND car_brand = ?"
		args = append(args, carBrand)
	}

	args = append(args, limit, offset)

	query := fmt.Sprintf(`
		SELECT %s FROM products
		WHERE is_active = 1
		  AND (is_performance = 1 OR is_tuning = 1)
		  %s
		ORDER BY is_featured DESC, %s
		LIMIT ? OFFSET ?
	`, productColumns, brandFilter, orderClause)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer func() { _ = rows.Close() }()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": products, "count": len(products)})
}

// ListFeatured godoc
// GET /api/v1/products/featured
func (h *ProductHandler) ListFeatured(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT `+productColumns+` FROM products
		WHERE is_active = 1 AND is_featured = 1
		ORDER BY sold_count DESC
		LIMIT 12
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": products})
}

// Create godoc
// POST /api/v1/admin/products (admin only)
func (h *ProductHandler) Create(c *gin.Context) {
	var p models.Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_payload",
			"message": "بيانات المنتج غير صحيحة / Invalid product data",
			"details": err.Error(),
		})
		return
	}

	p.ID = uuid.New().String()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	p.IsActive = true

	// Serialize complex fields
	imagesJSON, _ := json.Marshal(p.Images)
	compatJSON, _ := json.Marshal(p.Compatibility)
	tagsJSON, _ := json.Marshal(p.Tags)
	keywordsJSON, _ := json.Marshal(p.SearchKeywordsAR)

	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO products (
			id, name_ar, name_en, description_ar, description_en, sku, barcode,
			category_id, sub_category, brand, car_brand, price, sale_price, currency,
			stock, low_stock_alert, images, model_3d_url, is_performance, is_tuning,
			is_oem, distributor_id, weight_kg, dimensions, tags, search_keywords_ar,
			rating, review_count, sold_count, view_count, is_active, is_featured,
			compatibility, created_at, updated_at
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
		)
	`,
		p.ID, p.NameAR, p.NameEN, p.DescriptionAR, p.DescriptionEN, p.SKU, p.Barcode,
		p.Category, p.SubCategory, p.Brand, p.CarBrand, p.Price, p.SalePrice, p.Currency,
		p.Stock, p.LowStockAlert, string(imagesJSON), p.Model3DURL, p.IsPerformance, p.IsTuning,
		p.IsOEM, p.DistributorID, p.Weight, p.Dimensions, string(tagsJSON), string(keywordsJSON),
		0, 0, 0, 0, true, p.IsFeatured, string(compatJSON), formatSQLTime(p.CreatedAt), formatSQLTime(p.UpdatedAt),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "insert_error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    p,
		"message": "تم إضافة المنتج بنجاح / Product created successfully",
	})
}

// Update godoc
// PUT /api/v1/admin/products/:id (admin only)
func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var p models.Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "details": err.Error()})
		return
	}

	p.UpdatedAt = time.Now()
	imagesJSON, _ := json.Marshal(p.Images)
	compatJSON, _ := json.Marshal(p.Compatibility)
	tagsJSON, _ := json.Marshal(p.Tags)

	result, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE products SET
			name_ar = ?, name_en = ?, description_ar = ?, description_en = ?,
			category_id = ?, sub_category = ?, brand = ?, car_brand = ?,
			price = ?, sale_price = ?, stock = ?, images = ?,
			model_3d_url = ?, is_performance = ?, is_tuning = ?, is_oem = ?,
			is_active = ?, is_featured = ?, tags = ?, compatibility = ?,
			updated_at = ?
		WHERE id = ?
	`,
		p.NameAR, p.NameEN, p.DescriptionAR, p.DescriptionEN,
		p.Category, p.SubCategory, p.Brand, p.CarBrand,
		p.Price, p.SalePrice, p.Stock, string(imagesJSON),
		p.Model3DURL, p.IsPerformance, p.IsTuning, p.IsOEM,
		p.IsActive, p.IsFeatured, string(tagsJSON), string(compatJSON),
		formatSQLTime(p.UpdatedAt), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update_error", "message": err.Error()})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "product_not_found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "تم تحديث المنتج / Product updated", "id": id})
}

// Delete godoc
// DELETE /api/v1/admin/products/:id (admin only)
func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Soft delete
	result, err := h.db.ExecContext(c.Request.Context(),
		"UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?",
		formatSQLTime(time.Now()), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete_error"})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "product_not_found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "تم حذف المنتج / Product deleted", "id": id})
}

// BulkImport godoc
// POST /api/v1/admin/products/bulk-import
func (h *ProductHandler) BulkImport(c *gin.Context) {
	var products []models.Product
	if err := c.ShouldBindJSON(&products); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	if len(products) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "too_many_products",
			"message": "الحد الأقصى للاستيراد الدفعي 500 منتج / Max bulk import is 500 products",
		})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "tx_error"})
		return
	}

	imported := 0
	errors := []string{}

	for i, p := range products {
		p.ID = uuid.New().String()
		p.CreatedAt = time.Now()
		p.UpdatedAt = time.Now()
		p.IsActive = true

		imagesJSON, _ := json.Marshal(p.Images)
		compatJSON, _ := json.Marshal(p.Compatibility)
		tagsJSON, _ := json.Marshal(p.Tags)

		_, err := tx.ExecContext(c.Request.Context(), `
			INSERT OR IGNORE INTO products (
				id, name_ar, name_en, sku, category_id, brand, car_brand,
				price, currency, stock, images, compatibility, tags,
				is_performance, is_tuning, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			p.ID, p.NameAR, p.NameEN, p.SKU, p.Category, p.Brand, p.CarBrand,
			p.Price, p.Currency, p.Stock, string(imagesJSON), string(compatJSON), string(tagsJSON),
			p.IsPerformance, p.IsTuning, true, formatSQLTime(p.CreatedAt), formatSQLTime(p.UpdatedAt),
		)
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: %v", i+1, err))
		} else {
			imported++
		}
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"imported": imported,
		"errors":   errors,
		"message":  fmt.Sprintf("تم استيراد %d منتج / Imported %d products", imported, imported),
	})
}

// ─── helpers ──────────────────────────────────────────────────────────────────

func (h *ProductHandler) fetchProductByID(ctx context.Context, id string) (*models.Product, error) {
	row := h.db.QueryRowContext(ctx, "SELECT "+productColumns+" FROM products WHERE id = ?", id)
	return scanProduct(row)
}

// rowScanner is satisfied by both *sql.Row and *sql.Rows.
type rowScanner interface {
	Scan(dest ...interface{}) error
}

// scanProduct scans a single row (in productColumns order) into a Product.
// Several product columns are nullable in the schema, so they're scanned
// into sql.Null* first rather than directly into the struct's plain
// string/float64 fields, which would otherwise fail with "converting NULL
// to string/float64 is unsupported" for any row that leaves them unset.
func scanProduct(row rowScanner) (*models.Product, error) {
	p := &models.Product{}
	var imagesJSON, tagsJSON, keywordsJSON string
	var descriptionAR, descriptionEN, barcode, category, subCategory, model3DURL, distributorID, dimensions, compatJSON sql.NullString
	var salePrice, weight sql.NullFloat64
	var createdAt, updatedAt dbTime

	err := row.Scan(
		&p.ID, &p.NameAR, &p.NameEN, &descriptionAR, &descriptionEN,
		&p.SKU, &barcode, &category, &subCategory, &p.Brand, &p.CarBrand,
		&p.Price, &salePrice, &p.Currency, &p.Stock, &p.LowStockAlert,
		&imagesJSON, &model3DURL, &p.IsPerformance, &p.IsTuning, &p.IsOEM,
		&distributorID, &weight, &dimensions,
		&tagsJSON, &keywordsJSON, &compatJSON,
		&p.Rating, &p.ReviewCount, &p.SoldCount, &p.ViewCount,
		&p.IsActive, &p.IsFeatured, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	p.CreatedAt = createdAt.Time()
	p.UpdatedAt = updatedAt.Time()

	p.DescriptionAR = descriptionAR.String
	p.DescriptionEN = descriptionEN.String
	p.Barcode = barcode.String
	p.Category = category.String
	p.SubCategory = subCategory.String
	p.Model3DURL = model3DURL.String
	p.DistributorID = distributorID.String
	p.Dimensions = dimensions.String
	p.SalePrice = salePrice.Float64
	p.Weight = weight.Float64

	_ = json.Unmarshal([]byte(imagesJSON), &p.Images)
	if compatJSON.Valid {
		_ = json.Unmarshal([]byte(compatJSON.String), &p.Compatibility)
	}
	_ = json.Unmarshal([]byte(tagsJSON), &p.Tags)
	_ = json.Unmarshal([]byte(keywordsJSON), &p.SearchKeywordsAR)

	return p, nil
}

func buildProductListQuery(f *models.ProductFilter) (string, []interface{}) {
	base := "SELECT " + productColumns + " FROM products WHERE is_active = 1"
	args := []interface{}{}

	if f.Category != "" {
		base += " AND category_id = ?"
		args = append(args, f.Category)
	}
	if f.CarBrand != "" {
		base += " AND LOWER(car_brand) = LOWER(?)"
		args = append(args, f.CarBrand)
	}
	if f.MinPrice > 0 {
		base += " AND price >= ?"
		args = append(args, f.MinPrice)
	}
	if f.MaxPrice > 0 {
		base += " AND price <= ?"
		args = append(args, f.MaxPrice)
	}
	if f.IsTuning {
		base += " AND (is_tuning = 1 OR is_performance = 1)"
	}
	if f.InStock {
		base += " AND stock > 0"
	}

	switch f.SortBy {
	case "price_asc":
		base += " ORDER BY price ASC"
	case "price_desc":
		base += " ORDER BY price DESC"
	case "rating":
		base += " ORDER BY rating DESC, review_count DESC"
	case "newest":
		base += " ORDER BY created_at DESC"
	default: // popular
		base += " ORDER BY is_featured DESC, sold_count DESC"
	}

	return base, args
}

func buildProductCountQuery(f *models.ProductFilter) string {
	query, _ := buildProductListQuery(f)
	return strings.Replace(query, "SELECT "+productColumns+" FROM products", "SELECT COUNT(*) FROM products", 1)
}

func scanProductRows(rows *sql.Rows) ([]*models.Product, error) {
	var products []*models.Product

	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		products = append(products, p)
	}

	return products, rows.Err()
}

// ─── Stub handlers for category, order, distributor, auth ─────────────────────

// CategoryHandler handles category endpoints
type CategoryHandler struct{ db *sql.DB }

func NewCategoryHandler(db *sql.DB) *CategoryHandler { return &CategoryHandler{db: db} }

func (h *CategoryHandler) List(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, parent_id, icon_url, sort_order FROM categories WHERE parent_id IS NULL ORDER BY sort_order")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	type Category struct {
		ID       string  `json:"id"`
		NameAR   string  `json:"name_ar"`
		NameEN   string  `json:"name_en"`
		ParentID *string `json:"parent_id"`
		IconURL  string  `json:"icon_url"`
		Sort     int     `json:"sort_order"`
	}

	var cats []Category
	for rows.Next() {
		var cat Category
		var iconURL sql.NullString
		if err := rows.Scan(&cat.ID, &cat.NameAR, &cat.NameEN, &cat.ParentID, &iconURL, &cat.Sort); err != nil {
			continue
		}
		cat.IconURL = iconURL.String
		cats = append(cats, cat)
	}
	c.JSON(http.StatusOK, gin.H{"data": cats})
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": nil})
}

func (h *CategoryHandler) GetProducts(c *gin.Context) {
	categoryID := c.Param("id")
	filter := &models.ProductFilter{Category: categoryID, Page: 1, Limit: 24}
	if err := c.ShouldBindQuery(filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_params", "message": err.Error()})
		return
	}
	filter.Category = categoryID // path param takes precedence over any query-string override
	query, args := buildProductListQuery(filter)
	args = append(args, filter.Limit, (filter.Page-1)*filter.Limit)
	query += " LIMIT ? OFFSET ?"
	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()
	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": products})
}

// OrderHandler handles cart and order endpoints
type OrderHandler struct{ db *sql.DB }

func NewOrderHandler(db *sql.DB) *OrderHandler { return &OrderHandler{db: db} }

func (h *OrderHandler) GetCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT ci.id, ci.product_id, ci.quantity, p.name_ar, p.name_en, p.price, p.images
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = ?
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()
	type CartItem struct {
		ID        string  `json:"id"`
		ProductID string  `json:"product_id"`
		Quantity  int     `json:"quantity"`
		NameAR    string  `json:"name_ar"`
		NameEN    string  `json:"name_en"`
		Price     float64 `json:"price"`
		Images    string  `json:"images"`
	}
	var items []CartItem
	var total float64
	for rows.Next() {
		var item CartItem
		if err := rows.Scan(&item.ID, &item.ProductID, &item.Quantity, &item.NameAR, &item.NameEN, &item.Price, &item.Images); err != nil {
			continue
		}
		total += item.Price * float64(item.Quantity)
		items = append(items, item)
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total, "currency": "SAR"})
}

func (h *OrderHandler) AddToCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1,max=99"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	id := uuid.New().String()
	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO cart_items (id, user_id, product_id, quantity, added_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
	`, id, userID, req.ProductID, req.Quantity, formatSQLTime(time.Now()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تمت الإضافة / Added to cart"})
}

func (h *OrderHandler) UpdateCartItem(c *gin.Context) {
	userID, _ := c.Get("user_id")
	itemID := c.Param("itemId")
	var req struct {
		Quantity int `json:"quantity" binding:"required,min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	var err error
	if req.Quantity == 0 {
		_, err = h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE id = ? AND user_id = ?", itemID, userID)
	} else {
		_, err = h.db.ExecContext(c.Request.Context(), "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?", req.Quantity, itemID, userID)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم التحديث / Updated"})
}

func (h *OrderHandler) RemoveFromCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	itemID := c.Param("itemId")
	if _, err := h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE id = ? AND user_id = ?", itemID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تمت الإزالة / Removed"})
}

func (h *OrderHandler) ClearCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if _, err := h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE user_id = ?", userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم مسح السلة / Cart cleared"})
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		ShippingAddress string `json:"shipping_address" binding:"required"`
		PaymentMethod   string `json:"payment_method" binding:"required"`
		Notes           string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	// subtotal/total are NOT NULL columns on orders, so they must be computed
	// from the cart up front — the previous version never supplied them and
	// every checkout failed with a NOT NULL constraint violation.
	var subtotal float64
	if err := h.db.QueryRowContext(c.Request.Context(), `
		SELECT COALESCE(SUM(p.price * ci.quantity), 0)
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = ?
	`, userID).Scan(&subtotal); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cart_error"})
		return
	}
	if subtotal <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty_cart", "message": "السلة فارغة / Cart is empty"})
		return
	}

	orderID := uuid.New().String()
	now := formatSQLTime(time.Now())
	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO orders (id, user_id, status, subtotal, total, shipping_address, payment_method, notes_ar, created_at, updated_at)
		VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
	`, orderID, userID, subtotal, subtotal, req.ShippingAddress, req.PaymentMethod, req.Notes, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "order_create_error"})
		return
	}
	if _, err := h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE user_id = ?", userID); err != nil {
		log.Printf("⚠️  Failed to clear cart after order %s: %v", orderID, err)
	}
	c.JSON(http.StatusCreated, gin.H{"order_id": orderID, "status": "pending", "message": "تم إنشاء الطلب / Order created"})
}

func (h *OrderHandler) ListUserOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	rows, err := h.db.QueryContext(c.Request.Context(),
		"SELECT id, status, total AS total_amount, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()
	type OrderSummary struct {
		ID          string    `json:"id"`
		Status      string    `json:"status"`
		TotalAmount float64   `json:"total_amount"`
		CreatedAt   time.Time `json:"created_at"`
	}
	var orders []OrderSummary
	for rows.Next() {
		var o OrderSummary
		var createdAt dbTime
		if err := rows.Scan(&o.ID, &o.Status, &o.TotalAmount, &createdAt); err != nil {
			continue
		}
		o.CreatedAt = createdAt.Time()
		orders = append(orders, o)
	}
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")
	row := h.db.QueryRowContext(c.Request.Context(),
		"SELECT id, status, total AS total_amount, shipping_address, created_at FROM orders WHERE id = ? AND user_id = ?",
		orderID, userID)
	var o struct {
		ID              string    `json:"id"`
		Status          string    `json:"status"`
		TotalAmount     float64   `json:"total_amount"`
		ShippingAddress string    `json:"shipping_address"`
		CreatedAt       time.Time `json:"created_at"`
	}
	var createdAt dbTime
	if err := row.Scan(&o.ID, &o.Status, &o.TotalAmount, &o.ShippingAddress, &createdAt); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order_not_found"})
		return
	}
	o.CreatedAt = createdAt.Time()
	c.JSON(http.StatusOK, gin.H{"data": o})
}

func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")
	result, err := h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')",
		formatSQLTime(time.Now()), orderID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cancel_error"})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot_cancel", "message": "لا يمكن إلغاء هذا الطلب / Cannot cancel this order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم إلغاء الطلب / Order cancelled"})
}

func (h *OrderHandler) ListAllOrders(c *gin.Context) {
	status := c.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	whereClause := ""
	args := []interface{}{}
	if status != "" {
		whereClause = "WHERE status = ?"
		args = append(args, status)
	}
	args = append(args, limit)
	rows, err := h.db.QueryContext(c.Request.Context(),
		fmt.Sprintf("SELECT id, user_id, status, total AS total_amount, created_at FROM orders %s ORDER BY created_at DESC LIMIT ?", whereClause),
		args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	type AdminOrderSummary struct {
		ID          string    `json:"id"`
		UserID      string    `json:"user_id"`
		Status      string    `json:"status"`
		TotalAmount float64   `json:"total_amount"`
		CreatedAt   time.Time `json:"created_at"`
	}
	orders := []AdminOrderSummary{}
	for rows.Next() {
		var o AdminOrderSummary
		var createdAt dbTime
		if err := rows.Scan(&o.ID, &o.UserID, &o.Status, &o.TotalAmount, &createdAt); err != nil {
			continue
		}
		o.CreatedAt = createdAt.Time()
		orders = append(orders, o)
	}
	c.JSON(http.StatusOK, gin.H{"data": orders})
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	validStatuses := map[string]bool{"pending": true, "confirmed": true, "shipped": true, "delivered": true, "cancelled": true}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_status"})
		return
	}
	if _, err := h.db.ExecContext(c.Request.Context(), "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", req.Status, formatSQLTime(time.Now()), orderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم تحديث حالة الطلب / Order status updated"})
}

// DistributorHandler handles distributor endpoints
type DistributorHandler struct{ db *sql.DB }

func NewDistributorHandler(db *sql.DB) *DistributorHandler { return &DistributorHandler{db: db} }

func (h *DistributorHandler) List(c *gin.Context) {
	city := c.Query("city")
	args := []interface{}{}
	where := ""
	if city != "" {
		where = "WHERE city = ?"
		args = append(args, city)
	}
	rows, err := h.db.QueryContext(c.Request.Context(),
		fmt.Sprintf("SELECT id, name_ar, name_en, city, region, rating, is_verified FROM distributors %s ORDER BY is_verified DESC, rating DESC", where), args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()
	var dists []models.Distributor
	for rows.Next() {
		var d models.Distributor
		if err := rows.Scan(&d.ID, &d.NameAR, &d.NameEN, &d.City, &d.Region, &d.Rating, &d.IsVerified); err != nil {
			continue
		}
		dists = append(dists, d)
	}
	c.JSON(http.StatusOK, gin.H{"data": dists})
}

func (h *DistributorHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var d models.Distributor
	var address sql.NullString
	err := h.db.QueryRowContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, city, region, phone, whatsapp, address, is_verified, rating FROM distributors WHERE id = ?", id).
		Scan(&d.ID, &d.NameAR, &d.NameEN, &d.City, &d.Region, &d.Phone, &d.WhatsApp, &address, &d.IsVerified, &d.Rating)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	d.Address = address.String
	c.JSON(http.StatusOK, gin.H{"data": d})
}

func (h *DistributorHandler) Nearby(c *gin.Context) {
	city := c.Query("city")
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city_required"})
		return
	}
	rows, err := h.db.QueryContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, city, phone, is_verified, rating FROM distributors WHERE city = ? ORDER BY is_verified DESC, rating DESC LIMIT 10", city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()
	var dists []models.Distributor
	for rows.Next() {
		var d models.Distributor
		if err := rows.Scan(&d.ID, &d.NameAR, &d.NameEN, &d.City, &d.Phone, &d.IsVerified, &d.Rating); err != nil {
			continue
		}
		dists = append(dists, d)
	}
	c.JSON(http.StatusOK, gin.H{"data": dists})
}

func (h *DistributorHandler) GetCatalog(c *gin.Context) {
	distID := c.Param("id")
	rows, err := h.db.QueryContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, price, stock, category_id FROM products WHERE distributor_id = ? AND is_active = 1 ORDER BY category_id, name_ar LIMIT 100", distID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer func() { _ = rows.Close() }()

	type catalogItem struct {
		ID       string  `json:"id"`
		NameAR   string  `json:"name_ar"`
		NameEN   string  `json:"name_en"`
		Price    float64 `json:"price"`
		Stock    int     `json:"stock"`
		Category string  `json:"category"`
	}
	items := []catalogItem{}
	for rows.Next() {
		var it catalogItem
		if err := rows.Scan(&it.ID, &it.NameAR, &it.NameEN, &it.Price, &it.Stock, &it.Category); err != nil {
			continue
		}
		items = append(items, it)
	}
	c.JSON(http.StatusOK, gin.H{"distributor_id": distID, "data": items})
}

func (h *DistributorHandler) Create(c *gin.Context) {
	var d models.Distributor
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	d.ID = uuid.New().String()
	d.JoinedAt = time.Now()
	_, err := h.db.ExecContext(c.Request.Context(),
		"INSERT INTO distributors (id, name_ar, name_en, city, region, phone, whatsapp, address, is_verified, rating, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, ?)",
		d.ID, d.NameAR, d.NameEN, d.City, d.Region, d.Phone, d.WhatsApp, d.Address, formatSQLTime(d.JoinedAt))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "insert_error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": d})
}

func (h *DistributorHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var d models.Distributor
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if _, err := h.db.ExecContext(c.Request.Context(),
		"UPDATE distributors SET name_ar = ?, name_en = ?, city = ?, phone = ?, whatsapp = ?, address = ? WHERE id = ?",
		d.NameAR, d.NameEN, d.City, d.Phone, d.WhatsApp, d.Address, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *DistributorHandler) Verify(c *gin.Context) {
	id := c.Param("id")
	if _, err := h.db.ExecContext(c.Request.Context(), "UPDATE distributors SET is_verified = 1 WHERE id = ?", id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم التحقق من الموزع / Distributor verified"})
}

// AuthHandler is implemented in auth.go
