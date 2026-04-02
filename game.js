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
  },
  forest: {
    skyTop: "#7ecb89",
    skyMid: "#b8e6b0",
    skyBottom: "#e7f7d8",
    ground: "#6f9f5a",
    road: "#5b4636",
    line: "#f8f1d0",
    deco: "#2f6b3b"
  },
  volcano: {
    skyTop: "#2a0f0f",
    skyMid: "#7a1f1f",
    skyBottom: "#ff7b2f",
    ground: "#5b2b1f",
    road: "#2f2f2f",
    line: "#ffd166",
    deco: "#ff4d2d"
  },
  ocean: {
    skyTop: "#4db8ff",
    skyMid: "#87dbff",
    skyBottom: "#dff7ff",
    ground: "#7fd3ff",
    road: "#1f5f8b",
    line: "#e8faff",
    deco: "#ffffff"
  },
  candy: {
    skyTop: "#ff9ecf",
    skyMid: "#ffd1e8",
    skyBottom: "#fff1f8",
    ground: "#ffc1dd",
    road: "#ff5fa2",
    line: "#fff7ff",
    deco: "#ffffff"
  },
  cyber: {
    skyTop: "#090b1a",
    skyMid: "#151a3a",
    skyBottom: "#1c2d5a",
    ground: "#16213e",
    road: "#0f172a",
    line: "#00f5ff",
    deco: "#ff00d4"
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

function drawCactus(x, y, scale) {
  ctx.fillRect(x, y, 16 * scale, 70 * scale);
  ctx.fillRect(x - 16 * scale, y + 18 * scale, 16 * scale, 12 * scale);
  ctx.fillRect(x + 16 * scale, y + 28 * scale, 16 * scale, 12 * scale);
  ctx.fillRect(x - 16 * scale, y + 18 * scale, 10 * scale, 34 * scale);
  ctx.fillRect(x + 22 * scale, y + 28 * scale, 10 * scale, 34 * scale);
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 6 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x + 40 * scale, y, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawDesertBackground(theme) {
  const drift = Math.sin(frameCount * 0.01) * 20;

  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14 + Math.sin(frameCount * 0.02) * 4, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e7b96a";
  ctx.beginPath();
  ctx.moveTo(-40 + drift, h * 0.35);
  ctx.quadraticCurveTo(w * 0.2, h * 0.25, w * 0.4 + drift, h * 0.35);
  ctx.quadraticCurveTo(w * 0.6, h * 0.45, w * 0.8 + drift, h * 0.34);
  ctx.quadraticCurveTo(w * 0.9, h * 0.3, w + 40, h * 0.36);
  ctx.lineTo(w + 40, h * 0.55);
  ctx.lineTo(-40, h * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d89b52";
  ctx.beginPath();
  ctx.moveTo(-40 - drift, h * 0.45);
  ctx.quadraticCurveTo(w * 0.25, h * 0.34, w * 0.45 - drift, h * 0.44);
  ctx.quadraticCurveTo(w * 0.7, h * 0.54, w + 40, h * 0.42);
  ctx.lineTo(w + 40, h * 0.6);
  ctx.lineTo(-40, h * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.deco;
  drawCactus(w * 0.1, h * 0.31, 0.9);
  drawCactus(w * 0.9, h * 0.3, 1.05);
}

function drawSnowBackground() {
  ctx.fillStyle = "#dfefff";
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.16, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d8ebff";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.38);
  ctx.quadraticCurveTo(w * 0.2, h * 0.28 + Math.sin(frameCount * 0.01) * 4, w * 0.4, h * 0.38);
  ctx.quadraticCurveTo(w * 0.6, h * 0.48, w * 0.8, h * 0.37);
  ctx.quadraticCurveTo(w * 0.9, h * 0.31, w, h * 0.38);
  ctx.lineTo(w, h * 0.56);
  ctx.lineTo(0, h * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f6fbff";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.quadraticCurveTo(w * 0.22, h * 0.42, w * 0.45, h * 0.49 + Math.sin(frameCount * 0.012) * 3);
  ctx.quadraticCurveTo(w * 0.65, h * 0.56, w, h * 0.46);
  ctx.lineTo(w, h * 0.62);
  ctx.lineTo(0, h * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 50; i++) {
    const x = (i * 53 + frameCount * (1 + (i % 3) * 0.4)) % w;
    const y = (i * 29 + frameCount * (1.6 + (i % 4) * 0.2)) % h;
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

  const shift = (frameCount * 0.15) % 80;

  const buildings = [
    [-shift + 20, h * 0.16, 60, 160],
    [-shift + 100, h * 0.1, 80, 220],
    [-shift + 210, h * 0.17, 55, 150],
    [-shift + 300, h * 0.12, 75, 210],
    [-shift + 410, h * 0.08, 85, 250],
    [-shift + 530, h * 0.16, 60, 160],
    [-shift + 620, h * 0.11, 70, 220],
    [-shift + 730, h * 0.14, 90, 180],
    [-shift + 860, h * 0.09, 75, 240]
  ];

  buildings.forEach(([bx, by, bw, bh], index) => {
    let x = bx;
    while (x < w + 100) {
      ctx.fillStyle = "#2f3542";
      ctx.fillRect(x, by, bw, bh);

      ctx.fillStyle = (frameCount + index * 7) % 20 < 10 ? "#ffe8a3" : "#dbeafe";
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillRect(x + 10 + col * 16, by + 12 + row * 18, 6, 8);
        }
      }

      x += 900;
    }
  });
}

function drawLegoBackground() {
  drawCloud((frameCount * 0.4) % (w + 120) - 120, h * 0.14, 1);
  drawCloud((frameCount * 0.3 + 250) % (w + 120) - 120, h * 0.1, 0.9);

  const bob = Math.sin(frameCount * 0.02) * 4;

  const blocks = [
    { x: w * 0.06, y: h * 0.22 + bob, width: 110, height: 70, color: "#34c759" },
    { x: w * 0.18, y: h * 0.18 - bob, width: 90, height: 100, color: "#ffcc00" },
    { x: w * 0.75, y: h * 0.17 + bob, width: 110, height: 110, color: "#ff3b30" },
    { x: w * 0.87, y: h * 0.22 - bob, width: 80, height: 70, color: "#8b5cf6" }
  ];

  blocks.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(b.x + b.width * 0.3, b.y + 10, 8, 0, Math.PI * 2);
    ctx.arc(b.x + b.width * 0.58, b.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLunarBackground() {
  for (let i = 0; i < 70; i++) {
    const x = (i * 97) % w;
    const y = (i * 47) % (h * 0.45);
    const size = i % 3 === 0 ? 2 : 1.2;
    const alpha = 0.4 + 0.5 * Math.abs(Math.sin(frameCount * 0.02 + i));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(245,243,206,0.2)";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 52 + Math.sin(frameCount * 0.02) * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f3ce";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a8b0bb";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.quadraticCurveTo(w * 0.15, h * 0.42, w * 0.3, h * 0.49);
  ctx.quadraticCurveTo(w * 0.45, h * 0.56 + Math.sin(frameCount * 0.01) * 3, w * 0.6, h * 0.5);
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

  craters.forEach(([cx, cy, r], index) => {
    ctx.beginPath();
    ctx.arc(w * cx, h * cy + Math.sin(frameCount * 0.01 + index) * 1.5, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawForestBackground() {
  drawCloud((frameCount * 0.2) % (w + 120) - 120, h * 0.12, 1);
  drawCloud((frameCount * 0.15 + 240) % (w + 120) - 120, h * 0.16, 0.8);

  ctx.fillStyle = "#9ccc7c";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.4);
  ctx.quadraticCurveTo(w * 0.2, h * 0.3, w * 0.4, h * 0.4);
  ctx.quadraticCurveTo(w * 0.7, h * 0.5, w, h * 0.38);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(0, h * 0.55);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const x = w * (0.08 + i * 0.16);
    ctx.fillStyle = "#5b3c22";
    ctx.fillRect(x, h * 0.22, 18, 85);

    ctx.fillStyle = "#2f6b3b";
    ctx.beginPath();
    ctx.arc(x + 9, h * 0.2, 34, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVolcanoBackground() {
  ctx.fillStyle = "#ffb347";
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.15, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3c1f1a";
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.42);
  ctx.lineTo(w * 0.35, h * 0.18);
  ctx.lineTo(w * 0.5, h * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5b2b1f";
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.44);
  ctx.lineTo(w * 0.62, h * 0.16);
  ctx.lineTo(w * 0.8, h * 0.44);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#ff4d2d";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(w * 0.62, h * 0.2);
  ctx.lineTo(w * 0.66 + Math.sin(frameCount * 0.05) * 3, h * 0.28);
  ctx.lineTo(w * 0.69, h * 0.38);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const x = (i * 90 + frameCount * 2) % w;
    const y = h * 0.2 + ((i * 17 + frameCount * 1.5) % 80);
    ctx.fillStyle = "rgba(255,140,60,0.7)";
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOceanBackground() {
  drawCloud((frameCount * 0.25) % (w + 120) - 120, h * 0.12, 1);
  drawCloud((frameCount * 0.18 + 220) % (w + 120) - 120, h * 0.18, 0.9);

  ctx.fillStyle = "#fff4b0";
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.16, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5ec6f2";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (0.4 + i * 0.05));
    for (let x = 0; x <= w; x += 20) {
      const y = h * (0.4 + i * 0.05) + Math.sin((x + frameCount * (1 + i)) * 0.02) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(0, h * 0.7);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCandyBackground() {
  drawCloud((frameCount * 0.22) % (w + 120) - 120, h * 0.12, 1);
  drawCloud((frameCount * 0.16 + 240) % (w + 120) - 120, h * 0.17, 0.85);

  ctx.fillStyle = "#fff0f8";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.14, 30, 0, Math.PI * 2);
  ctx.fill();

  const hills = ["#ffb3d9", "#ffcce5", "#ffdff0"];
  hills.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h * (0.43 + i * 0.04));
    ctx.quadraticCurveTo(w * 0.25, h * (0.33 + i * 0.03), w * 0.5, h * (0.44 + i * 0.03));
    ctx.quadraticCurveTo(w * 0.75, h * (0.52 + i * 0.03), w, h * (0.42 + i * 0.03));
    ctx.lineTo(w, h * 0.65);
    ctx.lineTo(0, h * 0.65);
    ctx.closePath();
    ctx.fill();
  });

  for (let i = 0; i < 5; i++) {
    const x = w * (0.1 + i * 0.18);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, h * 0.24, 10, 60);
    ctx.beginPath();
    ctx.arc(x + 5, h * 0.23, 22, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? "#ff69b4" : "#7dd3fc";
    ctx.fill();
  }
}

function drawCyberBackground() {
  for (let i = 0; i < 60; i++) {
    const x = (i * 83) % w;
    const y = (i * 37) % (h * 0.45);
    const alpha = 0.3 + 0.5 * Math.abs(Math.sin(frameCount * 0.03 + i));
    ctx.fillStyle = `rgba(0,245,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 2 === 0 ? 1.5 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const shift = (frameCount * 0.3) % 120;

  ctx.strokeStyle = "rgba(0,245,255,0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i++) {
    const y = h * 0.1 + i * 35;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  for (let i = 0; i < 6; i++) {
    const x = (i * 160 + shift) % (w + 100);
    ctx.fillStyle = "#ff00d4";
    ctx.fillRect(x, h * 0.16, 60, 120);
    ctx.fillStyle = "#00f5ff";
    ctx.fillRect(x + 8, h * 0.18, 10, 10);
    ctx.fillRect(x + 26, h * 0.18, 10, 10);
    ctx.fillRect(x + 44, h * 0.18, 10, 10);
  }
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
  if (current === "forest") drawForestBackground();
  if (current === "volcano") drawVolcanoBackground();
  if (current === "ocean") drawOceanBackground();
  if (current === "candy") drawCandyBackground();
  if (current === "cyber") drawCyberBackground();

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

  if (current === "lego" || current === "cyber") {
    for (let i = 0; i < 7; i++) {
      const depth = i / 7;
      const edges = getRoadEdgesAtDepth(depth);

      ctx.strokeStyle = current === "cyber" ? "rgba(0,245,255,0.8)" : "rgba(255,255,255,0.9)";
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

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  for (let i = 0; i < 8; i++) {
    const depth = (i / 8 + (frameCount * (0.003 + score * 0.00015))) % 1;
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
    const pulse = 1 + Math.sin(frameCount * 0.15 + coin.depth * 10) * 0.08;
    const finalSize = size * pulse;

    ctx.fillStyle = "rgba(255,240,150,0.35)";
    ctx.beginPath();
    ctx.arc(x, edges.y - finalSize, finalSize / 2 + 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.arc(x, edges.y - finalSize, finalSize / 2 + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(x, edges.y - finalSize, finalSize / 2, 0, Math.PI * 2);
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
  window.location.reload();
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
