"use strict";

var textArr = ["Light mode", "Dark mode"];
var classMethods = ["remove", "add"];

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