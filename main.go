package main

import (
	"bufio"
	"bytes"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"
	"unicode"
)

type Page struct {
	Title      string
	Paragraphs []string
}

type Website struct {
	Name  string
	Pages []Page
}

type Image struct {
	Url string
	Alt string
}

//go:embed templates/index.html.tmpl templates/404.html.tmpl
var templates embed.FS

const (
	templateIndexPath = "templates/index.html.tmpl"
	template404Path   = "templates/404.html.tmpl"
	imageTemplate     = `<div class="image-outer-wrapper">
					<div class="image-inner-wrapper">
						<img class="image" src="{{ .Url }}" title="{{ .Alt }}" />
					</div>
				</div>`
)

var (
	imageRegex       = regexp.MustCompile(`^!\[(?P<url>[^]]*)]\((?P<alt>[^)]*)\)$`)
	headerRegex      = regexp.MustCompile(`^(#{1,6})\s(.*)$`)
	codeBlockRegex   = regexp.MustCompile("```([a-z]*)\n([^`]+)```")
	linkRegex        = regexp.MustCompile(`\[(.*?)\]\((.*?)\)`)
	inlineCodeRegex  = regexp.MustCompile("`([^`]*)`")
	codeStartRegex   = regexp.MustCompile("^```.*")
	headerStartRegex = regexp.MustCompile(`^\s*#{1,}`)

	compiledImageTemplate = template.Must(template.New("image").Parse(imageTemplate))
)

var funcMap = map[string]any{
	"parseContent": parseContent,
	"slugify":      slugify,
}

func parseContent(line string) string {
	if matches := imageRegex.FindStringSubmatch(line); matches != nil {
		url := matches[1]
		alt := matches[2]

		var b bytes.Buffer
		err := compiledImageTemplate.Execute(&b, Image{url, alt})
		if err != nil {
			log.Fatalf("Expected image but failed to execute template: %v", err.Error())
		}

		return b.String()
	}

	if matches := headerRegex.FindStringSubmatch(line); matches != nil {
		level := len(matches[1])
		title := strings.TrimSpace(matches[2])

		return fmt.Sprintf("<h%d>%s</h%d>", level, title, level)
	}

	if strings.HasPrefix(line, "* ") {
		return fmt.Sprintf("<ul><li>%s</li></ul>", strings.Join(strings.Split(line, "*")[1:], "</li>\n<li>"))
	}

	if matches := codeBlockRegex.FindStringSubmatch(line); matches != nil {
		lang := matches[1]
		code := matches[2]
		code = strings.ReplaceAll(strings.ReplaceAll(code, "<", "&lt;"), ">", "&gt;")

		return fmt.Sprintf("<pre class=\"%scode\" title=\"%s\">%s</pre>", lang, lang, code)
	}

	cleanedLinks := linkRegex.ReplaceAllStringFunc(line, func(str string) string {
		match := linkRegex.FindStringSubmatch(str)
		return fmt.Sprintf("<a href=\"%s\">%s</a>", match[2], match[1])
	})

	cleanedAll := inlineCodeRegex.ReplaceAllStringFunc(cleanedLinks, func(str string) string {
		match := inlineCodeRegex.FindStringSubmatch(str)
		return fmt.Sprintf("<code>%s</code>", match[1])
	})

	return fmt.Sprintf("<p>%s</p>", cleanedAll)
}

func slugify(s string) string {
	result := make([]rune, 0, len(s))
	for _, r := range strings.ToLower(s) {
		if unicode.IsPunct(r) {
			continue
		}
		if unicode.IsSpace(r) && result[len(result)-1] == '-' {
			continue
		} else if unicode.IsSpace(r) {
			result = append(result, '-')
		} else {
			result = append(result, r)
		}
	}

	return string(result)
}

func readMarkdown(input string) (page Page, err error) {
	file, err := os.Open(input)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	inCodeBlock := false
	var block strings.Builder
	var pageTitle string
	var lineList []string
	var prevLine string
	for scanner.Scan() {
		line := scanner.Text()

		if inCodeBlock {
			block.WriteString(fmt.Sprintf("%s\n", line))

			codeEnd := codeStartRegex.MatchString(line)
			listEnd := !strings.HasPrefix(line, "* ") && strings.HasPrefix(prevLine, "* ")
			if codeEnd || listEnd {
				inCodeBlock = false
				lineList = append(lineList, block.String())
				block.Reset()
			}
		} else {
			codeStart := codeStartRegex.MatchString(line)
			listStart := strings.HasPrefix(line, "* ")
			if codeStart || listStart {
				inCodeBlock = true
				block.WriteString(fmt.Sprintf("%s\n", line))
			} else {
				if pageTitle == "" && strings.HasPrefix(line, "#") {
					pageTitle = strings.TrimSpace(headerStartRegex.ReplaceAllString(line, ""))
				} else {
					lineList = append(lineList, line)
				}
			}
		}
		prevLine = line
	}

	err = scanner.Err()
	if err != nil {
		return
	}

	page.Title = pageTitle
	page.Paragraphs = lineList

	return
}

func parseMarkdown(inputDir string) (pages []Page, err error) {
	// TODO: This Website, Birthday Bot 3000, Gameboy Emulator, Brainfuck Anywhere, Rapberry Pi K8s, F# Neural Network
	err = filepath.Walk(inputDir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && filepath.Ext(path) == ".md" {
			log.Printf("Generating page for %q", path)
			page, err := readMarkdown(path)
			if err != nil {
				return err
			}
			pages = append(pages, page)
		}
		return nil
	})

	return
}

func renderTemplate(inputPath, outputPath string, data *Website) error {
	inputTemplate, err := template.New(filepath.Base(inputPath)).Funcs(funcMap).ParseFS(templates, inputPath)
	if err != nil {
		return fmt.Errorf("failed to read template: %v", err.Error())
	}

	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to write file: %v", err.Error())
	}
	defer file.Close()

	err = inputTemplate.Execute(file, data)
	if err != nil {
		return fmt.Errorf("failed to execute index template: %v", err.Error())
	}

	return nil
}

func generateWebsite(inputPath, outputPath string) error {
	pages, err := parseMarkdown(inputPath)
	if err != nil {
		return fmt.Errorf("could not parse markdown in %q: %v", inputPath, err.Error())
	}

	data := Website{
		Name:  "Josh's Website",
		Pages: pages,
	}

	outputIndex := filepath.Join(outputPath, "index.html")
	output404 := filepath.Join(outputPath, "404.html")

	err = renderTemplate(templateIndexPath, outputIndex, &data)
	if err != nil {
		return err
	}

	return renderTemplate(template404Path, output404, &data)
}

func main() {
	var outputPath, inputPath string
	flag.StringVar(&inputPath, "input", "./markdown/", "path to input markdown files")
	flag.StringVar(&outputPath, "output", ".", "path to dir in which to output html files")
	flag.Parse()

	err := generateWebsite(inputPath, outputPath)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Successfully generated website at %q", outputPath)
}