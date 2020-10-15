from typing import List, Tuple
from datetime import datetime
import subprocess, os


def generateIntro(inputFile : str, outputFile : str) -> Tuple[str, datetime]:
    """
    For an input file `inputFile` create an introduction paragraph for the homepage
    based on the \<intro date=X\>\</intro\> tags and add a read more link to `outputFile`. Return
    the introduction and the date specified in the \<intro\> tag.
    """
    with open(inputFile, 'r') as f:

        line = f.readline()
        title = line.strip(" #\n")
        intro, isIntro = [], False

        while line:
            line = f.readline()
            stripped = line.strip()
            
            if isIntro and stripped != "</intro>":
                intro.append(stripped)
            
            if "<intro" in stripped:
                date = stripped.split('date=\"')[1][:-2]
                isIntro = True
            elif isIntro and stripped == "</intro>":
                break

        intro = [line for line in intro if line != '']
        image = intro[0].split("](")[1][:-1].replace('../', '')
    
    dateKey = datetime.strptime(date, '%d/%m/%Y')
    
    introParagraph = f"""
        <div class=\"fancyPositioning\">
        <div class=\"picture-left\"><img src=\"{image}\"></div>
        <div class=\"tleft\"><h3>{title}
        <div class=date>{dateKey.strftime("%a %d %b %Y")}</div></h3>
        <p>{intro[1]}<br>
        <a href=\"{outputFile}\">Read More…</a></p>
        </div>\n</div>"""
    
    return introParagraph, dateKey
        

def generateIndexFile(intros : List[Tuple[str, str]]) -> None:
    """
    Take a list of introduction paragraphs `intros` and create a homepage with the list
    of intros linking to the relevant articles.
    """
    intros.sort(key=lambda el: el[1], reverse=True)

    intro = "\n".join([intro[0] for intro in intros]) 

    webpage = f"""<!DOCTYPE html>
        <html class="inverted" lang="en">
        <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <meta charset="utf-8">
        <meta name="theme-color" content="#ffffff">
        <title>Home - joshj.dev</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Josh's website and portfolio.">
        <link rel="stylesheet" type="text/css" href="files/main.css">
        <!-- Icons-->
        <link rel="apple-touch-icon" sizes="180x180" href="files/icons/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="files/icons/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="files/icons/favicon-16x16.png">
        </head>
        <body>
        <h1>joshj.dev</h1>
        <p>
        My name is Josh Jennings and I am a graduate software engineer at ARM. This is my website and a portfolio of some of my personal projects. 
        </p>
        <ul>
        <li>My GitHub is available <a href="https://github.com/joshjennings98">here</a>.</li>
        <li>My LinkedIn is available <a href="https://www.linkedin.com/in/josh-jennings-41a17213a/">here</a>.</li>
        <li>A copy of my CV is available <a href="https://joshj.dev/CV-Josh-Jennings.pdf">here</a>.</li>
        <li>I can be contacted via <a href="mailto:josh@joshj.dev">email</a>.</li>
        </ul>
        </p>
        <h2>Projects</h2>
        {intro}
        <a id=title href="/"><div id="test">Go to homepage</div></a>
        <script src="files/invert.js" type="text/javascript"></script>
        <footer><a href=#top>Back to top</a></footer>
        </body>
        </html>"""

    if os.path.exists("index.html"):
        os.remove("index.html")

    with open("index.html", 'w+') as f:
        f.write(webpage)


def markdownToHTML(inputFile : str, outputFile : str = "") -> str:
    """
    Take a file written in markdown `inputFile`, use pandoc to convert it to HTML,
    and save it to `outputFile`. The function will return the intro paragraph an image
    for use on the homepage.
    """
    intro = generateIntro(inputFile, outputFile)

    if outputFile == "":
        outputFile = f"{inputFile.split('.')[0]}.html"

    with open(inputFile, 'r') as f:
        line = f.readline()
        title = line.strip(" #\n")
    
    command = ['pandoc', '--from', 'markdown', 
        '-s',
        '--highlight-style=zenburn', 
        '--columns', '1000', '--to', 'html5', inputFile]
    out, err = subprocess.Popen(command, stdout=subprocess.PIPE).communicate()
    
    content = out.decode('utf-8')
    content = content.replace("pre, code", "pre")
    content = content.replace("<figure>", "<div class=\"picture-left\">\n<figure>")
    content = content.replace("</figure>", "</figure></div>\n<div class=\"tleft\">")
    content = content.replace("<picture>", "<div class=\"fancyPositioning\">")
    content = content.replace("</picture>", "</div>\n</div>")
    #content = content.replace("<style type=\"text/css\">code{white-space: pre;}</style>", "")

    webpage = f"""<!DOCTYPE html>
        <html class="inverted" lang="en">
        <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <meta charset="utf-8">
        <meta name="theme-color" content="#ffffff">
        <title>{title} - joshj.dev</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Josh's website and portfolio.">
        <link rel="stylesheet" type="text/css" href="../files/main.css">
        <!-- Icons-->
        <link rel="apple-touch-icon" sizes="180x180" href="../files/icons/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="../files/icons/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="../files/icons/favicon-16x16.png">
        </head>
        <body>
        {content}
        <a id=title href="/"><div id="test">Go to homepage</div></a>
        <script src="../files/invert.js" type="text/javascript"></script>
        <footer><a href=#top>Back to top</a></footer>
        </body>  
        </html>"""

    if os.path.exists(outputFile):
        os.remove(outputFile)

    with open(outputFile, 'w+') as f:
        f.write(webpage)

    return intro


def main():
    """
    Main entry point of program.
    """
    intros = []

    for f in os.listdir("files/markdown/"):
        inputFile, outputFile = f"files/markdown/{f}", f"pages/{f.split('.')[0]}.html"
        print(f"Generating '{inputFile}' ---> '{outputFile}'.")
        intros.append(markdownToHTML(inputFile, outputFile))

    print("Generating 'index.html'")
    generateIndexFile(intros)
    print("All files have been generated.")


if __name__ == "__main__":
    main()
