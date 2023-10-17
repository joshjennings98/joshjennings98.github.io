#!/bin/awk -f

function populate_html() {
    if (i in regex) {
        delete regex[i]
        delete val[i]
        delete code[i]
    }
    
    regex[1] = "<([a-zA-Z1-6]+)( |>)"
    val[1] = "#f92672"
    code[1] = "A"

    regex[2] = "([a-zA-Z-]+)="
    val[2] = "#66d9ef"
    code[2] = "B"

    regex[3] = "\"([^\"]*)\""
    val[3] = "#ae81ff"
    code[3] = "C"

    regex[4] = "/>"
    val[4] = "#f92672"
    code[4] = "D"
    
    regex[5] = "</.*>"
    val[5] = "#f92672"
    code[5] = "A"
}

function populate_css() {
    if (i in regex) {
        delete regex[i]
        delete val[i]
        delete code[i]
    }
    
    regex[1] = "(#[a-zA-Z0-9_-]+|\\.[a-zA-Z0-9_-]+|[a-zA-Z]+) " # Selectors
    val[1] = "#66d9ef"
    code[1] = "A"

    regex[2] = "([a-zA-Z-]+)(:)" # Properties
    val[2] = "#a6e22e"
    code[2] = "B"

    regex[3] = ": ([^;]*);"; # Values
    val[3] = "#ae81ff"
    code[3] = "C"

    regex[4] = "(\/\*.*?\*\/)" # Comments
    val[4] = "lightgrey"
    code[4] = "D"

    regex[5] = "(!important)" # !important
    val[5] = "#f92672"
    code[5] = "E"

    regex[6] = "(:[a-zA-Z-]+)" # Pseudo-classes and Pseudo-elements
    val[6] = "#fd971f"
    code[6] = "F"

    regex[7] = "(@[a-zA-Z-]+)" # @media, @keyframes, etc.
    val[7] = "#78dce8"
    code[7] = "G"
}


function populate_fsharp() {
    if (i in regex) {
        delete regex[i]
        delete val[i]
        delete code[i]
    }
    
    regex[1] = "'(.*?)'"
    val[1] = "#FFD658"
    code[1] = "A"
    regex[2] = "[A-Za-z]*(([0-9]+\.[0-9]+)|([0-9]+)|([0-9]+))"
    val[2] = "#A7C"
    code[2] = "B"
    regex[3] = "((#.*)|(\(\*.*\*\)))"
    val[3] = "lightgrey"
    code[3] = "C"
    regex[4] = "( |^)(let|let!|use|use!|do|and|assert|base|begin|class|default|delegate|downcast|downto|elif|else|exception|extern|false|finally|for|fun|function|if|in|inherit|inline|interface|lazy|match|member|module|mutable|namespace|new|null|of|open|or|override|private|public|rec|return|select|static|struct|then|to|rec|true|try|type|upcast|val|void|when|while|with|yield|yield!) "
    val[4] = "#78dce8"
    code[4] = "D"
    regex[5] = "( |^)(unit|int|bool|string|float|double|char|byte|sbyte|int16|int32|int64|uint16|uint32|uint64|decimal|bigint|array|list|seq|option|async)"
    val[5] = "#fd971f"
    code[5] = "E"
    regex[6] = "(:\?>|:?=|->|\.\.|::|:|\?\?|\+\+|--|\+=|-=|\*=|/=|%=|&=|\|=|\^=|<<=|>>=|&&|\|\||\||&|\^|<|<=|>|>=|==|!=|<<<|>>>|@)"
    val[6] = "#f92672"
    code[6] = "F"
    regex[7] = "(printfn?|sprintf|fprintf|System\.Collections\.Generic|System\.Text|System\.IO|System\.Linq|System\.Net|System\.Random)"
    val[7] = "#fd971f"
    code[7] = "G"
    regex[8] = "([A-Za-z0-9]*)(?=\()"
    val[8] = "#a6e22e"
    code[8] = "H"
    regex[9] = "(fun|Array|List|Seq|String|Char|Int|Math|Dictionary|HashSet|Queue|Stack|Set)"
    val[9] = "#7E7"
    code[9] = "I"
    regex[10] = "( |^)(try|with|match|when|yield|return|let|do|and|or|not) "
    val[10] = "#66d9ef"
    code[10] = "J"
}

BEGIN {
    in_pre = 0
    FONT_SIZE=14
    LINE_HEIGHT=1.6
}

function unEscapeHTML(content) {
    gsub(/&gt;/, ">", content)   
    gsub(/&lt;/, "<", content)    
    gsub(/&quot;/, "\"", content)
    gsub(/&amp;/, "&", content)
    return content
}

function find_tokens(line) {
    tokens = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    for (i in regex) {
    	line = unEscapeHTML(line)
        while(match(line, regex[i])) {
            # Replace match in tokens with code[i]. e.g. '0000' + 'if  ' becomes 'II00'
            replace = ""
    	    for(j = 1; j <= RLENGTH; j++) replace = replace code[i] 	    
    	    tokens = sprintf("%s%s%s", substr(tokens, 1, RSTART - 1), replace, substr(tokens, RSTART + RLENGTH))
    	    sub(regex[i], replace, line) # Get rid of match from line so it doesn't match again
    	    gsub(/0+$/, "", line)
    	    if (maxLen < length(line)) 
    	    	maxLen = length(line)
        }

    }
    return tokens
}

function convert_to_css(line) {
    rtn_string = "linear-gradient(to right, "
    previous_char = ""
    previous_colour = "white"
    n = length(line)
    for(i=1; i<=n; i++) {
        char = substr(line, i, 1)
        if(char != previous_char) {
            if(char == "0") {
                rtn_string = sprintf("%s%s %sch, white %sch, ", rtn_string, previous_colour, i-1, i-1)
                previous_char = "0"
                previous_colour = "white"
            } else {
                for(c in code) {
                    if(char == code[c]) {
                        rtn_string = rtn_string previous_colour " " i-1 "ch, " val[c] " " i-1 "ch, "
                        previous_char = char
                        previous_colour = val[c]
                    }
                }
            }
        }
    }
    rtn_string = rtn_string "white 300ch)"
    return rtn_string
}

{
    if ($0 ~ /<pre/) {
        if (index($0, "<pre class=") > 0) {
            tagStart = index($0, "\"") + 1; 
            restOfLine = substr($0, tagStart);
            tagEnd = index(restOfLine, "\"");  
            class = substr(restOfLine, 1, tagEnd - 1); 
            
            if (class == "code-fsharp") 
                populate_fsharp()
            else if (class == "code-html") 
                populate_html()
            else if (class == "code-css") 
                populate_css()
            
            in_pre = 1
            y = 1
            content = "<pre>"  # Reset pre_content for each <pre> tag
            css_string = ""
            background_size = ""
            maxLen = 0
        } else {
            in_pre = 1
            content = "<pre style=\"color: white\">"
            class = ""
            next
        }
    } else if ($0 ~ /<\/pre>/) {
        in_pre = 0
	    final_string = "<div class=\"preOuter\">\n" content "</pre></div>"
	    print final_string
    } else if (in_pre) {
        if (class == "") {
            content = content $0 "\n"
        } else {
            content = content "<span style=\"background: "  convert_to_css(find_tokens($0)) "; -webkit-background-clip: text\">" $0 "</span>\n"
        }
    } else {
        print $0
    }
}
