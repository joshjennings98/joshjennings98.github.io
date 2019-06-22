var PersonalDataUpdater = /** @class */ (function () {
    function PersonalDataUpdater(data) {
        this.data = data;
    }
    PersonalDataUpdater.prototype.update = function () {
        this.updateName();
        this.updateMail();
        this.updateTel();
        this.updateAboutMe();
        this.updatePageTitle();
    };
    PersonalDataUpdater.prototype.updateName = function () {
        PersonalDataUpdater.getAndUpdate("name", this.data.name);
    };
    PersonalDataUpdater.prototype.updateMail = function () {
        PersonalDataUpdater.getAndUpdate("email", this.data.email);
    };
    PersonalDataUpdater.prototype.updateTel = function () {
        PersonalDataUpdater.getAndUpdate("tel", this.data.telVisible);
        var contacts = document.getElementsByClassName("real-tel");
        for (var _i = 0, contacts_1 = contacts; _i < contacts_1.length; _i++) {
            var contact = contacts_1[_i];
            contact.href = "tel:" + this.data.telVisible
                .replace(new RegExp(' ', 'g'), "")
                .replace("+", "")
                .replace("-", "");
        }
    };
    PersonalDataUpdater.prototype.updateAboutMe = function () {
        PersonalDataUpdater.getAndUpdate("about-me", this.data.aboutMe);
    };
    PersonalDataUpdater.prototype.updatePageTitle = function () {
        if (this.data.pageTitle) {
            document.title = this.data.pageTitle;
        }
    };
    PersonalDataUpdater.getAndUpdate = function (what, to) {
        var all = document.getElementsByClassName(what);
        for (var _i = 0, all_1 = all; _i < all_1.length; _i++) {
            var single = all_1[_i];
            single.innerHTML = to;
        }
    };
    return PersonalDataUpdater;
}());
var handler = new XMLHttpReqHandler("about", makeProjects);
function makeProjects(str) {
    var personalData = JSON.parse(str);
    var aux = new PersonalDataUpdater(personalData);
    aux.update();
    slideDOM();
}
