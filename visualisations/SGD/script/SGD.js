let iterations = document.getElementById("interationsInput").value;

x1 = parseInt(document.getElementById("XInput").value);
y1 = parseInt(document.getElementById("YInput").value);
initialError = 1.25*(x1 + 6)**2 + (y1 - 8)**2;

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

var layout = {
  legend: {
    x: 0,
    y: 1
  },
  width: 600, height: 600,
  //margin: {l:30, r:30, t:30, b:30},
  hovermode: "closest",
  showlegend: true,
  //aspectratio: {x:1, y:1},
  title: {text: "How Gradient Descent finds the minimum of a plane"}
}

var layout2 = {
  legend: {
    x: 0,
    y: 1
  },
  width: 600, height: 700,
  xaxis: {range: [0, iterations], zeroline: true, title: "Iteration"},
  yaxis: {range: [0, initialError], zeroline: true, title: "Error"},
  hovermode: "closest",
  showlegend: true,
  title: {text: "Absolute Error against Number of Iterations"}
}

let x = [];
let y = [];
let z = [];

let c = 0;

var isStochastic = false;

for (i = -100; i < 100; i+=5) {
  for (j = -100; j < 100; j+=5) {
    x.push(i);
    y.push(j);
    z.push(1.25*(i + 6)**2 + (j - 8)**2);
  }
}

let xGD = [];
let yGD = [];
let zGD = [];

var type = "basic";

updateVals = () => {
  switch(document.getElementById("type").value) {
    case "basic":
      type = "basic"
      break;
    case "batch":
      type = "batch"
      break;
    case "stochastic":
      type = "stochastic"
      break;
    default:
      console.log('This should not happen.')
      break;
  }
}

randomIntFromInterval = (min,max) => {
    return Math.floor(Math.random()*(max-min+1)+min);
}

let currentAverage = [];

updatePlot = () => {
  
  let iterations = document.getElementById("interationsInput").value;
  let learningRate = document.getElementById("LRInput").value;

  console.log('Learning Rate:', learningRate)
  console.log('Iterations:', iterations)
  console.log('Type:', type)

  //xGD = [-100];
  //yGD = [100];
  xGD = [parseInt(document.getElementById("XInput").value)];
  yGD = [parseInt(document.getElementById("YInput").value)];
  zGD = [1.25*(xGD[0] + 6)**2 + (yGD[0] - 8)**2];
  //zGD = [1.25*(-6 + 6)**2 + (8 - 8)**2];

  let xAxis = [0];

  let runPoint = 0;
  let it = -1;

  var run = setInterval(function() {

    it = it + 1;

    let xGDlength = xGD.length;  

    if (it == iterations) {
      let xMean = xGD.reduce(function(a, b) { return a + b; }) / xGD.length;
      let yMean = yGD.reduce(function(a, b) { return a + b; }) / yGD.length;
      var math = MathJax.Hub.getAllJax("averageVector")[0];
      MathJax.Hub.Queue(["Text",math,
      "\\left(\\begin{matrix}" +
        round(xMean, 2) + "\\\\" +
        round(yMean, 2) + "\\\\" +
        round(1.25*(xMean + 6)**2 + (yMean - 8)**2, 2) + 
        "\\end{matrix}\\right)"
      ]);
      var math = MathJax.Hub.getAllJax("bestVector")[0];
      MathJax.Hub.Queue(["Text",math,
      "\\left(\\begin{matrix}" +
        round(xGD[xGD.length-1], 2) + "\\\\" +
        round(yGD[yGD.length-1], 2) + "\\\\" +
        round(zGD[zGD.length-1], 2) + 
        "\\end{matrix}\\right)"
      ]);
      var math = MathJax.Hub.getAllJax("finalError")[0];
      MathJax.Hub.Queue(["Text",math,
        round(zGD[zGD.length-1], 2)
      ]);
      
    }

    if (xGDlength < iterations) {

      if (runPoint == 0) {
        document.getElementById("runGD").innerHTML = "Runnning"
      } else if (runPoint == 5) {
        document.getElementById("runGD").innerHTML = "Runnning."
      } else if (runPoint == 10) {
        document.getElementById("runGD").innerHTML = "Runnning.."
      } else if (runPoint == 15) {
        document.getElementById("runGD").innerHTML = "Runnning..."
      }

      if (runPoint < 20) {
        runPoint += 1;
      } else {
        runPoint = 0;
      }

      let xCur = xGD[xGD.length - 1];
      let yCur = yGD[yGD.length - 1];

         

      if (type == "basic") {
        xGD.push(xCur - learningRate * (2.5 * xCur + 15));
        yGD.push(yCur - learningRate * (2 * yCur - 16));
        zGD.push(1.25*(xGD[xGD.length - 1] + 6)**2 + (yGD[yGD.length - 1] - 8)**2);
      } else if (type == "stochastic") {
        let randVal = Math.random();
        if (randVal < 0.5) {
          xGD.push(xCur - learningRate * (2.5 * xCur + 15));
          yGD.push(yCur);
        } else {
          xGD.push(xCur)
          yGD.push(yCur - learningRate * (2 * yCur - 16));
        }
        zGD.push(1.25*(xGD[xGD.length - 1] + 6)**2 + (yGD[yGD.length - 1] - 8)**2);
      } else if (type == "batch") {
        if (xGDlength < Math.floor(iterations / 2)) {
          xGD.push(xCur - learningRate * (2.5 * xCur + 15));
          yGD.push(yCur);
        } else {
          xGD.push(xCur)
          yGD.push(yCur - learningRate * (2 * yCur - 16));
        }
        zGD.push(1.25*(xGD[xGD.length - 1] + 6)**2 + (yGD[yGD.length - 1] - 8)**2);
      }

      xAxis.push(xAxis[xAxis.length - 1] + 1);

      let xMean = xGD.reduce(function(a, b) { return a + b; }) / xGD.length;
      let yMean = yGD.reduce(function(a, b) { return a + b; }) / yGD.length;
      

      Plotly.animate('graph', {
        data: [
          {
            opacity:0.15,
            color:'rgb(0,0,0)',
            type: 'mesh3d',
            x: x,
            y: y,
            z: z,
          },
          {x: xGD, y: yGD, z: zGD},
          {x: [xMean], y: [yMean], z: [1.25*(xMean + 6)**2 + (yMean - 8)**2]},
          {x: [xGD[xGD.length-1]], y: [yGD[yGD.length-1]], z: [zGD[zGD.length-1]]},
          
          //{x: xAxis, y: zGD}
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
      })
      Plotly.animate('graph1', {
        data: [          
          {x: xAxis, y: zGD}
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
      })
    } else {
      document.getElementById("runGD").innerHTML = "Run Simulation";
    }
  },
  100);
  
  
}

var data=[
  {
    opacity:0.15,
    color:'rgb(0,0,0)',
    type: 'mesh3d',
    x: x,
    y: y,
    z: z,
    showlegend: false,
  },
  {
    x: xGD,
    y: yGD,
    z: zGD,
    mode: 'lines',
    type: 'scatter3d',
    marker: {color: 'rgb(0,0,0)', size: 3},
    showlegend: false,
  },
  {
    x: [],
    y: [],
    z: [],
    mode: 'markers',
    type: 'scatter3d',
    marker: {color: 'rgb(255,0,0)', size: 5},
    name: 'Average Vector'
  },
  {
    x: [],
    y: [],
    z: [],
    mode: 'markers',
    type: 'scatter3d',
    marker: {color: 'rgb(0,0,255)', size: 5},
    name: 'Best Vector'
  },


];

var data2 = [
  {
    x: [],
    y: [],
    mode: 'lines',
    type: 'scatter',
    name: 'Absolute Error',
    xaxis: 'x1',
    yaxis: 'y1',
  }
]


Plotly.newPlot('graph', data, layout);
Plotly.newPlot('graph1', data2, layout2);


$("input[id=runGD]").each(function () {
  $(this).on('input', function(){
      $("#runGD").val(parseFloat(document.getElementById('runGD').value));
      console.log("Starting Simulation")
      updatePlot();
  });
});

$("input").each(function () {
  $(this).on("change", function() {
    iterations = document.getElementById("interationsInput").value;


    x1 = parseInt(document.getElementById("XInput").value);
    y1 = parseInt(document.getElementById("YInput").value);
    initialError = 1.25*(x1 + 6)**2 + (y1 - 8)**2;

    layout = {
      legend: {
        x: 0,
        y: 1
      },
      width: 600, height: 600,
      //margin: {l:30, r:30, t:30, b:30},
      hovermode: "closest",
      showlegend: true,
      //aspectratio: {x:1, y:1},
    }
    
    layout2 = {
      legend: {
        x: 0,
        y: 1
      },
      width: 600, height: 600,
      xaxis: {range: [0, iterations], zeroline: true, title: "Iteration"},
      yaxis: {range: [0, initialError], zeroline: true, title: "Error"},
      hovermode: "closest",
      showlegend: true,
      title: {text: "Absolute Error"}
    }

    Plotly.react('graph', data, layout);
    Plotly.react('graph1', data2, layout2);
  });
});

$("input[type=checkbox]").each(function () {
  $(this).on("change", function() {
      isStochastic = !isStochastic;
      if (isStochastic) {
          type = "stochastic";
      } else {
          type = "basic";
      }
  });
});

