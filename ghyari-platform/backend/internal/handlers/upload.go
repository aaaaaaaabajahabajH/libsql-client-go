package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ghyari/api/internal/storage"
)

// UploadHandler exposes GCS upload endpoints
type UploadHandler struct {
	gcs *storage.GCSClient
}

func NewUploadHandler(gcs *storage.GCSClient) *UploadHandler {
	return &UploadHandler{gcs: gcs}
}

// SignedURL godoc
// POST /api/v1/admin/uploads/signed-url
// Body: { "filename": "brake-pad.jpg", "content_type": "image/jpeg", "dir": "products" }
// Returns: { "upload_url": "<signed PUT URL>", "public_url": "<final GCS URL>" }
func (h *UploadHandler) SignedURL(c *gin.Context) {
	if h.gcs == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "storage_not_configured"})
		return
	}

	var req struct {
		Filename    string `json:"filename"     binding:"required"`
		ContentType string `json:"content_type" binding:"required"`
		Dir         string `json:"dir"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "details": err.Error()})
		return
	}
	if req.Dir == "" {
		req.Dir = "products"
	}
	// Restrict to safe directories
	req.Dir = sanitizeDir(req.Dir)

	publicURL, signedURL, err := h.gcs.SignedUploadURL(c.Request.Context(), req.Dir, req.Filename, req.ContentType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "signed_url_error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"upload_url": signedURL,
		"public_url": publicURL,
	})
}

// UploadDirect godoc
// POST /api/v1/admin/uploads/direct?dir=products
// multipart/form-data field: "file"
func (h *UploadHandler) UploadDirect(c *gin.Context) {
	if h.gcs == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "storage_not_configured"})
		return
	}

	dir := sanitizeDir(c.DefaultQuery("dir", "products"))

	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_file"})
		return
	}

	const maxSize = 20 << 20 // 20 MB
	if fh.Size > maxSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file_too_large", "max_bytes": maxSize})
		return
	}

	ct := fh.Header.Get("Content-Type")
	if ct == "" {
		ct = "application/octet-stream"
	}

	f, err := fh.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "open_file_error"})
		return
	}
	defer f.Close()

	publicURL, err := h.gcs.UploadFile(c.Request.Context(), dir, fh.Filename, f, ct)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "upload_error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"public_url": publicURL})
}

var allowedDirs = map[string]bool{
	"products": true,
	"models3d": true,
	"avatars":  true,
	"brands":   true,
}

func sanitizeDir(d string) string {
	d = strings.ToLower(strings.TrimSpace(d))
	if allowedDirs[d] {
		return d
	}
	return "products"
}
