package hrana

import (
	"encoding/json"
	"fmt"
	"reflect"
	"testing"
)

func TestGetLastInsertRowId(t *testing.T) {
	tests := []struct {
		name string
		id   *string
		want int64
	}{
		{
			name: "nil returns zero",
			id:   nil,
			want: 0,
		},
		{
			name: "valid integer",
			id:   strPtr("42"),
			want: 42,
		},
		{
			name: "invalid string returns zero",
			id:   strPtr("not-a-number"),
			want: 0,
		},
		{
			name: "zero",
			id:   strPtr("0"),
			want: 0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &StmtResult{LastInsertRowId: tt.id}
			got := r.GetLastInsertRowId()
			if got != tt.want {
				t.Errorf("GetLastInsertRowId() = %d, want %d", got, tt.want)
			}
		})
	}
}

func strPtr(s string) *string { return &s }

func TestStmtResult_UnmarshalJSON(t *testing.T) {
	testCases := []struct {
		name     string
		jsonData []byte
		expected *uint64
	}{
		{
			jsonData: []byte(`{"replication_index":1}`),
			expected: uint64Ptr(1),
		},
		{
			jsonData: []byte(`{"replication_index":"1"}`),
			expected: uint64Ptr(1),
		},
		{
			jsonData: []byte(`{"replication_index":""}`),
			expected: nil,
		},
		{
			jsonData: []byte(`{}`),
			expected: nil,
		},
		{
			jsonData: []byte(`{"replication_index":"0"}`),
			expected: uint64Ptr(0),
		},
		{
			jsonData: []byte(`{"replication_index":0}`),
			expected: uint64Ptr(0),
		},
	}

	for i, tc := range testCases {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			stmtResult := &StmtResult{}
			err := json.Unmarshal(tc.jsonData, stmtResult)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			if !reflect.DeepEqual(stmtResult.ReplicationIndex, tc.expected) {
				t.Errorf("ReplicationIndex field is not correctly unmarshaled got = %v, want = %v", stmtResult.ReplicationIndex, tc.expected)
			}
		})
	}
}
