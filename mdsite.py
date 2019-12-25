page1 = """test 1
# Test Page 1

## Test

test test test
"""

page2 = """testnot2
# Test Page 2

## Test Test

test test test
d
test 1 test 1 test 1
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

        if token == "h1":
            html = "<h1>%s</h1>\n\n" % data
        elif token == "h2":
            html = "<h2>%s</h2>\n\n" % data
        elif token == "h3":
            html = "<h3>%s</h3>\n\n" % data
        elif token == "h4":
            html = "<h4>%s</h4>\n\n" % data
        elif token == "h5":
            html = "<h5>%s</h5>\n\n" % data
        else: # paragraph
            html = "<p>\n%s\n</p>\n\n" % data
        
        allHTML.append(html)
        
    return "".join(allHTML)

def tokenise(lines):
    tokens = []
    
    for line in lines:
        words = line.split(" ")

        header = words[0]
        data = "".join(list(map(lambda x: x + " ", words[1:])))

        if header == "#":
            token = ("h1", data[:-1])
        elif header == "##":
            token = ("h2", data[:-1])
        elif header == "###":
            token = ("h3", data[:-1])
        elif header == "####":
            token = ("h4", data[:-1])
        elif header == "#####":
            token = ("h5", data[:-1])
        #elif header in "*-":
        #    token = ("b", data[:-1])
        else:
            token = ("p", (header + " " + data))

        tokens.append(token)

    return tokens
    

def lexer(tokens):
    newTokens = []
    i = 0

    while i < len(tokens):
        tokenType = tokens[i][0]
        incr = 1
        data = tokens[i][1]
        for token in tokens[i+1:]:
            if token[0] == tokenType:
                data = data + "\n" + token[1]
                incr += 1
            else:
                break
        newTokens.append((tokenType, data))
        i += incr

    return newTokens

def toHTML(pages):
    html = []

    for page in pages:
        lines = page.split("\n")
        title = "<title>%s</title>\n\n" % lines[0]
        lines = list(filter(lambda x: x != "", lines[1:])) # Ignore whitespace
        
        tokens = tokenise(lines)
        tokens = lexer(tokens)
        
        html.append(title + parse(tokens))

    return html
            
for page in toHTML(pages):
    print(page)

