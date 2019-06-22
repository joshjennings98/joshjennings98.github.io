function slideDOM() {
    var topSliders = document.getElementsByClassName("slide-top");
    var baseTimeout = 100;
    var timeout = 0;
    var _loop_1 = function (slider) {
        setTimeout(function () {
            if (!slider.classList.contains("slide-top-animated")) {
                slider.classList.add("slide-top-animated");
            }
        }, timeout);
        var _loop_4 = function (innerSlider) {
            setTimeout(function () {
                if (!innerSlider.classList.contains("slide-bottom-animated")) {
                    innerSlider.classList.add("slide-bottom-animated");
                }
            }, timeout);
        };
        for (var _i = 0, _a = slider.children; _i < _a.length; _i++) {
            var innerSlider = _a[_i];
            _loop_4(innerSlider);
        }
        timeout += baseTimeout;
    };
    for (var _i = 0, topSliders_1 = topSliders; _i < topSliders_1.length; _i++) {
        var slider = topSliders_1[_i];
        _loop_1(slider);
    }
    var menu = document.getElementsByClassName("index-menu");
    for (var _a = 0, menu_1 = menu; _a < menu_1.length; _a++) {
        var single = menu_1[_a];
        var _loop_2 = function (child) {
            child.addEventListener("mouseout", function (event) {
                if (!child.classList.contains("swing-out")) {
                    child.classList.add("swing-out");
                }
            });
        };
        for (var _b = 0, _c = single.children; _b < _c.length; _b++) {
            var child = _c[_b];
            _loop_2(child);
        }
    }
    var leftSliders = document.getElementsByClassName("slide-left");
    timeout = 0;
    var _loop_3 = function (slider) {
        setTimeout(function () {
            if (!slider.classList.contains("slide-left-animated")) {
                slider.classList.add("slide-left-animated");
            }
        }, timeout);
        timeout += baseTimeout;
    };
    for (var _d = 0, leftSliders_1 = leftSliders; _d < leftSliders_1.length; _d++) {
        var slider = leftSliders_1[_d];
        _loop_3(slider);
    }
}
slideDOM();
