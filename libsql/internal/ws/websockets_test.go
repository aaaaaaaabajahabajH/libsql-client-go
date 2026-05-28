package ws

import (
	"fmt"
	"reflect"
	"sync"
	"testing"
)

func TestConvertValue(t *testing.T) {
	tests := []struct {
		name  string
		value any
		want  map[string]any
		err   error
	}{
		{
			name:  "nil",
			value: nil,
			want: map[string]any{
				"type": "null",
			},
			err: nil,
		},
		{
			name:  "integer",
			value: int64(42),
			want: map[string]any{
				"type":  "integer",
				"value": "42",
			},
			err: nil,
		},
		{
			name:  "text",
			value: "turso for win",
			want: map[string]any{
				"type":  "text",
				"value": "turso for win",
			},
			err: nil,
		},
		{
			name:  "blob",
			value: []byte("hello world"),
			want: map[string]any{
				"type": "blob",
				// `hello world` encoded is `aGVsbG8gd29ybGQ=` but we want without padding
				"base64": "aGVsbG8gd29ybGQ",
			},
			err: nil,
		},
		{
			name:  "float",
			value: 3.14,
			want: map[string]any{
				"type":  "float",
				"value": 3.14,
			},
			err: nil,
		},
		{
			name:  "boolean_true",
			value: true,
			want: map[string]any{
				"type":  "integer",
				"value": "1",
			},
			err: nil,
		},
		{
			name:  "boolean_false",
			value: false,
			want: map[string]any{
				"type":  "integer",
				"value": "0",
			},
			err: nil,
		},
		{
			name:  "unsupported",
			value: struct{}{},
			want:  nil,
			err:   fmt.Errorf("unsupported value type: %s", struct{}{}),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := convertValue(tt.value)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(err, tt.err) {
				t.Errorf("got error %v, want %v", err, tt.err)
			}
		})
	}
}

func Test_execResponse_lastInsertId(t *testing.T) {
	tests := []struct {
		name  string
		value map[string]interface{}
		want  int64
	}{
		{
			name:  "valid",
			value: map[string]interface{}{"last_insert_rowid": "42"},
			want:  42,
		},
		{
			name:  "empty",
			value: map[string]interface{}{},
			want:  0,
		},
		{
			name:  "invalid",
			value: map[string]interface{}{"last_insert_rowid": "invalid"},
			want:  0,
		},
		{
			name:  "invalid_type",
			value: map[string]interface{}{"last_insert_rowid": 42.0},
			want:  0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &execResponse{
				resp: tt.value,
			}
			if got := r.lastInsertId(); got != tt.want {
				t.Errorf("lastInsertId() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_execResponse_affectedRowCount(t *testing.T) {
	r := &execResponse{resp: map[string]interface{}{"affected_row_count": float64(5)}}
	if got := r.affectedRowCount(); got != 5 {
		t.Errorf("affectedRowCount() = %d, want 5", got)
	}
}

func Test_execResponse_columns(t *testing.T) {
	tests := []struct {
		name string
		cols []interface{}
		want []string
	}{
		{
			name: "named columns",
			cols: []interface{}{
				map[string]interface{}{"name": "id"},
				map[string]interface{}{"name": "value"},
			},
			want: []string{"id", "value"},
		},
		{
			name: "nil column name becomes empty string",
			cols: []interface{}{
				map[string]interface{}{},
			},
			want: []string{""},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &execResponse{resp: map[string]interface{}{"cols": tt.cols}}
			got := r.columns()
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("columns() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_execResponse_rowsCount(t *testing.T) {
	r := &execResponse{resp: map[string]interface{}{
		"rows": []interface{}{
			[]interface{}{},
			[]interface{}{},
		},
	}}
	if got := r.rowsCount(); got != 2 {
		t.Errorf("rowsCount() = %d, want 2", got)
	}
}

func Test_execResponse_rowLen(t *testing.T) {
	r := &execResponse{resp: map[string]interface{}{
		"rows": []interface{}{
			[]interface{}{
				map[string]interface{}{"type": "integer", "value": "1"},
				map[string]interface{}{"type": "text", "value": "hello"},
			},
		},
	}}
	if got := r.rowLen(0); got != 2 {
		t.Errorf("rowLen(0) = %d, want 2", got)
	}
}

func Test_execResponse_value(t *testing.T) {
	makeRow := func(vals ...map[string]interface{}) []interface{} {
		row := make([]interface{}, len(vals))
		for i, v := range vals {
			row[i] = v
		}
		return row
	}
	makeResp := func(row []interface{}) *execResponse {
		return &execResponse{resp: map[string]interface{}{
			"rows": []interface{}{row},
		}}
	}

	tests := []struct {
		name    string
		cell    map[string]interface{}
		want    any
		wantErr bool
	}{
		{
			name: "null",
			cell: map[string]interface{}{"type": "null"},
			want: nil,
		},
		{
			name: "integer",
			cell: map[string]interface{}{"type": "integer", "value": "42"},
			want: int64(42),
		},
		{
			name: "text",
			cell: map[string]interface{}{"type": "text", "value": "hello"},
			want: "hello",
		},
		{
			name: "blob",
			cell: map[string]interface{}{"type": "blob", "base64": "aGVsbG8"},
			want: []byte("hello"),
		},
		{
			name: "float",
			cell: map[string]interface{}{"type": "float", "value": 3.14},
			want: 3.14,
		},
		{
			name:    "unknown type",
			cell:    map[string]interface{}{"type": "unknown"},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := makeResp(makeRow(tt.cell))
			got, err := r.value(0, 0)
			if (err != nil) != tt.wantErr {
				t.Errorf("value() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("value() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_idPool_sequential(t *testing.T) {
	pool := newIDPool()
	id1 := pool.Get()
	id2 := pool.Get()
	if id1 == id2 {
		t.Errorf("Get() returned duplicate IDs: %d", id1)
	}
	pool.Put(id1)
	pool.Put(id2)
}

func Test_idPool_recycles(t *testing.T) {
	pool := newIDPool()
	id := pool.Get()
	pool.Put(id)
	recycled := pool.Get()
	if recycled != id {
		t.Errorf("expected recycled ID %d, got %d", id, recycled)
	}
}

func Test_idPool_panicOnDoublePut(t *testing.T) {
	pool := newIDPool()
	id := pool.Get()
	pool.Put(id)
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic on double Put, got none")
		}
	}()
	pool.Put(id)
}

func Test_idPool_panicOnInvalidPut(t *testing.T) {
	pool := newIDPool()
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic on Put(0), got none")
		}
	}()
	pool.Put(0)
}

func Test_idPool_concurrent(t *testing.T) {
	pool := newIDPool()
	const n = 100
	var wg sync.WaitGroup
	ids := make(chan uint32, n)
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			id := pool.Get()
			ids <- id
		}()
	}
	wg.Wait()
	close(ids)

	seen := make(map[uint32]bool)
	for id := range ids {
		if seen[id] {
			t.Errorf("concurrent Get() returned duplicate ID %d", id)
		}
		seen[id] = true
	}
}
