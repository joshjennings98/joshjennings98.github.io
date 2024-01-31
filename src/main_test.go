package main

import (
	"bytes"
	"fmt"
	"io"
	"io/fs"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAboutMe(t *testing.T) {
	aboutPage := Page{
		Content: "About me content",
		Title:   "About Me",
		Date:    time.Now(),
	}

	node := AboutMe(aboutPage)
	require.NotNil(t, node)

	b := bytes.NewBufferString("")
	err := node.Render(b)
	require.NoError(t, err)
	renderedHTML := b.String()

	assert.Contains(t, renderedHTML, aboutPage.Content)
	assert.Contains(t, renderedHTML, "homepage page")
	assert.Contains(t, renderedHTML, "homepage")
	assert.Contains(t, renderedHTML, "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
}

func TestNavPages(t *testing.T) {
	t.Run("Empty list", func(t *testing.T) {
		node := NavPages([]Page{}, false)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Equal(t, "<ul></ul>", b.String())
	})

	t.Run("Single element", func(t *testing.T) {
		pages := []Page{
			{Title: "Page1", Slug: "page1", Date: time.Now()},
		}

		node := NavPages(pages, false)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedHTML := fmt.Sprintf("<ul><li><a href=\"#page1\">Page1</a></li></ul>")
		assert.Equal(t, expectedHTML, b.String())
	})

	t.Run("Single element with date", func(t *testing.T) {
		pages := []Page{
			{Title: "Page1", Slug: "page1", Date: time.Now()},
		}

		node := NavPages(pages, true)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedHTML := fmt.Sprintf("<ul><li><b>%s: </b><a href=\"#page1\">Page1</a></li></ul>", pages[0].Date.Format(time.DateOnly))
		assert.Equal(t, expectedHTML, b.String())
	})

	t.Run("Multiple elements", func(t *testing.T) {
		pages := []Page{
			{Title: "Page1", Slug: "page1", Date: time.Now()},
			{Title: "Page2", Slug: "page2", Date: time.Now()},
		}

		node := NavPages(pages, false)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedHTML := fmt.Sprintf("<ul><li><a href=\"#page1\">Page1</a></li><li><a href=\"#page2\">Page2</a></li></ul>")
		assert.Equal(t, expectedHTML, b.String())
	})

	t.Run("Multiple elements with dates", func(t *testing.T) {
		pages := []Page{
			{Title: "Page1", Slug: "page1", Date: time.Now()},
			{Title: "Page2", Slug: "page2", Date: time.Now()},
		}

		node := NavPages(pages, true)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedHTML := fmt.Sprintf("<ul><li><b>%s: </b><a href=\"#page1\">Page1</a></li><li><b>%s: </b><a href=\"#page2\">Page2</a></li></ul>", pages[0].Date.Format(time.DateOnly), pages[1].Date.Format(time.DateOnly))
		assert.Equal(t, expectedHTML, b.String())
	})
}

func TestBlogsPage(t *testing.T) {
	t.Run("Empty list", func(t *testing.T) {
		node := BlogsPage([]Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "<div class=\"page\" id=\"archive\">")
		assert.Contains(t, b.String(), "<h1>Archive</h1>")
		assert.Contains(t, b.String(), "<ul></ul>")
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#archive\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})

	t.Run("Single element", func(t *testing.T) {
		pages := []Page{
			{Title: "Blog1", Slug: "blog1", Date: time.Now()},
		}

		node := BlogsPage(pages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedNav := fmt.Sprintf("<ul><li><b>%s: </b><a href=\"#blog1\">Blog1</a></li></ul>", pages[0].Date.Format(time.DateOnly))
		assert.Contains(t, b.String(), expectedNav)
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#archive\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})

	t.Run("Multiple elements", func(t *testing.T) {
		pages := []Page{
			{Title: "Blog1", Slug: "blog1", Date: time.Now()},
			{Title: "Blog2", Slug: "blog2", Date: time.Now()},
		}

		node := BlogsPage(pages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedNav := fmt.Sprintf("<ul><li><b>%s: </b><a href=\"#blog1\">Blog1</a></li><li><b>%s: </b><a href=\"#blog2\">Blog2</a></li></ul>", pages[0].Date.Format(time.DateOnly), pages[1].Date.Format(time.DateOnly))
		assert.Contains(t, b.String(), expectedNav)
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#archive\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})
}

func TestProjectsPage(t *testing.T) {
	t.Run("Empty list", func(t *testing.T) {
		node := ProjectsPage([]Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "<div class=\"page\" id=\"projects\">")
		assert.Contains(t, b.String(), "<h1>Projects</h1>")
		assert.Contains(t, b.String(), "This page provides links to some of the projects")
		assert.Contains(t, b.String(), "<ul></ul>")
		assert.Contains(t, b.String(), "href=\"https://github.com/joshjennings98\">Github page</a>")
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#projects\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})

	t.Run("Single element", func(t *testing.T) {
		pages := []Page{
			{Title: "Project1", Slug: "project1", Date: time.Now()},
		}

		node := ProjectsPage(pages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedNav := fmt.Sprintf("<ul><li><a href=\"#project1\">Project1</a></li></ul>")
		assert.Contains(t, b.String(), expectedNav)
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#projects\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})

	t.Run("Multiple elements", func(t *testing.T) {
		pages := []Page{
			{Title: "Project1", Slug: "project1", Date: time.Now()},
			{Title: "Project2", Slug: "project2", Date: time.Now()},
		}

		node := ProjectsPage(pages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		expectedNav := fmt.Sprintf("<ul><li><a href=\"#project1\">Project1</a></li><li><a href=\"#project2\">Project2</a></li></ul>")
		assert.Contains(t, b.String(), expectedNav)
		assert.Contains(t, b.String(), "<footer><table width=\"100%\"><tr><td width=\"50%\" align=\"left\"><a href=\"#projects\">Back to top</a></td><td width=\"50%\" align=\"right\"><a href=\"#\">Home</a></td></tr></table></footer></div>")
	})
}

func TestPagesContent(t *testing.T) {
	aboutPage := Page{
		Content: "About me content",
		Title:   "About Me",
		Slug:    "about-me",
		Date:    time.Now(),
	}

	t.Run("All inputs empty", func(t *testing.T) {
		node := PagesContent(aboutPage, []Page{}, []Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "<div class=\"content2\">")
		assert.Contains(t, b.String(), "<div class=\"homepage page\" id=\"homepage\">")
		assert.Contains(t, b.String(), aboutPage.Content)
	})

	t.Run("Only project pages", func(t *testing.T) {
		projectPages := []Page{
			{Title: "Project1", Slug: "project1", Content: "Project1 content", Date: time.Now()},
		}

		node := PagesContent(aboutPage, projectPages, []Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Project1 content")
		assert.Contains(t, b.String(), "href=\"#project1\">Back to top")
	})

	t.Run("Only blog pages", func(t *testing.T) {
		blogPages := []Page{
			{Title: "Blog1", Slug: "blog1", Content: "Blog1 content", Date: time.Now()},
		}

		node := PagesContent(aboutPage, []Page{}, blogPages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Blog1 content")
		assert.Contains(t, b.String(), "href=\"#blog1\">Back to top")
	})

	t.Run("Project and blog pages", func(t *testing.T) {
		projectPages := []Page{
			{Title: "Project1", Slug: "project1", Content: "Project1 content", Date: time.Now()},
		}
		blogPages := []Page{
			{Title: "Blog1", Slug: "blog1", Content: "Blog1 content", Date: time.Now()},
		}

		node := PagesContent(aboutPage, projectPages, blogPages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Project1 content")
		assert.Contains(t, b.String(), "Blog1 content")
		assert.Contains(t, b.String(), "href=\"#project1\">Back to top")
		assert.Contains(t, b.String(), "href=\"#blog1\">Back to top")
	})
}

func TestWebsiteContent(t *testing.T) {
	title := "My Website"
	aboutPage := Page{
		Content: "About me content",
		Title:   "About Me",
		Slug:    "about-me",
		Date:    time.Now(),
	}

	t.Run("Minimal inputs", func(t *testing.T) {
		node := WebsiteContent(title, aboutPage, []Page{}, []Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "<!doctype html>")
		assert.Contains(t, b.String(), "<html lang=\"en\">")
		assert.Contains(t, b.String(), "<title>"+title+"</title>")
		assert.Contains(t, b.String(), "About me content")
		assert.Contains(t, b.String(), "Home")
		assert.Contains(t, b.String(), "Projects")
		assert.Contains(t, b.String(), "Archive")
		assert.Contains(t, b.String(), "Theme")
	})

	t.Run("Only project pages", func(t *testing.T) {
		projectPages := []Page{
			{Title: "Project1", Slug: "project1", Content: "Project1 content", Date: time.Now()},
		}

		node := WebsiteContent(title, aboutPage, projectPages, []Page{})

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Project1 content")
	})

	t.Run("Only blog pages", func(t *testing.T) {
		blogPages := []Page{
			{Title: "Blog1", Slug: "blog1", Content: "Blog1 content", Date: time.Now()},
		}

		node := WebsiteContent(title, aboutPage, []Page{}, blogPages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Blog1 content")
	})

	t.Run("Project and blog pages", func(t *testing.T) {
		projectPages := []Page{
			{Title: "Project1", Slug: "project1", Content: "Project1 content", Date: time.Now()},
		}
		blogPages := []Page{
			{Title: "Blog1", Slug: "blog1", Content: "Blog1 content", Date: time.Now()},
		}

		node := WebsiteContent(title, aboutPage, projectPages, blogPages)

		b := bytes.NewBufferString("")
		err := node.Render(b)
		require.NoError(t, err)

		assert.Contains(t, b.String(), "Project1 content")
		assert.Contains(t, b.String(), "Blog1 content")
	})
}

// MockFS represents a mock filesystem with directory support.
type MockFS map[string][]byte

// Open opens the named file.
func (m MockFS) Open(name string) (fs.File, error) {
	if strings.HasSuffix(name, "/") {
		return m.openDir(name)
	}
	content, ok := m[name]
	if !ok {
		return nil, fs.ErrNotExist
	}
	return &MockFile{data: content, size: int64(len(content))}, nil
}

func (m MockFS) openDir(name string) (fs.File, error) {
	entries := make([]fs.DirEntry, 0)
	for filename := range m {
		if strings.HasPrefix(filename, name) && filename != name {
			entryName := strings.TrimPrefix(filename, name)
			if strings.Contains(entryName, "/") {
				continue // Skip nested files/directories
			}
			entries = append(entries, mockDirEntry{entryName})
		}
	}
	return &MockDir{entries: entries}, nil
}

// MockFile is an in-memory file implementation for MockFS.
type MockFile struct {
	data []byte
	size int64
	read int64
}

// MockDir represents an in-memory directory.
type MockDir struct {
	entries []fs.DirEntry
	pos     int
}

type mockDirEntry struct {
	name string
}

func (f *MockFile) Read(b []byte) (int, error) {
	if f.read >= f.size {
		return 0, io.EOF
	}
	n := copy(b, f.data[f.read:])
	f.read += int64(n)
	return n, nil
}

func (f *MockFile) Close() error {
	return nil
}

func (f *MockFile) Stat() (fs.FileInfo, error) {
	return mockFileInfo{size: f.size}, nil
}

func (d *MockDir) Read(b []byte) (int, error) {
	return 0, io.EOF // Directories can't be read
}

func (d *MockDir) Close() error {
	return nil
}

func (d *MockDir) Stat() (fs.FileInfo, error) {
	return mockFileInfo{}, nil
}

func (d *MockDir) ReadDir(n int) ([]fs.DirEntry, error) {
	length := len(d.entries) - d.pos
	if n > 0 && n < length {
		length = n
	}
	if length == 0 {
		if n <= 0 {
			return nil, nil
		}
		return nil, io.EOF
	}
	entries := d.entries[d.pos : d.pos+length]
	d.pos += length
	return entries, nil
}

func (e mockDirEntry) Name() string               { return e.name }
func (e mockDirEntry) IsDir() bool                { return true }
func (e mockDirEntry) Type() fs.FileMode          { return 0 }
func (e mockDirEntry) Info() (fs.FileInfo, error) { return mockFileInfo{}, nil }

// mockFileInfo is a mock implementation of fs.FileInfo.
type mockFileInfo struct{ size int64 }

func (mockFileInfo) Name() string       { return "" }
func (mockFileInfo) Size() int64        { return 0 }
func (mockFileInfo) Mode() fs.FileMode  { return 0 }
func (mockFileInfo) ModTime() time.Time { return time.Time{} }
func (mockFileInfo) IsDir() bool        { return false }
func (mockFileInfo) Sys() interface{}   { return nil }

func TestParsePage(t *testing.T) {
	mockFS := MockFS{
		"valid.md": []byte(`---
title: "Test Page"
slug: "test-page"
date: "2023-01-01T00:00:00Z"
---
# Test Content
`),
		"missing_meta.md": []byte(`# Test Content`),
		"invalid_date.md": []byte(`---
title: "Test Page"
slug: "test-page"
date: "invalid-date"
---
# Test Content
`),
	}

	t.Run("Valid markdown with all metadata", func(t *testing.T) {
		page, err := ParsePage(mockFS, "valid.md")
		require.NoError(t, err)

		assert.Equal(t, "Test Page", page.Title)
		assert.Equal(t, "test-page", page.Slug)
		expectedDate, _ := time.Parse(time.RFC3339, "2023-01-01T00:00:00Z")
		assert.Equal(t, expectedDate, page.Date)
		assert.Contains(t, page.Content, "<h1 id=\"test-content\">Test Content</h1>")
	})

	t.Run("Missing metadata", func(t *testing.T) {
		page, err := ParsePage(mockFS, "missing_meta.md")
		require.NoError(t, err)

		assert.Equal(t, "no title...", page.Title)
		assert.NotEmpty(t, page.Slug)
		assert.NotZero(t, page.Date)
		assert.Contains(t, page.Content, "<h1 id=\"test-content\">Test Content</h1>")
	})

	t.Run("Non-existent file", func(t *testing.T) {
		_, err := ParsePage(mockFS, "nonexistent.md")
		assert.Error(t, err)
	})

	t.Run("Invalid date format in metadata", func(t *testing.T) {
		_, err := ParsePage(mockFS, "invalid_date.md")
		assert.Error(t, err)
	})
}

func TestParsePages(t *testing.T) {
	mockFS := MockFS{
		"empty/": nil, // make sure directories exist
		"pages/": nil,
		"pages/page1.md": []byte(`---
title: "Page 1"
slug: "page1"
date: "2023-01-02T00:00:00Z"
---
# Content of Page 1
`),
		"pages/page2.md": []byte(`---
title: "Page 2"
slug: "page2"
date: "2023-01-01T00:00:00Z"
---
# Content of Page 2
`),
	}

	t.Run("Directory with multiple markdown files", func(t *testing.T) {
		pages, err := ParsePages(mockFS, "pages/")
		require.NoError(t, err)
		require.Len(t, pages, 2)

		// Check if pages are sorted correctly by date
		assert.Equal(t, "Page 1", pages[0].Title)
		assert.Equal(t, "Page 2", pages[1].Title)

		assert.Contains(t, pages[0].Content, "Content of Page 1")
		assert.Contains(t, pages[1].Content, "Content of Page 2")
	})

	t.Run("Empty directory", func(t *testing.T) {
		pages, err := ParsePages(mockFS, "empty/")
		require.NoError(t, err)
		assert.Empty(t, pages)
	})

	t.Run("Non-existent directory", func(t *testing.T) {
		_, err := ParsePages(mockFS, "nonexistent")
		assert.Error(t, err)
	})
}

func TestLoadContent(t *testing.T) {
	// Setup mock filesystem
	blogDir = "blog/"
	projectDir = "projects/"
	aboutFile = "about.md"
	stylesheet = "website.css"
	favicon = "favicon.ico"
	font = "IosevkaFixedCurly-Regular.woff2"

	mockFS := MockFS{
		"blog/page1.md":                   []byte(`---\ntitle: "Blog Page 1"\n---\nContent`),
		"blog/page2.md":                   []byte(`---\ntitle: "Blog Page 2"\n---\nContent`),
		"projects/proj1.md":               []byte(`---\ntitle: "Project 1"\n---\nContent`),
		"about.md":                        []byte(`---\ntitle: "About"\n---\nContent`),
		"website.css":                     []byte(`body { color: red; }`),
		"favicon.ico":                     []byte(`icon content`),
		"IosevkaFixedCurly-Regular.woff2": []byte(`font content`),
	}

	t.Run("Successful content loading", func(t *testing.T) {
		err := loadContent(mockFS)
		require.NoError(t, err)

		assert.NotEmpty(t, blogPages)
		assert.NotEmpty(t, projectPages)
		assert.NotEmpty(t, aboutPage.Content)
		assert.NotEmpty(t, stylesheetContent)
		assert.NotEmpty(t, faviconContent)
		assert.NotEmpty(t, fontContent)
	})

	t.Run("Error when file is missing", func(t *testing.T) {
		err := loadContent(MockFS{}) // Empty filesystem
		assert.Error(t, err)
	})
}

func TestPreProcessor(t *testing.T) {
	highlightingRules := map[string]HighlightingMap{
		"lang": {
			'1': RegexCodePair{
				Regex:  regexp.MustCompile(`(\bregex\b)`),
				Code:   "1",
				Colour: "red",
			},
			'2': RegexCodePair{
				Regex:  regexp.MustCompile(`(\bkeyword\b)`),
				Code:   "2",
				Colour: "blue",
			},
		},
	}

	preProc := newPreProcessor(highlightingRules)

	t.Run("Basic Processing", func(t *testing.T) {
		lines := []string{"line without pre", "another line"}
		result, err := preProc.processLines(lines)
		require.NoError(t, err)
		assert.Equal(t, lines, result)
	})

	t.Run("Start Preformatted Text", func(t *testing.T) {
		err := preProc.startPre("<pre><code class=\"lang\">")
		require.NoError(t, err)
		assert.True(t, preProc.inPre)
		assert.Equal(t, "lang", preProc.class)
	})

	t.Run("End Preformatted Text", func(t *testing.T) {
		preProc.inPre = true // assume already in block
		preProc.buffer.WriteString("code content")
		pre, err := preProc.endPre()
		require.NoError(t, err)
		assert.False(t, preProc.inPre)
		assert.Contains(t, pre, "code content")
		assert.Contains(t, pre, "</code></pre></div>")
	})

	t.Run("Token Identification", func(t *testing.T) {
		preProc.class = "lang"

		line := "This is a regex and here is a keyword."
		expectedTokens := strings.ReplaceAll(line, "regex", "11111")
		expectedTokens = strings.ReplaceAll(expectedTokens, "keyword", "2222222")
		expectedTokens = regexp.MustCompile(`\D`).ReplaceAllString(expectedTokens, "0")

		tokens := preProc.findTokens(line)
		require.Equal(t, len(line), len(tokens))
		assert.Equal(t, expectedTokens, tokens)
	})

	t.Run("CSS Conversion", func(t *testing.T) {
		preProc.class = "lang"

		tokenString := "000012210000"

		expectedCSS := "linear-gradient(to right, white 0ch, white 0ch, white 4ch, red 4ch, red 5ch, blue 5ch, blue 7ch, red 7ch, red 8ch, white 8ch, white 300ch)"
		css, err := preProc.convertToCSS(tokenString)
		require.NoError(t, err)
		assert.Equal(t, expectedCSS, css)
	})

	t.Run("Error Handling", func(t *testing.T) {
		err := preProc.startPre("invalid line")
		assert.Error(t, err)
	})
}
