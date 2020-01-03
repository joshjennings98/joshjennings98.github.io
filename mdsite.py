page1 = """test 1
# Test Page 1

## Test


1. tttt
2. bsbsbs

test test test
"""

page2 = """testnot2
# Test Page 2

## Test Test

![I'm an imasdasdsaaage](https://www.image.com/imageasaaaaas.png)

thsjj hdnd **test test test** skkd
d
*test 1 test 1 `magic` test 1*
sjjsjs jsjsh **djdjjs** djej

*f*

***x***

### tititit
thia ia a adhdhd
- test point 1
- test pouny 2

v


testtsg
[I'm an inline-style link](https://www.google.com)
aafggg
[I'm an inline-style link2](https://www.google.co.uk)

h

![I'm an image](https://www.image.com/images.png)

*m*
"""

pages = [
    page1,
    page2
]

def parse(tokens):
    allHTML = []

    for tokenised in tokens:
        token = tokenised[0]
        data = tokenised[1]

        if token == ("h", 1):
            html = "<h1>%s</h1>\n\n" % data
        elif token == ("h", 2):
            html = "<h2>%s</h2>\n\n" % data
        elif token == ("h", 3):
            html = "<h3>%s</h3>\n\n" % data
        elif token == ("h", 4):
            html = "<h4>%s</h4>\n\n" % data
        elif token == ("h", 5):
            html = "<h5>%s</h5>\n\n" % data
        else: # paragraph
            html = "<p>\n%s\n</p>\n\n" % data
        
        allHTML.append(html)
        
    return "".join(allHTML)

def tokenise(lines):
    tokens = []
    cFlag = False
    
    for line in lines:
        words = line.split(" ")

        header = words[0]
        data = "".join(list(map(lambda x: x + " ", words[1:])))
        

        if header == "#" and cFlag == False:
            token = (("h", 1), data[:-1])
        elif header == "##" and cFlag == False:
            token = (("h", 2), data[:-1])
        elif header == "###" and cFlag == False:
            token = (("h", 3), data[:-1])
        elif header == "####" and cFlag == False:
            token = (("h", 4), data[:-1])
        elif header == "#####" and cFlag == False:
            token = (("h", 5), data[:-1])
        else: # paragraph
            
            if header in "-*+" and cFlag == False:
                 token = (("p", "b"), (header + " " + data))
            elif header[:-1] + "." == header and int(header[:-1]) in range(1000) and cFlag == False:
                 token = (("p", "n"), (header + " " + data))
            elif header[:3] == "```":
                lang = "" if header == "```" else " <!--" + header[3:] + "--> "
                cFlag = not cFlag
                token = (("p", "c"), lang)
            else:
                 token = (("p", "none"), (header + " " + data))

        tokens.append(token)
    
    return tokens

def emphasis(lines):
    bold = False
    italics = False
    code = False # inline
    cFlag = False
    newLines = []
    gotURLs = []
    
    for num, line in enumerate(lines):
        newLine =[]
        if line[:5] == "<code":
            cFlag = True
        elif line[:6] == "</code>":
            cFlag = False
        
        words = line[1]
        i = 0
        while i < len(words) - 1:
        # Sort emphasis
            if words[i] == "*" and words[i+1] == "*":
                b = "<b>" if bold == False else "</b>"
                bold = not bold
                words = words[:i] + b + words[i+2:]
            if (words[i] != "*" or i == 0) and words[i+1] == "*" and (i+2 >= (len(words) - 1) or words[i+2] != "*"):
                it = "<i>" if italics == False else "</i>"
                italics = not italics
                words = words[:i+1] + it + words[i+2:]
            if (words[i] != "`" or i == 0) and words[i+1] == "`" and (i+2 >= (len(words) - 1) or words[i+2] != "`"):
                cd = "<code>" if code == False else "</code>"
                code = not code
                words = words[:i+1] + cd + words[i+2:]
            i += 1
        i = 0
        gotURL = (False, 0, 0, 0, "", num + 1)
        while i < len(words):
        # sort URLs and images
            flagU = "img"
            if words[i] == "[":
                if i == 0 or words[i - 1] != "!":
                    flagU = "a"
                j = 0
                while j < len(words[i:]):
                    if words[i] not in "qwertyuiopasdfghjklzxcvbnm./:% ()[]!": # need all valid url chars
                        i += j
                        break
                    if words[i+j] == "]" and words[i+j+1] == "(":
                        name = words[i+1:i+j]
                        gotURL = (False, i, i + j, 0, "", num + 1)
                        i += j
                        k = 0
                        while k < len(words[i:]):
                            if words[i+k] == ")":
                                url = words[i+2:i+k]
                                i += k
                                gotURL = (True, gotURL[1], gotURL[2], i, flagU, num + 1)
                                gotURLs.append(gotURL)
                                break 
                            i += 1
                        break
                    j += 1
            i += 1         


        # IT'S DOING IT MULTIPLE TIMES, WE ONLY WANT TO DO IT ON THE LAST ONE.
        # LOOK AT GOTURLS
        # USE THE FINAL NUMBER AS THE 'LINE' IN LINES AND ONLY CHANGE IN THOSE


        if gotURLs:
            charAdjustment = 0
            print("URLs:", gotURLs)    
            for i in range(len(gotURLs)):
                x = 0
                if gotURLs[i][4] == "img":
                    x = 1
                
                words = words[:gotURLs[i][1]+charAdjustment-x] + "<" + gotURLs[i][4] + " href=\"" + words[gotURLs[i][2]+charAdjustment+2:gotURLs[i][3]+charAdjustment] + "\">" + words[gotURLs[i][1]+charAdjustment+1:gotURLs[i][2]+charAdjustment] + "</" + gotURLs[i][4] + ">" + words[gotURLs[i][3]+1+charAdjustment:]
                charAdjustment = charAdjustment + 9 + 2 * len(gotURLs[i][4]) - x
        newLine = (lines[0], words)
        newLines.append(newLine)
    return newLines
    
   
def lexer(tokens):
    #print(tokens)
    newTokens =[]
    bFlag = 0
    cFlag = False
    i = 0
    
    while i < len(tokens):
        if str(tokens[i][0][1]) == "b":
            data = "<ul>\n<li>" + tokens[i][1][2:-1] + "</li>"
            bFlag = 1
        elif str(tokens[i][0][1]) == "n":
            data = "<ol>\n<li>" + tokens[i][1][3:-1] + "</li>"
            bFlag = 2
        else:
            data = tokens[i][1]
        incr = 1
        
        if tokens[i][0][0] in "p":
            for token in tokens[i+1:]:        
                if token[0][0] == "p":
                    if token[0][1] == "none":
                        if bFlag == 1:
                            data = data + "\n</ul>"
                            bFlag = 0
                        elif bFlag == 2:
                            data = data + "\n</ol>"
                        data = data + "\n" + token[1]
                        incr += 1
                    elif token[0][1] == "b":
                        if bFlag == 0:
                            bFlag = 1
                            data = data + "\n<ul>"
                        data = data + "\n<li>" + token[1][2:-1] + "</li>"
                        incr += 1
                    elif token[0][1] == "n":
                        if bFlag == 0:
                            bFlag = 2
                            data = data + "\n<ol>"
                        data = data + "\n<li>" + token[1][3:-1] + "</li>"
                        incr += 1
                    elif token[0][1][0] == "c":
                        cFlag = not cFlag
                        x = "" if cFlag else "/"
                        data = data + "\n<" + x + "code" + token[1] + ">"
                        incr += 1
                else:
                    break
        if bFlag == 1: # if page ends in bulletpoints, fix it
            data = data + "\n</ul>"
            
        newTokens.append((tokens[i][0], data))
        
        i += incr
    #print(newTokens)
    return newTokens

def toHTML(pages):
    html = []

    for page in pages:
        lines = page.split("\n")
        head = "<!DOCTYPE html>\n<html>\n<head>\n<title>%s</title>\n<script type=\"text/javascript\" id=\"MathJax-script\" async\n    src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js\">\n</script>\n</head>\n\n<body>\n\n" % lines[0]
        foot = "</body>\n</html>"
        lines = list(filter(lambda x: x != "", lines[1:]))
 # Ignore whitespace
        
        tokens = tokenise(lines)
        tokens = lexer(tokens)
        tokens = emphasis(tokens)
        
        #sortURLs(tokens)
        
        html.append(head + parse(tokens) + foot)

    return html
            
for page in toHTML(pages):
    print(page)
    
