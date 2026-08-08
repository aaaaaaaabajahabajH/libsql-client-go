package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct{ db *sql.DB }

func NewAuthHandler(db *sql.DB) *AuthHandler { return &AuthHandler{db: db} }

type registerRequest struct {
	Name     string `json:"name"  binding:"required,min=2,max=100"`
	Phone    string `json:"phone" binding:"required"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required,min=8"`
}

type loginRequest struct {
	Phone    string `json:"phone"    binding:"required"`
	Password string `json:"password" binding:"required"`
}

type jwtClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "ghyari-dev-secret-change-in-production-minimum-32-chars"
	}
	return []byte(s)
}

func issueToken(userID, email, role string) (string, error) {
	claims := jwtClaims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		SessionID: uuid.New().String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "ghyari",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret())
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input", "details": err.Error()})
		return
	}

	req.Phone = strings.TrimSpace(req.Phone)

	// Check if phone already registered
	var existing string
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id FROM users WHERE phone = ? LIMIT 1`, req.Phone).Scan(&existing)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "phone_exists", "message": "رقم الهاتف مسجّل مسبقاً"})
		return
	}
	if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash_error"})
		return
	}

	id := uuid.New().String()
	_, err = h.db.ExecContext(c.Request.Context(),
		`INSERT INTO users (id, phone, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, 'customer')`,
		id, req.Phone, req.Email, req.Name, string(hash),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error", "details": err.Error()})
		return
	}

	token, err := issueToken(id, req.Email, "customer")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":   token,
		"user_id": id,
		"message": "تم التسجيل بنجاح",
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input", "details": err.Error()})
		return
	}

	var (
		id, email, role, passwordHash string
		isActive                      bool
	)
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT id, COALESCE(email,''), role, password_hash, is_active FROM users WHERE phone = ? LIMIT 1`,
		strings.TrimSpace(req.Phone),
	).Scan(&id, &email, &role, &passwordHash, &isActive)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials", "message": "رقم الهاتف أو كلمة المرور غير صحيحة"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	if !isActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "account_disabled", "message": "الحساب موقوف"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials", "message": "رقم الهاتف أو كلمة المرور غير صحيحة"})
		return
	}

	token, err := issueToken(id, email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"user_id": id,
		"role":    role,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// For simplicity: re-issue from existing valid token
	userID, _ := c.Get("user_id")
	email, _ := c.Get("user_email")
	role, _ := c.Get("user_role")

	token, err := issueToken(
		userID.(string),
		email.(string),
		role.(string),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Stateless JWT — client drops the token
	c.JSON(http.StatusOK, gin.H{"message": "تم تسجيل الخروج"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var name, phone, email, city, region, role string
	var loyaltyPoints int
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT name, phone, COALESCE(email,''), COALESCE(city,''), COALESCE(region,''), role, loyalty_points
		 FROM users WHERE id = ? LIMIT 1`, userID,
	).Scan(&name, &phone, &email, &city, &region, &role, &loyaltyPoints)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": gin.H{
		"id": userID, "name": name, "phone": phone, "email": email,
		"city": city, "region": region, "role": role, "loyalty_points": loyaltyPoints,
	}})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var body struct {
		Name   string `json:"name"`
		City   string `json:"city"`
		Region string `json:"region"`
		Email  string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input"})
		return
	}
	_, err := h.db.ExecContext(c.Request.Context(),
		`UPDATE users SET name=COALESCE(NULLIF(?,''),name), city=COALESCE(NULLIF(?,''),city),
		 region=COALESCE(NULLIF(?,''),region), email=COALESCE(NULLIF(?,''),email),
		 updated_at=datetime('now') WHERE id=?`,
		body.Name, body.City, body.Region, body.Email, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تم التحديث بنجاح"})
}
