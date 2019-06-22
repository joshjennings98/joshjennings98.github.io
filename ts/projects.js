var Project = /** @class */ (function () {
    function Project(desc) {
        this.desc = desc;
    }
    Project.prototype.generate = function () {
        var project = document.createElement("div");
        var innerDiv = document.createElement("div");
        project.classList.add("single-project");
        innerDiv.classList.add("project");
        innerDiv.appendChild(this.generateImg());
        innerDiv.appendChild(this.generateDesc());
        project.appendChild(innerDiv);
        return project;
    };
    Project.prototype.generateImg = function () {
        var img = document.createElement("div");
        img.classList.add("img-container");
        img.style.backgroundImage = "url(\"" + this.desc.imgUrl + "\")";
        return img;
    };
    Project.prototype.generateDesc = function () {
        var div = document.createElement("div");
        var h3 = document.createElement("h3");
        var h4 = document.createElement("h4");
        var p = document.createElement("p");
        div.classList.add("text");
        h3.innerHTML = this.desc.title;
        h4.innerHTML = this.desc.date;
        p.innerHTML = this.desc.description;
        div.appendChild(h3);
        div.appendChild(h4);
        div.appendChild(p);
        return div;
    };
    return Project;
}());
var Projects = /** @class */ (function () {
    function Projects() {
        this.projects = [];
    }
    Projects.prototype.add = function (project) {
        this.projects.push(project);
    };
    Projects.prototype.generate = function () {
        var div = document.createElement("div");
        this.projects.forEach(function (value) {
            div.appendChild(value.generate());
        });
        return div;
    };
    return Projects;
}());
var handler = new XMLHttpReqHandler("projects", makeProjects);
function makeProjects(str) {
    var projects = JSON.parse(str);
    var dom = document.getElementById("projects-timeline");
    var aux = new Projects();
    projects.forEach(function (value) {
        aux.add(new Project(value));
    });
    dom.appendChild(aux.generate());
    slideDOM();
}
