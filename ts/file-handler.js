var XMLHttpReqHandler = /** @class */ (function () {
    function XMLHttpReqHandler(file, func) {
        var _this = this;
        this.req = new XMLHttpRequest();
        this.req.onload = function () { return func(_this.req.responseText); };
        this.req.open("GET", "assets/jsons/" + file + ".json");
        this.req.send();
    }
    return XMLHttpReqHandler;
}());
