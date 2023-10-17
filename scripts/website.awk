#!/bin/awk -f

# Define Regular Expressions for different markdown elements and start HTML document
BEGIN {
    TAB_WIDTH=2
    regex_code = "`[^`]*`"
    regex_bold = "\\*\\*[^*]*\\*\\*"
    regex_strike = "~~[^~]*~~"
    regex_italic = "\\*[^*]*\\*"
    regex_link = "\\[([^\\]]*)\\]\\(([^\\)]*)\\)"
    regex_img = "!\\[([^\\]]*)\\]\\(([^\\)]*)\\)"
    regex_all = regex_code "|" regex_bold "|" regex_strike "|" regex_italic "|" regex_link "|" regex_img
    regex_table_line = "^ *\\| *[-:]+ *(\\| *[-:]+ *)+\\| *$"

    print "<!DOCTYPE html>"
    print "<html lang=\"en\">"
    print "<head>"
    print "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    print "<title>joshj.dev</title>"
    print "<link rel=\"stylesheet\" href=\"src/website.css\">"
    print "</head>"
    print "<body>"
    print "<input id=\"dark-mode\" class=\"dark-mode-checkbox\" hidden type=\"checkbox\">"
    print "<div class=\"container\">"
    print "<nav>"
    print "<input type=\"checkbox\" id=\"drop\">"
    print "<label for=\"drop\" class=\"toggle\" id=\"menu\"><span id=\"menu-content\">Menu</span></label>"
    print "<div class=\"nav-content\">"
    print "<ul class=\"menu\">"
    print "<li><a href=\"#\">Home</a></li>"
    print "<li>"
    print "<input type=\"checkbox\" id=\"drop-1\">"
    print "<label for=\"drop-1\" class=\"toggle\"><a href=\"#projects\">Projects</a></label>"
    print "<ul>"
    for (i = 1; i < ARGC; i++) { # Save the files passed into an associative array
        getline first_line < ARGV[i]
        first_lines[ARGV[i]] = first_line
        sub(/^#+ /, "", first_lines[ARGV[i]])
        
        printf "<li><a href=\"#%s\">%s</a></li>\n", titleLink(ARGV[i]), first_lines[ARGV[i]] 
    }
    print "</ul>"
    print "</li>"
    print "<li><a href=\"CV-Josh-Jennings.html\" target=\"_blank\">CV</a></li>"
    print "<li><label for=\"dark-mode\" title=\"Toggle light mode (if supported)\" class=\"page-button\">Theme</label></li>"
    print "</div>"
    print "</nav>"
    print "<section class=\"content\">"
    print "<section class=\"header\">"
    print "{{ JOSH SVG }}"
    print "</section>"
    print "<div class=\"content2\">"
    print "<div class=\"page\" id=\"projects\">"
    print "<div class=\"page-header\">"
    print "<h2>Projects</h2>"
    print "<p>"
    print "This page provides links to some of the projects I have worked on and written up. They are mostly dumb but I had fun making them:"
    print "</p>"
    print "<ul>"
    for (i in first_lines) {
        printf "<li><a href=\"#%s\">%s</a></li>\n", titleLink(i), first_lines[i] 
    }
    print "</ul>"
    print "<p>More projects can be found on my <a href=\"https://github.com/joshjennings98\">GitHub page</a>.</p>"
    print "</div>"
    print "<div class=\"bottom\"></div></div>"
    print "<div class=\"page\" id=\"website\">"
    print "<div class=\"page-header\">"
    print "<h2>This Website</h2>"
    print "</div>"
}

# Replace markdown inline syntax with corresponding HTML tags
function replaceInlineSyntax(line) {
    while (match(line, regex_all)) {
        matched = substr(line, RSTART, RLENGTH)
        pre = substr(line, 1, RSTART - 1)
        post = substr(line, RSTART + RLENGTH)
        if (match(matched, regex_link)) {
            split(matched, arr, /[\[\]\(\)]/)
            line = sprintf("%s<a href=\"%s\">%s</a>%s", pre, arr[4], arr[2], post)
        } else if (match(matched, regex_code)) {
            code = substr(matched, 2, length(matched) - 2)
            line = sprintf("%s<code>%s</code>%s", pre, code, post)
        } else if (match(matched, regex_bold)) {
            bold = substr(matched, 3, length(matched) - 4)
            line = sprintf("%s<b>%s</b>%s", pre, bold, post)
        } else if (match(matched, regex_strike)) {
            strike = substr(matched, 3, length(matched) - 4)
            line = sprintf("%s<s>%s</s>%s", pre, strike, post)
        } else if (match(matched, regex_italic)) {
            italic = substr(matched, 2, length(matched) - 2)
            line = sprintf("%s<i>%s</i>%s", pre, italic, post)
        } else if (match(matched, regex_img)) {
            split(matched, arr, /!\[|\]|\(|\)/)
            line = sprintf("%s<img src=\"%s\" alt=\"%s\">%s", pre, arr[3], arr[2], post)
        }
    }
    gsub(/^ +| +$/, "", line) # Remove leading and trailing spaces
    gsub(/ +/, " ", line) # Replace multiple spaces with a single space
    return line
}

# Ensure HTML tags within a code block are not rendered as HTML
function escapeHTML(content) {
    gsub(/&/, "\&amp;", content)
    gsub(/</, "\&lt;", content)
    gsub(/>/, "\&gt;", content)
    gsub(/"/, "\&quot;", content)
    gsub(/'/, "\&#039;", content)
    return content
}

# Close tags until the list_types is at the correct level
function close_lists(to_level) {
    while (list_level > to_level) {
        printf "</%s>\n", list_types[list_level]
        delete list_types[list_level--]
    }
}

# Create a consistent title link from a filepath
function titleLink(inputPath) {
    n = split(inputPath, parts, "/")
    file = tolower(parts[n])
    sub(/\.[^.]+$/, "", file)
    gsub(/[^a-z0-9_-]/, "", file)
    gsub(/^_/, "", file)
    return file
}

# Matches every line, used to add header when reading a new file
{
    if (FILENAME != prevFile && NR != 1) {
        printf "<div class=\"bottom\"><a href=\"#%s\">Back to top.</a></div>", titleLink(prevFile)
        print "</div>"
        printf "<div class=\"page\" id=\"%s\">", titleLink(FILENAME)
        print "<div class=\"page-header\">"
        printf "<h2>%s</h2>", first_lines[FILENAME]
        print "</div>"
    }
    prevFile = FILENAME
}

# Matches lines starting with '#', converts them to HTML heading tags
/^#+ / {
    if (in_table) next
    if (in_code_block) next
    close_lists(0)
    level = index($0, " ")
    if (level == 2) next # Skip single # as it is used for the header (2 because '# ')
    tag_content = substr($0, level)
    printf "<h%d>%s</h%d>\n", level, replaceInlineSyntax(tag_content), level
    next
}

# Matches lines starting with '```', toggles code block mode
/^```/ {
    if (in_table) next
    if (in_code_block) {
        print "</code></pre>"
        in_code_block = 0
    } else {
        close_lists(0)
        class = ""
        if (match($0, /^```([^ \n]*)/)) { # If language specified
            lang = substr($0, RSTART + 3, RLENGTH - 3)
            class = lang ? sprintf(" class=\"code-%s\"", lang) : ""
        }
        printf "<pre%s><code>\n", class
        in_code_block = 1
    }
    next
}

# Matches lines starting with either number or '*' or '-', converts them to HTML list items
/^ *([0-9]+\.|[*-]) / {
    if (in_table) next
    if (in_code_block) next
    match($0, /^ */) # Set RSTART, RLENGTH etc.
    indent = RLENGTH
    level = indent / TAB_WIDTH + 1
    type = (substr($0, RSTART + RLENGTH, 1) ~ /[0-9]+/) ? "ol" : "ul"
    item = substr($0, RSTART + RLENGTH + 2)
    gsub(/^ +| +$/, "", item)
    close_lists(level)
    # Open a new tag if the type is different or the level has increased
    if (list_level < level || (list_level > 0 && list_types[list_level] != type)) {
        list_types[++list_level] = type
        printf "<%s>\n", type
    }
    printf "<li>%s</li>\n", replaceInlineSyntax(item)
    next
}

# Matches lines starting with '>', converts them to HTML blockquote tags
/^>/ {
    if (in_table) next
    if (in_code_block) next
    if (!in_blockquote) {
        print "<blockquote>"
        in_blockquote = 1
    }
    printf "%s<br>\n", replaceInlineSyntax(substr($0, 3))
    next
}

# Closes blockquote tag if not in blockquote
!/^>/ {
    if (in_blockquote) {
        print "</blockquote>"
        in_blockquote = 0
    }
}

# Matches lines starting with '|', which are potentially table lines.
/^\|/ {
    if (in_code_block) next
    if (!in_table) {
        print "<table>"
        in_table = 1
        is_header = 1
    }
    if ($0 ~ regex_table_line) next
    gsub(/ \| /, is_header ? "</th><th>" : "</td><td>")
    gsub(/^\| /, is_header ? "<tr><th>" : "<tr><td>")
    gsub(/ \|$/, is_header ? "</th></tr>" : "</td></tr>")
    n = split($0, cells, is_header ? "</th><th>" : "</td><td>")
    line = replaceInlineSyntax(cells[1])
    for (i = 2; i <= n; i++) line = line (is_header ? "</th><th>" : "</td><td>") replaceInlineSyntax(cells[i])
    print line
    if (is_header) is_header = 0
    next
}

# Closes table tag if not in table
!/^\|/ {
    if (in_table) {
        print "</table>"
        in_table = 0
    }
}

# Matches non-empty lines (lines where NF != 0), handle paragraphs
NF {
    if (in_code_block) {
        printf "%s\n", escapeHTML($0)
    } else {
        close_lists(0)
        printf "<p>%s</p>\n", replaceInlineSyntax($0)
    }
}

# Closes any opened tags and ends the HTML document
END {
    if (in_code_block) print "</code></pre>"
    if (in_table) print "</table>"
    close_lists(0)
    printf "<div class=\"bottom\"><a href=\"#%s\">Back to top.</a></div>", titleLink(FILENAME)
    print "</div>"
    print "<div class=\"homepage page\" id=\"homepage\">"
    print "<h2>About Me</h2>"
    print "<p>My name is Josh Jennings and I'm a backend software engineer at Arm. I work in the Online Tools Group where I help develop and maintain <a href=\"https://www.keil.arm.com/\">keil.arm.com</a> as well as the backend services that power the <a href=\"https://studio.keil.arm.com/\">Keil Studio Cloud</a> online IDE for embedded developers. My areas of expertise are in backend web development using Go and Python as well as the use of Kubernetes in orchestrating scalable cloud services.</p>"
    print "<ul>"
    print "<li>My GitHub is available <a href=\"https://github.com/joshjennings98\">here</a>.</li>"
    print "<li>My LinkedIn is available <a href=\"https://www.linkedin.com/in/josh-jennings-41a17213a/\">here</a>.</li>"
    print "<li>A copy of my CV is available <a href=\"CV-Josh-Jennings.html\">here</a>.</li>"
    print "<li>I can be contacted via <a href=\"mailto:josh@joshj.dev\">email</a>.</li>"
    print "</ul>"
    print "<p>This website is where I document my (mostly dumb) projects. It was made with no JavaScript, only HTML and CSS (you can read more about that <a href=\"#website\">here</a>). You can toggle the theme between dark and light using the <label for=\"dark-mode\" title=\"Toggle dark mode (if supported)\" class=\"page-button\"><u>Theme</u></label> button in the top left corner. This website is also single page, elements are hidden based on CSS rules. You can view the other pages at the links<span class=\"big\">&nbsp;on the left</span><span class=\"small\">&nbsp;at the top</span>.</p>"
    print "</div>"
    print "</div>"
    print "</section>"
    print "<section class=\"lighth\">"
    print "<section class=\"lightv\"></section>"
    print "</section>"
    print "</div>"
    print "</body>"
    print "</html>"
}
