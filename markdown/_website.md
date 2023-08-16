## This Website

The goal of this website was to create an interactive static website using on HTML and CSS, no JavaScript. I had recently read [an article about the quiet web](https://briankoberlein.com/tech/quiet-web/) which inspired me to try and create an interesting website that satisfied the requirements laid out in the blog post:

* Exclude any page that has ads. 
* Remove them if they use Google Analytics or Google Fonts. 
* Remove them if they use scripts or trackers.

These are arbitrary requirements but it seemed like an interesting challenge. On top of this, in the event that CSS was disabled, I also wanted my website to retain most of it's usability.

I am not one for frontend development and none of the previous versions of my site have used a JavaScript framework, however, in a previous iteration of my website I had a script that would allow you to change the theme between light mode and dark mode. I enjoyed this gimicky feature and wanted to keep that functionality.

### Re-implementing theme toggle using only CSS

The main feature that I wanted to emulate using CSS was a light mode toggle. I wanted to be able to click a button and have the colour scheme change. With JavaScript I would watch for a checkbox and have an `onchange` event that makes the colour changes. Since this relies on JavaScript, this approach is not possible. So using only CSS we need some way to:

* Know that a checkbox has been checked.
* If the user was previously in a dark mode the page should become light or vice versa. 
* This needs to be dynamic and not just occur on page load but any time a user checks the checkbox.

Luckily, CSS has [pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes). These are keywords that are attached to a selector and specify a state of the selected element, for example `:hover` is triggered when an element is hovered over. There exists the [`:checked` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:checked) which can be used to change the style of a checkbox or radio button based on whether or not it is checked. This satisfies the goal of making the change dynamic and controllable by the user.

However, there is a problem. CSS stands for Cascading Style Sheets. Styling in CSS will only apply to descendants of the the DOM node for the element (if the styling doesn't only affect the specific element i.e. `margin` will only affect the current element, but `font-family` will apply to the descendants). In either case, the inheritance only goes down the DOM tree and we cannot affect the properties of any parent elements.

We can have some degree of control over which descendants are affected by the styling through the use of the [general sibling combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator). This seperates two seletors and matches all instances of the second element that appear anywhere after the first element that share the same parent element. For example, the following would match all span elements that come after the paragraph element in the DOM tree:

```css
p ~ span {
  color: red;
}
```

From the [general sibling combinator docs](https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator#html) we can see how this would work:

```html
<article>
  <span>This is not red because it appears before any paragraph.</span>
  <p>Here is a paragraph.</p>
  <code>Here is some code.</code>
  <span>
    This span is red because it appears after the paragraph, even though there
    are other nodes in between
  </span>
  <p>Whatever it may be, keep smiling.</p>
  <h1>Dream big</h1>
  <span>
    Doesn't matter how many or what kind of nodes are in between, all spans from
    the same parent after a paragraph are red.
  </span>
</article>
<span>
  This span is not red because it doesn't share a parent with a paragraph
</span>
```

How does this help us? Well, since we can style elements based on the pseudo-class selectors, the CSS can be modified to change based on the checked state of a checkbox. Say we have a class for the checkbox called `.dark-mode-checkbox`, we can do the following and change the font for siblings of an element based on whether the checkbox is checked:

```css
.content {
  font-family: Serif;
}

.dark-mode-checkbox:checked ~ .container {
  font-family: Monospace;
}
```

And in the HTML do something like this:

```html
<input hidden class="dark-mode-checkbox" id="dark-mode" type="checkbox">

<div class="container">
  <label class="dark-mode-label" for="dark-mode">Toggle Dark Mode</label>
  ...
</div>
```

You can see that the checkbox and the container are siblings. This is important as we wouldn't be able to have the content as a descendant of the checkbox due to the nature of inputs. One strange thing it does mean, is that we have the label for the button not be a parent or sibling of the checkbox. This is not an issue as we use the `for` attribute.

Now that we have the general technique, we can utilise it for the dark mode.

```css
:root {
  --c-text: #3c3836;
  --c-background: #fbf1c7;
  --c-dark-text: #ebdbb2;
  --c-dark-background: #282828;
}

@media (prefers-color-scheme: dark) {
  :root {
    --c-text: #ebdbb2;
    --c-background: #282828;
    --c-dark-text: #3c3836;
    --c-dark-background: #fbf1c7;
  }
}

.dark-mode-checkbox:checked ~ .container {
  --c-text: var(--c-dark-text);
  --c-background: var(--c-dark-background);
}

.container {
  color: var(--c-text);
  background-color: var(--c-background);
}
```

We use [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) and change them based on whether the checkbox is checked. We can then reference these variables in the CSS (such as when we set the background and text colour) to update the colours accordingly.

We can also utilise [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) to detect whether the initial colour scheme should be light or dark. Since we can use generic terminalogy in our labels, we can treat the light mode as the dark mode for users who initially requested the dark mode. There is this neat [codepen demo](https://codepen.io/kleinfreund/pen/NmpKZM) for determining whether your web browser supports this and what defaults to. This all means that the website will be the correct mode for users and they won't have to click the checkbox to toggle the theme. This ultimately makes the whole approach with the checkbox pointless, but this whole website is an exercise in pointlessness so I am doing it anyway. It also led to some interesting problems that I got to solve, I will go over theses in the next few sections.

One more problem arises. The checkbox is not part of the content and so it is unaffected by the styling. We cannot make it part of the container because it will never be able to affect the styling of it's parent. Luckily, since the label that you can click doesn't have to be a sibling of the checkbox itself, we can just hide the actual checkbox. Since the label can be clicked and we used the `for` attribute, it should still be accessible.

### Storing theme across pages

TODO.

### Having usable URLs

TODO.

### Code Generation

I implemented my own static site generator. Since my website is basically a single page application, I only ned to populate the `index.html` file. I use Go with it's powerful templating to fill the relevant sections of the `index.html` with content that has been parsed from markdown files. This means that if I want to add a page, I just add a markdown file, and the website will automatically regenerate the `index.html` when I push the change to GitHub. This is done with a simple CI workflow. GitHub pages then handles the deployment of the actual website, this is discuessed in the section below.

The Go code is not interesting. It is written with only standard library modules. It reads the markdown from the markdown directory, converts it into HTML using regex to convert the various markdown tags into their HTML equivalent, and then populates the templates for the `index.html` and `404.html` pages. Since there is only one page to really think about, the code is kept relatively simple.

The index template [can be found here](https://github.com/joshjennings98/joshjennings98.github.io/blob/master/templates/index.html.tmpl), whilst the Go program for populating the template [can be found here](https://github.com/joshjennings98/joshjennings98.github.io/blob/master/main.go).

The workflow to run the program in CI is very simple. It uses GitHub actions to checkout the repo, and if there are changes to the markdown or templates then it will regenerate the index and commit the changes back to the repository. There is also a similar workflow that is used for generating my CV. In this case, the CV is kept as a `yaml` file and then a python script is used to turn it into HTML. 

The CI workflows [can be found here](https://github.com/joshjennings98/joshjennings98.github.io/tree/master/.github/workflows).

### Deployment using GitHub Pages

I don't want to spend money so I host the website with GitHub pages. This is particularly nice since I am hosting the repository on GitHub so deployments are trivial.

You can use GitHub pages with fancy [Jekyll](https://jekyllrb.com/) setups but that probably involves some JavaScript which I don't want (also I prefer [Hugo](https://gohugo.io/) if I use a static site generator that isn't my own). Instead I just use my own static site generator that populates the `index.html.template` as talked about in the previous section. This makes the deployments very simple as there is only one page, it is as simple as the [hello world example for github pages](https://pages.github.com/). Since this is hosted on GitHub I don't even have to worry about CI for the actual deplyoment as it is handled by GitHub.

Unfortunately I can't have just one page, I need a 404 page so that users can still navigate my website if they go to a wrong page. Again, because this is GitHub pages, this is very simple. You just need to create a `404.html` and have it at the root of the repo, no need for special files like a `.htaccess`. You can create a tempalte for the 404 page and populate it like the index so that the website looks consistent and all the links can be accessed easily from the 404 page.

If you want to use a custom domain with GitHub pages, that is also relatively simple, you just need to add a CNAME record to your reopository. This involves two steps:
* Adding a CNAME record file to your repository.
* Creating a CNAME record with your DNS provider.

The CNAME record file contains the domain you want to use for your website. A CNAME record is used to specify that a domain name is an alias for another domain. This basically acts as a redirect so a custom dmain name can be used. The target domain must have an A address record. The A adress record is used to map a domain to it's corresponding IP where the werbsite is hosted.

To create the CNAME record itself, you must go to your DNS provider and create a CNAME record that points the domain to the GitHub pages URL (in my case joshjenning98.github.io). This is a different process for different DNS provders. In my case I used Google domains (for the `.dev` top level domain) for which the information on setting up a CNAME record can be found [on this page](https://support.google.com/a/answer/47283?hl=en#zippy=%2Cstep-get-your-unique-cname-record%2Cstep-add-the-cname-record-to-your-domains-dns-records). If you want to enforce HTTPS (a requirement for `.dev`) you must aso go to the GitHub pages setting and have "Enforce HTTPS" enabled.

### Acknowledgements

A lot of inspiration was taked from [this blog post](https://kleinfreund.de/css-only-dark-mode/) on CSS-only dark mode for the initial work on reimplementing the theme toggle without JavaScript.

### Github

The full project can be viewed on [GitHub](https://github.com/joshjennings98/joshjennings98.github.io).
