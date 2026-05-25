package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CategoryHandler handles category endpoints
type CategoryHandler struct{ db *sql.DB }
func NewCategoryHandler(db *sql.DB) *CategoryHandler { return &CategoryHandler{db: db} }

func (h *CategoryHandler) List(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, parent_id, name_ar, name_en, slug FROM categories WHERE is_active = 1 ORDER BY sort_order`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer rows.Close()
	cats := []map[string]any{}
	for rows.Next() {
		var id, parentID, nameAR, nameEN, slug string
		rows.Scan(&id, &parentID, &nameAR, &nameEN, &slug)
		cats = append(cats, map[string]any{
			"id": id, "parent_id": parentID, "name_ar": nameAR, "name_en": nameEN, "slug": slug,
		})
	}
	c.JSON(http.StatusOK, gin.H{"categories": cats})
}
func (h *CategoryHandler) GetByID(c *gin.Context)   { c.JSON(http.StatusOK, gin.H{"category": nil}) }
func (h *CategoryHandler) GetProducts(c *gin.Context) {
	catID := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"category_id": catID, "products": []any{}})
}

// OrderHandler handles cart and order endpoints
type OrderHandler struct{ db *sql.DB }
func NewOrderHandler(db *sql.DB) *OrderHandler { return &OrderHandler{db: db} }

func (h *OrderHandler) GetCart(c *gin.Context)          { c.JSON(http.StatusOK, gin.H{"items": []any{}, "total": 0}) }
func (h *OrderHandler) AddToCart(c *gin.Context)        { c.JSON(http.StatusCreated, gin.H{"added": true}) }
func (h *OrderHandler) UpdateCartItem(c *gin.Context)   { c.JSON(http.StatusOK, gin.H{"updated": true}) }
func (h *OrderHandler) RemoveFromCart(c *gin.Context)   { c.JSON(http.StatusOK, gin.H{"removed": true}) }
func (h *OrderHandler) ClearCart(c *gin.Context)        { c.JSON(http.StatusOK, gin.H{"cleared": true}) }
func (h *OrderHandler) CreateOrder(c *gin.Context)      { c.JSON(http.StatusCreated, gin.H{"order_id": "pending"}) }
func (h *OrderHandler) ListUserOrders(c *gin.Context)   { c.JSON(http.StatusOK, gin.H{"orders": []any{}}) }
func (h *OrderHandler) GetOrder(c *gin.Context)         { c.JSON(http.StatusOK, gin.H{"order": nil}) }
func (h *OrderHandler) CancelOrder(c *gin.Context)      { c.JSON(http.StatusOK, gin.H{"cancelled": true}) }
func (h *OrderHandler) ListAllOrders(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"orders": []any{}}) }
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"updated": true}) }

// DistributorHandler handles distributor endpoints
type DistributorHandler struct{ db *sql.DB }
func NewDistributorHandler(db *sql.DB) *DistributorHandler { return &DistributorHandler{db: db} }

func (h *DistributorHandler) List(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, name_ar, name_en, city, region, phone, is_verified, rating
		 FROM distributors WHERE is_active = 1 ORDER BY is_verified DESC, rating DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	defer rows.Close()
	dists := []map[string]any{}
	for rows.Next() {
		var id, nameAR, nameEN, city, region, phone string
		var isVerified bool
		var rating float64
		rows.Scan(&id, &nameAR, &nameEN, &city, &region, &phone, &isVerified, &rating)
		dists = append(dists, map[string]any{
			"id": id, "name_ar": nameAR, "city": city, "region": region,
			"is_verified": isVerified, "rating": rating,
		})
	}
	c.JSON(http.StatusOK, gin.H{"distributors": dists})
}
func (h *DistributorHandler) GetByID(c *gin.Context)   { c.JSON(http.StatusOK, gin.H{"distributor": nil}) }
func (h *DistributorHandler) Nearby(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"distributors": []any{}}) }
func (h *DistributorHandler) GetCatalog(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"products": []any{}}) }
func (h *DistributorHandler) Create(c *gin.Context)    { c.JSON(http.StatusCreated, gin.H{"created": true}) }
func (h *DistributorHandler) Update(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"updated": true}) }
func (h *DistributorHandler) Verify(c *gin.Context)    { c.JSON(http.StatusOK, gin.H{"verified": true}) }

// AuthHandler handles authentication endpoints
type AuthHandler struct{ db *sql.DB }
func NewAuthHandler(db *sql.DB) *AuthHandler { return &AuthHandler{db: db} }

func (h *AuthHandler) Register(c *gin.Context)      { c.JSON(http.StatusCreated, gin.H{"message": "تم التسجيل بنجاح"}) }
func (h *AuthHandler) Login(c *gin.Context)         { c.JSON(http.StatusOK, gin.H{"token": "", "message": "تسجيل الدخول"}) }
func (h *AuthHandler) RefreshToken(c *gin.Context)  { c.JSON(http.StatusOK, gin.H{"token": ""}) }
func (h *AuthHandler) Logout(c *gin.Context)        { c.JSON(http.StatusOK, gin.H{"message": "تم تسجيل الخروج"}) }
func (h *AuthHandler) Me(c *gin.Context)            { c.JSON(http.StatusOK, gin.H{"user": nil}) }
func (h *AuthHandler) UpdateProfile(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"updated": true}) }
