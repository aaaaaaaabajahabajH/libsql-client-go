package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
)

// toolCaller is the subset of mcpClient's behavior a tool binding needs.
// Extracted as an interface so registry dispatch can be tested without
// spawning a real MCP server subprocess.
type toolCaller interface {
	callTool(ctx context.Context, name string, args json.RawMessage) (string, error)
}

type toolBinding struct {
	caller   toolCaller
	toolName string
}

// MCPToolRegistry aggregates tools discovered from multiple connected MCP
// servers and exposes them in the shape the Claude Messages API expects.
// A nil *MCPToolRegistry behaves as "no tools configured" everywhere.
type MCPToolRegistry struct {
	clients     map[string]*mcpClient
	bindings    map[string]toolBinding
	claudeTools []ClaudeTool
}

// LoadMCPServersFromEnv parses the MCP_SERVERS env var: a JSON array of
// {"name","command","args","env"} objects, one per MCP server to connect to
// over stdio. Returns (nil, nil) when the variable is unset or blank, which
// means "no MCP tools" rather than an error.
//
// Example:
//
//	MCP_SERVERS=[{"name":"fetch","command":"npx","args":["-y","@modelcontextprotocol/server-fetch"]}]
func LoadMCPServersFromEnv() ([]MCPServerConfig, error) {
	raw := strings.TrimSpace(os.Getenv("MCP_SERVERS"))
	if raw == "" {
		return nil, nil
	}
	var configs []MCPServerConfig
	if err := json.Unmarshal([]byte(raw), &configs); err != nil {
		return nil, fmt.Errorf("MCP_SERVERS is not valid JSON: %w", err)
	}
	return configs, nil
}

// NewMCPToolRegistry connects to every configured MCP server and discovers
// its tools. A server that fails to start, complete its handshake, or list
// tools is logged and skipped rather than failing the whole registry — MCP
// integrations are optional extras, and one misconfigured server shouldn't
// take down demand analysis.
func NewMCPToolRegistry(ctx context.Context, configs []MCPServerConfig) *MCPToolRegistry {
	reg := &MCPToolRegistry{
		clients:  make(map[string]*mcpClient),
		bindings: make(map[string]toolBinding),
	}
	for _, cfg := range configs {
		client, err := startMCPClient(ctx, cfg)
		if err != nil {
			log.Printf("⚠️  MCP server %q failed to start: %v", cfg.Name, err)
			continue
		}
		tools, err := client.listTools(ctx)
		if err != nil {
			log.Printf("⚠️  MCP server %q failed to list tools: %v", cfg.Name, err)
			_ = client.Close()
			continue
		}

		reg.clients[cfg.Name] = client
		for _, t := range tools {
			claudeName := cfg.Name + "__" + t.Name
			reg.bindings[claudeName] = toolBinding{caller: client, toolName: t.Name}

			schema := t.InputSchema
			if len(schema) == 0 {
				schema = json.RawMessage(`{"type":"object","properties":{}}`)
			}
			reg.claudeTools = append(reg.claudeTools, ClaudeTool{
				Name:        claudeName,
				Description: t.Description,
				InputSchema: schema,
			})
		}
		log.Printf("🔌 MCP server %q connected — %d tool(s)", cfg.Name, len(tools))
	}
	return reg
}

// ClaudeTools returns the aggregated tool list in Claude Messages API
// format, ready to attach to a request's "tools" field.
func (reg *MCPToolRegistry) ClaudeTools() []ClaudeTool {
	if reg == nil {
		return nil
	}
	return reg.claudeTools
}

// CallTool dispatches a Claude-facing tool_use block (its prefixed name) to
// the MCP server that owns it.
func (reg *MCPToolRegistry) CallTool(ctx context.Context, name string, args json.RawMessage) (string, error) {
	if reg == nil {
		return "", fmt.Errorf("no MCP tools configured")
	}
	binding, ok := reg.bindings[name]
	if !ok {
		return "", fmt.Errorf("unknown tool %q", name)
	}
	return binding.caller.callTool(ctx, binding.toolName, args)
}

// Close disconnects every MCP server this registry connected to.
func (reg *MCPToolRegistry) Close() {
	if reg == nil {
		return
	}
	for name, client := range reg.clients {
		if err := client.Close(); err != nil {
			log.Printf("⚠️  MCP server %q close error: %v", name, err)
		}
	}
}
