
let xspacing = 1; // Distance between each horizontal location
let w; // Width of entire wave
let theta = 0.0; // Start angle at 0
let amplitude = 70.0; // Height of wave
let period = 125.0; // How many pixels before the wave repeats
let dx; // Value for incrementing x
let yvalues; // Using an array to store height values for the wave

function setup() {

  var canvas=createCanvas(1000, 300);
  
  
  canvas.parent('ADCanimation');

  
  w = width / 3 + 16;
  dx = -1 * (TWO_PI / period) * xspacing;
  yvalues = new Array(floor(3 * w / xspacing));
}

function draw() {
  background(255);
  calcWave();
  renderWave();
  fill(135, 206, 250);
  rect(4 * width / 10,0.2 * height ,2 * width / 10, 0.6 * height, 20);
  line(0.6 * width, height / 2, width, height / 2)
  textSize(20);

  let s = 'Analogue to Digital Converter';
  fill(0);
  text(s, width / 2 - 47, height / 2 - 45, 70, 200);
  text("Continuous Signal", width / 8, height / 10, 200, 100);
  text("Sampled Signal", 6 * width / 8, height / 10, 200, 100);
}

function calcWave() {
  theta += 0.02;
  let x = theta;
  for (let i = 0; i < yvalues.length; i++) {
    yvalues[i] = sin(x) * amplitude;
    x += dx;
  }
}

function renderWave() {
  noStroke();
  fill(0);
  for (let x = 0; x < yvalues.length; x++) {
    if (x < yvalues.length / 2.5) {
      ellipse(x, height / 2 + yvalues[x], 8, 8);
    } else if (x > yvalues.length / 2.5 && (x % 16 == 0)) {
      ellipse(x, height / 2 + yvalues[x], 8, 8);
      line(x, height / 2, x, height / 2 + yvalues[x]);
      stroke(0);
    } 
    
  }
}
