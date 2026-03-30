const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const messageEl = document.getElementById("message");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

let lane = 1;
let gameStarted = false;
let gameOver = false;
let score = 0;
let frameCount = 0;
let obstacles = [];
let coinsOnTrack = [];

let playerJump = 0;
let jumpVelocity = 0;
let jumping = false;

let w = 0;
let h = 0;

const saveKeyCoins = "runnerCoins";
const saveKeyTheme = "runnerTheme";
const saveKeyOwnedThemes = "runnerOwnedThemes";

const themes = {
  desert: {
    skyTop: "#ff9966",
    skyBottom: "#ffd699",
    ground: "#d8b06a",
    road: "#6b4f2a",
    line: "#fff3c4",
    deco: "#c97e3a"
  },
  snow: {
    skyTop: "#bfe9ff",
    skyBottom: "#eefaff",
    ground: "#f4f8ff",
    road: "#9aa4b2",
    line: "#ffffff",
    deco: "#d9ecff"
  },
  city: {
    skyTop: "#6a85b6",
    skyBottom: "#bac8e0",
    ground: "#7a7a7a",
    road: "#2d2d2d",
    line: "#f8f8f8",
    deco: "#444"
  },
  lego: {
    skyTop: "#7ad7ff",
    skyBottom: "#dff8ff",
    ground: "#ffd54f",
    road: "#ff3b30",
    line: "#ffffff",
    deco: "#34c759"
  },
  lunar: {
    skyTop: "#0f1021",
    skyBottom: "#2b2d42",
    ground: "#bfc5ce",
    road: "#6c757d",
    line: "#f1f3f5",
    deco: "#9098a1"
  }
};

function getCoins() {
  return Number(localStorage.getItem(saveKeyCoins) || "0");
}

function setCoins(value) {
  localStorage.setItem(saveKeyCoins, String(value));
}

function getOwnedThemes() {
  const raw = localStorage.getItem(saveKeyOwnedThemes);
  if (raw) return JSON.parse(raw);
  const defaults = ["desert"];
  localStorage.setItem(saveKeyOwnedThemes, JSON.stringify(defaults));
  return defaults;
}

function getCurrentThemeName() {
  return localStorage.getItem(saveKeyTheme) || "desert";
}

function getCurrentTheme() {
  return themes[getCurrentThemeName()] || themes.desert;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  w = canvas.width;
  h = canvas.height;
}

function resetGame() {
  lane = 1;
  gameStarted = false;
  gameOver = false;
  score = 0;
  frameCount = 0;
  obstacles = [];
  coinsOnTrack = [];
  playerJump = 0;
  jumpVelocity = 0;
  jumping = false;

  scoreEl.textContent = "0";
  coinsEl.textContent = getCoins();
  messageEl.textContent = "Press Start to begin.";
  drawScene();
}

function moveLeft() {
  if (!gameStarted || gameOver) return;
  if (lane > 0) lane--;
}

function moveRight() {
  if (!gameStarted || gameOver) return;
  if (lane < 2) lane++;
}

function jump() {
  if (!gameStarted || gameOver) return;
  if (!jumping) {
    jumping = true;
    jumpVelocity = 18;
  }
}

function getRoadEdgesAtDepth(depth) {
  const topY = h * 0.3;
  const bottomY = h;
  const y = topY + (bottomY - topY) * depth;

  const leftTop = w * 0.42;
  const rightTop = w * 0.58;
  const leftBottom = w * 0.05;
  const rightBottom = w * 0.95;

  const leftX = leftTop + (leftBottom - leftTop) * depth;
  const rightX = rightTop + (rightBottom - rightTop) * depth;

  return { y, leftX, rightX };
}

function getLaneX(laneIndex, depth) {
  const edges = getRoadEdgesAtDepth(depth);
  const roadWidth = edges.rightX - edges.leftX;
  const laneWidth = roadWidth / 3;
  return edges.leftX + laneWidth * (laneIndex + 0.5);
}

function spawnObstacle() {
  const obstacleLane = Math.floor(Math.random() * 3);
  obstacles.push({
    lane: obstacleLane,
    depth: 0
  });
}

function spawnCoin() {
  const coinLane = Math.floor(Math.random() * 3);
  coinsOnTrack.push({
    lane: coinLane,
    depth: 0.1
  });
}

function updateJump() {
  if (!jumping) return;

  playerJump += jumpVelocity;
  jumpVelocity -= 1.1;

  if (playerJump <= 0) {
    playerJump = 0;
    jumpVelocity = 0;
    jumping = false;
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].depth += 0.018;

    if (obstacles[i].depth > 1.05) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;
      continue;
    }

    if (obstacles[i].lane === lane && obstacles[i].depth > 0.82 && obstacles[i].depth < 0.98) {
      if (playerJump < 60) {
        gameOver = true;
        gameStarted = false;
        messageEl.textContent = "Game Over!";
      }
    }
  }
}

function updateCoinsOnTrack() {
  for (let i = coinsOnTrack.length - 1; i >= 0; i--) {
    coinsOnTrack[i].depth += 0.018;

    if (coinsOnTrack[i].depth > 1.05) {
      coinsOnTrack.splice(i, 1);
      continue;
    }

    if (coinsOnTrack[i].lane === lane && coinsOnTrack[i].depth > 0.78 && coinsOnTrack[i].depth < 0.96) {
      if (playerJump < 90 || jumping) {
        coinsOnTrack.splice(i, 1);
        const totalCoins = getCoins() + 1;
        setCoins(totalCoins);
        coinsEl.textContent = totalCoins;
      }
    }
  }
}

function drawDecorations(theme) {
  if (getCurrentThemeName() === "desert") {
    ctx.fillStyle = theme.deco;
    ctx.fillRect(w * 0.1, h * 0.24, 35, 90);
    ctx.fillRect(w * 0.85, h * 0.22, 35, 100);
  }

  if (getCurrentThemeName() === "snow") {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 30; i++) {
      const x = (i * 37 + frameCount * 2) % w;
      const y = (i * 23 + frameCount * 3) % h;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (getCurrentThemeName() === "city") {
    ctx.fillStyle = theme.deco;
    ctx.fillRect(w * 0.05, h * 0.1, 70, h * 0.25);
    ctx.fillRect(w * 0.18, h * 0.15, 60, h * 0.2);
    ctx.fillRect(w * 0.8, h * 0.08, 80, h * 0.27);
    ctx.fillRect(w * 0.72, h * 0.14, 55, h * 0.21);
  }

  if (getCurrentThemeName() === "lego") {
    ctx.fillStyle = theme.deco;
    ctx.fillRect(w * 0.08, h * 0.22, 100, 70);
    ctx.fillRect(w * 0.78, h * 0.2, 110, 80);

    ctx.fillStyle = "#1e90ff";
    ctx.fillRect(w * 0.18, h * 0.2, 80, 90);

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(w * 0.75, h * 0.17, 90, 100);
  }

  if (getCurrentThemeName() === "lunar") {
    ctx.fillStyle = "#f5f3ce";
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.14, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9aa0a6";
    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.82, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.28, h * 0.86, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBackground() {
  const theme = getCurrentTheme();

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawDecorations(theme);

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, h * 0.3, w, h * 0.7);
}

function drawRoad() {
  const theme = getCurrentTheme();

  ctx.fillStyle = theme.road;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.3);
  ctx.lineTo(w * 0.58, h * 0.3);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(w * 0.47, h * 0.3);
  ctx.lineTo(w * 0.35, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.53, h * 0.3);
  ctx.lineTo(w * 0.65, h);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  for (let i = 0; i < 8; i++) {
    const depth = (i / 8 + (frameCount * 0.01)) % 1;
    const edges = getRoadEdgesAtDepth(depth);
    ctx.beginPath();
    ctx.moveTo(edges.leftX, edges.y);
    ctx.lineTo(edges.rightX, edges.y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const playerDepth = 0.92;
  const x = getLaneX(lane, playerDepth);
  const edges = getRoadEdgesAtDepth(playerDepth);
  const y = edges.y - playerJump;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x, edges.y + 10, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "red";
  ctx.fillRect(x - 25, y - 50, 50, 50);

  ctx.fillStyle = "white";
  ctx.fillRect(x - 12, y - 38, 8, 8);
  ctx.fillRect(x + 4, y - 38, 8, 8);
}

function drawObstacles() {
  ctx.fillStyle = "green";

  for (const obstacle of obstacles) {
    const x = getLaneX(obstacle.lane, obstacle.depth);
    const edges = getRoadEdgesAtDepth(obstacle.depth);
    const size = 12 + obstacle.depth * 35;
    ctx.fillRect(x - size / 2, edges.y - size, size, size);
  }
}

function drawCoins() {
  ctx.fillStyle = "gold";

  for (const coin of coinsOnTrack) {
    const x = getLaneX(coin.lane, coin.depth);
    const edges = getRoadEdgesAtDepth(coin.depth);
    const size = 8 + coin.depth * 18;

    ctx.beginPath();
    ctx.arc(x, edges.y - size, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScene() {
  drawBackground();
  drawRoad();
  drawCoins();
  drawObstacles();
  drawPlayer();
}

function loop() {
  if (!gameStarted) return;

  frameCount++;

  if (frameCount % 45 === 0) {
    spawnObstacle();
  }

  if (frameCount % 60 === 0) {
    spawnCoin();
  }

  updateJump();
  updateObstacles();
  updateCoinsOnTrack();
  drawScene();

  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp" || e.code === "Space") jump();
});

leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);
jumpBtn.addEventListener("click", jump);

leftBtn.addEventListener("touchstart", function (e) {
  e.preventDefault();
  moveLeft();
});

rightBtn.addEventListener("touchstart", function (e) {
  e.preventDefault();
  moveRight();
});

jumpBtn.addEventListener("touchstart", function (e) {
  e.preventDefault();
  jump();
});

startBtn.addEventListener("click", function () {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
    messageEl.textContent = "Collect coins and avoid blocks!";
    loop();
  }
});

restartBtn.addEventListener("click", function () {
  resetGame();
});

window.addEventListener("resize", function () {
  resizeCanvas();
  drawScene();
});

resizeCanvas();
coinsEl.textContent = getCoins();
getOwnedThemes();
drawScene();
resetGame();
