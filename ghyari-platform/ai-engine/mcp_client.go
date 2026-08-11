package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
)

// mcpProtocolVersion is the MCP protocol version this client speaks during
// the initialize handshake.
const mcpProtocolVersion = "2024-11-05"

type jsonRPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int64       `json:"id,omitempty"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type jsonRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int64           `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *jsonRPCError   `json:"error,omitempty"`
}

type jsonRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// MCPServerConfig describes how to launch and connect to one MCP server
// over stdio.
type MCPServerConfig struct {
	Name    string            `json:"name"`
	Command string            `json:"command"`
	Args    []string          `json:"args,omitempty"`
	Env     map[string]string `json:"env,omitempty"`
}

// MCPTool is a tool definition as advertised by an MCP server via tools/list.
type MCPTool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	InputSchema json.RawMessage `json:"inputSchema"`
}

// mcpClient is a JSON-RPC 2.0 client for a single MCP server, connected over
// newline-delimited JSON on stdin/stdout (the MCP stdio transport).
type mcpClient struct {
	name  string
	stdin io.Writer

	writeMu sync.Mutex
	nextID  int64

	mu      sync.Mutex
	pending map[int64]chan jsonRPCResponse

	closeFn   func() error
	closeOnce sync.Once
}

// newMCPClient wires an mcpClient to an already-open stdin/stdout pair and
// starts its read loop. closeFn is invoked once, on Close, to release the
// underlying transport (e.g. terminate the subprocess).
func newMCPClient(name string, stdin io.Writer, stdout io.Reader, closeFn func() error) *mcpClient {
	c := &mcpClient{
		name:    name,
		stdin:   stdin,
		pending: make(map[int64]chan jsonRPCResponse),
		closeFn: closeFn,
	}
	go c.readLoop(stdout)
	return c
}

// startMCPClient launches cfg.Command as a subprocess and speaks MCP to it
// over its stdin/stdout, completing the initialize handshake before
// returning.
func startMCPClient(ctx context.Context, cfg MCPServerConfig) (*mcpClient, error) {
	cmd := exec.CommandContext(ctx, cfg.Command, cfg.Args...)
	cmd.Env = os.Environ()
	for k, v := range cfg.Env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}
	cmd.Stderr = os.Stderr

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("mcp %s: stdin pipe: %w", cfg.Name, err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("mcp %s: stdout pipe: %w", cfg.Name, err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("mcp %s: start: %w", cfg.Name, err)
	}

	c := newMCPClient(cfg.Name, stdin, stdout, func() error {
		_ = stdin.Close()
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		return cmd.Wait()
	})

	if err := c.initialize(ctx); err != nil {
		_ = c.Close()
		return nil, fmt.Errorf("mcp %s: %w", cfg.Name, err)
	}
	return c, nil
}

func (c *mcpClient) initialize(ctx context.Context) error {
	params := map[string]interface{}{
		"protocolVersion": mcpProtocolVersion,
		"capabilities":    map[string]interface{}{},
		"clientInfo": map[string]string{
			"name":    "ghyari-ai-engine",
			"version": "1.0.0",
		},
	}
	if _, err := c.call(ctx, "initialize", params); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}
	// Notifications carry no id and expect no response.
	if err := c.notify("notifications/initialized", map[string]interface{}{}); err != nil {
		return fmt.Errorf("initialized notification: %w", err)
	}
	return nil
}

func (c *mcpClient) readLoop(stdout io.Reader) {
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var resp jsonRPCResponse
		if err := json.Unmarshal([]byte(line), &resp); err != nil {
			log.Printf("mcp %s: malformed message, skipping: %v", c.name, err)
			continue
		}
		c.mu.Lock()
		ch, ok := c.pending[resp.ID]
		if ok {
			delete(c.pending, resp.ID)
		}
		c.mu.Unlock()
		if ok {
			ch <- resp
		}
	}
}

func (c *mcpClient) call(ctx context.Context, method string, params interface{}) (json.RawMessage, error) {
	id := atomic.AddInt64(&c.nextID, 1)
	ch := make(chan jsonRPCResponse, 1)
	c.mu.Lock()
	c.pending[id] = ch
	c.mu.Unlock()

	req := jsonRPCRequest{JSONRPC: "2.0", ID: id, Method: method, Params: params}
	line, err := json.Marshal(req)
	if err != nil {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
		return nil, err
	}

	c.writeMu.Lock()
	_, writeErr := c.stdin.Write(append(line, '\n'))
	c.writeMu.Unlock()
	if writeErr != nil {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
		return nil, fmt.Errorf("write: %w", writeErr)
	}

	select {
	case resp := <-ch:
		if resp.Error != nil {
			return nil, fmt.Errorf("%s (code %d)", resp.Error.Message, resp.Error.Code)
		}
		return resp.Result, nil
	case <-ctx.Done():
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
		return nil, ctx.Err()
	}
}

func (c *mcpClient) notify(method string, params interface{}) error {
	req := jsonRPCRequest{JSONRPC: "2.0", Method: method, Params: params}
	line, err := json.Marshal(req)
	if err != nil {
		return err
	}
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	_, err = c.stdin.Write(append(line, '\n'))
	return err
}

func (c *mcpClient) listTools(ctx context.Context) ([]MCPTool, error) {
	result, err := c.call(ctx, "tools/list", map[string]interface{}{})
	if err != nil {
		return nil, err
	}
	var out struct {
		Tools []MCPTool `json:"tools"`
	}
	if err := json.Unmarshal(result, &out); err != nil {
		return nil, fmt.Errorf("decode tools/list: %w", err)
	}
	return out.Tools, nil
}

// callTool invokes a tool by its MCP-local name (not the Claude-facing
// prefixed name) and returns its concatenated text output.
func (c *mcpClient) callTool(ctx context.Context, name string, args json.RawMessage) (string, error) {
	params := map[string]interface{}{"name": name}
	if len(args) > 0 {
		var decoded interface{}
		if err := json.Unmarshal(args, &decoded); err != nil {
			return "", fmt.Errorf("decode tool arguments: %w", err)
		}
		params["arguments"] = decoded
	} else {
		params["arguments"] = map[string]interface{}{}
	}

	result, err := c.call(ctx, "tools/call", params)
	if err != nil {
		return "", err
	}
	var out struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		IsError bool `json:"isError"`
	}
	if err := json.Unmarshal(result, &out); err != nil {
		return "", fmt.Errorf("decode tools/call result: %w", err)
	}

	var sb strings.Builder
	for _, block := range out.Content {
		if block.Type == "text" {
			sb.WriteString(block.Text)
		}
	}
	if out.IsError {
		return "", fmt.Errorf("tool error: %s", sb.String())
	}
	return sb.String(), nil
}

func (c *mcpClient) Close() error {
	var err error
	c.closeOnce.Do(func() {
		if c.closeFn != nil {
			err = c.closeFn()
		}
	})
	return err
}
