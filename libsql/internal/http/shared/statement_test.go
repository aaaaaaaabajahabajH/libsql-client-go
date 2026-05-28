package shared

import (
	"database/sql/driver"
	"encoding/json"
	"reflect"
	"sort"
	"testing"
)

func TestExtractParameters(t *testing.T) {
	tests := []struct {
		name                  string
		value                 string
		nameParams            []string
		positionalParamsCount int
		wantErr               bool
	}{
		{
			name:       "OnlyColonNameParams",
			value:      "select :column from :table",
			nameParams: []string{"column", "table"},
		},
		{
			name:       "OnlyAtNameParams",
			value:      "select @column from @table",
			nameParams: []string{"column", "table"},
		},
		{
			name:       "OnlyDollarSignNameParams",
			value:      "select $column from $table",
			nameParams: []string{"column", "table"},
		},
		{
			name:       "RepeatedNamedParameter",
			value:      "select :number, :number",
			nameParams: []string{"number"},
		},
		{
			name:                  "OnlyPositionalParams",
			value:                 "select ? from ?",
			nameParams:            []string{},
			positionalParamsCount: 2,
		},
		{
			name:                  "OnlyPositionalParamsWithoutIndexes",
			value:                 "select ? from ?",
			nameParams:            []string{},
			positionalParamsCount: 2,
		},
		{
			name:                  "PositionalParamsWithIndexes",
			value:                 "select ? from ?1",
			nameParams:            []string{},
			positionalParamsCount: 0,
			wantErr:               true,
		},
		{
			name:                  "MixedParams",
			value:                 "select :column1, @column2, $column3, ? from ?",
			nameParams:            []string{"column1", "column2", "column3"},
			positionalParamsCount: 2,
		},
		{
			name:       "NoParams",
			value:      "select myColumn from myTable",
			nameParams: []string{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotNameParams, gotPositionalParamsCount, gotErr := extractParameters(tt.value)
			sort.Strings(gotNameParams)
			sort.Strings(tt.nameParams)
			if !reflect.DeepEqual(gotNameParams, tt.nameParams) {
				t.Errorf("got nameParams %#v, want %#v", gotNameParams, tt.nameParams)
			}
			if !reflect.DeepEqual(gotPositionalParamsCount, tt.positionalParamsCount) {
				t.Errorf("got positionalParams %#v, want %#v", gotPositionalParamsCount, tt.positionalParamsCount)
			}
			if (gotErr != nil) != tt.wantErr {
				t.Errorf("got err %v, wantErr %v", gotErr, tt.wantErr)
			}
		})
	}
}

func TestConvertArgs(t *testing.T) {
	tests := []struct {
		name    string
		args    []driver.NamedValue
		want    Params
		wantErr bool
	}{
		{
			name: "empty",
			args: nil,
			want: NewParams(positionalParameters),
		},
		{
			name: "positional",
			args: []driver.NamedValue{
				{Ordinal: 1, Value: int64(1)},
				{Ordinal: 2, Value: "hello"},
			},
			want: Params{positional: []any{int64(1), "hello"}},
		},
		{
			name: "named",
			args: []driver.NamedValue{
				{Ordinal: 1, Name: "foo", Value: int64(42)},
				{Ordinal: 2, Name: "bar", Value: "baz"},
			},
			want: Params{named: map[string]any{"foo": int64(42), "bar": "baz"}},
		},
		{
			name: "positional sorted by ordinal",
			args: []driver.NamedValue{
				{Ordinal: 2, Value: "second"},
				{Ordinal: 1, Value: "first"},
			},
			want: Params{positional: []any{"first", "second"}},
		},
		{
			name: "mixed positional and named",
			args: []driver.NamedValue{
				{Ordinal: 1, Value: int64(1)},
				{Ordinal: 2, Name: "foo", Value: "bar"},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ConvertArgs(tt.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("ConvertArgs() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr {
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ConvertArgs() = %#v, want %#v", got, tt.want)
			}
		})
	}
}

func TestParseStatementAndArgs(t *testing.T) {
	tests := []struct {
		name       string
		sql        string
		args       []driver.NamedValue
		wantStmts  []string
		wantParams []Params
		wantErr    bool
	}{
		{
			name:      "single statement no args",
			sql:       "SELECT 1",
			args:      nil,
			wantStmts: []string{"SELECT 1"},
			wantParams: []Params{
				{positional: []any{}},
			},
		},
		{
			name: "single statement positional args",
			sql:  "SELECT ?, ?",
			args: []driver.NamedValue{
				{Ordinal: 1, Value: int64(1)},
				{Ordinal: 2, Value: int64(2)},
			},
			wantStmts: []string{"SELECT ?, ?"},
			wantParams: []Params{
				{positional: []any{int64(1), int64(2)}},
			},
		},
		{
			name: "single statement named args",
			sql:  "SELECT :x",
			args: []driver.NamedValue{
				{Ordinal: 1, Name: "x", Value: int64(99)},
			},
			wantStmts: []string{"SELECT :x"},
			wantParams: []Params{
				{named: map[string]any{"x": int64(99)}},
			},
		},
		{
			name: "missing positional args",
			sql:  "SELECT ?, ?",
			args: []driver.NamedValue{
				{Ordinal: 1, Value: int64(1)},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotStmts, gotParams, err := ParseStatementAndArgs(tt.sql, tt.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseStatementAndArgs() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr {
				return
			}
			if !reflect.DeepEqual(gotStmts, tt.wantStmts) {
				t.Errorf("stmts = %v, want %v", gotStmts, tt.wantStmts)
			}
			if !reflect.DeepEqual(gotParams, tt.wantParams) {
				t.Errorf("params = %#v, want %#v", gotParams, tt.wantParams)
			}
		})
	}
}

func TestParamsMarshalJSON(t *testing.T) {
	tests := []struct {
		name   string
		params Params
		want   string
	}{
		{
			name:   "empty positional",
			params: NewParams(positionalParameters),
			want:   `[]`,
		},
		{
			name:   "positional",
			params: Params{positional: []any{int64(1), "hello"}},
			want:   `[1,"hello"]`,
		},
		{
			name:   "named",
			params: Params{named: map[string]any{"x": int64(42)}},
			want:   `{"x":42}`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, err := json.Marshal(&tt.params)
			if err != nil {
				t.Fatalf("MarshalJSON() error = %v", err)
			}
			got := string(b)
			if got != tt.want {
				t.Errorf("MarshalJSON() = %s, want %s", got, tt.want)
			}
		})
	}
}

func TestRemoveParamPrefix(t *testing.T) {
	tests := []struct {
		input   string
		want    string
		wantErr bool
	}{
		{input: ":foo", want: "foo"},
		{input: "@foo", want: "foo"},
		{input: "$foo", want: "foo"},
		{input: "foo", wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := removeParamPrefix(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("removeParamPrefix(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("removeParamPrefix(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsPositionalParameter(t *testing.T) {
	tests := []struct {
		input   string
		want    bool
		wantErr bool
	}{
		{input: "?", want: true},
		{input: "?1", want: true, wantErr: true},
		{input: ":foo", want: false},
		{input: "@foo", want: false},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := isPositionalParameter(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("isPositionalParameter(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("isPositionalParameter(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsExplain(t *testing.T) {
	if !isExplain("EXPLAIN SELECT 1") {
		t.Error("isExplain(EXPLAIN SELECT 1) = false, want true")
	}
	if isExplain("SELECT 1") {
		t.Error("isExplain(SELECT 1) = true, want false")
	}
}

func TestParseStatement(t *testing.T) {
	stmts, infos, err := ParseStatement("SELECT :x; SELECT ?")
	if err != nil {
		t.Fatalf("ParseStatement() error = %v", err)
	}
	if len(stmts) != 2 {
		t.Fatalf("got %d stmts, want 2", len(stmts))
	}
	if infos[0].NamedParameters[0] != "x" {
		t.Errorf("infos[0].NamedParameters = %v, want [x]", infos[0].NamedParameters)
	}
	if infos[1].PositionalParametersCount != 1 {
		t.Errorf("infos[1].PositionalParametersCount = %d, want 1", infos[1].PositionalParametersCount)
	}
}

func TestExplainStatementSkipsMissingPositionalArgs(t *testing.T) {
	// EXPLAIN statements should not fail when no args are provided
	_, params, err := ParseStatementAndArgs("EXPLAIN SELECT ?, ?", nil)
	if err != nil {
		t.Fatalf("ParseStatementAndArgs() error = %v", err)
	}
	if params[0].Len() != 0 {
		t.Errorf("expected empty params for EXPLAIN, got %v", params[0])
	}
}
