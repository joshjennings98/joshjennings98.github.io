/*
	SGD.js

	To Do:
	Remove eval() since its apparently quite bad :(
	Remove absolute pixel sizes (less important).
*/

// Set up the intitial state using nasty global (sort of) variables
var myPlot = document.getElementById('graph')
var x1 = -100;
var y1 = -100;
var initialError = '1.25 * (x1 + 6) ** 2 + (y1 - 8) ** 2';
var lrVals = [0.0000005, 0.000005, 0.00005,  0.0005, 0.001, 0.003, 0.005, 0.007, 0.01, 0.03, 0.05, 0.07, 0.1, 0.3, 0.5, 0.7]
var isStochastic = false;
var type = "basic";
var startX = -100;
var startY = -100;
var endX = 100; 
var endY = 100; 
var incrValue = 10;
var initialFunction = '1.25*(i + 6)**2 + (j - 8)**2';
var curFunc = '1.25*(i + 6)**2 + (j - 8)**2';
var dx = '(2.5 * xCur + 15)';
var dy = '(2 * yCur - 16)';
var meanFunc = '1.25 * (xMean + 6) ** 2 + (yMean - 8) ** 2';
var breakFlag = false
var MAXERROR = 2**64;
var clipValue = 1000;
var clipFlag = false;
var lrFlag = false;
var prevError = 2**64;

let currentAverage = [];
let xVals = [];
let yVals = [];
let zVals = [];
let xTemp = []
let yTemp = []
let zTemp = []
let xGD = [];
let yGD = [];
let zGD = [];
let c = 0;
let iterations = document.getElementById("interationsInput").value;
let learningRate = lrVals[document.getElementById("LRInput").value];


var layout = {
	legend: {
		x: 0,
		y: 1
	},
	width: 600,
	height: 600,
	hovermode: "closest",
	showlegend: true,
	title: {
		text: "How Gradient Descent finds the minimum of a plane"
	}
}

var layout2 = {
	legend: {
		x: 0,
		y: 1
	},
	width: 600,
	height: 700,
	xaxis: {
		range: [0, iterations],
		zeroline: true,
		title: "Iteration"
	},
	yaxis: {
		range: [0, eval(initialError)],
		zeroline: true,
		title: "Error"
	},
	hovermode: "closest",
	showlegend: true,
	title: {
		text: "Absolute Error against Number of Iterations"
	}
}

var data = [{
		opacity: 0.8,
		type: 'surface',
		x: xVals,
		y: yVals,
		z: zVals,
		showlegend: false,
		showscale: false
	},
	{
		x: xGD,
		y: yGD,
		z: zGD,
		mode: 'lines',
		type: 'scatter3d',
		marker: {
			color: 'rgb(0,0,0)',
			size: 3
		},
		showlegend: false,
	},
	{
		x: [],
		y: [],
		z: [],
		mode: 'markers',
		type: 'scatter3d',
		marker: {
			color: 'rgb(255,0,0)',
			size: 5
		},
		name: 'Average Vector'
	},
	{
		x: [],
		y: [],
		z: [],
		mode: 'markers',
		type: 'scatter3d',
		marker: {
			color: 'rgb(0,0,255)',
			size: 5
		},
		name: 'Best Vector'
	}
];

var data2 = [{
	x: [],
	y: [],
	mode: 'lines',
	type: 'scatter',
	name: 'Absolute Error',
	xaxis: 'x1',
	yaxis: 'y1',
}]

// Function for rounding to a set number of decimal places
round = (value, decimals) => {
	if (Math.abs(value) > Number(1 + 'e-' + decimals)) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	} else {
		return 0.0
	}
}

// Function for initialising everything
initEverything = (func) => {
	xVals = [];
	yVals = [];
	zVals = [];
	xTemp = [];
	yTemp = [];
	zTemp = [];

	switch (func) {
		case '1.25*(i + 6)**2 + (j - 8)**2':
			startX = -100;
			endX = 100;
			startY = -100; 
			endY = 100;
			incrValue = 10;
			curFunc = '1.25*(xGD[xGD.length - 1] + 6)**2 + (yGD[yGD.length - 1] - 8)**2';
			dx = '(2.5 * xCur + 15)';
			dy = '(2 * yCur - 16)';
			initialError = '1.25 * (x1 + 6) ** 2 + (y1 - 8) ** 2';
			meanFunc = '1.25 * (xMean + 6) ** 2 + (yMean - 8) ** 2';
			break;
		case '(1 - i)**2+100*(j - i**2)**2':
			startX = -2;
			endX = 2;
			startY = -1;
			endY = 3;
			incrValue = 0.1;
			curFunc = '(1 - xGD[xGD.length - 1])**2+100*(yGD[yGD.length - 1] - xGD[xGD.length - 1]**2)**2';
			dx = '2 * xCur * (200 * xCur**2 - 200 * yCur - 1)';
			dy = '200 * (yCur - xCur**2)';
			initialError = '(1 - x1)**2+100*(y1 - x1**2)**2';
			meanFunc = '(1 - xMean)**2+100*(yMean - xMean**2)**2';
			break;
		case 'Math.sin(10*(i**2+j**2))/10':
			startX = -1;
			endX = 1;
			startY = -1;
			endY = 1;
			incrValue = 0.01;
			curFunc = 'Math.sin(10*(xGD[xGD.length - 1]**2+yGD[yGD.length - 1]**2))/10';
			dx = '2 * yCur * Math.cos(10 * (xCur**2 + yCur**2))';
			dy = '2 * xCur * Math.cos(10 * (xCur**2 + yCur**2))';
			initialError = 'Math.sin(10*(x1**2+y1**2))/10';
			meanFunc = 'Math.sin(10*(xMean**2+yMean**2))/10';
			break;
		case 'Math.sin(5*i)*Math.cos(5*j)/5':
			startX = -1;
			endX = 1;
			startY = -1;
			endY = 1;
			incrValue = 0.01;
			curFunc = 'Math.sin(5*xGD[xGD.length - 1])*Math.cos(5*yGD[yGD.length - 1])/5';
			dx = 'Math.cos(5 * xCur) * Math.cos(5 * yCur)';
			dy = '-1 * Math.sin(5 * xCur) * Math.sin(5 * yCur)';
			initialError = 'Math.sin(5*x1)*Math.cos(5*y1)/5';
			meanFunc = 'Math.sin(5*xMean)*Math.cos(5*yMean)/5';
			break;
		default:
			break;
	}

	// layout2.yaxis = {range: [0, eval(initialError)]};

	for (i = startX; i < endX; i += incrValue) {
		for (j = startY; j < endY; j += incrValue) {
			xTemp.push(i);
			yTemp.push(j);
			zTemp.push(eval(func)); 
		}
		xVals.push(xTemp);
		yVals.push(yTemp);
		zVals.push(zTemp);
		xTemp = [];
		yTemp = [];
		zTemp = [];
	}

	data = [{
		opacity: 0.8,
		type: 'surface',
		x: xVals,
		y: yVals,
		z: zVals,
		showlegend: false,
		showscale: false
	},
	{
		x: xGD,
		y: yGD,
		z: zGD,
		mode: 'lines',
		type: 'scatter3d',
		marker: {
			color: 'rgb(0,0,0)',
			size: 3
		},
		showlegend: false,
	},
	{
		x: [],
		y: [],
		z: [],
		mode: 'markers',
		type: 'scatter3d',
		marker: {
			color: 'rgb(255,0,0)',
			size: 5
		},
		name: 'Average Vector'
	},
	{
		x: [],
		y: [],
		z: [],
		mode: 'markers',
		type: 'scatter3d',
		marker: {
			color: 'rgb(0,0,255)',
			size: 5
		},
		name: 'Best Vector'
	}];

	document.getElementById("LRInputSlider").innerHTML = learningRate;
	Plotly.newPlot('graph', data, layout);
	Plotly.newPlot('graph1', data2, layout2);

	myPlot.on('plotly_click', function(data) {
		for (var i = 0; i < data.points.length; i++) {
			let xIndex = data.points[i].pointNumber[0];
			let yIndex = data.points[i].pointNumber[1];
			
			x1 = xVals[yIndex][xIndex];
			y1 = yVals[yIndex][xIndex];
			document.getElementById("XInput").innerHTML = "Starting X = " + x1;
			document.getElementById("YInput").innerHTML = "Starting Y = " + y1;
		};
	fixAxis(zGD);
	});
}

// Explain gradient explosion
gradientExplosion = () => {
  	alert("Due to the choice of learning rate and/or starting location, the gradient has increased so much that it has caused an overflow.\nThis is known as Gradient Explosion.\nWays to counter this include capping the maximum size the new x and y can be, or by decreasing the learning rate.\nTry implementing either of these things using the check boxes and seeing how that affects the outcome.")
	reset();
}

// Gets called in the HTML for setting the type
updateVals = () => {
	switch (document.getElementById("type").value) {
		case "basic":
			type = "basic";
			break;
		case "batch":
			type = "batch";
			break;
		case "stochastic":
			type = "stochastic";
			break;
		default:
			break;
	}
}

// Defining a sign function that returns positive for zero
newSign = (x) => {
	if (x < 0.0) {
		return -1.0;
	} else {
		return 1.0;
	}
} 

// Resets the simulation
reset = () => {
	// Reinitialise everything
	let func = document.getElementById("datadropdown").value;
	xGD = [x1];
	yGD = [y1];
	zGD = [eval(initialError)];
	initEverything(func)
	// Mark the breakflag as true to break out of the set interval
	breakFlag = true;
}

// Function for updating the plot
updatePlot = () => {
	let xAxis = [0];
	let runPoint = 0;
	let iterations = document.getElementById("interationsInput").value;
	let learningRate = lrVals[document.getElementById("LRInput").value];
	let xGD = [x1];
	let yGD = [y1];
	let zGD = [eval(initialError)];

	document.getElementById("LRInputSlider").innerHTML = learningRate;

	// Use setInterval() to run this code segment every x miliseconds
	var run = setInterval(function() {
		let xGDlength = xGD.length;

		// This updates all the mathjax once at the end of the simulation
		if (xGDlength == iterations) {
			let xMean = xGD.reduce(function(a, b) { return a + b; }) / xGD.length;
			let yMean = yGD.reduce(function(a, b) { return a + b; }) / yGD.length;
			let bestZIndex = zGD.indexOf(Math.min(...zGD));

			var math = MathJax.Hub.getAllJax("averageVector")[0];
			MathJax.Hub.Queue(["Text", math,
				"\\left(\\begin{matrix}" +
				round(xMean, 2) + "\\\\" +
				round(yMean, 2) + "\\\\" +
				round(eval(meanFunc), 2) +
				"\\end{matrix}\\right)"
			]);

			var math = MathJax.Hub.getAllJax("bestVector")[0];
			MathJax.Hub.Queue(["Text", math,
				"\\left(\\begin{matrix}" +
				round(xGD[bestZIndex], 2) + "\\\\" +
				round(yGD[bestZIndex], 2) + "\\\\" +
				round(zGD[bestZIndex], 2) +
				"\\end{matrix}\\right)"
			]);

			var math = MathJax.Hub.getAllJax("finalVector")[0];
			MathJax.Hub.Queue(["Text", math,
				"\\left(\\begin{matrix}" +
				round(xGD[xGD.length - 1], 2) + "\\\\" +
				round(yGD[yGD.length - 1], 2) + "\\\\" +
				round(zGD[zGD.length - 1], 2) +
				"\\end{matrix}\\right)"
			]);

			var math = MathJax.Hub.getAllJax("finalError")[0];
			MathJax.Hub.Queue(["Text", math,
				round(zGD[zGD.length - 1], 2)
			]);

			if (zGD.slice(Math.floor(zGD.length * 0.9)).reduce(function(a, b) { return a + b; }) / Math.floor(zGD.length * 0.1) > 1) {
				document.getElementById("localMinima").innerHTML = "You are probably stuck in a local minima not the global minima.<br>Alternatively, it might be that more iterations are required to find the global minima."
			} else {
				document.getElementById("localMinima").innerHTML = "";
			}
		}

		// Since we use the setInterval() to run the loop slow enough to see the graph update, and it can't 
		// be stopped, we use this conditional to only update the graph only whilst we haven't reached the
		// number of iterations that has been set.
		if (xGDlength < iterations && breakFlag === false) {
			// This makes it so the Run Simulation button becomes Running... whilst the simulation is running
			if (runPoint == 0) {
				document.getElementById("runGD").innerHTML = "Runnning";
			} else if (runPoint == 5) {
				document.getElementById("runGD").innerHTML = "Runnning.";
			} else if (runPoint == 10) {
				document.getElementById("runGD").innerHTML = "Runnning..";
			} else if (runPoint == 15) {
				document.getElementById("runGD").innerHTML = "Runnning...";
			}
			if (runPoint < 20) {
				runPoint += 1;
			} else {
				runPoint = 0;
			}

			let xCur = xGD[xGD.length - 1];
			let yCur = yGD[yGD.length - 1];

			let nx = xCur - learningRate * eval(dx);
			if (Math.abs(nx) > clipValue && clipFlag == true) { nx = newSign(nx) * clipValue }

			let ny = yCur - learningRate * eval(dy);
			if (Math.abs(ny) > clipValue && clipFlag == true) { ny = newSign(ny) * clipValue }

			let nz = eval(curFunc);
			if (nz > MAXERROR) { gradientExplosion(); }

			if (nz > prevError && lrFlag == true) {
				learningRate = learningRate * 0.5;
				document.getElementById("LRInputSlider").innerHTML = learningRate;
				fixAxis(zGD);
			} else if (nz >= prevError && lrFlag == false) {
				fixAxis(zGD);
			} else if (nz <= prevError && lrFlag == true) {
				learningRate = learningRate * 1.25;
			}
			prevError = nz;

			// Different things are set to happen depending on the gradient descent method chosen
			switch (type) {
				case "basic":
					xGD.push(nx);
					yGD.push(ny);
					zGD.push(nz);
					break;
				case "stochastic":
					let randVal = Math.random();
					if (randVal < 0.5) {
						xGD.push(nx);
						yGD.push(yCur);
					} else {
						xGD.push(xCur);
						yGD.push(ny);
					}
					zGD.push(eval(curFunc));
					break;
				case "batch":
					if (xGDlength < Math.floor(iterations / 2)) {
						xGD.push(nx);
						yGD.push(yCur);
					} else {
						xGD.push(xCur);
						yGD.push(ny);
					}
					zGD.push(eval(curFunc));
					break;
				default:
					break;
				}

			xAxis.push(xAxis[xAxis.length - 1] + 1);

			let xMean = xGD.reduce(function(a, b) { return a + b; }) / xGD.length;
			let yMean = yGD.reduce(function(a, b) { return a + b; }) / yGD.length;

			// Update the surface plot with the new locaton of the balls and the lines
			Plotly.animate('graph', {
				data: [{
						opacity: 0.8,
						type: 'surface',
						x: xVals,
						y: yVals,
						z: zVals,
					},
					{
						x: xGD,
						y: yGD,
						z: zGD
					},
					{
						x: [xMean],
						y: [yMean],
						z: [eval(meanFunc)]
					},
					{
						x: [xGD[xGD.length - 1]],
						y: [yGD[yGD.length - 1]],
						z: [zGD[zGD.length - 1]]
					},
				],
				layout: {}
			}, {
				transition: {
					duration: 00,
					easing: 'cubic-in-out'
				},
				frame: {
					duration: 0
				}
			});
			// Update the error graph
			Plotly.animate('graph1', {
				data: [{
					x: xAxis,
					y: zGD
				}],
				layout: {}
			}, {
				transition: {
					duration: 00,
					easing: 'cubic-in-out'
				},
				frame: {
					duration: 0
				}
			});
			// If error gets too big then set breakflag
			if (zGD[zGD.length - 1] > MAXERROR) {
				breakFlag = true;
			}
		} else {
			// Resets the button to be Run Simulation when the number of iterations has been reached
			document.getElementById("runGD").innerHTML = "Run Simulation";
			// Ends the interval that is running
			clearInterval(run);
			// Reset if error got too big
			if (breakFlag === true) {
				reset();
			}
		}
	},
	// How long between each frame update
	100);
	// Make sure breakFlag is false
	breakFlag = false;
}

// Initialise everything
initEverything('1.25*(i + 6)**2 + (j - 8)**2');

// This stuff gets called when the runGD button is pressed
$("input[id=runGD]").each(function() {
	$(this).on('input', function() {
		$("#runGD").val(parseFloat(document.getElementById('runGD').value));
		updatePlot();
	});
});

// Any time of of the inputs changes (dropdown, slider, inputs etc.) this gets called
// It updates the layouts, data, etc. for the new values
$("input").each(function() {
	$(this).on("change", function() {
		iterations = document.getElementById("interationsInput").value;
		learningRate = lrVals[document.getElementById("LRInput").value];
		document.getElementById("LRInputSlider").innerHTML = learningRate;

		layout = {
			legend: {
				x: 0,
				y: 1
			},
			width: 600,
			height: 600,
			hovermode: "closest",
			showlegend: true,
		};

		// Error graph axis have a different size depending on number of iterations and initial error
		layout2 = {
			legend: {
				x: 0,
				y: 1
			},
			width: 600,
			height: 600,
			xaxis: {
				range: [0, iterations],
				zeroline: true,
				title: "Iteration"
			},
			yaxis: {
				range: [0, eval(initialError)],
				zeroline: true,
				title: "Error"
			},
			hovermode: "closest",
			showlegend: true,
			title: {
				text: "Absolute Error"
			}
		};

		// Update graph
		Plotly.react('graph', data, layout);
		Plotly.react('graph1', data2, layout2);
	});
});

$("input[id=\"clipping\"]").each(function () {
	$(this).on("change", function() {
		let val = document.getElementById("clipping").value;
		if (val === "off") {
			document.getElementById("clipping").value = "on";
			clipFlag = true;
		} else {
			document.getElementById("clipping").value = "off";
			clipFlag = false;
		}
	});
});

$("input[id=\"learningRateDecrease\"]").each(function () {
	$(this).on("change", function() {
		let val = document.getElementById("learningRateDecrease").value;
		if (val === "off") {
			document.getElementById("learningRateDecrease").value = "on";
			lrFlag = true;
		} else {
			document.getElementById("learningRateDecrease").value = "off";
			lrFlag = false;
		}
	});
});

// Sometimes the error will increase so the axis of the error graph will need to be changed on the fly
fixAxis = (zVals) => {
	layout2 = {
		legend: {
			x: 0,
			y: 1
		},
		width: 600,
		height: 600,
		xaxis: {
			range: [0, iterations],
			zeroline: true,
			title: "Iteration"
		},
		yaxis: {
			range: [Math.min(...zVals) * 1.1, Math.max(...zVals) * 1.1],
			zeroline: true,
			title: "Error"
		},
		hovermode: "closest",
		showlegend: true,
		title: {
			text: "Absolute Error"
		}
	};

	// Update graph
	Plotly.react('graph1', data2, layout2);
}