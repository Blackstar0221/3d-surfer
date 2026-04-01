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
    skyTop: "#ff8a5b",
    skyMid: "#ffb36b",
    skyBottom: "#ffe0a3",
    ground: "#d8b06a",
    road: "#7a5530",
    line: "#fff3c4",
    deco: "#8f5b2e"
  },
  snow: {
    skyTop: "#98d8ff",
    skyMid: "#cceeff",
    skyBottom: "#f7fcff",
    ground: "#eef6ff",
    road: "#7f8c99",
    line: "#ffffff",
    deco: "#dceeff"
  },
  city: {
    skyTop: "#1f2f54",
    skyMid: "#4d648d",
    skyBottom: "#b7c5dd",
    ground: "#6b7280",
    road: "#262626",
    line: "#f3f4f6",
    deco: "#2f3542"
  },
  lego: {
    skyTop: "#6ed6ff",
    skyMid: "#a8ecff",
    skyBottom: "#e7fbff",
    ground: "#ffd54f",
    road: "#2563eb",
    line: "#ffffff",
    deco: "#34c759"
  },
  lunar: {
    skyTop: "#050816",
    skyMid: "#131a33",
    skyBottom: "#2b2d42",
    ground: "#bcc3cc",
    road: "#5f6b76",
    line: "#f8fafc",
    deco: "#8d99a6"
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

function getGameSpeed() {
  return Math.min(0.009 + score * 0.00035, 0.02);
}

function getObstacleSpawnRate() {
  return Math.max(90 - score * 2, 45);
}

function getCoinSpawnRate() {
  return Math.max(120 - score, 65);
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
    jumpVelocity = 16;
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
    depth: 0.08
  });
}

function updateJump() {
  if (!jumping) return;

  playerJump += jumpVelocity;
  jumpVelocity -= 0.95;

  if (playerJump <= 0) {
    playerJump = 0;
    jumpVelocity = 0;
    jumping = false;
  }
}

function updateObstacles() {
  const speed = getGameSpeed();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].depth += speed;

    if (obstacles[i].depth > 1.05) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;
      continue;
    }

    if (obstacles[i].lane === lane && obstacles[i].depth > 0.79 && obstacles[i].depth < 0.99) {
      if (playerJump < 72) {
        gameOver = true;
        gameStarted = false;
        messageEl.textContent = "Game Over!";
      }
    }
  }
}

function updateCoinsOnTrack() {
  const speed = getGameSpeed();

  for (let i = coinsOnTrack.length - 1; i >= 0; i--) {
    coinsOnTrack[i].depth += speed;

    if (coinsOnTrack[i].depth > 1.05) {
      coinsOnTrack.splice(i, 1);
      continue;
    }

    if (coinsOnTrack[i].lane === lane && coinsOnTrack[i].depth > 0.75 && coinsOnTrack[i].depth < 0.98) {
      coinsOnTrack.splice(i, 1);
      const totalCoins = getCoins() + 1;
      setCoins(totalCoins);
      coinsEl.textContent = totalCoins;
    }
  }
}

function drawSky(theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function drawDesertBackground(theme) {
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e7b96a";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.35);
  ctx.quadraticCurveTo(w * 0.2, h * 0.25, w * 0.4, h * 0.35);
  ctx.quadraticCurveTo(w * 0.6, h * 0.45, w * 0.8, h * 0.34);
  ctx.quadraticCurveTo(w * 0.9, h * 0.3, w, h * 0.36);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(0, h * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d89b52";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.quadraticCurveTo(w * 0.25, h * 0.34, w * 0.45, h * 0.44);
  ctx.quadraticCurveTo(w * 0.7, h * 0.54, w, h * 0.42);
  ctx.lineTo(w, h * 0.6);
  ctx.lineTo(0, h * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.deco;
  drawCactus(w * 0.1, h * 0.31, 0.9);
  drawCactus(w * 0.9, h * 0.3, 1.05);
}

function drawCactus(x, y, scale) {
  ctx.fillRect(x, y, 16 * scale, 70 * scale);
  ctx.fillRect(x - 16 * scale, y + 18 * scale, 16 * scale, 12 * scale);
  ctx.fillRect(x + 16 * scale, y + 28 * scale, 16 * scale, 12 * scale);
  ctx.fillRect(x - 16 * scale, y + 18 * scale, 10 * scale, 34 * scale);
  ctx.fillRect(x + 22 * scale, y + 28 * scale, 10 * scale, 34 * scale);
}

function drawSnowBackground() {
  ctx.fillStyle = "#dfefff";
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.16, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d8ebff";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.38);
  ctx.quadraticCurveTo(w * 0.2, h * 0.28, w * 0.4, h * 0.38);
  ctx.quadraticCurveTo(w * 0.6, h * 0.48, w * 0.8, h * 0.37);
  ctx.quadraticCurveTo(w * 0.9, h * 0.31, w, h * 0.38);
  ctx.lineTo(w, h * 0.56);
  ctx.lineTo(0, h * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f6fbff";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.quadraticCurveTo(w * 0.22, h * 0.42, w * 0.45, h * 0.49);
  ctx.quadraticCurveTo(w * 0.65, h * 0.56, w, h * 0.46);
  ctx.lineTo(w, h * 0.62);
  ctx.lineTo(0, h * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    const x = (i * 53 + frameCount * 1.1) % w;
    const y = (i * 29 + frameCount * 1.6) % h;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCityBackground() {
  ctx.fillStyle = "#f7d27a";
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.16, 28, 0, Math.PI * 2);
  ctx.fill();

  const buildings = [
    [0.04, 0.14, 0.07, 0.22],
    [0.12, 0.08, 0.09, 0.28],
    [0.22, 0.16, 0.07, 0.2],
    [0.72, 0.12, 0.08, 0.24],
    [0.81, 0.06, 0.1, 0.3],
    [0.91, 0.15, 0.06, 0.21]
  ];

  ctx.fillStyle = "#2f3542";
  buildings.forEach(([bx, by, bw, bh]) => {
    ctx.fillRect(w * bx, h * by, w * bw, h * bh);

    ctx.fillStyle = "#ffe8a3";
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const winX = w * bx + 10 + col * 16;
        const winY = h * by + 10 + row * 18;
        ctx.fillRect(winX, winY, 6, 8);
      }
    }
    ctx.fillStyle = "#2f3542";
  });
}

function drawLegoBackground() {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.12, 30, 0, Math.PI * 2);
  ctx.fill();

  const blocks = [
    { x: 0.06, y: 0.22, width: 0.12, height: 0.1, color: "#34c759" },
    { x: 0.18, y: 0.18, width: 0.1, height: 0.14, color: "#ffcc00" },
    { x: 0.75, y: 0.17, width: 0.13, height: 0.15, color: "#ff3b30" },
    { x: 0.86, y: 0.22, width: 0.09, height: 0.1, color: "#8b5cf6" }
  ];

  blocks.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(w * b.x, h * b.y, w * b.width, h * b.height);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const left = w * b.x;
    const top = h * b.y;
    const bw = w * b.width;

    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(left + bw * 0.3 + i * bw * 0.28, top + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawLunarBackground() {
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % w;
    const y = (i * 47) % (h * 0.45);
    const size = i % 3 === 0 ? 2 : 1.2;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(245,243,206,0.2)";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f3ce";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a8b0bb";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.quadraticCurveTo(w * 0.15, h * 0.42, w * 0.3, h * 0.49);
  ctx.quadraticCurveTo(w * 0.45, h * 0.56, w * 0.6, h * 0.5);
  ctx.quadraticCurveTo(w * 0.8, h * 0.43, w, h * 0.5);
  ctx.lineTo(w, h * 0.65);
  ctx.lineTo(0, h * 0.65);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#9098a1";
  const craters = [
    [0.14, 0.82, 34],
    [0.28, 0.86, 20],
    [0.75, 0.81, 28],
    [0.88, 0.88, 18]
  ];

  craters.forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(w * cx, h * cy, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBackground() {
  const theme = getCurrentTheme();
  const current = getCurrentThemeName();

  drawSky(theme);

  if (current === "desert") drawDesertBackground(theme);
  if (current === "snow") drawSnowBackground();
  if (current === "city") drawCityBackground();
  if (current === "lego") drawLegoBackground();
  if (current === "lunar") drawLunarBackground();

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, h * 0.3, w, h * 0.7);
}

function drawRoad() {
  const theme = getCurrentTheme();
  const current = getCurrentThemeName();

  ctx.fillStyle = theme.road;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.3);
  ctx.lineTo(w * 0.58, h * 0.3);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.closePath();
  ctx.fill();

  if (current === "lego") {
    for (let i = 0; i < 7; i++) {
      const depth = i / 7;
      const edges = getRoadEdgesAtDepth(depth);

      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(edges.leftX, edges.y);
      ctx.lineTo(edges.rightX, edges.y);
      ctx.stroke();
    }
  }

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

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  for (let i = 0; i < 7; i++) {
    const depth = (i / 7 + (frameCount * (0.003 + score * 0.00015))) % 1;
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
  ctx.ellipse(x, edges.y + 10, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.fillRect(x - 28, y - 53, 56, 56);

  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(x - 25, y - 50, 50, 50);

  ctx.fillStyle = "white";
  ctx.fillRect(x - 12, y - 38, 8, 8);
  ctx.fillRect(x + 4, y - 38, 8, 8);
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    const x = getLaneX(obstacle.lane, obstacle.depth);
    const edges = getRoadEdgesAtDepth(obstacle.depth);
    const size = 24 + obstacle.depth * 60;

    ctx.fillStyle = "#14532d";
    ctx.fillRect(x - size / 2 - 2, edges.y - size - 2, size + 4, size + 4);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x - size / 2, edges.y - size, size, size);

    ctx.fillStyle = "#166534";
    ctx.fillRect(x - size / 2, edges.y - size, size, Math.max(5, size * 0.18));
  }
}

function drawCoins() {
  for (const coin of coinsOnTrack) {
    const x = getLaneX(coin.lane, coin.depth);
    const edges = getRoadEdgesAtDepth(coin.depth);
    const size = 16 + coin.depth * 28;

    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.arc(x, edges.y - size, size / 2 + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(x, edges.y - size, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff7ae";
    ctx.lineWidth = 2;
    ctx.stroke();
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

  if (frameCount % Math.floor(getObstacleSpawnRate()) === 0) {
    spawnObstacle();
  }

  if (frameCount % Math.floor(getCoinSpawnRate()) === 0) {
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
