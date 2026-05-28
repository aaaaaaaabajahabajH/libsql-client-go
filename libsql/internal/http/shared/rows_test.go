package shared

import (
	"database/sql/driver"
	"io"
	"testing"
)

type mockRowsProvider struct {
	cols      [][]string
	rows      [][][]driver.Value
	errors    []string
	hasResult []bool
}

func (m *mockRowsProvider) SetsCount() int { return len(m.cols) }
func (m *mockRowsProvider) RowsCount(setIdx int) int {
	if setIdx >= len(m.rows) {
		return 0
	}
	return len(m.rows[setIdx])
}
func (m *mockRowsProvider) Columns(setIdx int) []string { return m.cols[setIdx] }
func (m *mockRowsProvider) FieldValue(setIdx, rowIdx, colIdx int) driver.Value {
	return m.rows[setIdx][rowIdx][colIdx]
}
func (m *mockRowsProvider) Error(setIdx int) string {
	if setIdx >= len(m.errors) {
		return ""
	}
	return m.errors[setIdx]
}
func (m *mockRowsProvider) HasResult(setIdx int) bool {
	if setIdx >= len(m.hasResult) {
		return false
	}
	return m.hasResult[setIdx]
}

func TestRowsColumns(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"id", "name"}},
		rows:      [][][]driver.Value{{}},
		errors:    []string{""},
		hasResult: []bool{true},
	}
	r := NewRows(p)
	cols := r.Columns()
	if len(cols) != 2 || cols[0] != "id" || cols[1] != "name" {
		t.Errorf("Columns() = %v, want [id name]", cols)
	}
}

func TestRowsNextIteratesAndEOF(t *testing.T) {
	p := &mockRowsProvider{
		cols: [][]string{{"v"}},
		rows: [][][]driver.Value{
			{{int64(10)}, {int64(20)}},
		},
		errors:    []string{""},
		hasResult: []bool{true},
	}
	r := NewRows(p)
	dest := make([]driver.Value, 1)

	if err := r.Next(dest); err != nil {
		t.Fatalf("Next() first row error = %v", err)
	}
	if dest[0] != int64(10) {
		t.Errorf("first row = %v, want 10", dest[0])
	}

	if err := r.Next(dest); err != nil {
		t.Fatalf("Next() second row error = %v", err)
	}
	if dest[0] != int64(20) {
		t.Errorf("second row = %v, want 20", dest[0])
	}

	if err := r.Next(dest); err != io.EOF {
		t.Errorf("Next() after last row = %v, want io.EOF", err)
	}
}

func TestRowsClose(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"id"}},
		rows:      [][][]driver.Value{{}},
		errors:    []string{""},
		hasResult: []bool{true},
	}
	r := NewRows(p)
	if err := r.Close(); err != nil {
		t.Errorf("Close() error = %v", err)
	}
}

func TestRowsHasNextResultSet(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"a"}, {"b"}},
		rows:      [][][]driver.Value{{}, {}},
		errors:    []string{"", ""},
		hasResult: []bool{true, true},
	}
	r := NewRows(p)

	if !r.(interface{ HasNextResultSet() bool }).HasNextResultSet() {
		t.Error("HasNextResultSet() = false on first set of two, want true")
	}
}

func TestRowsNextResultSetAdvances(t *testing.T) {
	p := &mockRowsProvider{
		cols: [][]string{{"a"}, {"b"}},
		rows: [][][]driver.Value{
			{{int64(1)}},
			{{int64(2)}},
		},
		errors:    []string{"", ""},
		hasResult: []bool{true, true},
	}
	type multiRows interface {
		driver.Rows
		HasNextResultSet() bool
		NextResultSet() error
	}
	r := NewRows(p).(multiRows)

	// consume first set
	dest := make([]driver.Value, 1)
	if err := r.Next(dest); err != nil {
		t.Fatalf("Next() error = %v", err)
	}

	if err := r.NextResultSet(); err != nil {
		t.Fatalf("NextResultSet() error = %v", err)
	}

	if cols := r.Columns(); len(cols) != 1 || cols[0] != "b" {
		t.Errorf("Columns() after NextResultSet = %v, want [b]", cols)
	}

	if err := r.Next(dest); err != nil {
		t.Fatalf("Next() on second set error = %v", err)
	}
	if dest[0] != int64(2) {
		t.Errorf("second set row = %v, want 2", dest[0])
	}
}

func TestRowsNextResultSetEOF(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"a"}},
		rows:      [][][]driver.Value{{}},
		errors:    []string{""},
		hasResult: []bool{true},
	}
	type multiRows interface {
		driver.Rows
		NextResultSet() error
	}
	r := NewRows(p).(multiRows)
	if err := r.NextResultSet(); err != io.EOF {
		t.Errorf("NextResultSet() on single set = %v, want io.EOF", err)
	}
}

func TestRowsNextResultSetPropagatesError(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"a"}, {"b"}},
		rows:      [][][]driver.Value{{}, {}},
		errors:    []string{"", "something went wrong"},
		hasResult: []bool{true, true},
	}
	type multiRows interface {
		driver.Rows
		NextResultSet() error
	}
	r := NewRows(p).(multiRows)
	err := r.NextResultSet()
	if err == nil {
		t.Error("NextResultSet() with error = nil, want an error")
	}
}

func TestRowsNextResultSetNoResult(t *testing.T) {
	p := &mockRowsProvider{
		cols:      [][]string{{"a"}, {"b"}},
		rows:      [][][]driver.Value{{}, {}},
		errors:    []string{"", ""},
		hasResult: []bool{true, false},
	}
	type multiRows interface {
		driver.Rows
		NextResultSet() error
	}
	r := NewRows(p).(multiRows)
	err := r.NextResultSet()
	if err == nil {
		t.Error("NextResultSet() with no result = nil, want an error")
	}
}
