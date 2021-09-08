#!/bin/python3

import argparse, os, yaml
from jinja2 import Template


def load_template(filepath):
    with open(filepath) as file:
        return Template(file.read())


def load_cv_yaml_file(filepath):
    with open(filepath) as file:
        return yaml.load(file, Loader=yaml.BaseLoader)


def render_html(template, cv):
    return template.render(cv)


def build(html, output):
    if dir := os.path.dirname(output):
        os.makedirs(dir, exist_ok=True)
    with open(output, 'w+') as file:
        file.writelines(html)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--cv", help="Input yaml file for CV", required=True)
    parser.add_argument("-t", "--template", help="Input template file", required=True)
    parser.add_argument("-o", "--output", help="Output file", required=True)
    args = parser.parse_args()

    template = load_template(args.template)
    cv = load_cv_yaml_file(args.cv)
    html = render_html(template, cv)

    build(html, args.output)
