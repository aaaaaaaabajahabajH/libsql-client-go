package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CarHandler handles car brands and models endpoints
type CarHandler struct{ db *sql.DB }

// NewCarHandler creates a CarHandler
func NewCarHandler(db *sql.DB) *CarHandler { return &CarHandler{db: db} }

// ListBrands returns all car brands, popular ones first
func (h *CarHandler) ListBrands(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, name_ar, name_en, logo_url, is_popular
		 FROM car_brands ORDER BY is_popular DESC, sort_order`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer rows.Close()

	brands := []map[string]any{}
	for rows.Next() {
		var id, nameAR, nameEN string
		var logoURL sql.NullString
		var isPopular bool
		if err := rows.Scan(&id, &nameAR, &nameEN, &logoURL, &isPopular); err != nil {
			continue
		}
		brands = append(brands, map[string]any{
			"id": id, "name_ar": nameAR, "name_en": nameEN,
			"logo_url": logoURL.String, "is_popular": isPopular,
		})
	}
	c.JSON(http.StatusOK, gin.H{"brands": brands})
}

// ListModels returns all models for a given car brand
func (h *CarHandler) ListModels(c *gin.Context) {
	brandID := c.Param("brand")
	if brandID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "brand_required"})
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, brand_id, name_ar, name_en, year_from, year_to, body_type, is_popular
		 FROM car_models
		 WHERE brand_id = ?
		 ORDER BY is_popular DESC, year_from DESC`,
		brandID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer rows.Close()

	models := []map[string]any{}
	for rows.Next() {
		var id, brandIDVal, nameAR, nameEN, bodyType string
		var yearFrom int
		var yearTo sql.NullInt64
		var isPopular bool
		if err := rows.Scan(&id, &brandIDVal, &nameAR, &nameEN, &yearFrom, &yearTo, &bodyType, &isPopular); err != nil {
			continue
		}
		m := map[string]any{
			"id": id, "brand_id": brandIDVal, "name_ar": nameAR, "name_en": nameEN,
			"year_from": yearFrom, "body_type": bodyType, "is_popular": isPopular,
		}
		if yearTo.Valid {
			m["year_to"] = yearTo.Int64
		}
		models = append(models, m)
	}
	c.JSON(http.StatusOK, gin.H{"models": models, "brand": brandID})
}
