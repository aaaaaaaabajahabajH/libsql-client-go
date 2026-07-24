package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

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
	defer rows.Close()

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
		h.db.Exec("UPDATE products SET view_count = view_count + 1 WHERE id = ?", id)
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
	ftsQuery := fmt.Sprintf(`"%s"`, strings.ReplaceAll(q, `"`, ``))
	ftsSQL := `SELECT ` + productColumnsP + `
		FROM products p
		JOIN products_fts ON products_fts.rowid = p.rowid
		WHERE products_fts MATCH ?
		  AND p.is_active = 1
		ORDER BY rank
		LIMIT ? OFFSET ?`

	rows, err := h.db.QueryContext(c.Request.Context(), ftsSQL, ftsQuery, limit, offset)
	if err != nil {
		// Fallback to LIKE search if FTS table doesn't exist
		like := "%" + q + "%"
		likeSQL := `SELECT ` + productColumns + ` FROM products
			WHERE is_active = 1
			  AND (name_ar LIKE ? OR name_en LIKE ? OR sku LIKE ? OR brand LIKE ?)
			ORDER BY sold_count DESC, rating DESC
			LIMIT ? OFFSET ?`
		rows, err = h.db.QueryContext(c.Request.Context(), likeSQL, like, like, like, like, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "search_error", "message": err.Error()})
			return
		}
	}
	defer rows.Close()

	products, err := scanProductRows(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "scan_error", "message": err.Error()})
		return
	}

	// Log this search for AI Radar
	go func() {
		if len(products) == 0 {
			// Zero results = strong demand signal
			userID, _ := c.Get("user_id")
			h.db.Exec(`
				INSERT INTO customer_requests
				(id, user_id, session_id, query_raw, signal_type, country, created_at)
				VALUES (?, ?, ?, ?, 'search_not_found', ?, ?)
			`,
				uuid.New().String(),
				fmt.Sprintf("%v", userID),
				c.GetHeader("X-Session-ID"),
				q,
				c.GetHeader("CF-IPCountry"),
				time.Now(),
			)
		}
	}()

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

	// Compatibility is stored two ways in the schema:
	//   1. product_compatibility → car_models (structured, may be empty for older seeds)
	//   2. products.car_brand + products.compatibility JSON (used by current seed)
	// We match either.
	modelLike := "%" + carModel + "%"
	args := []interface{}{carBrand, modelLike, modelLike, modelLike}
	whereExtra := ""

	if category != "" {
		whereExtra += " AND p.category_id = ?"
		args = append(args, category)
	}
	args = append(args, limit, offset)

	query := fmt.Sprintf(`
		SELECT DISTINCT `+productColumnsP+`
		FROM products p
		LEFT JOIN product_compatibility pc ON pc.product_id = p.id
		LEFT JOIN car_models cm ON cm.id = pc.car_model_id
		WHERE p.is_active = 1
		  AND LOWER(p.car_brand) = LOWER(?)
		  AND (p.compatibility LIKE ? OR cm.name_ar LIKE ? OR cm.name_en LIKE ?)
		  %s
		ORDER BY p.is_featured DESC, p.sold_count DESC
		LIMIT ? OFFSET ?
	`, whereExtra)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer rows.Close()

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
		SELECT `+productColumns+` FROM products
		WHERE is_active = 1
		  AND (is_performance = 1 OR is_tuning = 1)
		  %s
		ORDER BY is_featured DESC, %s
		LIMIT ? OFFSET ?
	`, brandFilter, orderClause)

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer rows.Close()

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
	defer rows.Close()

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
	p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	p.IsActive = true

	// Serialize complex fields
	imagesJSON, _ := json.Marshal(p.Images)
	compatJSON, _ := json.Marshal(p.Compatibility)
	tagsJSON, _ := json.Marshal(p.Tags)
	keywordsJSON, _ := json.Marshal(p.SearchKeywordsAR)

	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO products (
			id, name_ar, name_en, description_ar, description_en, sku, barcode,
			category, sub_category, brand, car_brand, price, sale_price, currency,
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
		0, 0, 0, 0, true, p.IsFeatured, string(compatJSON), p.CreatedAt, p.UpdatedAt,
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

	p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	imagesJSON, _ := json.Marshal(p.Images)
	compatJSON, _ := json.Marshal(p.Compatibility)
	tagsJSON, _ := json.Marshal(p.Tags)

	result, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE products SET
			name_ar = ?, name_en = ?, description_ar = ?, description_en = ?,
			category = ?, sub_category = ?, brand = ?, car_brand = ?,
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
		p.UpdatedAt, id,
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
		time.Now(), id,
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
		p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		p.IsActive = true

		imagesJSON, _ := json.Marshal(p.Images)
		compatJSON, _ := json.Marshal(p.Compatibility)
		tagsJSON, _ := json.Marshal(p.Tags)

		_, err := tx.ExecContext(c.Request.Context(), `
			INSERT OR IGNORE INTO products (
				id, name_ar, name_en, sku, category, brand, car_brand,
				price, currency, stock, images, compatibility, tags,
				is_performance, is_tuning, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			p.ID, p.NameAR, p.NameEN, p.SKU, p.Category, p.Brand, p.CarBrand,
			p.Price, p.Currency, p.Stock, string(imagesJSON), string(compatJSON), string(tagsJSON),
			p.IsPerformance, p.IsTuning, true, p.CreatedAt, p.UpdatedAt,
		)
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: %v", i+1, err))
		} else {
			imported++
		}
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
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
	row := h.db.QueryRowContext(ctx,
		"SELECT "+productColumns+" FROM products WHERE id = ? AND is_active = 1", id)

	p := &models.Product{}
	var imagesJSON, compatJSON, tagsJSON, keywordsJSON string
	err := row.Scan(
		&p.ID, &p.NameAR, &p.NameEN, &p.DescriptionAR, &p.DescriptionEN,
		&p.SKU, &p.Barcode, &p.Category, &p.SubCategory,
		&p.Brand, &p.CarBrand,
		&p.Price, &p.SalePrice, &p.Currency, &p.Stock, &p.LowStockAlert,
		&imagesJSON, &p.Model3DURL,
		&p.IsPerformance, &p.IsTuning, &p.IsOEM,
		&p.DistributorID, &p.Weight, &p.Dimensions,
		&tagsJSON, &keywordsJSON, &compatJSON,
		&p.Rating, &p.ReviewCount, &p.SoldCount, &p.ViewCount,
		&p.IsActive, &p.IsFeatured, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	json.Unmarshal([]byte(imagesJSON), &p.Images)
	json.Unmarshal([]byte(compatJSON), &p.Compatibility)
	json.Unmarshal([]byte(tagsJSON), &p.Tags)
	json.Unmarshal([]byte(keywordsJSON), &p.SearchKeywordsAR)
	return p, nil
}

// FetchProductByBarcode finds a product by barcode (mobile scanner).
func (h *ProductHandler) FetchProductByBarcode(c *gin.Context) {
	barcode := c.Param("barcode")
	row := h.db.QueryRowContext(c.Request.Context(),
		"SELECT "+productColumns+" FROM products WHERE barcode = ? AND is_active = 1", barcode)
	p := &models.Product{}
	var imagesJSON, compatJSON, tagsJSON, keywordsJSON string
	err := row.Scan(
		&p.ID, &p.NameAR, &p.NameEN, &p.DescriptionAR, &p.DescriptionEN,
		&p.SKU, &p.Barcode, &p.Category, &p.SubCategory,
		&p.Brand, &p.CarBrand,
		&p.Price, &p.SalePrice, &p.Currency, &p.Stock, &p.LowStockAlert,
		&imagesJSON, &p.Model3DURL,
		&p.IsPerformance, &p.IsTuning, &p.IsOEM,
		&p.DistributorID, &p.Weight, &p.Dimensions,
		&tagsJSON, &keywordsJSON, &compatJSON,
		&p.Rating, &p.ReviewCount, &p.SoldCount, &p.ViewCount,
		&p.IsActive, &p.IsFeatured, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	json.Unmarshal([]byte(imagesJSON), &p.Images)
	json.Unmarshal([]byte(compatJSON), &p.Compatibility)
	json.Unmarshal([]byte(tagsJSON), &p.Tags)
	json.Unmarshal([]byte(keywordsJSON), &p.SearchKeywordsAR)
	c.JSON(http.StatusOK, gin.H{"data": p})
}

const productColumns = `id, name_ar, name_en,
	COALESCE(description_ar,''), COALESCE(description_en,''),
	sku, COALESCE(barcode,''), COALESCE(category_id,''), COALESCE(sub_category,''),
	brand, COALESCE(car_brand,''),
	price, COALESCE(sale_price, 0), currency, stock, low_stock_alert,
	COALESCE(images,'[]'), COALESCE(model_3d_url,''),
	is_performance, is_tuning, is_oem,
	COALESCE(distributor_id,''), COALESCE(weight_kg, 0), COALESCE(dimensions,''),
	COALESCE(tags,'[]'), COALESCE(search_keywords_ar,'[]'), COALESCE(compatibility,'[]'),
	rating, review_count, sold_count, view_count,
	is_active, is_featured, created_at, updated_at`

// productColumnsP is productColumns but with the "p." table alias for JOINs.
const productColumnsP = `p.id, p.name_ar, p.name_en,
	COALESCE(p.description_ar,''), COALESCE(p.description_en,''),
	p.sku, COALESCE(p.barcode,''), COALESCE(p.category_id,''), COALESCE(p.sub_category,''),
	p.brand, COALESCE(p.car_brand,''),
	p.price, COALESCE(p.sale_price,0), p.currency, p.stock, p.low_stock_alert,
	COALESCE(p.images,'[]'), COALESCE(p.model_3d_url,''),
	p.is_performance, p.is_tuning, p.is_oem,
	COALESCE(p.distributor_id,''), COALESCE(p.weight_kg,0), COALESCE(p.dimensions,''),
	COALESCE(p.tags,'[]'), COALESCE(p.search_keywords_ar,'[]'), COALESCE(p.compatibility,'[]'),
	p.rating, p.review_count, p.sold_count, p.view_count,
	p.is_active, p.is_featured, p.created_at, p.updated_at`

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
	// Replace SELECT <cols> with SELECT COUNT(*)
	return strings.Replace(query, "SELECT "+productColumns, "SELECT COUNT(*)", 1)
}

func scanProductRows(rows *sql.Rows) ([]*models.Product, error) {
	var products []*models.Product

	for rows.Next() {
		p := &models.Product{}
		var imagesJSON, compatJSON, tagsJSON, keywordsJSON string

		err := rows.Scan(
			&p.ID, &p.NameAR, &p.NameEN, &p.DescriptionAR, &p.DescriptionEN,
			&p.SKU, &p.Barcode, &p.Category, &p.SubCategory,
			&p.Brand, &p.CarBrand,
			&p.Price, &p.SalePrice, &p.Currency, &p.Stock, &p.LowStockAlert,
			&imagesJSON, &p.Model3DURL,
			&p.IsPerformance, &p.IsTuning, &p.IsOEM,
			&p.DistributorID, &p.Weight, &p.Dimensions,
			&tagsJSON, &keywordsJSON, &compatJSON,
			&p.Rating, &p.ReviewCount, &p.SoldCount, &p.ViewCount,
			&p.IsActive, &p.IsFeatured, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}

		json.Unmarshal([]byte(imagesJSON), &p.Images)
		json.Unmarshal([]byte(compatJSON), &p.Compatibility)
		json.Unmarshal([]byte(tagsJSON), &p.Tags)
		json.Unmarshal([]byte(keywordsJSON), &p.SearchKeywordsAR)

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
		"SELECT id, name_ar, name_en, parent_id, slug, COALESCE(icon_url,''), sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer rows.Close()

	type Category struct {
		ID       string  `json:"id"`
		NameAR   string  `json:"name_ar"`
		NameEN   string  `json:"name_en"`
		ParentID *string `json:"parent_id"`
		Slug     string  `json:"slug"`
		IconURL  string  `json:"icon_url"`
		Sort     int     `json:"sort_order"`
	}

	cats := []Category{}
	for rows.Next() {
		var cat Category
		rows.Scan(&cat.ID, &cat.NameAR, &cat.NameEN, &cat.ParentID, &cat.Slug, &cat.IconURL, &cat.Sort)
		cats = append(cats, cat)
	}
	c.JSON(http.StatusOK, gin.H{"categories": cats})
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	idOrSlug := c.Param("id")
	var (
		id, nameAr, nameEn, slug, iconURL string
		parentID                          sql.NullString
		sortOrder                         int
	)
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, name_ar, name_en, parent_id, slug, COALESCE(icon_url,''), sort_order
		 FROM categories WHERE (id = ? OR slug = ?) AND is_active = 1`,
		idOrSlug, idOrSlug).
		Scan(&id, &nameAr, &nameEn, &parentID, &slug, &iconURL, &sortOrder)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "category_not_found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"id": id, "name_ar": nameAr, "name_en": nameEn,
		"parent_id": parentID.String, "slug": slug,
		"icon_url": iconURL, "sort_order": sortOrder,
	}})
}

func (h *CategoryHandler) GetProducts(c *gin.Context) {
	categoryID := c.Param("id")
	filter := &models.ProductFilter{Category: categoryID, Page: 1, Limit: 24}
	c.ShouldBindQuery(filter)
	query, args := buildProductListQuery(filter)
	args = append(args, filter.Limit, (filter.Page-1)*filter.Limit)
	query += " LIMIT ? OFFSET ?"
	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer rows.Close()
	products, _ := scanProductRows(rows)
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
	defer rows.Close()
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
		rows.Scan(&item.ID, &item.ProductID, &item.Quantity, &item.NameAR, &item.NameEN, &item.Price, &item.Images)
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
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO cart_items (id, user_id, product_id, quantity, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = excluded.updated_at
	`, id, userID, req.ProductID, req.Quantity, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
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
	if req.Quantity == 0 {
		h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE id = ? AND user_id = ?", itemID, userID)
	} else {
		h.db.ExecContext(c.Request.Context(), "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?", req.Quantity, itemID, userID)
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم التحديث / Updated"})
}

func (h *OrderHandler) RemoveFromCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	itemID := c.Param("itemId")
	h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE id = ? AND user_id = ?", itemID, userID)
	c.JSON(http.StatusOK, gin.H{"message": "تمت الإزالة / Removed"})
}

func (h *OrderHandler) ClearCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE user_id = ?", userID)
	c.JSON(http.StatusOK, gin.H{"message": "تم مسح السلة / Cart cleared"})
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	// Accept both legacy (shipping_address / payment_method) and mobile
	// (shipping_address_ar / notes_ar) payload shapes. Payment defaults to COD.
	var req struct {
		ShippingAddress   string `json:"shipping_address"`
		ShippingAddressAR string `json:"shipping_address_ar"`
		PaymentMethod     string `json:"payment_method"`
		Notes             string `json:"notes"`
		NotesAR           string `json:"notes_ar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "details": err.Error()})
		return
	}
	address := req.ShippingAddress
	if address == "" {
		address = req.ShippingAddressAR
	}
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_address",
			"message": "عنوان التوصيل مطلوب / shipping address is required",
		})
		return
	}
	notes := req.Notes
	if notes == "" {
		notes = req.NotesAR
	}
	if req.PaymentMethod == "" {
		req.PaymentMethod = "cod"
	}
	// Rewire the local names so the rest of the handler uses them without changes.
	req.ShippingAddress = address
	req.Notes = notes
	// Calculate totals from cart
	var subtotal float64
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT COALESCE(p.sale_price, p.price) * ci.quantity
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = ?
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var lineTotal float64
			rows.Scan(&lineTotal)
			subtotal += lineTotal
		}
	}
	if subtotal == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty_cart", "message": "السلة فارغة / Cart is empty"})
		return
	}
	shipping := 0.0
	if subtotal < 500 {
		shipping = 25.0
	}
	total := subtotal + shipping
	orderNum := "ORD-" + time.Now().Format("060102") + "-" + uuid.New().String()[:6]

	orderID := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = h.db.ExecContext(c.Request.Context(), `
		INSERT INTO orders (id, order_number, user_id, status, subtotal, shipping, total, currency,
		                    payment_method, payment_status, shipping_address, notes_ar, created_at, updated_at)
		VALUES (?, ?, ?, 'pending', ?, ?, ?, 'SAR', ?, 'unpaid', ?, ?, ?, ?)
	`, orderID, orderNum, userID, subtotal, shipping, total,
		req.PaymentMethod, req.ShippingAddress, req.Notes, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "order_create_error", "message": err.Error()})
		return
	}
	// Move cart items to order_items
	h.db.ExecContext(c.Request.Context(), `
		INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
		SELECT hex(randomblob(16)), ?, ci.product_id, ci.quantity,
		       COALESCE(p.sale_price, p.price),
		       COALESCE(p.sale_price, p.price) * ci.quantity
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = ?
	`, orderID, userID)
	h.db.ExecContext(c.Request.Context(), "DELETE FROM cart_items WHERE user_id = ?", userID)

	c.JSON(http.StatusCreated, gin.H{
		"order_id":     orderID,
		"order_number": orderNum,
		"status":       "pending",
		"subtotal":     subtotal,
		"shipping":     shipping,
		"total":        total,
		"currency":     "SAR",
		"message":      "تم إنشاء الطلب بنجاح",
	})
}

func (h *OrderHandler) ListUserOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, COALESCE(order_number,''), status, total, currency, created_at
		 FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	defer rows.Close()
	type OrderSummary struct {
		ID          string  `json:"id"`
		OrderNumber string  `json:"order_number"`
		Status      string  `json:"status"`
		Total       float64 `json:"total"`
		Currency    string  `json:"currency"`
		CreatedAt   string  `json:"created_at"`
	}
	orders := []OrderSummary{}
	for rows.Next() {
		var o OrderSummary
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.Status, &o.Total, &o.Currency, &o.CreatedAt); err != nil {
			continue
		}
		orders = append(orders, o)
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")
	row := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, COALESCE(order_number,''), status, subtotal, shipping, total,
		 currency, COALESCE(shipping_address,''), COALESCE(notes_ar,''), created_at
		 FROM orders WHERE id = ? AND user_id = ?`,
		orderID, userID)
	var o struct {
		ID              string  `json:"id"`
		OrderNumber     string  `json:"order_number"`
		Status          string  `json:"status"`
		Subtotal        float64 `json:"subtotal"`
		Shipping        float64 `json:"shipping"`
		Total           float64 `json:"total"`
		Currency        string  `json:"currency"`
		ShippingAddress string  `json:"shipping_address"`
		NotesAR         string  `json:"notes_ar"`
		CreatedAt       string  `json:"created_at"`
	}
	if err := row.Scan(&o.ID, &o.OrderNumber, &o.Status, &o.Subtotal, &o.Shipping,
		&o.Total, &o.Currency, &o.ShippingAddress, &o.NotesAR, &o.CreatedAt); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order_not_found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": o})
}

func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	orderID := c.Param("id")
	result, err := h.db.ExecContext(c.Request.Context(),
		"UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')",
		time.Now(), orderID, userID)
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
	rows, _ := h.db.QueryContext(c.Request.Context(),
		fmt.Sprintf("SELECT id, user_id, status, total_amount, created_at FROM orders %s ORDER BY created_at DESC LIMIT ?", whereClause),
		args...)
	defer rows.Close()
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
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
	h.db.ExecContext(c.Request.Context(), "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", req.Status, time.Now(), orderID)
	c.JSON(http.StatusOK, gin.H{"message": "تم تحديث حالة الطلب / Order status updated"})
}

// DistributorHandler handles distributor endpoints
type DistributorHandler struct{ db *sql.DB }

func NewDistributorHandler(db *sql.DB) *DistributorHandler { return &DistributorHandler{db: db} }

func (h *DistributorHandler) List(c *gin.Context) {
	city := c.Query("city")
	region := c.Query("region")
	args := []interface{}{}
	where := "WHERE is_active = 1"
	if region != "" {
		where += " AND region = ?"
		args = append(args, region)
	}
	if city != "" {
		where += " AND city = ?"
		args = append(args, city)
	}
	rows, err := h.db.QueryContext(c.Request.Context(),
		fmt.Sprintf(`SELECT id, name_ar, name_en, city, region,
			COALESCE(phone,''), COALESCE(address,''),
			COALESCE(logo_url,''), is_verified, rating
			FROM distributors %s ORDER BY is_verified DESC, rating DESC`, where), args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "details": err.Error()})
		return
	}
	defer rows.Close()
	dists := []gin.H{}
	for rows.Next() {
		var id, nameAr, nameEn, city, region, phone, address, logoURL string
		var isVerified int
		var rating float64
		if err := rows.Scan(&id, &nameAr, &nameEn, &city, &region, &phone, &address, &logoURL, &isVerified, &rating); err != nil {
			continue
		}
		dists = append(dists, gin.H{
			"id": id, "name_ar": nameAr, "name_en": nameEn,
			"city": city, "region": region,
			"phone": phone, "address": address, "logo_url": logoURL,
			"is_verified": isVerified == 1, "rating": rating,
		})
	}
	c.JSON(http.StatusOK, gin.H{"distributors": dists})
}

func (h *DistributorHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var d models.Distributor
	err := h.db.QueryRowContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, city, region, phone, whatsapp, address, is_verified, rating FROM distributors WHERE id = ?", id).
		Scan(&d.ID, &d.NameAR, &d.NameEN, &d.City, &d.Region, &d.Phone, &d.WhatsApp, &d.Address, &d.IsVerified, &d.Rating)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": d})
}

func (h *DistributorHandler) Nearby(c *gin.Context) {
	city := c.Query("city")
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city_required"})
		return
	}
	rows, _ := h.db.QueryContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, city, phone, is_verified, rating FROM distributors WHERE city = ? ORDER BY is_verified DESC, rating DESC LIMIT 10", city)
	defer rows.Close()
	var dists []models.Distributor
	for rows.Next() {
		var d models.Distributor
		rows.Scan(&d.ID, &d.NameAR, &d.NameEN, &d.City, &d.Phone, &d.IsVerified, &d.Rating)
		dists = append(dists, d)
	}
	c.JSON(http.StatusOK, gin.H{"data": dists})
}

func (h *DistributorHandler) GetCatalog(c *gin.Context) {
	distID := c.Param("id")
	rows, _ := h.db.QueryContext(c.Request.Context(),
		"SELECT id, name_ar, name_en, price, stock, category FROM products WHERE distributor_id = ? AND is_active = 1 ORDER BY category, name_ar LIMIT 100", distID)
	defer rows.Close()
	c.JSON(http.StatusOK, gin.H{"distributor_id": distID, "data": []interface{}{}})
}

func (h *DistributorHandler) Create(c *gin.Context) {
	var d models.Distributor
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	d.ID = uuid.New().String()
	d.JoinedAt = time.Now().UTC().Format(time.RFC3339)
	_, err := h.db.ExecContext(c.Request.Context(),
		"INSERT INTO distributors (id, name_ar, name_en, city, region, phone, whatsapp, address, is_verified, rating, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, ?)",
		d.ID, d.NameAR, d.NameEN, d.City, d.Region, d.Phone, d.WhatsApp, d.Address, d.JoinedAt)
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
	h.db.ExecContext(c.Request.Context(),
		"UPDATE distributors SET name_ar = ?, name_en = ?, city = ?, phone = ?, whatsapp = ?, address = ? WHERE id = ?",
		d.NameAR, d.NameEN, d.City, d.Phone, d.WhatsApp, d.Address, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *DistributorHandler) Verify(c *gin.Context) {
	id := c.Param("id")
	h.db.ExecContext(c.Request.Context(), "UPDATE distributors SET is_verified = 1 WHERE id = ?", id)
	c.JSON(http.StatusOK, gin.H{"message": "تم التحقق من الموزع / Distributor verified"})
}

// AuthHandler handles authentication
const devJWTSecret = "ghyari-dev-secret-change-in-production-minimum-32-chars"

// jwtSecret returns the signing key.
// In release mode (GIN_MODE=release) it PANICS if JWT_SECRET is unset or matches
// the well-known dev default — a production process must never sign with a
// public secret. In debug mode it falls back to the dev secret with a warning.
func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	prod := os.Getenv("GIN_MODE") == "release"
	if s == "" || s == devJWTSecret {
		if prod {
			panic("JWT_SECRET must be set to a strong random value in production " +
				"(see scripts/generate-secrets.sh). Refusing to sign tokens with the dev default.")
		}
		return []byte(devJWTSecret)
	}
	if len(s) < 32 {
		if prod {
			panic("JWT_SECRET must be at least 32 characters in production")
		}
	}
	return []byte(s)
}

func issueJWT(userID, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(jwtSecret())
}

type AuthHandler struct{ db *sql.DB }

func NewAuthHandler(db *sql.DB) *AuthHandler { return &AuthHandler{db: db} }

func (h *AuthHandler) Register(c *gin.Context) {
	// Accept both {name, phone?} (mobile app) and {name_ar, phone} (legacy web).
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Name     string `json:"name"`
		NameAR   string `json:"name_ar"`
		Phone    string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "details": err.Error()})
		return
	}
	name := req.Name
	if name == "" {
		name = req.NameAR
	}
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_name", "message": "name (or name_ar) is required"})
		return
	}

	var exists int
	h.db.QueryRowContext(c.Request.Context(),
		"SELECT COUNT(*) FROM users WHERE email = ?", req.Email).Scan(&exists)
	if exists > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "email_exists", "message": "البريد الإلكتروني مسجل مسبقاً"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash_error"})
		return
	}

	id := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = h.db.ExecContext(c.Request.Context(),
		"INSERT INTO users (id, email, phone, name, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'customer', 1, ?, ?)",
		id, req.Email, req.Phone, name, string(hash), now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "register_failed", "message": err.Error()})
		return
	}

	// Auto-login: issue JWT so the mobile app can use the new account immediately.
	token, err := issueJWT(id, req.Email, "customer")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"user":  gin.H{"id": id, "email": req.Email, "name": name, "role": "customer"},
		"token": token,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	var userID, role, name, passwordHash string
	err := h.db.QueryRowContext(c.Request.Context(),
		"SELECT id, role, name, password_hash FROM users WHERE email = ? AND is_active = 1",
		req.Email).
		Scan(&userID, &role, &name, &passwordHash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials", "message": "البريد أو كلمة المرور غير صحيحة"})
		return
	}

	// Verify password. Historic seed users may have unhashed placeholders — treat
	// any bcrypt-looking hash as required; other formats reject unless bootstrap.
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials", "message": "البريد أو كلمة المرور غير صحيحة"})
		return
	}

	token, err := issueJWT(userID, req.Email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  gin.H{"id": userID, "email": req.Email, "name": name, "role": role},
		"token": token,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"access_token": "new_jwt_placeholder", "expires_in": 900})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "تم تسجيل الخروج / Logged out"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var id, email, name, role string
	var phone sql.NullString
	err := h.db.QueryRowContext(c.Request.Context(),
		"SELECT id, email, COALESCE(name,''), COALESCE(phone,''), role FROM users WHERE id = ?", userID).
		Scan(&id, &email, &name, &phone, &role)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"id": id, "email": email, "name": name, "phone": phone.String, "role": role,
	}})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		NameAR string `json:"name_ar"`
		Phone  string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	h.db.ExecContext(c.Request.Context(), "UPDATE users SET name_ar = ?, phone = ? WHERE id = ?", req.NameAR, req.Phone, userID)
	c.JSON(http.StatusOK, gin.H{"message": "تم التحديث / Profile updated"})
}
