const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let x = canvas.width / 2 - 25;
let y = canvas.height - 120;
let lane = 1;
let lanes = [];

function updateLanes() {
  lanes = [canvas.width / 6, canvas.width / 2, canvas.width * 5 / 6];
  x = lanes[lane] - 25;
}

updateLanes();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "gray";
  ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

  ctx.fillStyle = "red";
  ctx.fillRect(x, y, 50, 50);

  requestAnimationFrame(draw);
}

document.addEventListener("keydown", function(e) {
  if (e.key === "ArrowLeft" && lane > 0) {
    lane--;
    updateLanes();
  }
  if (e.key === "ArrowRight" && lane < 2) {
    lane++;
    updateLanes();
  }
});

document.getElementById("leftBtn").addEventListener("click", function() {
  if (lane > 0) {
    lane--;
    updateLanes();
  }
});

document.getElementById("rightBtn").addEventListener("click", function() {
  if (lane < 2) {
    lane++;
    updateLanes();
  }
});

draw();
