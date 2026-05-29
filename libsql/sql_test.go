package libsql

import (
	"net/url"
	"testing"
)

func TestExtractJwt(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		want    string
		wantErr bool
	}{
		{
			name:  "auth_token snake_case",
			query: "auth_token=mytoken",
			want:  "mytoken",
		},
		{
			name:  "authToken camelCase",
			query: "authToken=mytoken",
			want:  "mytoken",
		},
		{
			name:  "jwt",
			query: "jwt=mytoken",
			want:  "mytoken",
		},
		{
			name:  "no token",
			query: "",
			want:  "",
		},
		{
			name:    "multiple tokens",
			query:   "auth_token=a&jwt=b",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			values, _ := url.ParseQuery(tt.query)
			got, err := extractJwt(&values)
			if (err != nil) != tt.wantErr {
				t.Errorf("extractJwt() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("extractJwt() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestExtractTls(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		scheme  string
		want    bool
		wantErr bool
	}{
		{name: "https default on", scheme: "https", want: true},
		{name: "http default off", scheme: "http", want: false},
		{name: "ws default off", scheme: "ws", want: false},
		{name: "wss default on", scheme: "wss", want: true},
		{name: "tls=1", query: "tls=1", scheme: "https", want: true},
		{name: "tls=0", query: "tls=0", scheme: "http", want: false},
		{name: "tls=invalid", query: "tls=bad", scheme: "https", want: true, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			values, _ := url.ParseQuery(tt.query)
			got, err := extractTls(&values, tt.scheme)
			if (err != nil) != tt.wantErr {
				t.Errorf("extractTls() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("extractTls() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewConnector(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		opts    []Option
		wantErr bool
	}{
		{
			name: "https URL",
			url:  "https://example.com",
		},
		{
			name: "http URL",
			url:  "http://example.com",
		},
		{
			name: "wss URL",
			url:  "wss://example.com",
		},
		{
			name: "ws URL",
			url:  "ws://example.com",
		},
		{
			name: "libsql defaults to https",
			url:  "libsql://example.com",
		},
		{
			name: "libsql with WithTls false requires port",
			url:  "libsql://example.com",
			opts: []Option{WithTls(false)},
			// no port specified → error
			wantErr: true,
		},
		{
			name: "libsql with WithTls false and port",
			url:  "libsql://example.com:8080",
			opts: []Option{WithTls(false)},
		},
		{
			name:    "wss cannot opt out of TLS",
			url:     "wss://example.com",
			opts:    []Option{WithTls(false)},
			wantErr: true,
		},
		{
			name:    "ws cannot opt in to TLS",
			url:     "ws://example.com",
			opts:    []Option{WithTls(true)},
			wantErr: true,
		},
		{
			name:    "https cannot opt out of TLS",
			url:     "https://example.com",
			opts:    []Option{WithTls(false)},
			wantErr: true,
		},
		{
			name:    "http cannot opt in to TLS",
			url:     "http://example.com",
			opts:    []Option{WithTls(true)},
			wantErr: true,
		},
		{
			name:    "auth_token in URL is forbidden",
			url:     "https://example.com?auth_token=x",
			wantErr: true,
		},
		{
			name:    "authToken in URL is forbidden",
			url:     "https://example.com?authToken=x",
			wantErr: true,
		},
		{
			name:    "jwt in URL is forbidden",
			url:     "https://example.com?jwt=x",
			wantErr: true,
		},
		{
			name:    "tls in URL is forbidden",
			url:     "https://example.com?tls=1",
			wantErr: true,
		},
		{
			name:    "unknown query param",
			url:     "https://example.com?unknown=1",
			wantErr: true,
		},
		{
			name:    "unsupported scheme",
			url:     "ftp://example.com",
			wantErr: true,
		},
		{
			name:    "duplicate authToken option",
			url:     "https://example.com",
			opts:    []Option{WithAuthToken("a"), WithAuthToken("b")},
			wantErr: true,
		},
		{
			name:    "empty authToken option",
			url:     "https://example.com",
			opts:    []Option{WithAuthToken("")},
			wantErr: true,
		},
		{
			name:    "duplicate tls option",
			url:     "https://example.com",
			opts:    []Option{WithTls(true), WithTls(false)},
			wantErr: true,
		},
		{
			name:    "empty proxy option",
			url:     "https://example.com",
			opts:    []Option{WithProxy("")},
			wantErr: true,
		},
		{
			name: "proxy rewrites host",
			url:  "https://example.com",
			opts: []Option{WithProxy("https://proxy.example.com")},
		},
		{
			name:    "proxy not supported for ws",
			url:     "ws://example.com",
			opts:    []Option{WithProxy("https://proxy.example.com")},
			wantErr: true,
		},
		{
			name:    "proxy not supported for wss",
			url:     "wss://example.com",
			opts:    []Option{WithProxy("https://proxy.example.com")},
			wantErr: true,
		},
		{
			name:    "file:// with double slash is invalid",
			url:     "file://relative/path",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewConnector(tt.url, tt.opts...)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewConnector(%q) error = %v, wantErr %v", tt.url, err, tt.wantErr)
			}
		})
	}
}

func TestWithAuthToken(t *testing.T) {
	opt := WithAuthToken("secret")
	var cfg config
	if err := opt.apply(&cfg); err != nil {
		t.Fatalf("apply() error = %v", err)
	}
	if cfg.authToken == nil || *cfg.authToken != "secret" {
		t.Errorf("authToken = %v, want 'secret'", cfg.authToken)
	}
}

func TestWithTls(t *testing.T) {
	opt := WithTls(false)
	var cfg config
	if err := opt.apply(&cfg); err != nil {
		t.Fatalf("apply() error = %v", err)
	}
	if cfg.tls == nil || *cfg.tls != false {
		t.Errorf("tls = %v, want false", cfg.tls)
	}
}

func TestWithProxy(t *testing.T) {
	opt := WithProxy("https://proxy.example.com")
	var cfg config
	if err := opt.apply(&cfg); err != nil {
		t.Fatalf("apply() error = %v", err)
	}
	if cfg.proxy == nil || *cfg.proxy != "https://proxy.example.com" {
		t.Errorf("proxy = %v, want 'https://proxy.example.com'", cfg.proxy)
	}
}

func TestContains(t *testing.T) {
	if !Contains([]string{"a", "b", "c"}, "b") {
		t.Error("Contains([a,b,c], b) = false, want true")
	}
	if Contains([]string{"a", "b", "c"}, "z") {
		t.Error("Contains([a,b,c], z) = true, want false")
	}
}

func TestIndex(t *testing.T) {
	if got := Index([]string{"a", "b", "c"}, "b"); got != 1 {
		t.Errorf("Index([a,b,c], b) = %d, want 1", got)
	}
	if got := Index([]string{"a", "b", "c"}, "z"); got != -1 {
		t.Errorf("Index([a,b,c], z) = %d, want -1", got)
	}
}
