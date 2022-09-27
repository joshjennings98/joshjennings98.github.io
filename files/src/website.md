# Static Website Generator

<picture>

<intro date="04/09/2021">

![This website.](images/website.png)

This website uses my own static site generator and GitHub actions to convert markdown into HTML using pandoc automatically when any pages are updated.

</intro>

- [Introduction](#introduction)
- [Implementation](#implementation)
- [Website features](#website-features)
- [How it works](#how-it-works)
- [GitHub Repository](#github-repository)

</picture>

## Introduction

This website uses a static site generator script written in python that converts markdown files into HTML using pandoc and Jinja templates. The repository is set up to use GitHub actions to automatically run the scripts only if the markdown portion of the site is updated. If changes are made to any other parts of the repository, then the website is not updated.

## Implementation

The markdown pages are loaded into the strings where any relative paths to images are replaced with paths relative to the base of the directory. These are then converted into HTML using [pypandoc](https://pypi.org/project/pypandoc/). Since these are only the raw HTML without any site specific code (CSS and website UI etc.) jinja templates are used which contain the website UI. This results in the full page being rendered and this is put into the pages section of the website.

The index page then needs to be updated as it contains a brief overview of the projects. Therefore we take a section of each of the markdown files and load it into another jinja template for the index of the site. This results in a simple website that contains everything needed to host my portfolio.

Another similar script is used to generate my CV from a YAML file, a jinja template, and some CSS.

## Website features

This website is based off of [https://thebestmotherfucking.website/](https://thebestmotherfucking.website/) with some changes. It has a nice short invert script that lets you switch to dark or light mode based on the OS settings (or by clicking the button). It can run on literally anything without losing the look of the website by using simple CSS. The website has different behavior for mobile devices yet retains a simple yet consistent styling.

The website itself is also very small. The images are kept to as few kB as possible and the CV is generated into HTML instead of hosting a PDF. These are attempts to minimise the carbon footprint of my website. At the time of writing all of the pages weigh less than 35kB!

<picture>

![Running on a HTC Wildfire!](images/website-wildfire.jpg)

In cases where the invert button isn't supported, it is specifically designed to not appear. In this case you retain the rest of the styling.


This was tested using a HTC Wildfire using Android 2.2 (Froyo). This phone is so weak I was never able to get it to run Angry Birds back in the day! As you can see, the styling is simple enough that the website looks identical to on other devices. If you scroll up you find the "Go to homepage" but not the "Invert mode" button as the web browser used on this device doesn't support very recent versions of CSS.

*Note: image is compressed to 11kB to reduce the carbon footprint of my website.*

</picture>

## How it works

We use two GitHub actions workflows for generating the website and CV.

For the website:

```yml
name: Build Website

on:
  push:
    paths:
      - 'files/src/**.md'
      - 'files/templates/**'
      - '!files/templates/cv.html.template'
      - 'files/website.css'

concurrency:
  group: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        persist-credentials: false # otherwise token used is the GITHUB_TOKEN, instead of your personal access token.
        fetch-depth: 0 # otherwise, there would be errors pushing refs to the destination repository.
    - name: Setup python
      uses: actions/setup-python@v2
      with:
        python-version: 3.8
    - name: Install dependencies
      run: |
          pip3 install -r build_scripts/requirements.txt
          sudo apt install pandoc
    - name: Generate webpages from markdown files
      run: |
        python3 build_scripts/generate_webpages.py -m files/src/ -t files/templates/ -s /files/website.css -o pages/ -f /files
    - name: Commit changes
      run: |
	  	git pull
        git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        git add .
        git commit -m "Update website - $(date)."
    - name: Push changes ready for Github Pages to deploy
      uses: ad-m/github-push-action@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        branch: master
```

For the CV:

```yml
name: Build CV

on:
  push:
    paths:
      - 'files/src/cv.yml'
      - 'files/templates/cv.html.template'
      - 'files/cv.css'

concurrency:
  group: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        persist-credentials: false # otherwise token used is the GITHUB_TOKEN, instead of your personal access token.
        fetch-depth: 0 # otherwise, there would be errors pushing refs to the destination repository.
    - name: Setup python
      uses: actions/setup-python@v2
      with:
        python-version: 3.8
    - name: Install dependencies
      run: |
          pip3 install -r build_scripts/requirements.txt
    - name: Generate CV from YAML
      run: |
          python3 build_scripts/generate_cv.py -c files/src/cv.yaml -t files/templates/cv.html.template -o pages/CV-Josh-Jennings.html
    - name: Commit changes
      run: |
        git pull
        git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        git add .
		git commit -m "Update CV - $(date)."
    - name: Push changes ready for Github Pages to deploy
      uses: ad-m/github-push-action@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        branch: master
```

These are very similar and are only differentiated by which changes trigger them and which files get updated.

I use concurrency with the context set to the entire repository so that only one workflow will run at a time.

Due to the similarities of these workflows they could easily be turned into a [composite action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) which I may do in the future.

## GitHub Repository

The full project can be viewed on [GitHub.](https://github.com/joshjennings98/joshjennings98.github.io)

