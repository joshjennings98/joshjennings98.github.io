"use strict";

if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {

  document.body.style.margin="2em auto";

  var textArr = ["Inverted mode", "Normal mode"];
  var classMethods = ["remove", "add"];

  var nightmodeDiv = document.createElement('div');
      nightmodeDiv.id = "invmode";
      nightmodeDiv.innerText = textArr[0];
    
    document.body.appendChild(nightmodeDiv);

  var el = document.getElementsByTagName("html")[0];
  var acbox = document.getElementById("invmode"),
    textNode = acbox.firstChild,
    toggled = sessionStorage.getItem("inverted") == 'true';
    var selector = Number(toggled);
    textNode.data = textArr[selector];
    el.classList[classMethods[selector]]("inverted");
    
  acbox.addEventListener(
    "ontouchstart" in window ? "touchend" : "click",
    function() {
      var selector = Number((toggled = !toggled));
      textNode.data = textArr[selector];
      el.classList[classMethods[selector]]("inverted");
      sessionStorage.setItem("inverted", toggled);
    },
    false
  );
}