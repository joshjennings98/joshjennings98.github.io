# This website!!

<picture>

<intro date="04/09/2021">

![This website.](images/website.png)

This website uses my own static site generator and GitHub actions to convert markdown into HTML using pandoc automatically when any pages are updated.

</intro>

- [Introduction](#introduction)
- [Implementation](#implementation)
- [Website features](#website-features)
- [GitHub Actions Workflow](#github-actions-workflow)

</picture>

## Introduction

This website uses a static site generator script written in python that converts markdown files into HTML using pandoc and Jinja templates. The repository is set up to use GitHub actions to automatically run the scripts only if the markdown portion of the site is updated. If changes are made to any other parts of the repository, then the website is not updated.

## Implementation

The markdown pages are loaded into the strings where any relative paths to images are replaced with paths relative to the base of the directory. These are then converted into HTML using [pypandoc](https://pypi.org/project/pypandoc/). Since these are only the raw HTML without any site specific code (CSS and website UI etc.) jinja templates are used which contain the website UI. This results in the full page being rendered and this is put into the pages section of the website.

The index page then needs to be updated as it contains a brief overview of the projects. Therefore we take a section of each of the markdown files and load it into another jinja template for the index of the site. This results in a simple website that contains everything needed to host my portfolio.

Another similar script is used to generate my CV from a YAML file, a jinja template, and some CSS.

## Website features

This website is based off of [https://thebestmotherfucking.website/](https://thebestmotherfucking.website/) with some changes. It has a nice short invert script that lets you switch to dark or light mode based on the OS settings (or by clicking the button). It can run on literally anything without losing the look of the website by using simple CSS. The website has different behavior for mobile devices yet retains a simple yet consistent styling.

<picture>

![Running on a HTC Wildfire!](images/website-wildfire.jpg)

In cases where the invert button isn't supported, it is specifically designed to not appear. In this case you retain the rest of the styling.


This was tested using a HTC Wildfire using Android 2.2 (Froyo). This phone is so weak I was never able to get it to run Angry Birds back in the day! As you can see, the styling is simple enough that the website looks identical to on other devices. If you scroll up you find the "Go to homepage" but not the "Invert mode" button as the web browser used on this device doesn't support very recent versions of CSS.

</picture>

## GitHub Actions Workflow

The GitHub actions is a simple workflow and it will be explained below.

We set the workflow to only run when the GitHub actions workflow is updated, or when the markdown/CV files (or the templates themselves) are updated.

```yaml
on:
  push:
    paths:
      - 'files/src/**'
      - '.github/workflows/build.yml'
      - 'files/templates/**'
```

We run using Ubuntu image as I have experience with Linux.

```yaml
jobs:
  Build-website-content:
    runs-on: ubuntu-latest
    steps:
```

We checkout the repository. This has `persist-credentials: false` as otherwise, the token used is the `GITHUB_TOKEN`, instead of my personal access token. The `fetch-depth` is set to zero because otherwise, there would be errors pushing refs to the destination repository.

```yaml
- uses: actions/checkout@v2
	with:
	persist-credentials: false
	fetch-depth: 0
```

The next step just sets up Python 3.8.

```yaml
- name: Setup python
	uses: actions/setup-python@v2
	with:
	python-version: 3.8
```

We install the dependencies depending on what needs updating. We use `git diff` to determine if there were any changes to the markdown (or CV yaml) in the last commit. If there were then we install the dependencies.

We only install pandoc if we made changes to the markdown. The CV generation doesn't require pandoc so we don't install it if we don't need to.

```yaml
- name: Install dependencies
	run: |
	if [[ $(git diff HEAD^ files/src/) ]] ; then
		pip3 install -r build_scripts/requirements.txt
		if [[ $(git diff HEAD^ files/src/**.md) ]] ; then
			sudo apt install pandoc
		fi
	else
		echo "Nothing to rebuild so skipping dependency install."
	fi
```

Again using `git diff` we check for changes to the markdown and if there were any changes then we use the `generate_webpages.py` script to convert the markdown to HTML.

```yaml
- name: Generate webpages from markdown files
	run: |
	if [[ $(git diff HEAD^ files/src/**.md) ]] ; then
		python3 build_scripts/generate_webpages.py -m files/src/ -t files/templates/ -s /files/website.css -o pages/ -f /files
	else
		echo "Skipping stage as no markdown files were modified."
	fi
```

Once again, we use `git diff` we check for changes to the CV yaml and only run the `generate_cv.py` script if necessary.

```yaml
- name: Generate CV from YAML
	run: |
	if [[ $(git diff HEAD^ files/src/cv.yaml) ]] ; then
		python3 build_scripts/generate_cv.py -c files/src/cv.yaml -t files/templates/cv.html.template -o pages/CV-Josh-Jennings.html
	else
		echo "Skipping stage as CV wasn't modified."
	fi
```

We then stage any changes and commit them. If the workflow is run due to the workflow file being updated then we won't want to commit the changes as the commit would be empty. This would cause issues so we check if there are actually changes before we commit anything.

```yaml
- name: Commit changes
	run: |
	git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
	git config --local user.name "github-actions[bot]"
	git add .
	if [[ $(git diff HEAD^ files/src/) ]] ; then
		git commit -m "Build website - $(date)."
	else
		echo "No changes to src directory. Aborting deploy."
	fi
```

We use a `github-push-action` to then push the changes to the same repo. This results in a commit from the GitHub actions bot stating that the website has been built. These changes will then be reflected when GitHub pages completes it's deploy actions.

```yaml
- name: Push changes ready for Github Pages to deploy
	uses: ad-m/github-push-action@master
	with:
	github_token: ${{ secrets.GITHUB_TOKEN }}
	branch: master
```

And that is the entire workflow. As you can see, it is nice and simple yet very effective!

## GitHub Repository

The full project can be viewed on [GitHub.](https://github.com/joshjennings98/joshjennings98.github.io)

