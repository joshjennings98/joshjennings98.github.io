var layout = {
  title: "Pure alcohol consumption<br>among adults (ages 15+) in 2010", 
  yaxis: {
    zeroline: false
  },
  yaxis2: {
    zeroline: false
  },
  width: 500, height: 700,
  yaxis: {zeroline: false, title: "Pure alcohol consumed in litres"},
}

var y2 = [
  -1.040e+0,
  1.970e-1,
  -9.770e-1,
  1.000e+0,
  -2.240e+0,
  -7.890e-1,
  6.360e+0,
  -2.920e+0,
  -6.940e-1,
  2.690e+0,
  1.360e+0,
  -2.340e+0,
  -1.870e+0,
  4.610e+0,
  -7.970e+0,
  -2.980e+0,
  4.130e+0,
  8.810e-1,
  2.210e+0,
  -1.770e+0,
];
var y1 = [
  1.230e+0,
  2.570e+0,
  2.000e+0,
  1.720e+0,
  -7.550e-1,
  -3.120e-1,
  3.730e+0,
  1.410e+0,
  3.910e-1,
  -3.160e+0,
  1.740e+0,
  -3.230e+0,
  -8.470e-2,
  2.070e+0,
  4.970e-1,
  1.040e+0,
  -1.650e+0,
  3.080e+0,
  8.240e-1,
  8.860e-1,
];
var y0 = [
  6.620e-2,
  -1.470e-1,
  -5.010e-1,
  -1.160e+0,
  1.390e+0,
  7.410e-1,
  4.060e-1,
  -6.750e-1,
  6.010e-1,
  3.400e-1,
  1.600e+0,
  -1.520e+0,
  1.100e+0,
  -9.700e-1,
  -9.960e-1,
  -6.580e-2,
  -6.910e-1,
  -1.890e+0,
  -1.520e+0,
  -2.050e+0,
];

var data = [];

var layout1 = [];

var yData = [];

getDataSet = (dataset) => {
  switch(dataset) {
    case "alcohol":
    console.log("case = alcohol")
      Plotly.d3.csv('https://raw.githubusercontent.com/plotly/datasets/master/2010_alcohol_consumption_by_country.csv', function(err, rows){
          function unpack(rows, key) {
              return rows.map(function(row) { return row[key]; });
          }
        var countries = unpack(rows, 'location');
        var alcoholConsumed = unpack(rows, 'alcohol');

        var list = [];
        for (var j = 0; j < countries.length; j++) 
            list.push({'country': countries[j], 'alcoholConsumption': alcoholConsumed[j]});
        list.sort(function(a, b) {
            return ((a.country < b.country) ? -1 : ((a.country == b.country) ? 0 : 1));
        });
        for (var k = 0; k < list.length; k++) {
            countries[k] = list[k].country;
            alcoholConsumed[k] = list[k].alcoholConsumption;
        }

        data = [{
                    mode: 'markers',
                    x: countries, 
                    y: alcoholConsumed, 
                    text: countries, 
                    
                }];

        layout1 = {
                title: 'Pure alcohol consumption<br>among adults (ages 15+) in 2010',
                width: 3500,
                height: 500,
                xaxis: {range: [0.8, 191], zeroline: true, title: "Country"},
                yaxis: {range: [0, 18], zeroline: true, title: "Pure alcohol in litres"},
            };

        yData = alcoholConsumed;
        });
        Plotly.plot('graph1', data, layout1, {showLink: false});
      break;
    default:
      break  
  }
}

updatePlot = (data) => {
  var yVals = data; 
  var box = {
    y: yVals,
    name: "Box Plot",
    type: 'box',
  };
  
  var violin = {
    y: yVals,
    name: "Violin Plot",
    type: 'violin',
    points: 'none',
    box: {
      visible: true
    },
    line: {
      color: 'green',
    },
    meanline: {
      visible: true
    },
  };
  
  var data = [box, violin];

  Plotly.newPlot('graph', data, layout);
}

getData = (x) => {
  switch (x) {
    case "1":
      getDataSet("alcohol");
      updatePlot(yData);
      document.getElementById("data").innerHTML = "Alcohol Global Dataset";
      break;
    case "2":
      updatePlot(y1);
      document.getElementById("data").innerHTML = "Apple stock price dataset";
      break;
    case "3":
      updatePlot(y2);
      document.getElementById("data").innerHTML = "Test Gaussian";
      break;
    default:
      break;
  }

}

getData("1");

$("datadropdown").each(function () {
  $(this).on('datadropdown', function(){
    //getData(document.getElementById("datadropdown").value);
  });
});

/*Tabs*/
$(function() {
  $('ul.tab-nav li a.button').click(function() {
      var href = $(this).attr('href');
      $('li a.active.button', $(this).parent().parent()).removeClass('active');
      $(this).addClass('active');
      $('.tab-pane.active', $(href).parent()).removeClass('active');
      $(href).addClass('active');

      return false;
  });
});




