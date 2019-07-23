//Global Initial Parameters:
var initialPoint = [1.0];
var layout = {
    width: 1000, height: 450,
    margin: {l:30, r:30, t:30, b:30},
    hovermode: "closest",
    showlegend: false,
    xaxis: {range: [-4*Math.PI, 4*Math.PI], zeroline: true, title: "x"},
    yaxis: {range: [-1.5, 1.5], zeroline: true, title: "y"},
    aspectratio: {x:1, y:1}
};
var currentPoint = initialPoint;
var initialX = 0;

var isCurved = false;
var curveType = '';

/**
 * Returns sign but with 1 if input = 0
 * @param {int} type - input
 */
sign2 = (x) => {
    if (x >= 0) {
        return 1;
    } else {
        return -1;
    }
}

//Plot
/**
 * Resets and plots Sigmoid curve.
 */
initSigmoid = () => {
    Plotly.purge("graph");
    initialX = currentPoint[0];

    $("#controllerA").val(initialX);
    $("#controllerADisplay").text(initialX);
    

    let a = parseFloat(document.getElementById('controllerA').value);
    
    
    Plotly.newPlot("graph", computeGraphValues(a), layout);
    
    return;
}

/**
 * Computes sigmoid y = a * sigmoid(b * x + c) + d.
 * @param {float} x - x value.
 * @param {float} a - a value.
 * @param {float} b - b value.
 * @param {float} c - c value.
 * @param {float} d - d value.
 */
sigmoid = (x, a, b, c, d) => {
    let y = a / (1 + Math.pow(Math.E, -(b * x + c))) + d
    return y;
}

/**
 * Computes the array of values used for the graph.
 * @param {float} a - a value.
 */
computeGraphValues = (a) => {

    var sampleRate = a;

    xTerms = [];
    yterms = [];

    xTermsProper = [];
    yTermsProper = [];

    xTermMarkers = [];
    yTermMarkers = [];   

    for (i = -5*Math.PI; i <= 5*Math.PI; i += 0.05) {
        xTermsProper.push(i);
        yTermsProper.push(Math.sin(i));
    }

    switch(sampleRate) {
        case 1.0:
            for (i = -5*Math.PI; i <= 4.5*Math.PI; i += 2*Math.PI) {
                xTerms.push(i - Math.PI);
                yterms.push(-100);
            }
            for (i = -3.75*Math.PI; i <= 5.5*Math.PI; i += 2*Math.PI) {
                xTermMarkers.push(i);
                yTermMarkers.push(Math.sin(i));
            }
            break;
        case 1.5:
                for (i = -3.75*Math.PI; i <= 4.5*Math.PI; i += 0.05) {
                    xTerms.push(i - Math.PI - 0.25 * Math.PI);
                    yterms.push(Math.sin(i / 2));
                }
                for (i = -3.75*Math.PI; i <= 4.5*Math.PI; i += 2 * Math.PI / 1.5) {
                    xTermMarkers.push(i);
                    yTermMarkers.push(Math.sin(i));
                }
            break;
        default:
            for (i = -3.75*Math.PI; i <= 4.5*Math.PI; i += 0.05) {
                xTerms.push(i);
                yterms.push(100);
            }
            for (i = -3.75*Math.PI; i <= 4.5*Math.PI; i += 2 * Math.PI / sampleRate) {
                xTermMarkers.push(i);
                yTermMarkers.push(Math.sin(i));
            }
            break;
    }

    if (a === 2) {
        yterms = yterms.map(el => 0.7 * el)
    }

    let graph = {
        type: "scatter",
        mode: "lines",
        x: xTerms,
        y: yterms,
        line: {simplify: false, color: 'rgb(200,200,200)', width: 4, shape: curveType,}, //, shape: 'spline'},
        opacity: 1
    }
    
    let graphMarkers = {
        type: "scatter",
        mode: "lines+markers",
        x: xTermMarkers,
        y: yTermMarkers,
        marker: {size: 15, opacity: 1.0, color: 'rgb(0,0,0)'},
        line: {simplify: false, color: 'rgb(255,0,0)', width: 4},
        opacity: 1        
    }

    let graphProper = {
        type: "scatter",
        mode: "lines",
        x: xTermsProper,
        y: yTermsProper,
        line: {simplify: false, color: 'rgb(0,0,255)', width: 4, shape: 'spline'},
        opacity: 0.5
    }

    return [
        graphProper,
        graph,
        graphMarkers
        ];
}

/** updates the plot according to the slider controls. */
updatePlot = () => {
    let data = [];

    let x = parseFloat(document.getElementById('controllerA').value);

    if (x == 1) {
        document.getElementById("chatAboutSignal").innerHTML = "At a sample rate of 1 time per cycle, the reconstructed signal is a straight line instead of a sine wave.";
    } else if (x == 1.5) {
        document.getElementById("chatAboutSignal").innerHTML = "At a sample rate of lower than 2 times per sample, there is the issue that the signal could be interpreted as another sine wave with a different frequency as can be seen with the grey curve.";
    } else if (x == 2.0) {
        document.getElementById("chatAboutSignal").innerHTML = "At a sample rate of 2 times per cycle, the reconstructed signal has the correct frequency, but the amplitude may be incorrect, as can be seen if you compare the red line to the blue line. This is due to a lag between the input and output of the conversion from analogue to digital which creates a phase shift. If you were really unlucky you could get a straight line if you happened to sample the wave every half cycle.";
    } else if (x < 6.0) {
        document.getElementById("chatAboutSignal").innerHTML = "At a sample rate of above two times per sample, the frequency is known and the amplitude can be inferred so the signal can be recreated faithfully, although this can be difficult if the sample rate is quite low.";
    } else {
        document.getElementById("chatAboutSignal").innerHTML = "The more samples that are taken, the better the representation of the signal.";
    }

    data = computeGraphValues(x);

    Plotly.animate(
        'graph',
        {data: data},
        {
            fromcurrent: true,
            transition: {duration: 0,},
            frame: {duration: 0, redraw: false,},
            mode: "afterall"
        }
    );
}

main = () => {
    /*Jquery*/ //NB: Put Jquery stuff in the main not in HTML
    $("input").each(function () {
        /*Allows for live update for display values*/
        $(this).on('input', function(){
            //Displays: (FLT Value) + (Corresponding Unit(if defined))
            $("#"+$(this).attr("id") + "Display").text( $(this).val() + $("#"+$(this).attr("id") + "Display").attr("data-unit") );

            updatePlot(); //Updating the plot is linked with display (Just My preference)
        });
    });


    $("input[type=checkbox]").each(function () {
        $(this).on("change", function() {
            isCurved = !isCurved;
            if (isCurved) {
                curveType = 'spline';
            } else {
                curveType = '';
            }

            updatePlot();
        });
        initSigmoid();
    });

    /*Tabs*/
    $(function() {
        $('ul.tab-nav li a.button').click(function() {
            var href = $(this).attr('href');
            $('li a.active.button', $(this).parent().parent()).removeClass('active');
            $(this).addClass('active');
            $('.tab-pane.active', $(href).parent()).removeClass('active');
            $(href).addClass('active');

            initSigmoid(); //re-initialise when tab is changed
            return false;
        });
    });

    initSigmoid();
}
$(document).ready(main); //Load main when document is ready.