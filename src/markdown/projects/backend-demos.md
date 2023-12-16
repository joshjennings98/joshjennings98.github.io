---
title: Backend Demo Tool
slug: backend-demos
date: 2017-11-15T14:45:28Z
---

# Backend Demo Tool

This is a small [Flask](https://flask.palletsprojects.com/en/2.3.x/) application that makes it easier to demonstrate backend features.

Frontend developers have a much easier time of it when it comes to demonstrating their work. It is easy to see what they've done and they can make it look as interesting as they want. In comparison, trying to demo a backend API or tool is rarely interesting to watch. It usually involves a lot of text, ends up with the presenter pulling out a terminal to show commands on the fly, searching their command history and hoping they do everything in the right order. All this to get some JSON or similarly uninteresting output.

This project is an attempt to try and improve that situation and make backend demos simpler and more engaging. To do this, a python application was created that reads a simple text file containing information to present and generates a web server with Flask. The data for each slide is exposed as JSON via endpoints and with a simple `index.html` and some JavaScript, the tool is able to create a simple presentation that is shown in the browser and can be clicked through like a PowerPoint presentation.

The advantage this provides is that python can be to execute pre-written commands and stream the results back to the webserver and expose it via an iframe that is then embedded into a slide. This allows you to easily demonstrate commands without having to open a terminal. It also means you can plan the exact order of the commands and not worry about mixing them up. A side effect of running the presentation in the browser is that you can easily have links that open up in new tabs which can be useful to show the result of any executed commands, this is useful as you can just share the web browser during a meeting instead of having to switch between PowerPoint, a terminal, and a web browser.

This application lends itself to a presentation method similar to the [Takahashi method](https://en.wikipedia.org/wiki/Takahashi_method) where you have a concise slides with very little text. The created presentations are more complex than the Taskahashi method but it is still purposefully designed to keep things simple by only having one type of content per slide, be that text, a command output, or something else.

The result is that with this application backend demos should be much easier to create and run whilst also being slightly more engaging.

## Features

* A presentation is uses just a simple text file.
* A slide can contain one of: text, an executed command, a code block, or an image and are delimted by the tags: <code>[TEXT]</code>, <code>[COMMAND]</code>, <code>[CODE]</code>, and <code>[IMAGE]</code>.
* Executed commands will stream output to be shown in the slide.
* The command that is executed is shown above the command output.
* Correctly renders commands that span multiple lines.
* Optionally run command every few seconds like <code>watch</code>.
* Code blocks are automatically highlighted using <a href="https://highlightjs.org/">hightlight.js</a>.
* Text slides will add text line by line like a PowerPoint presentation with animations.
* Left click or right arrow to go forwards, right click or left arrow to go backwards.
* When going backwards previously rendered text is handled properly and slides don't reset.
* Extremely easy to use and share via screen sharing.
* Configurable CSS if you desire to change the look.
* Jump to any slide via a drop down menu.

## Usage

The tool is not on PyPi so to install it you will need to [clone the repository](https://github.com/joshjennings98/backend-demo). Once this is done `cd` into the base directory and run `pip install .` to install it as `backend_demo`.

To create a presentation you just need to write a command file `commands.txt` like this:

```
[TEXT] 
This is a slide

[COMMAND] 
ping -c 4 google.com

[TEXT] 
I am another text slide
with multiple lines

[IMAGE]
https://upload.wikimedia.org/wikipedia/en/7/73/Hyperion_cover.jpg

[CODE]
def main():
    print("I am a code block")
    print("I will be automatically syntax highlighted with hightlight.js")

[COMMAND]
echo commands \
spanning \
multiple \
lines \
are \
handled
```

To present a presentation, pass the command file as an argument to `backend_demo`:

```
backend_demo commands.txt
```

<i>Currently, all the commands are run in a sub shell on you machine so be careful with what you execute.</i>

## Github Repository

The full project can be viewed on [GitHub](https://github.com/joshjennings98/backend-demo).
