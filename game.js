const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

let width, height;
let laneWidth;
let lanes;

let player;
let obstacles;
let roadOffset;
let score;
let gameOver;
let gameSpeed;
let spawnTimer;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  width = canvas.width;
  height = canvas.height;

  laneWidth = width / 3;
  lanes = [laneWidth * 0.5, laneWidth * 1.5, laneWidth * 2.5];
}

function resetGame() {
  resizeCanvas();

  player = {
    lane: 1,
    x: lanes[1],
    y: height - 140,
    width: Math.min(60, width * 0.12),
    height: Math.min(80, height * 0.12),
    vy: 0,
    jumping: false
  };

  obstacles = [];
  roadOffset = 0;
  score = 0;
  gameOver = false;
  gameSpeed = Math.max(8, height * 0.012);
  spawnTimer = 0;

  scoreEl.textContent = score;
  messageEl.textContent = "";
}

function moveLeft() {
  if (gameOver) return;
  if (player.lane > 0) {
    player.lane--;
  }
}

function moveRight() {
  if (gameOver) return;
  if (player.lane < 2) {
    player.lane++;
  }
}

function jump() {
  if (gameOver) return;
  if (!player.jumping) {
    player.vy = -18;
    player.jumping = true;
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const size = Math.min(70, width * 0.13);

  obstacles.push({
    lane: lane,
    x: lanes[lane] - size / 2,
    y: -size,
    width: size,
    height: size
  });
}

function update() {
  if (gameOver) return;

  player.x += (lanes[player.lane] - player.x) * 0.25;

  player.y += player.vy;
  player.vy += 0.9;

  const groundY = height - 140;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.jumping = false;
  }

  roadOffset += gameSpeed;
  if (roadOffset > 80) {
    roadOffset = 0;
  }

  spawnTimer++;
  if (spawnTimer > 50) {
    spawnObstacle();
    spawnTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += gameSpeed;

    if (checkCollision(player, obstacles[i])) {
      gameOver = true;
      messageEl.textContent = "Game Over 💥";
    }

    if (obstacles[i].y > height) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;

      if (score % 5 === 0) {
        gameSpeed += 0.5;
      }
    }
  }
}

function checkCollision(a, b) {
  return (
    a.x - a.width / 2 < b.x + b.width &&
    a.x + a.width / 2 > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawBackground() {
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(0, height - 160, width, 160);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.setLineDash([30, 20]);

  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneWidth, 0);
    ctx.lineTo(i * laneWidth, height);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  ctx.fillStyle = "#555";
  ctx.fillRect(0, height - 120, width, 120);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.setLineDash([40, 30]);

  for (let i = -1; i < 20; i++) {
    const y = i * 80 + (roadOffset % 80);
    ctx.beginPath();
    ctx.moveTo(laneWidth, y);
    ctx.lineTo(laneWidth, y + 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(laneWidth * 2, y);
    ctx.lineTo(laneWidth * 2, y + 40);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawPlayer() {
  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(
    player.x - player.width / 2,
    player.y,
    player.width,
    player.height
  );

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    player.x - player.width / 4,
    player.y + 15,
    player.width / 6,
    player.width / 6
  );
  ctx.fillRect(
    player.x + player.width / 12,
    player.y + 15,
    player.width / 6,
    player.width / 6
  );
}

function drawObstacles() {
  ctx.fillStyle = "#00aa55";
  for (const obs of obstacles) {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  }
}

function draw() {
  drawBackground();
  drawPlayer();
  drawObstacles();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp" || e.code === "Space") jump();
});

leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);
jumpBtn.addEventListener("click", jump);

leftBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  moveLeft();
});

rightBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  moveRight();
});

jumpBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  jump();
});

restartBtn.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

resetGame();
gameLoop();
