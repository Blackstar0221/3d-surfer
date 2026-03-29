const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

let laneCenters = [];
let roadLineOffset = 0;

let player;
let obstacles;
let score;
let gameOver;
let spawnCounter;
let speed;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  laneCenters = [
    canvas.width / 6,
    canvas.width / 2,
    canvas.width * 5 / 6
  ];
}

function resetGame() {
  resizeCanvas();

  const playerWidth = Math.min(50, canvas.width * 0.12);
  const playerHeight = Math.min(70, canvas.height * 0.12);

  player = {
    lane: 1,
    x: laneCenters[1],
    y: canvas.height - 160,
    width: playerWidth,
    height: playerHeight,
    velocityY: 0,
    jumping: false
  };

  obstacles = [];
  score = 0;
  gameOver = false;
  spawnCounter = 0;
  speed = 7;
  roadLineOffset = 0;

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
    player.velocityY = -16;
    player.jumping = true;
  }
}

function spawnObstacle() {
  const size = Math.min(60, canvas.width * 0.12);
  const lane = Math.floor(Math.random() * 3);

  obstacles.push({
    lane: lane,
    x: laneCenters[lane] - size / 2,
    y: -size,
    width: size,
    height: size
  });
}

function update() {
  if (gameOver) return;

  const targetX = laneCenters[player.lane];
  player.x += (targetX - player.x) * 0.25;

  player.y += player.velocityY;
  player.velocityY += 0.9;

  const groundY = canvas.height - 160;
  if (player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.jumping = false;
  }

  roadLineOffset += speed;
  if (roadLineOffset > 80) {
    roadLineOffset = 0;
  }

  spawnCounter++;
  if (spawnCounter >= 45) {
    spawnObstacle();
    spawnCounter = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += speed;

    if (isColliding(player, obstacles[i])) {
      gameOver = true;
      messageEl.textContent = "Game Over 💥";
    }

    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;

      if (score % 5 === 0) {
        speed += 0.4;
      }
    }
  }
}

function isColliding(a, b) {
  return (
    a.x - a.width / 2 < b.x + b.width &&
    a.x + a.width / 2 > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawBackground() {
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#666";
  ctx.fillRect(0, canvas.height - 180, canvas.width, 180);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.setLineDash([35, 25]);

  for (let laneX = 1; laneX <= 2; laneX++) {
    for (let y = -100; y < canvas.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo((canvas.width / 3) * laneX, y + roadLineOffset);
      ctx.lineTo((canvas.width / 3) * laneX, y + 40 + roadLineOffset);
      ctx.stroke();
    }
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

  ctx.fillStyle = "white";
  ctx.fillRect(player.x - 12, player.y + 12, 8, 8);
  ctx.fillRect(player.x + 4, player.y + 12, 8, 8);
}

function drawObstacles() {
  ctx.fillStyle = "#00aa55";

  for (const obstacle of obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

function draw() {
  drawBackground();
  drawPlayer();
  drawObstacles();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
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

window.addEventListener("resize", () => {
  const oldLane = player ? player.lane : 1;
  resizeCanvas();

  if (player) {
    player.lane = oldLane;
    player.x = laneCenters[player.lane];
    player.y = canvas.height - 160;
  }
});

resetGame();
loop();
