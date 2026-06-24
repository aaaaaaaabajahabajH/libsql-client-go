package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/tursodatabase/libsql-client-go/libsql"

	"github.com/ghyari/api/internal/db"
	"github.com/ghyari/api/internal/handlers"
	"github.com/ghyari/api/internal/middleware"
	"github.com/ghyari/api/internal/storage"
)

// App holds application-level dependencies
type App struct {
	DB     *sql.DB
	Router *gin.Engine
}

func main() {
	// ── Environment ──────────────────────────────────────────────────────────
	port := getEnv("PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "file:./ghyari_local.db")
	dbToken := os.Getenv("DATABASE_AUTH_TOKEN")

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	// ── Startup validation ────────────────────────────────────────────────────
	if os.Getenv("GIN_MODE") == "release" {
		required := map[string]string{
			"DATABASE_URL":    dbURL,
			"JWT_SECRET":      os.Getenv("JWT_SECRET"),
			"ANTHROPIC_API_KEY": os.Getenv("ANTHROPIC_API_KEY"),
		}
		for name, val := range required {
			if val == "" || val == "file:./ghyari_local.db" {
				log.Fatalf("❌ متغير البيئة المطلوب غير موجود: %s", name)
			}
		}
		if os.Getenv("JWT_SECRET") == "CHANGE_ME_openssl_rand_hex_32" {
			log.Fatalf("❌ يجب تغيير JWT_SECRET إلى قيمة عشوائية آمنة قبل الإطلاق")
		}
	}

	// ── Database ─────────────────────────────────────────────────────────────
	connStr := dbURL
	if dbToken != "" {
		connStr = fmt.Sprintf("%s?authToken=%s", dbURL, dbToken)
	}

	database, err := sql.Open("libsql", connStr)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(10)
	database.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := database.PingContext(ctx); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}
	log.Println("✅ Database connected:", dbURL)

	// ── Migrations & Seed ─────────────────────────────────────────────────────
	migrateCtx, migrateCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer migrateCancel()
	if err := db.Migrate(migrateCtx, database); err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	if err := db.Seed(migrateCtx, database); err != nil {
		log.Printf("⚠️  Seed warning: %v", err)
	}

	// ── Google Cloud Storage (optional) ──────────────────────────────────────
	var gcsClient *storage.GCSClient
	if os.Getenv("GCS_BUCKET") != "" {
		gcsCtx, gcsCancel := context.WithTimeout(context.Background(), 10*time.Second)
		if c, gcsErr := storage.NewGCSClient(gcsCtx); gcsErr != nil {
			log.Printf("⚠️  GCS not available: %v", gcsErr)
		} else {
			gcsClient = c
			defer gcsClient.Close()
			log.Println("✅ Google Cloud Storage connected:", os.Getenv("GCS_BUCKET"))
		}
		gcsCancel()
	}

	// ── Router ────────────────────────────────────────────────────────────────
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())

	// CORS configuration — origins from ALLOWED_ORIGINS env var
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if originsEnv := os.Getenv("ALLOWED_ORIGINS"); originsEnv != "" {
		allowedOrigins = strings.Split(originsEnv, ",")
		for i := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
		}
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"X-Request-ID", "X-RateLimit-Remaining"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── Health check ─────────────────────────────────────────────────────────
	router.GET("/health", func(c *gin.Context) {
		if err := database.PingContext(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "db": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "ghyari-api",
			"version": "1.0.0",
			"time":    time.Now().UTC().Format(time.RFC3339),
		})
	})

	// ── Instantiate handlers ──────────────────────────────────────────────────
	productHandler := handlers.NewProductHandler(database)
	categoryHandler := handlers.NewCategoryHandler(database)
	orderHandler := handlers.NewOrderHandler(database)
	aiRadarHandler := handlers.NewAIRadarHandler(database)
	distributorHandler := handlers.NewDistributorHandler(database)
	authHandler := handlers.NewAuthHandler(database)
	carHandler := handlers.NewCarHandler(database)
	uploadHandler := handlers.NewUploadHandler(gcsClient)
	paymentHandler := handlers.NewPaymentHandler(database)

	// ── API v1 routes ─────────────────────────────────────────────────────────
	v1 := router.Group("/api/v1")

	// Public auth routes
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.RefreshToken)
	}

	// Public product routes (read-only)
	products := v1.Group("/products")
	{
		products.GET("", productHandler.List)
		products.GET("/:id", productHandler.GetByID)
		products.GET("/search", productHandler.Search)
		products.GET("/compatible", productHandler.Compatible)
		products.GET("/performance", productHandler.ListPerformanceParts)
		products.GET("/featured", productHandler.ListFeatured)
	}

	// Car brands and models
	cars := v1.Group("/cars")
	{
		cars.GET("", carHandler.ListBrands)
		cars.GET("/:brand/models", carHandler.ListModels)
	}

	// Public category routes
	categories := v1.Group("/categories")
	{
		categories.GET("", categoryHandler.List)
		categories.GET("/:id", categoryHandler.GetByID)
		categories.GET("/:id/products", categoryHandler.GetProducts)
	}

	// Public distributor routes
	distributors := v1.Group("/distributors")
	{
		distributors.GET("", distributorHandler.List)
		distributors.GET("/:id", distributorHandler.GetByID)
		distributors.GET("/nearby", distributorHandler.Nearby)
		distributors.GET("/:id/catalog", distributorHandler.GetCatalog)
	}

	// Payment webhooks — public but HMAC-verified inside each handler
	webhooks := v1.Group("/webhooks")
	{
		webhooks.POST("/ngenius", paymentHandler.NGeniusWebhook)
		webhooks.POST("/tabby", paymentHandler.TabbyWebhook)
	}

	// Authenticated routes
	protected := v1.Group("")
	protected.Use(middleware.RequireAuth())
	{
		// User profile and garage
		protected.GET("/users/me", authHandler.Me)
		protected.PUT("/users/me", authHandler.UpdateProfile)
		protected.POST("/auth/logout", authHandler.Logout)

		// Cart
		cart := protected.Group("/cart")
		{
			cart.GET("", orderHandler.GetCart)
			cart.POST("/items", orderHandler.AddToCart)
			cart.PUT("/items/:itemId", orderHandler.UpdateCartItem)
			cart.DELETE("/items/:itemId", orderHandler.RemoveFromCart)
			cart.DELETE("", orderHandler.ClearCart)
		}

		// Orders
		orders := protected.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.ListUserOrders)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.POST("/:id/cancel", orderHandler.CancelOrder)
		}

		// Payments — authenticated initiation endpoints
		payments := protected.Group("/payments")
		{
			payments.POST("/ngenius", paymentHandler.InitiateNGeniusPayment)
			payments.POST("/tabby", paymentHandler.InitiateTabbySession)
			payments.POST("/cod", paymentHandler.ConfirmCOD)
		}

		// AI Radar (public signal capture, private analytics)
		ai := protected.Group("/ai")
		{
			ai.POST("/requests", aiRadarHandler.SubmitRequest)
			ai.GET("/recommendations/:userId", aiRadarHandler.GetPersonalizedRecommendations)
		}
	}

	// Admin-only routes
	admin := v1.Group("/admin")
	admin.Use(middleware.RequireAuth(), middleware.RequireRole("admin"))
	{
		// Product management
		adminProducts := admin.Group("/products")
		{
			adminProducts.POST("", productHandler.Create)
			adminProducts.PUT("/:id", productHandler.Update)
			adminProducts.DELETE("/:id", productHandler.Delete)
			adminProducts.POST("/bulk-import", productHandler.BulkImport)
		}

		// AI Radar analytics
		adminAI := admin.Group("/ai")
		{
			adminAI.GET("/signals", aiRadarHandler.GetDemandSignals)
			adminAI.GET("/suggestions", aiRadarHandler.GetInventorySuggestions)
			adminAI.POST("/analyze", aiRadarHandler.TriggerAnalysis)
			adminAI.GET("/trending", aiRadarHandler.GetTrending)
		}

		// Distributor management
		adminDistributors := admin.Group("/distributors")
		{
			adminDistributors.POST("", distributorHandler.Create)
			adminDistributors.PUT("/:id", distributorHandler.Update)
			adminDistributors.POST("/:id/verify", distributorHandler.Verify)
		}

		// Order management
		adminOrders := admin.Group("/orders")
		{
			adminOrders.GET("", orderHandler.ListAllOrders)
			adminOrders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
		}

		// File uploads to GCS
		adminUploads := admin.Group("/uploads")
		{
			adminUploads.POST("/signed-url", uploadHandler.SignedURL)
			adminUploads.POST("/direct", uploadHandler.UploadDirect)
		}
	}

	// ── 404 Handler ───────────────────────────────────────────────────────────
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "route_not_found",
			"message": "المسار المطلوب غير موجود / The requested route was not found",
			"path":    c.Request.URL.Path,
		})
	})

	// ── HTTP server with graceful shutdown ────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 Ghyari API server starting on port %s", port)
		log.Printf("   Environment: %s", getEnv("GIN_MODE", "debug"))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed to start: %v", err)
		}
	}()

	// Graceful shutdown on signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Ghyari API server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}
	log.Println("Server exited cleanly")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
