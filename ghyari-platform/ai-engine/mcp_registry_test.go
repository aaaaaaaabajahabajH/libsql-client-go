package main

import (
	"context"
	"encoding/json"
	"testing"
)

func TestLoadMCPServersFromEnv_Unset(t *testing.T) {
	t.Setenv("MCP_SERVERS", "")
	configs, err := LoadMCPServersFromEnv()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if configs != nil {
		t.Fatalf("expected nil configs for unset MCP_SERVERS, got %+v", configs)
	}
}

func TestLoadMCPServersFromEnv_Valid(t *testing.T) {
	t.Setenv("MCP_SERVERS", `[{"name":"fetch","command":"npx","args":["-y","@modelcontextprotocol/server-fetch"]}]`)
	configs, err := LoadMCPServersFromEnv()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(configs) != 1 || configs[0].Name != "fetch" || configs[0].Command != "npx" {
		t.Fatalf("unexpected configs: %+v", configs)
	}
}

func TestLoadMCPServersFromEnv_Invalid(t *testing.T) {
	t.Setenv("MCP_SERVERS", "not json")
	if _, err := LoadMCPServersFromEnv(); err == nil {
		t.Fatal("expected an error for invalid MCP_SERVERS JSON")
	}
}

type fakeToolCaller struct {
	output  string
	err     error
	gotName string
	gotArgs json.RawMessage
}

func (f *fakeToolCaller) callTool(_ context.Context, name string, args json.RawMessage) (string, error) {
	f.gotName = name
	f.gotArgs = args
	return f.output, f.err
}

func TestMCPToolRegistry_CallTool_Dispatch(t *testing.T) {
	fake := &fakeToolCaller{output: "42"}
	reg := &MCPToolRegistry{
		bindings: map[string]toolBinding{
			"calc__add": {caller: fake, toolName: "add"},
		},
	}

	out, err := reg.CallTool(context.Background(), "calc__add", json.RawMessage(`{"a":1,"b":2}`))
	if err != nil {
		t.Fatalf("CallTool: %v", err)
	}
	if out != "42" {
		t.Fatalf("got %q, want %q", out, "42")
	}
	if fake.gotName != "add" {
		t.Fatalf("dispatched with tool name %q, want %q (the unprefixed MCP-local name)", fake.gotName, "add")
	}
}

func TestMCPToolRegistry_CallTool_UnknownName(t *testing.T) {
	reg := &MCPToolRegistry{bindings: map[string]toolBinding{}}
	if _, err := reg.CallTool(context.Background(), "nope", nil); err == nil {
		t.Fatal("expected an error for an unbound tool name")
	}
}

func TestMCPToolRegistry_NilSafety(t *testing.T) {
	var reg *MCPToolRegistry

	if tools := reg.ClaudeTools(); tools != nil {
		t.Fatalf("expected nil tools from a nil registry, got %+v", tools)
	}
	if _, err := reg.CallTool(context.Background(), "anything", nil); err == nil {
		t.Fatal("expected an error calling a tool on a nil registry")
	}
	// Must not panic.
	reg.Close()
}
