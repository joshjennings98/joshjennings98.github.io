package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSlugify(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Basic string",
			input:    "Hello World",
			expected: "hello-world",
		},
		{
			name:     "String with punctuations",
			input:    "Hello, World!",
			expected: "hello-world",
		},
		{
			name:     "String with multiple spaces",
			input:    "Hello   World",
			expected: "hello-world",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := slugify(test.input)
			assert.Equal(t, test.expected, result)
		})
	}
}

func TestParseLine(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Parse image line",
			input:    "![http://test.com](Test Image)",
			expected: "<div class=\"image-outer-wrapper\">\n\t\t\t\t\t<div class=\"image-inner-wrapper\">\n\t\t\t\t\t\t<img class=\"image\" src=\"http://test.com\" title=\"Test Image\" />\n\t\t\t\t\t</div>\n\t\t\t\t</div>",
		},
		{
			name:     "Parse header line",
			input:    "# Hello World",
			expected: "<h1>Hello World</h1>",
		},
		{
			name:     "Parse code block line",
			input:    "```js\nconsole.log('Hello, World!')\n```",
			expected: "<pre class=\"jscode\" title=\"js\">console.log('Hello, World!')\n</pre>",
		},
		{
			name:     "Parse normal line",
			input:    "Hello World",
			expected: "<p>Hello World</p>",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := parseContent(test.input)
			assert.Equal(t, test.expected, result)
		})
	}
}

func TestParseLine_Error(t *testing.T) {
	line := "Invalid line format!"

	output := parseContent(line)

	assert.Equal(t, "<p>Invalid line format!</p>", output)
}

func TestRenderTemplate(t *testing.T) {
	tmpDir := t.TempDir()
	testInputPath := "index.html.tmpl"
	testOutputPath := filepath.Join(tmpDir, "test_output.html")

	data := &Website{
		Name: "Test Website",
		Pages: []Page{
			{
				Title:      "Test Page",
				Paragraphs: []string{"This is a test paragraph."},
			},
		},
	}

	err := renderTemplate(testInputPath, testOutputPath, data)
	assert.NoError(t, err)

	output, err := ioutil.ReadFile(testOutputPath)
	assert.NoError(t, err)
	assert.Contains(t, string(output), "<div class=\"page\" id=\"test-page\">\n        <div class=\"page-header\">\n          <h2>Test Page</h2>\n        </div>\n        <p>This is a test paragraph.</p>\n        </div>")
}

func TestRenderTemplate_TemplateNotExists(t *testing.T) {
	tmpDir := t.TempDir()

	testInputPath := "not_exists.tmpl"
	testOutputPath := filepath.Join(tmpDir, "test_output.html")
	data := &Website{}

	err := renderTemplate(testInputPath, testOutputPath, data)

	assert.Error(t, err)
}

func TestGenerateWebsite(t *testing.T) {
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "markdown")
	err := os.Mkdir(inputPath, 0744)
	assert.NoError(t, err)

	outputPath := filepath.Join(tmpDir, "html")
	err = os.Mkdir(outputPath, 0744)
	assert.NoError(t, err)

	dummyMarkdown := "# Test\nThis is a test file.\n```go\nfunc a() error {\n  return nil\n}\n```\n![url](alt)\nThis is an apple.\n\n"
	err = ioutil.WriteFile(filepath.Join(inputPath, "test.md"), []byte(dummyMarkdown), 0744)
	assert.NoError(t, err)

	err = generateWebsite(inputPath, outputPath)
	assert.NoError(t, err)

	indexOutput, err := ioutil.ReadFile(filepath.Join(outputPath, "index.html"))
	assert.NoError(t, err)
	assert.Contains(t, string(indexOutput), "<h2>Test</h2>")
	assert.Contains(t, string(indexOutput), "<a href=\"#test\">Test</a></div>")
	assert.Contains(t, string(indexOutput), "<p>This is a test file.</p>")
	assert.Contains(t, string(indexOutput), "<p>This is an apple.</p>")
	assert.Contains(t, string(indexOutput), "<pre class=\"gocode\" title=\"go\">func a() error {\n  return nil\n}\n</pre>")
	assert.Contains(t, string(indexOutput), "<div class=\"image-outer-wrapper\">\n\t\t\t\t\t<div class=\"image-inner-wrapper\">\n\t\t\t\t\t\t<img class=\"image\" src=\"url\" title=\"alt\" />\n\t\t\t\t\t</div>\n\t\t\t\t</div>")
}

func TestGenerateWebsite_InputNotExists(t *testing.T) {
	tmpDir := t.TempDir()

	inputPath := "not_exists_input"
	outputPath := filepath.Join(tmpDir, "not_exists_output")

	err := generateWebsite(inputPath, outputPath)

	assert.Error(t, err)
}

func TestReadMarkdown(t *testing.T) {
	tmpDir := t.TempDir()

	tempFile, err := ioutil.TempFile(tmpDir, "test.md")
	assert.NoError(t, err)

	tempFile.WriteString("# Title\nParagraph 1\nParagraph 2\n```go\ncode\n```\n")
	tempFile.Close()

	page, err := readMarkdown(tempFile.Name())
	assert.NoError(t, err)

	assert.Equal(t, "Title", page.Title)
	assert.Equal(t, []string{"Paragraph 1", "Paragraph 2", "```go\ncode\n```\n"}, page.Paragraphs)
}

func TestReadMarkdown_FileNotExists(t *testing.T) {
	_, err := readMarkdown("not_exists.md")

	assert.Error(t, err)
}

func TestParseMarkdown(t *testing.T) {
	tmpDir := t.TempDir()

	for i := 0; i < 3; i++ {
		err := ioutil.WriteFile(filepath.Join(tmpDir, fmt.Sprintf("%d.md", i)), []byte(fmt.Sprintf("# Title %d\nParagraph 1\nParagraph 2\n```go\ncode\n```\n", i+1)), 0644)
		assert.NoError(t, err)
	}

	pages, err := parseMarkdown(tmpDir)
	assert.NoError(t, err)

	assert.Equal(t, 3, len(pages))
	for i, page := range pages {
		assert.Equal(t, fmt.Sprintf("Title %d", i+1), page.Title)
		assert.Equal(t, []string{"Paragraph 1", "Paragraph 2", "```go\ncode\n```\n"}, page.Paragraphs)
	}
}

func TestParseMarkdown_DirNotExists(t *testing.T) {
	_, err := parseMarkdown("not_exists_dir")

	assert.Error(t, err)
}
