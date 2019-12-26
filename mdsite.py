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

test test test
d
test 1 test 1 test 1

### tititit
thia ia a adhdhd
- test point 1
- test pouny 2

v

```
testtsg
ddddd

# habdb

h
```
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
    
    
def lexer(tokens):
    print(tokens)
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
    print(newTokens)
    return newTokens

def toHTML(pages):
    html = []

    for page in pages:
        lines = page.split("\n")
        head = "<!DOCTYPE html>\n<html>\n<head>\n<title>%s</title>\n</head>\n\n<body>\n\n" % lines[0]
        foot = "</body>\n</html>"
        lines = list(filter(lambda x: x != "", lines[1:]))
 # Ignore whitespace
        
        tokens = tokenise(lines)
        tokens = lexer(tokens)
        
        html.append(head + parse(tokens) + foot)

    return html
            
for page in toHTML(pages):
    print(page)
