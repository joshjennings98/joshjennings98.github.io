var getSourceFromService = {
    "github": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-github.svg",
    "linkedin": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-linkedin.svg",
    "facebook": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-facebook.svg",
    "cv": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-cv.png",
    "leetcode": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-leetcode.png",
    "youtube": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-youtube.svg",
    "telegram": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-telegram.png",
    "behance": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-behance.svg",
    "devianart": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-devianart.svg",
    "dribble": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-dribble.svg",
    "dropbox": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-dropbox.svg",
    "evernote": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-evernote.svg",
    "google-plus": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-google-plus.svg",
    "instagram": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-instagram.svg",
    "pinterest": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-pinterest.svg",
    "product-hunt": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-product-hunt.svg",
    "skype": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-skype.svg",
    "slack": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-slack.svg",
    "spotify": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-spotify.svg",
    "twitter": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-twitter.svg",
    "vimeo": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-vimeo.svg",
    "wordpress": "assets/icons/nucleo-social-icons/nucleo-social-icons/svg/social-1_round-wordpress.svg",
};
var SingleSocial = /** @class */ (function () {
    function SingleSocial(social) {
        this.social = social;
    }
    SingleSocial.prototype.generate = function () {
        var a = document.createElement("a");
        a.href = this.social.link;
        a.appendChild(this.generateSocialCell());
        return a;
    };
    SingleSocial.prototype.generateSocialCell = function () {
        var div = document.createElement("div");
        var img = document.createElement("img");
        var span = document.createElement("span");
        div.classList.add("social-cell", "slide-left");
        img.src = getSourceFromService[this.social.service];
        span.innerText = this.social.title;
        div.appendChild(img);
        div.appendChild(span);
        return div;
    };
    return SingleSocial;
}());
var Nav = /** @class */ (function () {
    function Nav() {
        this.cells = [];
    }
    Nav.prototype.addSocial = function (social) {
        this.cells.push(social);
    };
    Nav.prototype.generate = function () {
        var nav = document.createElement("nav");
        nav.classList.add("social-grid");
        for (var _i = 0, _a = this.cells; _i < _a.length; _i++) {
            var singleCell = _a[_i];
            var newCell = new SingleSocial(singleCell);
            nav.appendChild(newCell.generate());
        }
        return nav;
    };
    return Nav;
}());
var handler = new XMLHttpReqHandler("socials", makeJobs);
function makeJobs(str) {
    var socials = JSON.parse(str);
    var body = document.getElementsByTagName("body");
    var newNav = new Nav();
    socials.forEach(function (val) {
        newNav.addSocial(val);
    });
    for (var _i = 0, body_1 = body; _i < body_1.length; _i++) {
        var single = body_1[_i];
        single.appendChild(newNav.generate());
    }
    slideDOM();
}
