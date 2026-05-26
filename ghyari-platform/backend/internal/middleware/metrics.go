package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "ghyari",
		Name:      "http_requests_total",
		Help:      "Total HTTP requests by method, path, and status.",
	}, []string{"method", "path", "status"})

	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "ghyari",
		Name:      "http_request_duration_seconds",
		Help:      "HTTP request latency in seconds.",
		Buckets:   []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
	}, []string{"method", "path"})

	httpRequestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "ghyari",
		Name:      "http_requests_in_flight",
		Help:      "Current number of HTTP requests being served.",
	})

	dbQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "ghyari",
		Name:      "db_query_duration_seconds",
		Help:      "Database query latency in seconds.",
		Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
	}, []string{"operation"})

	productSearchTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "ghyari",
		Name:      "product_search_total",
		Help:      "Product search requests by result type.",
	}, []string{"result"}) // "found" | "not_found"

	aiRadarSignals = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "ghyari",
		Name:      "ai_radar_signals_total",
		Help:      "AI Radar demand signals by type.",
	}, []string{"signal_type"})
)

// Metrics returns a Gin middleware that records Prometheus metrics per request.
func Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip the metrics endpoint itself
		if c.FullPath() == "/metrics" {
			c.Next()
			return
		}

		start := time.Now()
		httpRequestsInFlight.Inc()

		c.Next()

		httpRequestsInFlight.Dec()
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		// Use the Gin route pattern (not raw URL) to avoid high cardinality
		path := c.FullPath()
		if path == "" {
			path = "unmatched"
		}

		httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)

		// Expose duration as a response header for client-side measurement
		c.Header("X-Response-Time", strconv.FormatInt(time.Since(start).Milliseconds(), 10)+"ms")
	}
}

// RecordDBQuery records database query latency. Call with defer:
//
//	defer middleware.RecordDBQuery("select_products", time.Now())
func RecordDBQuery(operation string, start time.Time) {
	dbQueryDuration.WithLabelValues(operation).Observe(time.Since(start).Seconds())
}

// RecordSearchResult increments the product search counter.
func RecordSearchResult(found bool) {
	result := "found"
	if !found {
		result = "not_found"
	}
	productSearchTotal.WithLabelValues(result).Inc()
}

// RecordAISignal increments the AI Radar signal counter.
func RecordAISignal(signalType string) {
	aiRadarSignals.WithLabelValues(signalType).Inc()
}
