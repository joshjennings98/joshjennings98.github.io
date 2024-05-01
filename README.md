# Josh's Website

This is my website. It is generated from markdown files using clojure.

The goal of this website was to create an interactive static website using on HTML and CSS, no JavaScript. I had recently read [an article about the quiet web](https://briankoberlein.com/tech/quiet-web/) which inspired me to try and create an interesting website that satisfied the requirements laid out in the blog post:

* Exclude any page that has ads.
* Remove them if they use Google Analytics or Google Fonts.
* Remove them if they use scripts or trackers.

These are arbitrary requirements but it seemed like an interesting challenge. On top of this, in the event that CSS was disabled, I also wanted my website to retain most of it's usability.

I am not one for frontend development and none of the previous versions of my site have used a JavaScript framework, however, in a previous iteration of my website I had a script that would allow you to change the theme between light mode and dark mode. I enjoyed this gimicky feature and wanted to keep that functionality.

## Re-implementing theme toggle using only CSS

The main feature that I wanted to emulate using CSS was a theme toggle. I wanted to be able to click a button and have the theme change in case a user doesn't like the default one. With JavaScript I would watch for a checkbox and have an `onchange` event that makes the colour changes. Since this relies on JavaScript, this approach is not possible. So using only CSS we need some way to:

* Know that a checkbox has been checked.
* If the user previously had the theme activated then it should deactivate or vice versa.
* This needs to be dynamic and not just occur on page load but any time a user checks the checkbox.
* Ideally it accounts for the user's light/dark mode preferences.

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

How does this help us? Well, since we can style elements based on the pseudo-class selectors, the CSS can be modified to change based on the checked state of a checkbox. Say we have a class for the checkbox called `.theme-checkbox`, we can do the following and change the font for siblings of an element based on whether the checkbox is checked:

```css
.content {
  font-family: Serif;
}

.theme-checkbox:checked ~ .container {
  font-family: Monospace;
}
```

And in the HTML do something like this:

```html
<input hidden class="theme-checkbox" id="theme" type="checkbox">

<div class="container">
  <label class="theme-label" for="theme">Toggle Theme</label>
  ...
</div>
```

You can see that the checkbox and the container are siblings. This is important as we wouldn't be able to have the content as a descendant of the checkbox due to the nature of inputs. One strange thing it does mean, is that we have the label for the button not be a parent or sibling of the checkbox. This is not an issue as we use the `for` attribute.

Now that we have the general technique, we can utilise it for theme toggle. In this example we are using it to toggle light and dark mode:

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

.theme-checkbox:checked ~ .container {
  --c-text: var(--c-dark-text);
  --c-background: var(--c-dark-background);
}

.container {
  color: var(--c-text);
  background-color: var(--c-background);
}
```

We use [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) and change them based on whether the checkbox is checked. We can then reference these variables in the CSS (such as when we set the background and text colour) to update the colours accordingly.

We also utilise [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) to detect whether the alternative colour scheme should be light or dark. There is this neat [codepen demo](https://codepen.io/kleinfreund/pen/NmpKZM) for determining whether your web browser supports this and what defaults to. This all means that the website will have the correct colour scheme for users if they toggle the theme.

One more problem arises. In this case, the checkbox is not part of the content and so it is unaffected by the styling. We cannot make it part of the container because it will never be able to affect the styling of it's parent. Luckily, since the label that you can click doesn't have to be a sibling of the checkbox itself, we can just hide the actual checkbox. Since the label can be clicked and we used the `for` attribute, it should still be accessible.

## Storing theme across pages

Now there is a theme I can toggle without JavaScript (yay), but if I go to another page on the website, the theme resets. This is because there is no state stored between pages. If I were using JavaScript then I could use `localStorage` to store a flag that lets the website know which theme should be used. You could do this with three lines of JavaScript. Unfortunately, I want to do it with zero lines of JavaScript which sadly isn't possible. There is no way to access the `localStorage` without JavaScript or JQuery (or maybe some fancy HTML5 or something). This is a limitation of CSS, there is literally no way to solve this. You cannot persist the theme information across pages.

Luckily there is a solution. Have the entire website in just one page, this way there is nothing to persist across pages because there are no pages. The website can act as if there are multiple pages whilst actually having only one page, this can be done using the power of CSS and radio buttons. In the previous section we went over the `:checked` psuedo-class for checkboxes. Another input type also has it's own `:checked` psuedo-class: radio buttons. Radio buttons allow you to select one option from a set of multiple options. You can select only one option at a time which means that we can use the radio button to control what page we are on. Then we can use the `:checked` pseudo-class to either show or hide sections on the website depending on the 'page' that has been chosen:

```css
.page1, .page2, .homepage {
  display: none;
}

#homepage-button:checked ~ .homepage { display: block; }
#page1-button:checked ~ .page1 { display: block; }
#page2-button:checked ~ .page2 { display: block; }
```

By default all the pages will be hidden, and then when a radio button is selected, it will override the default styling and set the display to `block` making the section visible. Since we will want the main page of the website to be visible, we can make the homepage radio button the value that is checked by default.

```html
<input type="radio" class="radio" id="homepage-button" checked>
<input type="radio" class="radio" id="page1-button">
<input type="radio" class="radio" id="page2-button">
```

This is all good, except radio buttons don't look like page links. We want this webpage to look like a normal website, users should be able to interact with it like they would any other website and a set of radio buttons to switch pages looks a bit stupid. To solve this, we will use a similar technique that we used with the theme toggle, we will hide the radio buttons themselves and rely on the button labels. We can make the radio button labels by styling them so they have underlines and so that when a user hovers over them, the mouse pointer changes. This way a user will never know they aren't actual links and from an accessability standpoint we will make sure to have good labels. We can make links stay the same colour if they have been visited (I never liked them changing colour) and then the page switch buttons will be indistinguishable from normal links.

```css
.page-button {
  cursor: pointer;
  text-decoration: underline;
}

.page1, .page2, .homepage {
  display: none;
}

#homepage-button:checked ~ .homepage { display: block; }
#page1-button:checked ~ .page1 { display: block; }
#page2-button:checked ~ .page2 { display: block; }

a {
  color: var(--c-text);
}
```

This is combined with the following HTML:

```html
<label for="homepage-button" class="page-button">Home</label>
<label for="page1-button" class="page-button">Page 1</label>
<label for="page2-button" class="page-button">Page 2</label>

<input type="radio" class="radio" id="homepage-button" checked hidden>
<input type="radio" class="radio" id="page1-button" hidden>
<input type="radio" class="radio" id="page2-button" hidden>
```

A nice thing about having a single webpage and using the radio buttons is that the website is extremely responsive as there are no HTTP requests between page switches since we have all the 'pages' all the time. This could cause problems in the future if there were a lot of pages and the website became very large. However, this would only affect the initial page load and once loaded you would have a quick and snappy website. There are many websites outhere that have multi-megabyte pages as they load in all the image, scripts, and styles yet they remain responsive so I am confident this website would as well.

A problem with this is that if we add a page we need to make changes to the CSS to add the new rule for which page to show and hide. This can be solved by tempalting the CSS when generating the website or it will be solved as a side effect of what we do in the next section.

## Having usable URLs

We almost have a fully functional website that behaves as if there are multiple pages whilst actually only having one page. Unfortunately, there is yet another issue. You can only choose the pages via the radio buttons, you can't go to a specific page via a URL. This means you cannot share a page, a problem if the site is used as a blog or a portfolio. This is because you cannot set radio buttons based on the contents of the URL (well as usual, you could do if you were willing to use JavaScript, but I am not). Without this feature the website is basically unusable, I want to be able to link to specific pages from other pages or even from other websites. Luckily, there is a solution!

This problem can be solved by replacing the radio buttons with links. But wait, then we won't be able to use the `:checked` pseudo-class. Yes, that is true, but luckily there is another pseudo-class we can use: the [`:target` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:target)! This pseudo-class represents an element with an id matching the URL's [fragment](https://en.wikipedia.org/wiki/URI_fragment). This is a string of characters that refers to a resource that is subordinate to another resource. For URLs, the fragment is the last part of a URL preceded by the `#`. It is usually used for identifying a portion of a document so that you can jump to a particular heading. We choose this over the query of the URL so that the pseudo-class can be used. Some other examples of how the fragment can be used, such as a pure CSS light box or table of contents, can be found in [the Mozilla web docs](https://developer.mozilla.org/en-US/docs/Web/CSS/:target#examples).

In our case we have behavior similar to the radio buttons. We will hide all pages and then depending on which id is targeted, we will unhide that page:

```css
.homepage.page {
  display: block; /* The homepage is displayed by default */
}

.page {
  display: none;
}

.page:target {
  display: block; /* When an id is targeted, show that page */
}

.page:target ~ .homepage.page {
  display: none; /* When an id is targeted, hide the homepage */
}
```

There is a difference vs the radio button version, that being that we have explicit behavior for the homepage. Since the default is that there is no fragment, we want to make sure that the homepage is shown if there is no fragment. We can't have a default fragment as that would make the URL messy. We therefore use the power of the General sibling combinator again to have the homepage show by default then hide if any other sibling page is selected. This means that the individual pages of the website can be accessed by doing `https://website.com#page`! Due to the nature of the combinators, we need to make sure that the homepage is the final section of the website since we want to hide it if a page is selected and we can only affect elements that come after the current DOM element.

To specify links to the pages within the website, we just have to create links to them like you would in a table of contents:

```html
<a href="#page1">Page 1</a>
<a href="#page2">Page 2</a>

<div class="page" id="page1"/>
<div class="page" id="page2"/>
```

An issue with this is that when you go to a heading via a fragment, it shifts the page downwards so that the heading is at the top of the page. This is fine if we were using the fragments with what they were designed for but it is a bit annoying as we want to be able to see the website header on each 'page'. To solve this we do a bit of a hacky solution, we add some invisible content before every element that gets targeted by a fragment, effectively pushing the actual content down the page by a fixed amount. it is a bit messy but it works.

```css
:target::before {
  content: "";
  display: block;
  height: 1000px; /* Fixed header height */
  margin: -1000px 0 0; /* Negative fixed header height */
}
```

And with that, we have a fully usable single-page website that behaves like it has multiple pages and has a theme toggle and uses no JavaScript. Obviously this is isn't viable for every website, but it was a fun idea to mess about with and the result is something I am quite happy with. It has all the features I want in a website without the bloat (although it uses slightly complex CSS that probably doesn't function on some browsers). Even if CSS is fully disabled, the website remains usable, it isn't as nice to use but is still completely functional. The fact it is just a single page of HTML and a bit of CSS means that it should be easily trasnsportable across web hosts with very little work when migrating. Now we just need a way to add content and deploy it!

## Code Generation

The website exists as a series of markdown files which are converted into HTML. I use clojure (with [babashka](https://babashka.org/)) to do this. The generated `index.html` is then hosted with [GitHub pages](https://pages.github.com/).

### Converting Markdown to HTML

I used to use templates for generating my website content. This worked fine but it is hard to read so I wanted a component library that meant I could write the website components in Clojure itself. This also means that testing is easier as I can test individual components. I went with [bootleg](https://github.com/retrogradeorbit/bootleg) as it is available as a [babashka pod](https://github.com/babashka/pods) meaning I can use it's utilities from within Clojure code. The website boilerplate is written using [hiccup](https://github.com/weavejester/hiccup) which represents HTML in Clojure using vectors. This means that everything is written in Clojure and there are no templates needed.

The code for the generators can be found in the [`generate.clj`](https://github.com/joshjennings98/joshjennings98.github.io/blob/master/generate.clj) in the [GitHub repo](https://github.com/joshjennings98/joshjennings98.github.io) for this project.

### Syntax Highlighting with CSS gradients

There are a lot of code snippets on my website and it would be nice if they could have some syntax highlighting. The most common way to do this is with a library like [highlight.js](https://highlightjs.org/) where JavaScript is used to determine the language and automatically highlight the code. This requires JavaScript which means I don't want it on my website. The other way is to generate the css for each syntax element in a language and wrap each part of the code in a span that matches the syntax element. This works but you end up with a million spans and it is also a bit boring.

The much more interesting and fun approach is to use CSS gradients. Like almost every approach, we use regex to work out the styling for each element but instead of wrapping each element in a span, we style the whole pre with gradients. This avoids having a mess of spans and uses no javascript.

Lets say we have the following code block:

```
for(i = 0; i < 10; i++){
    console.log(i);
}
```

We utilise a horrible regex to match specific keywords etc. and create a gradient that lines up with the text:

<pre class="skip" style="background: linear-gradient(to right, white 0ch, #E68 0ch, #E68 3ch, white 3ch, white 8ch, #A7C 8ch, #A7C 9ch, white 9ch, white 13ch, #f92672 13ch, #f92672 14ch, white 14ch, white 15ch, #A7C 15ch, #A7C 17ch, white 17ch, white 20ch, #f92672 20ch, #f92672 22ch, white 22ch, white 300ch), linear-gradient(to right, white 0ch, white 0ch, white 4ch, #fd971f 4ch, #fd971f 11ch, white 11ch, white 12ch, #a6e22e 12ch, #a6e22e 15ch, white 15ch, white 300ch), linear-gradient(to right, white 0ch, white 0ch, white 300ch); background-repeat: no-repeat; background-size: 80ch 22px, 80ch 44px, 80ch 66px, 80ch 88px; color: black; width: 80ch; font-family: monospace; font-size: 20px; line-height: 22px; width:inherit">
for(i = 0; i < 10; i++){
    console.log(i);
}
</pre>

We then set this as the background for the `pre` and make the text transparent. This makes the colour of the text match the gradient.

I lied about not using spans. An unfortunate problem with the gradients is that depending on the browser, you can end up with the gradient from one line affecting the colours in the surrounding lines. You can also end up with some other rendering artifacts because browsers aren't designed carry out syntax highlighting with this method. Therefore we wrap each line in a span which avoids the rendering issues. Whilst there are some spans, this approach is still better than wrapping each syntax element in a span.

The end result can be seen below:

```javascript
for(i = 0; i < 10; i++){
    console.log(i);
}
```

The resulting effect looks quite nice if you get the regular expressions for the language syntax correct (you will notice many places on this website where the choice of regex causes problems but this is just meant to be a bit of fun). It should be noted that this whole technique is quite pointless and it causes the website to take up more space than just using a JavaScript library for the highlighting.

## Deployment with GitHub Pages

I don't want to spend money so I host the website with [GitHub pages](https://pages.github.com/). This is particularly nice since I am hosting the repository on GitHub so deployments are trivial, I just run the go code to generate the static files and I am done.

## Acknowledgements

A lot of inspiration was taked from [this blog post](https://kleinfreund.de/css-only-theme/) on CSS-only dark mode for the initial work on reimplementing the theme toggle without JavaScript.

This [person on codepen](https://codepen.io/finnhvman) has a lot of amazing CSS only stuff available that make this website seem like a toy. They also have some cool SVG stuff like this [gas giant](https://codepen.io/finnhvman/pen/jOQvYaz) that I want to include on my website somehow.

The CSS only syntax highlighting is a slightly modified version of the work in [this blog post](https://dev.to/grahamthedev/impossible-css-only-js-syntax-highlighting-with-a-single-element-and-gradients-243j).
