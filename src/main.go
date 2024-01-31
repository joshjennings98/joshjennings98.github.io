package main

import (
	"bytes"
	"embed"
	"flag"
	"fmt"
	html2 "html"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/maragudk/gomponents"
	"github.com/maragudk/gomponents/html"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	htmlRenderer "github.com/yuin/goldmark/renderer/html"
	"golang.org/x/exp/maps"
)

type (
	HighlightingMap = map[rune]RegexCodePair
	Token           = string

	RegexCodePair struct {
		Regex  *regexp.Regexp
		Code   Token
		Colour string
	}

	preProcessor struct {
		inPre           bool
		class           string
		buffer          strings.Builder
		highlightingMap map[string]HighlightingMap
	}

	Page struct {
		Content string
		Title   string
		Slug    string
		Date    time.Time
	}
)

var (
	//go:embed all:markdown static
	embedFS embed.FS

	blogDir    = filepath.Join("markdown", "blog")
	projectDir = filepath.Join("markdown", "projects")
	aboutFile  = filepath.Join("markdown", "about.md")
	stylesheet = filepath.Join("static", "website.css")
	favicon    = filepath.Join("static", "favicon.ico")

	aboutPage         Page
	projectPages      []Page
	blogPages         []Page
	stylesheetContent []byte
	faviconContent    []byte

	markdownConverter = goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			meta.Meta,
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			htmlRenderer.WithHardWraps(),
			htmlRenderer.WithUnsafe(),
		),
	)

	jsHighlighting = HighlightingMap{
		'A': {Regex: regexp.MustCompile(`('(.*?)')`), Code: "A", Colour: "#FFD658"},
		'B': {Regex: regexp.MustCompile(`(\d+(\.\d+)?)`), Code: "B", Colour: "#A7C"},
		'C': {Regex: regexp.MustCompile(`(\/\/.*)`), Code: "C", Colour: "lightgrey"},
		'D': {Regex: regexp.MustCompile(`(\b(\w[A-Za-z0-9]*)\b)\(`), Code: "D", Colour: "#a6e22e"},
		'E': {Regex: regexp.MustCompile(`(\b(typeof|try|catch|finally|delete|switch|case|in|of|if|else|import|from|as|export|extends|new|return|throw|for|while|break|continue|async|await)\b)`), Code: "E", Colour: "#E68"},
		'F': {Regex: regexp.MustCompile(`(\b(true|false|null|undefined|NaN|Infinity|\$)\b)`), Code: "F", Colour: "#ae81ff"},
		'G': {Regex: regexp.MustCompile(`([!=]=|[!=]==|\+\+|--|\*|\/|&&|\|\||!|<=?|>=?|>>|<<|\.{3})`), Code: "G", Colour: "#f92672"},
		'H': {Regex: regexp.MustCompile(`(\b(window|document|navigator|console|self|top|process|require|module|define|global|Promise|Array|Math|String|Number|Symbol|Function|Reflect|Proxy|Error)\b)`), Code: "H", Colour: "#fd971f"},
		'I': {Regex: regexp.MustCompile(`\b(var|let|const|function|this|do|super|as|constructor|instanceof|default)\b`), Code: "I", Colour: "#78dce8"},
		'J': {Regex: regexp.MustCompile(`(\b(getElementsBy(TagName|ClassName|Name)|getElementById|(get|set|remove)Attribute|querySelector(All)?)\b)`), Code: "J", Colour: "#7E7"},
	}

	fsharpHighlighting = HighlightingMap{
		'A': {Regex: regexp.MustCompile(`("(.*?)")`), Code: "A", Colour: "#FFD658"},
		'B': {Regex: regexp.MustCompile(`(\b\d+(\.\d+)?\b)`), Code: "B", Colour: "#A7C"},
		'C': {Regex: regexp.MustCompile(`(//.*)`), Code: "C", Colour: "lightgrey"},
		'D': {Regex: regexp.MustCompile(`\s+\:(\s+([^)=]+))`), Code: "D", Colour: "#a6e22e"},
		'E': {Regex: regexp.MustCompile(`(\b(let|match|with|if|then|else|open|module|type|of|in|for|do|yield|return|try|mutable|struct|interface|abstract|override|virtual|new|base)\b)`), Code: "E", Colour: "#E68"},
		'F': {Regex: regexp.MustCompile(`(\b(true|false|null|None|Some|unit)\b)`), Code: "F", Colour: "#ae81ff"},
		'G': {Regex: regexp.MustCompile(`([!=]=|<>|\+\+|--|&&|\|\||<|[!-]>|<=|>=|\|>|<<|::|\+\+|-->|\.\.|@)`), Code: "G", Colour: "#f92672"},
		'H': {Regex: regexp.MustCompile(`(\b(List|Seq|Array|Map|Set|Option|Result|Async|printfn|sprintfn|printf|sprintf|failwith|raise)\b)`), Code: "H", Colour: "#fd971f"},
		'I': {Regex: regexp.MustCompile(`(\b(let!|use|use!|yield!|return!|async|do!|elif|end|finally|fun|function|try|with|rec)\b)`), Code: "I", Colour: "#78dce8"},
	}

	htmlHighlighting = HighlightingMap{
		'A': {Regex: regexp.MustCompile(`(<[A-Za-z0-9]+( |>))`), Code: "A", Colour: "#f92672"},
		'B': {Regex: regexp.MustCompile(`([a-zA-Z-]+)=`), Code: "B", Colour: "#66d9ef"},
		'C': {Regex: regexp.MustCompile(`("([^"]*)")`), Code: "C", Colour: "#ae81ff"},
		'D': {Regex: regexp.MustCompile(`(/>|>)`), Code: "D", Colour: "#f92672"},
		'E': {Regex: regexp.MustCompile(`(</.*>)`), Code: "E", Colour: "#f92672"},
	}

	cssHighlighting = HighlightingMap{
		'A': {Regex: regexp.MustCompile(`(#[a-zA-Z0-9_-]+|\\.[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)`), Code: "A", Colour: "#66d9ef"},
		'B': {Regex: regexp.MustCompile(`([a-zA-Z-]+): `), Code: "B", Colour: "#a6e22e"},
		'C': {Regex: regexp.MustCompile(`: (.*);`), Code: "C", Colour: "#ae81ff"},
		'D': {Regex: regexp.MustCompile(`(\/\*.*?\*\/)`), Code: "D", Colour: "lightgrey"},
		'E': {Regex: regexp.MustCompile(`(!important)`), Code: "E", Colour: "#f92672"},
		'F': {Regex: regexp.MustCompile(`:([a-zA-Z-]+)`), Code: "F", Colour: "#fd971f"},
		'G': {Regex: regexp.MustCompile(`@([a-zA-Z-]+)`), Code: "G", Colour: "#78dce8"},
	}

	noHightlighting = HighlightingMap{}

	highlightingRules = map[string]HighlightingMap{
		"language-javascript": jsHighlighting,
		"language-fsharp":     fsharpHighlighting,
		"language-html":       htmlHighlighting,
		"language-css":        cssHighlighting,
		"languge-none":        noHightlighting,
	}

	preWithClassRegex   = regexp.MustCompile(`(?P<pre><pre><code class="(?P<class>.*?)">)(?P<content>.*)`)
	preWithNoClassRegex = regexp.MustCompile(`(?P<pre><pre><code>)(?P<content>.*)`)
)

func Footer(slug string) gomponents.Node {
	return html.Footer(
		html.Table(
			html.Width("100%"),
			html.Tr(
				html.Td(
					html.Width("50%"),
					gomponents.Attr("align", "left"),
					html.A(
						html.Href(fmt.Sprintf("#%v", slug)),
						gomponents.Text("Back to top"),
					),
				),
				html.Td(
					html.Width("50%"),
					gomponents.Attr("align", "right"),
					html.A(
						html.Href("#"),
						gomponents.Text("Home"),
					),
				),
			),
		),
	)
}

func AboutMe(aboutPage Page) gomponents.Node {
	return html.Div(
		html.Class("homepage page"),
		html.ID("homepage"),
		gomponents.Raw(aboutPage.Content),
		Footer(""),
	)
}

func NavPages(pages []Page, includeDate bool) gomponents.Node {
	var lis []gomponents.Node
	for _, page := range pages {
		var li []gomponents.Node
		if includeDate {
			li = append(
				li,
				html.B(
					gomponents.Text(page.Date.Format(time.DateOnly)),
					gomponents.Text(": "),
				),
			)
		}
		li = append(
			li,
			html.A(
				html.Href(fmt.Sprintf("#%v", page.Slug)),
				gomponents.Text(page.Title),
			),
		)
		lis = append(
			lis,
			html.Li(li...),
		)
	}
	return html.Ul(
		lis...,
	)
}

func BlogsPage(blogPages []Page) gomponents.Node {
	return html.Div(
		html.Class("page"),
		html.ID("archive"),
		html.H2(
			gomponents.Text("Archive"),
		),
		html.P(
			gomponents.Text(
				"This page contains blog posts I have written. There is a mixture of posts about random topics as well as dev logs.",
			),
		),
		NavPages(blogPages, true),
		Footer("archive"),
	)
}

func ProjectsPage(projectPages []Page) gomponents.Node {
	return html.Div(
		html.Class("page"),
		html.ID("projects"),
		html.H2(
			gomponents.Text("Projects"),
		),
		html.P(
			gomponents.Text(
				"This page provides links to some of the projects I have worked on and written up. They are mostly dumb but I had fun making them:",
			),
		),
		NavPages(projectPages, false),
		html.P(
			gomponents.Text("More projects can be found on my "),
			html.A(
				html.Href("https://github.com/joshjennings98"),
				gomponents.Text("Github page"),
			),
			gomponents.Text("."),
		),
		Footer("projects"),
	)
}

func PagesContent(aboutPage Page, projectPages, blogPages []Page) gomponents.Node {
	nodes := []gomponents.Node{
		html.Class("content2"),
		ProjectsPage(projectPages),
		BlogsPage(blogPages),
	}
	pages := append(projectPages, blogPages...)
	p := newPreProcessor(highlightingRules)
	for _, page := range pages {
		content, _ := p.processLines(strings.Split(page.Content, "\n"))
		nodes = append(
			nodes,
			html.Div(
				html.Class("page"),
				html.ID(page.Slug),
				gomponents.Raw(strings.Join(content, "\n")),
				Footer(page.Slug),
			),
		)
	}
	nodes = append(nodes, AboutMe(aboutPage))
	return html.Div(
		nodes...,
	)
}

func WebsiteContent(title string, aboutPage Page, projectPages, blogPages []Page) gomponents.Node {
	return html.Doctype(
		html.HTML(
			html.Lang("en"),
			html.Head(
				html.Meta(
					html.Name("viewport"),
					html.Content("width=device-width, initial-scale=1.0"),
				),
				html.TitleEl(gomponents.Text(title)),
				html.Link(
					html.Rel("stylesheet"),
					html.Href(stylesheet),
				),
				html.Link(html.Rel("icon"), html.Href(favicon), html.Type("image/x-icon")),
			),
			html.Body(
				html.Input(
					html.Type("checkbox"),
					html.ID("dark-mode"),
					html.Class("dark-mode-checkbox"),
					gomponents.Attr("hidden", ""),
				),
				html.Div(
					html.Class("container"),
					html.Header(
						html.Table(
							html.Width("100%"),
							html.Class("nav"),
							html.Tr(
								html.Td(
									html.Width("18%"),
									gomponents.Attr("align", "left"),
									html.A(
										html.Href("#"),
										gomponents.Text("Home"),
									),
								),
								html.Td(
									html.Width("32%"),
									gomponents.Attr("align", "center"),
									html.A(
										html.Href("#projects"),
										gomponents.Text("Projects"),
									),
								),
								html.Td(
									html.Width("28%"),
									gomponents.Attr("align", "center"),
									html.A(
										html.Href("#archive"),
										gomponents.Text("Archive"),
									),
								),
								html.Td(
									html.Width("22%"),
									gomponents.Attr("align", "right"),
									html.Label(
										html.For("dark-mode"),
										html.TitleAttr("Toggle light mode (if supported)"),
										html.Class("page-button"),
										gomponents.Text("Theme"),
									),
								),
							),
						),
					),
					html.Div(
						html.Class("content"),
						PagesContent(aboutPage, projectPages, blogPages),
					),
				),
			),
		),
	)
}

func ParsePage(fsys fs.FS, path string) (page Page, err error) {
	b, err := fs.ReadFile(fsys, path)
	if err != nil {
		return
	}

	var buf bytes.Buffer
	context := parser.NewContext()
	if err = markdownConverter.Convert(b, &buf, parser.WithContext(context)); err != nil {
		return
	}

	metaData := meta.Get(context)
	title, ok := metaData["title"].(string)
	if !ok {
		title = "no title..."
	}
	slug, ok := metaData["slug"].(string)
	if !ok {
		slug = fmt.Sprint(time.Now().UnixNano())
	}

	date, ok := metaData["date"].(string)
	if !ok {
		date = time.Now().Format(time.RFC3339)
	}
	dateT, err := time.Parse(time.RFC3339, date)
	if err != nil {
		return
	}

	page.Content = buf.String()
	page.Title = title
	page.Slug = slug
	page.Date = dateT

	return
}

func ParsePages(fsys fs.FS, dir string) (pages []Page, err error) {
	files, err := fs.ReadDir(fsys, dir)
	if err != nil {
		return
	}

	for _, entry := range files {
		page, subErr := ParsePage(fsys, filepath.Join(dir, entry.Name()))
		if subErr != nil {
			err = subErr
			return
		}
		pages = append(pages, page)
	}

	slices.SortFunc(pages, func(a, b Page) int {
		return b.Date.Compare(a.Date)
	})

	return
}

func loadContent(fsys fs.FS) (err error) {
	blogPages, err = ParsePages(fsys, blogDir)
	if err != nil {
		return
	}

	projectPages, err = ParsePages(fsys, projectDir)
	if err != nil {
		return
	}

	aboutPage, err = ParsePage(fsys, aboutFile)
	if err != nil {
		return
	}

	stylesheetContent, err = fs.ReadFile(fsys, stylesheet)
	if err != nil {
		return
	}

	faviconContent, err = fs.ReadFile(fsys, favicon)
	if err != nil {
		return
	}

	return
}

func newPreProcessor(m map[string]HighlightingMap) *preProcessor {
	return &preProcessor{
		highlightingMap: m,
	}
}

func (p *preProcessor) processLines(lines []string) (result []string, err error) {
	for _, line := range lines {
		switch {
		case strings.Contains(line, "<pre><code"):
			err = p.startPre(line)
			if err != nil {
				return
			}
		case strings.Contains(line, "</code></pre>"):
			pre, subErr := p.endPre()
			if subErr != nil {
				err = subErr
				return
			}
			result = append(result, pre)
		case p.inPre:
			err = p.addToPre(line)
			if err != nil {
				return
			}
		default:
			result = append(result, line)
		}
	}
	return
}

func (p *preProcessor) startPre(line string) (err error) {
	p.inPre = true
	p.class = "language-none"

	var matches []string
	var classIndex, preIndex, contentIndex int

	if preWithClassRegex.MatchString(line) {
		matches = preWithClassRegex.FindStringSubmatch(line)
		classIndex = preWithClassRegex.SubexpIndex("class")
		preIndex = preWithClassRegex.SubexpIndex("pre")
		contentIndex = preWithClassRegex.SubexpIndex("content")
	} else if preWithNoClassRegex.MatchString(line) {
		matches = preWithNoClassRegex.FindStringSubmatch(line)
		preIndex = preWithNoClassRegex.SubexpIndex("pre")
		contentIndex = preWithNoClassRegex.SubexpIndex("content")
	}

	if len(matches) == 0 {
		return fmt.Errorf("line '%s' does not contain a <pre>", line)
	}

	if classIndex > 0 && matches[classIndex] != "" {
		p.class = matches[classIndex]
	}

	_, err = p.buffer.WriteString(fmt.Sprintf("<div class=\"pre\">%v", matches[preIndex]))
	if err != nil {
		return
	}

	if len(matches) > contentIndex && matches[contentIndex] != "" {
		err = p.addToPre(matches[contentIndex])
	}

	return
}

func (p *preProcessor) endPre() (pre string, err error) {
	p.inPre = false
	_, err = p.buffer.WriteString("</code></pre></div>")
	if err != nil {
		return
	}

	pre = p.buffer.String()
	p.buffer.Reset()

	return
}

func (p *preProcessor) addToPre(line string) (err error) {
	if p.class == "" || line == "" {
		_, err = p.buffer.WriteString(fmt.Sprintf("%v\n", line))
		return
	} else {
		tokens := p.findTokens(line)
		cssStyle, subErr := p.convertToCSS(tokens)
		if subErr != nil {
			err = subErr
			return
		}
		_, err = p.buffer.WriteString(fmt.Sprintf("<span style=\"background: %v; -webkit-background-clip: text\">%v</span>\n", cssStyle, line))
		return
	}
}

func (p *preProcessor) findTokens(line string) (tokens string) {
	tokens = strings.Repeat("0", len(line))

	keys := maps.Keys(p.highlightingMap[p.class])
	slices.Sort(keys)
	for _, key := range keys {
		codePair := p.highlightingMap[p.class][key]
		line = html2.UnescapeString(line)

		loc := codePair.Regex.FindStringSubmatchIndex(line)
		for startIndex := 0; loc != nil; {
			capturedStart, capturedEnd := loc[2], loc[3]

			replace := strings.Repeat(codePair.Code, capturedEnd-capturedStart)
			tokens = tokens[:capturedStart+startIndex] + replace + tokens[capturedEnd+startIndex:]

			startIndex += loc[1]
			loc = codePair.Regex.FindStringSubmatchIndex(line[startIndex:])
		}
	}

	return
}

func (p *preProcessor) convertToCSS(line string) (css string, err error) {
	var cssBuilder strings.Builder
	_, err = cssBuilder.WriteString("linear-gradient(to right, ")
	if err != nil {
		return
	}

	previousChar := rune(0)
	previousColour := "white"

	for i, char := range line {
		if char != previousChar {
			colour := "white"
			if char != '0' {
				if c, ok := p.highlightingMap[p.class][char]; ok {
					colour = c.Colour
				}
			}

			_, err = cssBuilder.WriteString(fmt.Sprintf("%s %dch, %s %dch, ", previousColour, i, colour, i))
			if err != nil {
				return
			}

			previousChar = char
			previousColour = colour
		}
	}

	_, err = cssBuilder.WriteString("white 300ch)")
	if err != nil {
		return
	}

	css = cssBuilder.String()
	return
}

func main() {
	var port, host string

	serve := flag.Bool("serve", false, "Serve the content on a web server")
	staticDir := flag.String("static", "", "Save the content as static files in a directory")
	flag.StringVar(&port, "port", "8080", "Port to serve on")
	flag.StringVar(&port, "p", "8080", "Port to serve on")
	flag.StringVar(&host, "host", "localhost", "Host to serve on")
	flag.StringVar(&host, "h", "localhost", "Host to serve on")

	flag.Parse()

	if err := loadContent(embedFS); err != nil {
		fmt.Println("Error parsing content:", err.Error())
		return
	}

	content := WebsiteContent("joshj.dev", aboutPage, projectPages, blogPages)

	if *serve {
		http.Handle(fmt.Sprintf("/%v", favicon), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "image/x-icon")
			w.Write(faviconContent)
		}))

		http.Handle(fmt.Sprintf("/%v", stylesheet), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/css")
			w.Write(stylesheetContent)
		}))

		http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			content.Render(w)
		}))

		fmt.Printf("Serving content on http://%v:%v\n", host, port)
		_ = http.ListenAndServe(fmt.Sprintf("%v:%v", host, port), nil)
	} else if *staticDir != "" {
		err := os.MkdirAll(filepath.Join(*staticDir, "static"), os.ModePerm)
		if err != nil {
			fmt.Println("Error creating directory:", err.Error())
			return
		}

		err = os.WriteFile(filepath.Join(*staticDir, stylesheet), stylesheetContent, 0644)
		if err != nil {
			fmt.Println("Error writing stylesheet:", err.Error())
			return
		}

		err = os.WriteFile(filepath.Join(*staticDir, favicon), faviconContent, 0644)
		if err != nil {
			fmt.Println("Error writing favicon:", err.Error())
			return
		}

		err = os.WriteFile(filepath.Join(*staticDir, "index.html"), []byte(fmt.Sprint(content)), 0644)
		if err != nil {
			fmt.Println("Error writing index:", err.Error())
			return
		}
		fmt.Printf("Saved content to %v\n", *staticDir)
	} else {
		fmt.Println("Please specify either --serve or --static <DIRECTORY>")
	}
}
