package storage

import (
	"context"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"google.golang.org/api/option"
)

// GCSClient wraps a Google Cloud Storage bucket
type GCSClient struct {
	client     *storage.Client
	bucket     string
	publicBase string // e.g. "https://storage.googleapis.com/<bucket>"
}

// NewGCSClient creates a GCS client from environment variables.
// GCS_BUCKET and (optionally) GOOGLE_APPLICATION_CREDENTIALS must be set.
func NewGCSClient(ctx context.Context) (*GCSClient, error) {
	bucket := os.Getenv("GCS_BUCKET")
	if bucket == "" {
		return nil, fmt.Errorf("GCS_BUCKET environment variable is not set")
	}

	var opts []option.ClientOption
	if creds := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); creds != "" {
		opts = append(opts, option.WithCredentialsFile(creds))
	}
	// On Cloud Run the default service account is used automatically

	client, err := storage.NewClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCS client: %w", err)
	}

	publicBase := fmt.Sprintf("https://storage.googleapis.com/%s", bucket)
	if cdn := os.Getenv("GCS_CDN_BASE"); cdn != "" {
		publicBase = strings.TrimRight(cdn, "/")
	}

	return &GCSClient{client: client, bucket: bucket, publicBase: publicBase}, nil
}

// Close releases the underlying GCS connection
func (g *GCSClient) Close() { g.client.Close() }

// UploadFile uploads r to GCS under the given directory prefix and returns the public URL.
// Allowed content types: image/jpeg, image/png, image/webp, model/gltf-binary, model/gltf+json
func (g *GCSClient) UploadFile(ctx context.Context, dir string, originalName string, r io.Reader, contentType string) (string, error) {
	if err := validateContentType(contentType); err != nil {
		return "", err
	}

	ext := extensionFor(originalName, contentType)
	objectName := fmt.Sprintf("%s/%s%s", strings.Trim(dir, "/"), uuid.New().String(), ext)

	wc := g.client.Bucket(g.bucket).Object(objectName).NewWriter(ctx)
	wc.ContentType = contentType
	wc.CacheControl = "public, max-age=31536000"

	if _, err := io.Copy(wc, r); err != nil {
		_ = wc.Close()
		return "", fmt.Errorf("upload copy failed: %w", err)
	}
	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("upload close failed: %w", err)
	}

	// Make the object publicly readable
	if err := g.client.Bucket(g.bucket).Object(objectName).ACL().Set(ctx, storage.AllUsers, storage.RoleReader); err != nil {
		// Non-fatal: uniform bucket-level access may be on
		_ = err
	}

	return fmt.Sprintf("%s/%s", g.publicBase, objectName), nil
}

// SignedUploadURL generates a short-lived (15 min) signed PUT URL so the
// frontend can upload directly to GCS without going through the API server.
func (g *GCSClient) SignedUploadURL(ctx context.Context, dir, filename, contentType string) (objectURL, signedURL string, err error) {
	if err = validateContentType(contentType); err != nil {
		return "", "", err
	}

	ext := extensionFor(filename, contentType)
	objectName := fmt.Sprintf("%s/%s%s", strings.Trim(dir, "/"), uuid.New().String(), ext)

	signedURL, err = g.client.Bucket(g.bucket).SignedURL(objectName, &storage.SignedURLOptions{
		Method:      "PUT",
		Expires:     time.Now().Add(15 * time.Minute),
		ContentType: contentType,
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	objectURL = fmt.Sprintf("%s/%s", g.publicBase, objectName)
	return objectURL, signedURL, nil
}

// DeleteFile removes an object by its full public URL (best-effort)
func (g *GCSClient) DeleteFile(ctx context.Context, publicURL string) error {
	prefix := g.publicBase + "/"
	objectName := strings.TrimPrefix(publicURL, prefix)
	if objectName == publicURL {
		return fmt.Errorf("URL does not belong to this bucket")
	}
	return g.client.Bucket(g.bucket).Object(objectName).Delete(ctx)
}

var allowedTypes = map[string]string{
	"image/jpeg":        ".jpg",
	"image/png":         ".png",
	"image/webp":        ".webp",
	"model/gltf-binary": ".glb",
	"model/gltf+json":   ".gltf",
}

func validateContentType(ct string) error {
	if _, ok := allowedTypes[ct]; !ok {
		allowed := make([]string, 0, len(allowedTypes))
		for k := range allowedTypes {
			allowed = append(allowed, k)
		}
		return fmt.Errorf("content type %q not allowed; accepted: %s", ct, strings.Join(allowed, ", "))
	}
	return nil
}

func extensionFor(filename, contentType string) string {
	if ext := filepath.Ext(filename); ext != "" {
		return ext
	}
	if exts, err := mime.ExtensionsByType(contentType); err == nil && len(exts) > 0 {
		return exts[0]
	}
	if ext, ok := allowedTypes[contentType]; ok {
		return ext
	}
	return ""
}
