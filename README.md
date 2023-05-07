# joshj.dev

This website uses a static site generator script written in python that converts markdown files into HTML using pandoc and Jinja templates. The repository is set up to use GitHub actions to automatically run the scripts only if the markdown portion of the site is updated. If changes are made to any other parts of the repository, then the website is not updated.

- [Implementation](#implementation)
- [Website features](#website-features)
- [How it works](#how-it-works)

## Implementation

The markdown pages are loaded into the strings where any relative paths to images are replaced with paths relative to the base of the directory. These are then converted into HTML using [pypandoc](https://pypi.org/project/pypandoc/). Since these are only the raw HTML without any site specific code (CSS and website UI etc.) jinja templates are used which contain the website UI. This results in the full page being rendered and this is put into the pages section of the website.

The index page then needs to be updated as it contains a brief overview of the projects. Therefore we take a section of each of the markdown files and load it into another jinja template for the index of the site. This results in a simple website that contains everything needed to host my portfolio.

Another similar script is used to generate my CV from a YAML file, a jinja template, and some CSS.

## Website features

This website is based off of [https://thebestmotherfucking.website/](https://thebestmotherfucking.website/) with some changes. It has a nice short invert script that lets you switch to dark or light mode based on the OS settings (or by clicking the button). It can run on literally anything without losing the look of the website by using simple CSS. The website has different behavior for mobile devices yet retains a simple yet consistent styling.

The website itself is also very small. The images are kept to as few kB as possible and the CV is generated into HTML instead of hosting a PDF. These are attempts to minimise the carbon footprint of my website. At the time of writing all of the pages weigh less than 35kB!

![Running on a HTC Wildfire!](files/images/website-wildfire.jpg)

This was tested using a HTC Wildfire using Android 2.2 (Froyo). This phone is so weak I was never able to get it to run Angry Birds back in the day! As you can see, the styling is simple enough that the website looks identical to on other devices. If you scroll up you find the "Go to homepage" but not the "Invert mode" button as the web browser used on this device doesn't support very recent versions of CSS.

*Note: image is compressed to 11kB to reduce the carbon footprint of my website.*

## How it works

A reusable GitHub actions workflow is used for generating the website and CV. This means that it can be called from other workflows. It takes a `branch` to run on (and commit the changes back to) and an `update` string specifying which of either the website or CV should be updated:

```yml
on:
  workflow_call:
    inputs:
      branch:
        description: Branch to run on
        type: string
        required: false
      update:
        description: What to update ('cv' or 'website')
        type: string
        required: true
    secrets:
      GIT_SECRET:
        required: true
```

Concurrency is used so that only one workflow runs on a branch at once. This avoids the issue of the CV and website workflows trying to commit changes to the same branch at the same time.

If the branch isn't specified then it defaults to the HEAD of branch the workflow was called on and if that isn't available then it will be the pull request reference (e.g. `refs/pull/31/merge`).

```yml
concurrency:
  group: ${{ inputs.branch || github.head_ref || github.ref }}
```

The steps are as follows:

1. Checkout the repo on the correct branch.
2. Set up python and restore pip dependencies before trying to install them.
3. Install `pandoc` if updating the website.
4. Update the resource specified by `inputs.update`.
5. Commit and push the changes.

```yml
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        ref: ${{ inputs.branch || github.head_ref || github.ref }}
        persist-credentials: false # otherwise token used is the GITHUB_TOKEN, instead of your personal access token.
        fetch-depth: 0 # otherwise, there would be errors pushing refs to the destination repository.
    - name: Setup python
      uses: actions/setup-python@v4
      with:
        python-version: 3.11
        cache: 'pip'
    - name: Install dependencies
      run: |
          pip3 install -r build_scripts/requirements.txt
    - name: Install pandoc
      if: inputs.update == 'website'
      run: |
          sudo apt install pandoc
    - name: Generate CV from YAML
      if: inputs.update == 'cv'
      run: |
          python3 build_scripts/generate_cv.py -c files/src/cv.yaml -t files/templates/cv.html.template -o pages/CV-Josh-Jennings.html
    - name: Generate webpages from markdown files
      if: inputs.update == 'website'
      run: |
        python3 build_scripts/generate_webpages.py -m files/src/ -t files/templates/ -s /files/website.css -o pages/ -f /files
    - name: Commit changes
      run: |
        git pull
        git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        git add .
        git commit -m "Update ${{ inputs.update }} - $(date)."
    - name: Push changes ready for Github Pages to deploy
      uses: ad-m/github-push-action@master
      with:
        github_token: ${{ secrets.GIT_SECRET }}
        branch: ${{ inputs.branch || github.head_ref || github.ref }}
```

An example of how this workflow is used can be seen below in `update-cv.yml`:

```yml
name: Build CV
on:
  push:
    branches:
      - master
    paths:
      - 'files/src/cv.yaml'
      - 'files/templates/cv.html.template'
jobs:
  build-and-deploy-cv:
    name: Build and deploy CV
    uses: joshjennings98/joshjennings98.github.io/.github/workflows/update.yml@master
    secrets:
      GIT_SECRET: ${{ secrets.GITHUB_TOKEN }}
    with:
      update: cv
      branch: ${{ github.head_ref || github.ref }}
```

