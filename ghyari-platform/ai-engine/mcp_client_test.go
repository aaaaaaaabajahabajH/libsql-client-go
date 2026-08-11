package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"
)

// fakeMCPServer speaks the client's half of the stdio JSON-RPC protocol so
// mcpClient's transport code can be tested without spawning a real process.
// in is what the client wrote (its "stdin"); out is what the client reads
// from (its "stdout").
func fakeMCPServer(t *testing.T, in io.Reader, out io.WriteCloser) {
	t.Helper()
	scanner := bufio.NewScanner(in)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var req jsonRPCRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			t.Errorf("fake server: bad request line %q: %v", line, err)
			continue
		}

		switch req.Method {
		case "notifications/initialized":
			// No response expected for notifications.
			continue
		case "initialize":
			writeResult(t, out, req.ID, map[string]interface{}{
				"protocolVersion": mcpProtocolVersion,
				"capabilities":    map[string]interface{}{},
				"serverInfo":      map[string]string{"name": "fake", "version": "0.0.1"},
			})
		case "tools/list":
			writeResult(t, out, req.ID, map[string]interface{}{
				"tools": []map[string]interface{}{
					{
						"name":        "echo",
						"description": "echoes its input back",
						"inputSchema": map[string]interface{}{
							"type":       "object",
							"properties": map[string]interface{}{"text": map[string]string{"type": "string"}},
						},
					},
				},
			})
		case "tools/call":
			handleFakeToolCall(t, out, req)
		default:
			t.Errorf("fake server: unexpected method %q", req.Method)
		}
	}
}

func handleFakeToolCall(t *testing.T, out io.Writer, req jsonRPCRequest) {
	t.Helper()
	paramsBytes, err := json.Marshal(req.Params)
	if err != nil {
		t.Fatalf("fake server: marshal params: %v", err)
	}
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(paramsBytes, &params); err != nil {
		t.Fatalf("fake server: decode tools/call params: %v", err)
	}

	switch params.Name {
	case "echo":
		var args struct {
			Text string `json:"text"`
		}
		_ = json.Unmarshal(params.Arguments, &args)
		writeResult(t, out, req.ID, map[string]interface{}{
			"content": []map[string]string{{"type": "text", "text": args.Text}},
			"isError": false,
		})
	case "boom":
		writeResult(t, out, req.ID, map[string]interface{}{
			"content": []map[string]string{{"type": "text", "text": "kaboom"}},
			"isError": true,
		})
	default:
		writeResponse(t, out, jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32601, Message: "unknown tool " + params.Name},
		})
	}
}

func writeResult(t *testing.T, out io.Writer, id int64, result interface{}) {
	t.Helper()
	resultBytes, err := json.Marshal(result)
	if err != nil {
		t.Fatalf("fake server: marshal result: %v", err)
	}
	writeResponse(t, out, jsonRPCResponse{JSONRPC: "2.0", ID: id, Result: resultBytes})
}

func writeResponse(t *testing.T, out io.Writer, resp jsonRPCResponse) {
	t.Helper()
	line, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("fake server: marshal response: %v", err)
	}
	if _, err := out.Write(append(line, '\n')); err != nil {
		t.Errorf("fake server: write: %v", err)
	}
}

// newTestMCPClient wires an mcpClient to a fakeMCPServer over in-memory
// pipes and completes the initialize handshake.
func newTestMCPClient(t *testing.T) *mcpClient {
	t.Helper()
	clientStdinReader, clientStdinWriter := io.Pipe()
	clientStdoutReader, clientStdoutWriter := io.Pipe()

	go fakeMCPServer(t, clientStdinReader, clientStdoutWriter)

	client := newMCPClient("fake", clientStdinWriter, clientStdoutReader, func() error {
		return clientStdinWriter.Close()
	})
	t.Cleanup(func() { _ = client.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.initialize(ctx); err != nil {
		t.Fatalf("initialize: %v", err)
	}
	return client
}

func TestMCPClient_ListTools(t *testing.T) {
	client := newTestMCPClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tools, err := client.listTools(ctx)
	if err != nil {
		t.Fatalf("listTools: %v", err)
	}
	if len(tools) != 1 || tools[0].Name != "echo" {
		t.Fatalf("unexpected tools: %+v", tools)
	}
}

func TestMCPClient_CallTool(t *testing.T) {
	client := newTestMCPClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	out, err := client.callTool(ctx, "echo", json.RawMessage(`{"text":"hello mcp"}`))
	if err != nil {
		t.Fatalf("callTool: %v", err)
	}
	if out != "hello mcp" {
		t.Fatalf("got %q, want %q", out, "hello mcp")
	}
}

func TestMCPClient_CallTool_ToolError(t *testing.T) {
	client := newTestMCPClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.callTool(ctx, "boom", nil)
	if err == nil {
		t.Fatal("expected an error from a tool that reports isError:true")
	}
}

func TestMCPClient_CallTool_UnknownTool(t *testing.T) {
	client := newTestMCPClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.callTool(ctx, "does-not-exist", nil)
	if err == nil {
		t.Fatal("expected an error calling an unknown tool")
	}
}

func TestMCPClient_ConcurrentCalls(t *testing.T) {
	client := newTestMCPClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const n = 10
	errCh := make(chan error, n)
	for i := 0; i < n; i++ {
		i := i
		go func() {
			text := fmt.Sprintf("msg-%d", i)
			out, err := client.callTool(ctx, "echo", json.RawMessage(fmt.Sprintf(`{"text":%q}`, text)))
			if err != nil {
				errCh <- err
				return
			}
			if out != text {
				errCh <- fmt.Errorf("got %q, want %q", out, text)
				return
			}
			errCh <- nil
		}()
	}
	for i := 0; i < n; i++ {
		if err := <-errCh; err != nil {
			t.Error(err)
		}
	}
}
