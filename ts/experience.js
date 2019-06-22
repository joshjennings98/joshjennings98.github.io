var Job = /** @class */ (function () {
    function Job(desc) {
        this.desc = desc;
    }
    Job.prototype.generate = function () {
        var outerDiv = document.createElement("div");
        var innerDiv = document.createElement("div");
        outerDiv.classList.add("single-job");
        innerDiv.appendChild(this.createTitle());
        innerDiv.appendChild(this.createTimeframe());
        innerDiv.appendChild(this.createParagraph());
        outerDiv.appendChild(innerDiv);
        return outerDiv;
    };
    Job.prototype.createTitle = function () {
        return Job.createCustom("h3", this.desc.title);
    };
    Job.prototype.createTimeframe = function () {
        return Job.createCustom("h4", this.desc.timeframe + "<br>" + this.desc.place);
    };
    Job.prototype.createParagraph = function () {
        return Job.createCustom("p", this.desc.description);
    };
    Job.createCustom = function (tag, inner) {
        var item = document.createElement(tag);
        item.innerHTML = inner;
        return item;
    };
    return Job;
}());
var Jobs = /** @class */ (function () {
    function Jobs() {
        this.jobs = [];
    }
    Jobs.prototype.add = function (job) {
        this.jobs.push(job);
    };
    Jobs.prototype.generate = function () {
        var div = document.createElement("div");
        div.classList.add("timeline");
        for (var _i = 0, _a = this.jobs; _i < _a.length; _i++) {
            var job = _a[_i];
            div.appendChild(job.generate());
        }
        return div;
    };
    return Jobs;
}());
var handler = new XMLHttpReqHandler("jobs", makeJobs);
function makeJobs(str) {
    var jobs = JSON.parse(str);
    var timeline = document.getElementById("job-timeline");
    var auxTimeline = new Jobs();
    for (var _i = 0, jobs_1 = jobs; _i < jobs_1.length; _i++) {
        var job = jobs_1[_i];
        auxTimeline.add(new Job(job));
    }
    timeline.appendChild(auxTimeline.generate());
    slideDOM();
}
