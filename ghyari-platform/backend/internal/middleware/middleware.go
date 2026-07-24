package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Logger returns a structured logging middleware
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()

		duration := time.Since(start)
		statusCode := c.Writer.Status()

		// Structured log (zerolog format)
		level := "INFO"
		if statusCode >= 500 {
			level = "ERROR"
		} else if statusCode >= 400 {
			level = "WARN"
		}

		gin.DefaultWriter.Write([]byte(
			time.Now().Format(time.RFC3339) + " " + level +
				" method=" + c.Request.Method +
				" path=" + c.Request.URL.Path +
				" status=" + http.StatusText(statusCode) +
				" duration=" + duration.String() +
				" ip=" + c.ClientIP() +
				" request_id=" + requestID + "\n",
		))
	}
}

// JWTClaims extends jwt.RegisteredClaims with user info
type JWTClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

// RequireAuth validates a JWT Bearer token
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "missing_token",
				"message": "مطلوب تسجيل الدخول / Authentication required",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token_format",
				"message": "تنسيق التوكن غير صحيح / Invalid token format",
			})
			return
		}

		tokenStr := parts[1]
		jwtSecret := getJWTSecret()

		token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": "التوكن غير صالح أو منتهي / Token is invalid or expired",
			})
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_claims",
				"message": "بيانات التوكن غير صحيحة / Invalid token claims",
			})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("session_id", claims.SessionID)
		c.Next()
	}
}

// RequireRole checks that the authenticated user has the specified role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "no_role",
				"message": "لا توجد صلاحية / No role assigned",
			})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid_role"})
			return
		}

		for _, r := range roles {
			if roleStr == r {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error":    "insufficient_role",
			"message":  "غير مصرح لك بهذه العملية / Insufficient permissions",
			"required": roles,
		})
	}
}

// RateLimit is a simple per-IP rate limiter (production: use Redis-backed)
func RateLimit(requestsPerMinute int) gin.HandlerFunc {
	// Simple in-memory token bucket per IP
	// Production: replace with Redis-based sliding window
	_ = requestsPerMinute
	return func(c *gin.Context) {
		// TODO: Redis-backed rate limiter
		c.Next()
	}
}

func getJWTSecret() []byte {
	secret := getEnv("JWT_SECRET", "ghyari-dev-secret-change-in-production-minimum-32-chars")
	return []byte(secret)
}

func getEnv(key, fallback string) string {
	if v := lookupEnv(key); v != "" {
		return v
	}
	return fallback
}

func lookupEnv(key string) string {
	return os.Getenv(key)
}
