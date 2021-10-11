"use strict";

function localStorageAvailable() {
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function setFooterLightDarkMode() {
    if (window.matchMedia('(prefers-color-scheme:dark)').matches) {
        if (!toggled) {
            document.getElementById("wcb").classList.add('wcb-d')
        } else {
            document.getElementById("wcb").classList.remove('wcb-d')
        }
    } else {
        if (!toggled) {
            document.getElementById("wcb").classList.remove('wcb-d')
        } else {
            document.getElementById("wcb").classList.add('wcb-d')
        }
    }
}

if (window.matchMedia('(prefers-color-scheme)').media !== 'not all' && localStorageAvailable() === true) { // using localStorage because it's not a variable that needs to be secure or anything

    document.body.style.margin = "2em auto";

    var textArr = ["Inverted mode", "Normal mode"];
    var classMethods = ["remove", "add"];

    var nightmodeDiv = document.createElement('div');
    nightmodeDiv.id = "invmode";
    nightmodeDiv.innerText = textArr[0];

    document.body.appendChild(nightmodeDiv);

    var el = document.getElementsByTagName("html")[0];
    var acbox = document.getElementById("invmode"),
        textNode = acbox.firstChild,
        toggled = localStorage.getItem("inverted") == 'true';
    var selector = Number(toggled);
    textNode.data = textArr[selector];
    el.classList[classMethods[selector]]("inverted");

    setFooterLightDarkMode()

    acbox.addEventListener(
        "ontouchstart" in window ? "touchend" : "click",
        function() {
            var selector = Number((toggled = !toggled));
            textNode.data = textArr[selector];
            el.classList[classMethods[selector]]("inverted");
            localStorage.setItem("inverted", toggled);
            setFooterLightDarkMode()
        },
        false
    );
}
