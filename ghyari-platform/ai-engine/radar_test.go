package main

import "testing"

func TestTextFromContent(t *testing.T) {
	blocks := []ContentBlock{
		{Type: "text", Text: "hello "},
		{Type: "tool_use", Name: "search", ID: "toolu_1"},
		{Type: "text", Text: "world"},
	}
	if got, want := textFromContent(blocks), "hello world"; got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestExtractJSONArray(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"plain array", `[{"a":1}]`, `[{"a":1}]`},
		{"wrapped in prose", "Sure, here you go:\n[{\"a\":1}]\nHope that helps!", `[{"a":1}]`},
		{"no array", "no json here", "no json here"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := extractJSONArray(tc.input); got != tc.want {
				t.Fatalf("got %q, want %q", got, tc.want)
			}
		})
	}
}
