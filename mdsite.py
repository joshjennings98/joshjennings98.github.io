import os
import glob

def sortMainTags(tokens):
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
        
    return allHTML

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

def sortEmphasis(lines):
    bold = False
    italics = False
    code = False # inline code
    cFlag = False
    newLines = []
    gotURLs = []
    
    for line in lines:
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
        
        newLine = (line[0], words)
        newLines.append(newLine)
        
    return newLines

def sortURLs(lines):
    newLines = []
    gotURLs = []
    
    for num, line in enumerate(lines):
        words = line[1]
        i = 0
        gotURL = (False, 0, 0, 0, "", num)
        while i < len(words):
        # sort URLs and images
            flagU = "img"
            if words[i] == "[":
                if i == 0 or words[i - 1] != "!":
                    flagU = "a"
                j = 0
                while j < len(words[i:]):
                    if words[i+j] == "]" and words[i+j+1] == "(":
                        name = words[i+1:i+j]
                        gotURL = (False, i, i + j, 0, "", num)
                        i += j
                        k = 0
                        while k < len(words[i:]):
                            if words[i+k] == ")":
                                url = words[i+2:i+k]
                                i += k
                                gotURL = (True, gotURL[1], gotURL[2], i, flagU, num)
                                gotURLs.append(gotURL)
                                break 
                            i += 1
                        break
                    j += 1
            i += 1         
      
        if gotURLs:
            charAdjustment = 0
            for i in range(len(gotURLs)):
                if gotURLs[i][5] == num:
                    x = 0
                    if gotURLs[i][4] == "img":
                        x = 1
                        words = words[:gotURLs[i][1]+charAdjustment-x] + "<" + gotURLs[i][4] + " src=\"" + words[gotURLs[i][2]+charAdjustment+2:gotURLs[i][3]+charAdjustment] + "\" alt=\"" + words[gotURLs[i][1]+charAdjustment+1:gotURLs[i][2]+charAdjustment] + "\">" + words[gotURLs[i][3]+1+charAdjustment:]
                    else:
                        words = words[:gotURLs[i][1]+charAdjustment-x] + "<" + gotURLs[i][4] + " href=\"" + words[gotURLs[i][2]+charAdjustment+2:gotURLs[i][3]+charAdjustment] + "\">" + words[gotURLs[i][1]+charAdjustment+1:gotURLs[i][2]+charAdjustment] + "</" + gotURLs[i][4] + ">" + words[gotURLs[i][3]+1+charAdjustment:]
                    charAdjustment = charAdjustment + 9 + 2 * len(gotURLs[i][4]) - x

        newLine = (line[0], words)
        newLines.append(newLine)

    return newLines
    
   
def sortInsideParagraphs(tokens):
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
                            bFlag = 0
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

    return newTokens

def getMetadata(lines):
    pageStart = 1
    i = 0 # while loop to find where page starts
    while i < len(lines):
        if lines[i] != "<start page>":
            pageStart += 1
        else:
            break
        i += 1
    title = lines[0]
    return (pageStart, title)

def toHTML(pages):
    html = []

    for page in pages:
        lines = page.split("\n")
        metadata = getMetadata(lines)
        head = "<!DOCTYPE html>\n<html>\n<head>\n<title>%s</title>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\">\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width\">\n<script type=\"text/javascript\" id=\"MathJax-script\" async\n    src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js\">\n</script>\n</head>\n\n<body>\n<main>\n\n" % metadata[1]
        foot = "</main>\n</body>\n</html>"
        lines = list(filter(lambda x: x != "", lines[metadata[0]:]))
        # Ignore whitespace
        
        tokens = tokenise(lines)
        tokens = sortInsideParagraphs(tokens)
        tokens = sortEmphasis(tokens)
        tokens = sortURLs(tokens)
        tokens = sortMainTags(tokens)
        
        html.append((head + "".join(tokens) + foot, metadata[1]))

    return html

def main():

    pages = []
    for filepath in glob.glob(os.path.join('_data/', '*.md')):
        with open(filepath) as f:
            pages.append(f.read())

    for page in toHTML(pages):
        title = page[1]
        html = page[0]

        # This will only work on linux, should probably change it
        os.system('mkdir -p _site')
        os.system('cp -f style.css _site')
        
        file = open("_site/" + title + ".html", "w")
        file.write(html)
        file.close

if __name__ == "__main__":
    main()

"""
To Do:

- Make work with links to other site pages
- Add header and footer stuff
- Make work with local images

"""
    
