package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
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

		level := "INFO"
		if statusCode >= 500 {
			level = "ERROR"
		} else if statusCode >= 400 {
			level = "WARN"
		}

		_, _ = gin.DefaultWriter.Write([]byte(
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

// RateLimit is a Redis-backed sliding window rate limiter.
// Falls back to pass-through if Redis is unavailable (graceful degradation).
func RateLimit(requestsPerMinute int) gin.HandlerFunc {
	rdb := newRedisClient()

	return func(c *gin.Context) {
		if rdb == nil {
			c.Next()
			return
		}

		ip := c.ClientIP()
		key := fmt.Sprintf("rate:%s", ip)
		ctx := c.Request.Context()
		now := time.Now()
		window := time.Minute

		pipe := rdb.Pipeline()
		pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", now.Add(-window).UnixMilli()))
		pipe.ZCard(ctx, key)
		pipe.ZAdd(ctx, key, redis.Z{Score: float64(now.UnixMilli()), Member: uuid.New().String()})
		pipe.Expire(ctx, key, window)
		results, err := pipe.Exec(ctx)
		if err != nil {
			c.Next()
			return
		}

		count := results[1].(*redis.IntCmd).Val()
		remaining := int64(requestsPerMinute) - count
		if remaining < 0 {
			remaining = 0
		}
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", requestsPerMinute))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

		if count >= int64(requestsPerMinute) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate_limit_exceeded",
				"message": "تجاوزت الحد المسموح من الطلبات / Too many requests, please slow down",
			})
			return
		}
		c.Next()
	}
}

func newRedisClient() *redis.Client {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		return nil
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil
	}
	rdb := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil
	}
	return rdb
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		if os.Getenv("GIN_MODE") == "release" {
			panic("JWT_SECRET يجب تعيينه في بيئة الإنتاج")
		}
		secret = "ghyari-dev-secret-change-in-production-minimum-32-chars"
	}
	return []byte(secret)
}
