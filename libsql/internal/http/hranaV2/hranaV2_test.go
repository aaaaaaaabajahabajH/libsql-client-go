package hranaV2

import (
	"encoding/json"
	"testing"

	"github.com/tursodatabase/libsql-client-go/libsql/internal/hrana"
)

func u64ptr(v uint64) *uint64 { return &v }

func makeExecuteResponse(t *testing.T, repIdx *uint64) hrana.StreamResult {
	t.Helper()
	stmt := hrana.StmtResult{ReplicationIndex: repIdx}
	raw, err := json.Marshal(stmt)
	if err != nil {
		t.Fatalf("marshal StmtResult: %v", err)
	}
	return hrana.StreamResult{
		Response: &hrana.StreamResponse{
			Type:   "execute",
			Result: raw,
		},
	}
}

func TestAddReplicationIndex(t *testing.T) {
	idx := uint64(10)
	sql := "SELECT 1"
	stmt := &hrana.Stmt{Sql: &sql}
	req := &hrana.PipelineRequest{}
	req.Add(hrana.StreamRequest{Type: "execute", Stmt: stmt})

	addReplicationIndex(req, idx)

	if req.Requests[0].Stmt == nil {
		t.Fatal("Stmt is nil after addReplicationIndex")
	}
	if req.Requests[0].Stmt.ReplicationIndex == nil || *req.Requests[0].Stmt.ReplicationIndex != idx {
		t.Errorf("ReplicationIndex = %v, want %d", req.Requests[0].Stmt.ReplicationIndex, idx)
	}
}

func TestAddReplicationIndex_DoesNotOverwrite(t *testing.T) {
	existing := uint64(5)
	sql := "SELECT 1"
	stmt := &hrana.Stmt{Sql: &sql, ReplicationIndex: &existing}
	req := &hrana.PipelineRequest{}
	req.Add(hrana.StreamRequest{Type: "execute", Stmt: stmt})

	addReplicationIndex(req, 99)

	if *req.Requests[0].Stmt.ReplicationIndex != existing {
		t.Errorf("existing ReplicationIndex overwritten: got %d, want %d",
			*req.Requests[0].Stmt.ReplicationIndex, existing)
	}
}

func TestGetReplicationIndex_Empty(t *testing.T) {
	resp := &hrana.PipelineResponse{}
	if got := getReplicationIndex(resp); got != 0 {
		t.Errorf("getReplicationIndex(empty) = %d, want 0", got)
	}
}

func TestGetReplicationIndex_Nil(t *testing.T) {
	if got := getReplicationIndex(nil); got != 0 {
		t.Errorf("getReplicationIndex(nil) = %d, want 0", got)
	}
}

func TestGetReplicationIndex_TakesMax(t *testing.T) {
	resp := &hrana.PipelineResponse{
		Results: []hrana.StreamResult{
			makeExecuteResponse(t, u64ptr(5)),
			makeExecuteResponse(t, u64ptr(12)),
			makeExecuteResponse(t, u64ptr(3)),
		},
	}
	if got := getReplicationIndex(resp); got != 12 {
		t.Errorf("getReplicationIndex() = %d, want 12", got)
	}
}

func TestGetReplicationIndex_NilResponseSkipped(t *testing.T) {
	resp := &hrana.PipelineResponse{
		Results: []hrana.StreamResult{
			{Response: nil},
			makeExecuteResponse(t, u64ptr(7)),
		},
	}
	if got := getReplicationIndex(resp); got != 7 {
		t.Errorf("getReplicationIndex() = %d, want 7", got)
	}
}
