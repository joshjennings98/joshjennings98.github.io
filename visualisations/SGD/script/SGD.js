// To Do:
// 
// Remove eval() since its apparently quite bad :(
// Remove absolute pixel sizes (less important).
// 
// Add more learning rate values, add more functions, add popup explaning why it seems to break

var myPlot = document.getElementById('graph')
var x1 = -100;
var y1 = -100;
var initialError = '1.25 * (x1 + 6) ** 2 + (y1 - 8) ** 2';
var lrVals = [0.0000005, 0.001, 0.003, 0.005, 0.007, 0.01, 0.03, 0.05, 0.07, 0.1, 0.3, 0.5, 0.7]
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
var MAXERROR = 2**6400;
var clipValue = 1000;

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
			startX = -200;
			endX = 200;
			startY = -100;
			endY = 300;
			incrValue = 10;
			curFunc = '(1 - xGD[xGD.length - 1])**2+100*(yGD[yGD.length - 1] - xGD[xGD.length - 1]**2)**2';
			dx = '2 * xCur * (200 * xCur**2 - 200 * yCur - 1)';
			dy = '200 * (yCur - xCur**2)';
			initialError = '(1 - x1)**2+100*(y1 - x1**2)**2';
			meanFunc = '(1 - xMean)**2+100*(yMean - xMean**2)**2';
			break;
		default:
			break;
	}

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
	}
];

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
	});
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
	console.log("Reset.")
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

	console.log('Learning Rate:', learningRate);
	console.log('Iterations:', iterations);
	console.log('Type:', type);
	console.log('Initial x:', x1);
	console.log('Initial y:', y1);
	console.log('Initial Error', eval(initialError));

	// Use setInterval() to run this code segment every x miliseconds
	var run = setInterval(function() {
		let xGDlength = xGD.length;

		// This updates all the mathjax once at the end of the simulation
		if (xGDlength == iterations) {
			let xMean = xGD.reduce(function(a, b) { return a + b; }) / xGD.length;
			let yMean = yGD.reduce(function(a, b) { return a + b; }) / yGD.length;

			var math = MathJax.Hub.getAllJax("averageVector")[0];
			MathJax.Hub.Queue(["Text", math,
				"\\left(\\begin{matrix}" +
				round(xMean, 2) + "\\\\" +
				round(yMean, 2) + "\\\\" +
				round(1.25 * (xMean + 6) ** 2 + (yMean - 8) ** 2, 2) +
				"\\end{matrix}\\right)"
			]);

			var math = MathJax.Hub.getAllJax("bestVector")[0];
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

			console.log('Final Error: ', zGD[zGD.length - 1]);
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

			// Different things are set to happen depending on the gradient descent method chosen
			switch (type) {
				case "basic":
					let nx = xCur - learningRate * eval(dx);
					if (Math.abs(nx) > clipValue) { nx = newSign(nx) * clipValue; learningRate = learningRate / 2.0;}
					console.log(nx)
					let ny = yCur - learningRate * eval(dy);
					if (Math.abs(ny) > clipValue) { ny = newSign(ny) * clipValue; learningRate = learningRate / 2.0; }
					console.log(ny)
					xGD.push(nx);
					yGD.push(ny);
					zGD.push(eval(curFunc));

					console.log("\nX Adjust: ", round(xCur, 4) + ' - ' + learningRate + ' * ' + round(eval(dx), 4) + ' = ' + round(nx, 4))
					console.log("Y Adjust: ", round(yCur, 4) + ' - ' + learningRate + ' * ' + round(eval(dy), 4) + ' = ' + round(ny, 4))
					console.log("New Error: ", eval(curFunc) + "\n")

					console.log("xCur^3", round(xCur**3, 4), "\nnewxCur", round(xCur - learningRate * eval(dx), 4))


					break;
				case "stochastic":
					let randVal = Math.random();
					if (randVal < 0.5) {
						xGD.push(xCur - learningRate * eval(dx));
						yGD.push(yCur);
					} else {
						xGD.push(xCur);
						yGD.push(yCur - learningRate * eval(dy));
					}
					zGD.push(eval(curFunc));
					break;
				case "batch":
					if (xGDlength < Math.floor(iterations / 2)) {
						xGD.push(xCur - learningRate * eval(dx));
						yGD.push(yCur);
					} else {
						xGD.push(xCur);
						yGD.push(yCur - learningRate * eval(dy));
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
		console.log("Starting Simulation");
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

		console.log("test", initialError);

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
