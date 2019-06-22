var MenuItem = /** @class */ (function () {
    function MenuItem(fileLink, label) {
        this.fileLink = fileLink;
        this.label = label;
    }
    MenuItem.prototype.generate = function () {
        var _this = this;
        var div = document.createElement("div");
        div.innerText = this.label;
        div.addEventListener("click", function () {
            navigateTo(_this.fileLink);
        });
        return div;
    };
    return MenuItem;
}());
var Menu = /** @class */ (function () {
    function Menu() {
        this.items = [];
    }
    Menu.prototype.addItem = function (fileLink, label) {
        this.items.push(new MenuItem(fileLink, label));
    };
    Menu.prototype.copyItem = function (item) {
        this.items.push(item);
    };
    Menu.prototype.generate = function () {
        var nav = document.createElement("nav");
        nav.classList.add("index-menu", "center-text", "slide-bottom-children");
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            nav.appendChild(item.generate());
        }
        return nav;
    };
    return Menu;
}());
var bodys = document.getElementsByClassName("main-body");
var menu = new Menu();
var singleBody;
menu.addItem("about", "About me");
menu.addItem("experience", "Experience");
menu.addItem("projects", "projects");
for (var _i = 0, bodys_1 = bodys; _i < bodys_1.length; _i++) {
    var body = bodys_1[_i];
    body.prepend(menu.generate());
    singleBody = body;
}
function parseScroll() {
    var navbars = document.getElementsByClassName("index-menu");
    var padding = document.getElementById("add-padding");
    for (var _i = 0, navbars_1 = navbars; _i < navbars_1.length; _i++) {
        var navbar = navbars_1[_i];
        var offset = navbar.scrollHeight;
        var navcpy = navbar;
        if (window.pageYOffset > offset) {
            navcpy.classList.add("sticky-menu");
            navcpy.style.width = (5 + singleBody.clientWidth).toString() + "px";
            padding.style.paddingTop = "150px";
        }
        else {
            navcpy.classList.remove("sticky-menu");
            navcpy.style.width = "100%";
            padding.style.paddingTop = "0";
        }
    }
}
window.onscroll = function () {
    parseScroll();
};
