#!/bin/python3

import os, re, pypandoc, argparse
from datetime import datetime
from jinja2 import Template
from typing import List, Tuple


def loadMarkdown(inputFile : str, mediaDirectory : str) -> str:
    """
    Loads the markdown and fixes image paths.
    """
    with open(inputFile, 'r') as file:
        return re.sub(r'!\[(.*)\]\((.*)\)', r'![\1](%s%s\2)' % (mediaDirectory, os.path.sep), file.read())


def generateIntro(content : str, introTemplateFile : str, outputFile : str) -> Tuple[str, datetime]:
    """
    For a string containing markdown content, create an introduction paragraph for the homepage
    based on the <intro date=X></intro> tags and add a read more link to outputFile. Return
    the introduction and the date specified in the <intro> tag.
    """

    date, intro = re.findall(r'<intro date=(.*)>(.*)<\/intro>', content, re.DOTALL)[0]

    intro = intro.replace('\n', '')
    dateKey = datetime.strptime(date, '"%d/%m/%Y"').strftime("%a %d %b %Y")

    try:
        image = re.findall(r'(!\[.*\]\(.*\))', intro)[0]  # find image
        intro = re.sub(r'(!\[.*\]\(.*\))', '', intro)     # remove image from intro
        image = re.findall(r'!\[.*\]\((.*)\)', image)[0]  # convert image to just path to image
    except:
        image = ""  # don't need to remove image if not in intro

    title = content.splitlines()[0].strip(" #\n")

    with open(introTemplateFile, 'r') as file:
        template = Template(file.read())
    introParagraph = template.render(image=image, title=title, date=dateKey, intro=intro, outputFile=outputFile)

    return introParagraph, dateKey


def generateIndexFile(intros : List[Tuple[str, str]], indexTemplateFile : str, outputIndexFile : str, style : str, mediaDirectory : str) -> None:
    """
    Take a list of introduction paragraphs `intros` and create a homepage with the list
    of intros linking to the relevant articles.
    """
    print("Generating 'index.html' ... ", end="")
    intros.sort(key=lambda el: datetime.strptime(el[1], "%a %d %b %Y"), reverse=True)

    with open(indexTemplateFile) as file:
        template = Template(file.read())

    webpage = template.render(intros=[intro[0] for intro in intros], style=style, files=mediaDirectory)

    if os.path.exists(outputIndexFile):
        os.remove(outputIndexFile)

    os.makedirs(os.path.dirname(outputIndexFile), exist_ok=True)
    with open(outputIndexFile, 'w') as f:
        f.write(webpage)

    print("Success!")


def generate404(notFoundTemplateFile : str, output404File : str, styleFile : str, mediaDirectory : str) -> None:
    """
    Generate the 404 page.
    """
    print("Generating '404.html' ... ", end="")
    with open(notFoundTemplateFile) as file:
        template = Template(file.read())
    webpage = template.render(style=styleFile, files=mediaDirectory)

    os.makedirs(os.path.dirname(output404File), exist_ok=True)
    with open(output404File, 'w') as f:
        f.write(webpage)
    print("Success!")


def markdownToHTML(content : str, pageTemplateFile : str, introTemplateFile : str, style : str, outputFile : str, mediaDirectory : str) -> str:
    """
    Take content written in markdown, use pandoc to convert it to HTML, and save it to
    outputFile. The function will return the intro paragraph an image for use on the homepage.
    """
    print(f"Generating '{outputFile}' ... ", end="")
    intro = generateIntro(content, introTemplateFile, outputFile)

    title = content.splitlines()[0].strip(" #\n")

    pandoc_args = ['-s' ,'--highlight-style=zenburn', '--columns', '1000']
    content = pypandoc.convert_text(content, 'html5', format='md', extra_args=pandoc_args)

    # A couple of things to make the pages prettier
    content = content.replace("pre, code", "pre")
    content = content.replace("<figure>", "<div class=\"picture-left\">\n<figure>")
    content = content.replace("</figure>", "</figure></div>\n<div class=\"tleft\">")
    content = content.replace("<picture>", "<div class=\"fancyPositioning\">")
    content = content.replace("</picture>", "</div>\n</div>")

    with open(pageTemplateFile) as file:
        template = Template(file.read())

    webpage = template.render(content=content, title=title, style=style, files=mediaDirectory)

    os.makedirs(os.path.dirname(outputFile), exist_ok=True)
    with open(outputFile, 'w') as f:
        f.write(webpage)

    print("Success!")
    return intro


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--markdown", help="Directory containing markdown files", required=True)
    parser.add_argument("-t", "--templates", help="Directory containing template files", required=True)
    parser.add_argument("-o", "--output", help="Directory to output html files", required=True)
    parser.add_argument("-f", "--media", help="Directory containing media files (images, css etc.)", required=True)
    parser.add_argument("-s", "--style", help="Input CSS file", default="files/website.css")
    parser.add_argument("-i", "--index", help="Directory to output index file", default=".")
    parser.add_argument("-x", "--notfound", help="Directory to output 404 file", default=".")
    args = parser.parse_args()

    intros = []
    for file in os.listdir(args.markdown):
        if os.path.splitext(file)[1] == ".md":
            inputFile = os.path.join(args.markdown, file)
            content = loadMarkdown(inputFile, args.media)
            outputFile = os.path.join(args.output, os.path.splitext(file)[0] + '.html')
            intros.append(
                markdownToHTML(
                    content,
                    os.path.join(args.templates, "page.html.template"),
                    os.path.join(args.templates, "intro.html.template"),
                    args.style,
                    outputFile,
                    args.media,
                )
            )

    generateIndexFile(
        intros,
        os.path.join(args.templates, "index.html.template"),
        os.path.join(args.index, "index.html"),
        args.style,
        args.media,
    )

    generate404(
        os.path.join(args.templates, "404.html.template"),
        os.path.join(args.notfound, "404.html"),
        args.style,
        args.media,
    )
