const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lane = 1;
let lanes = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  lanes = [canvas.width * 0.3, canvas.width * 0.5, canvas.width * 0.7];
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // sky
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, w, h);

  // ground
  ctx.fillStyle = "#d9c38c";
  ctx.fillRect(0, h * 0.3, w, h * 0.7);

  // track
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.3);
  ctx.lineTo(w * 0.58, h * 0.3);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.closePath();
  ctx.fill();

  // lane lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(w * 0.47, h * 0.3);
  ctx.lineTo(w * 0.35, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.53, h * 0.3);
  ctx.lineTo(w * 0.65, h);
  ctx.stroke();

  // player
  const playerX = lanes[lane];
  const playerY = h * 0.8;

  ctx.fillStyle = "red";
  ctx.fillRect(playerX - 25, playerY - 50, 50, 50);

  requestAnimationFrame(draw);
}

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowLeft" && lane > 0) lane--;
  if (e.key === "ArrowRight" && lane < 2) lane++;
});

document.getElementById("leftBtn").addEventListener("click", function () {
  if (lane > 0) lane--;
});

document.getElementById("rightBtn").addEventListener("click", function () {
  if (lane < 2) lane++;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
draw();
