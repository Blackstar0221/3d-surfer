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
draw();  laneTopSpacing = roadTopWidth / 3;
}

function resetGame() {
  resizeCanvas();

  player = {
    lane: 1,
    jumpHeight: 0,
    velocityY: 0,
    jumping: false,
    width: Math.min(55, w * 0.11),
    height: Math.min(75, h * 0.12)
  };

  obstacles = [];
  score = 0;
  gameOver = false;
  speed = 0.012;
  spawnTimer = 0;
  stripeOffset = 0;

  scoreEl.textContent = score;
  messageEl.textContent = "";
}

function moveLeft() {
  if (gameOver) return;
  if (player.lane > 0) player.lane--;
}

function moveRight() {
  if (gameOver) return;
  if (player.lane < 2) player.lane++;
}

function jump() {
  if (gameOver) return;
  if (!player.jumping) {
    player.jumping = true;
    player.velocityY = 0.028;
  }
}

function getLaneX(lane, depth) {
  const centerX = w / 2;
  const halfRoad = (roadTopWidth + (roadBottomWidth - roadTopWidth) * depth) / 2;
  const spacing = laneTopSpacing + (laneBottomSpacing - laneTopSpacing) * depth;
  return centerX - halfRoad + spacing * (lane + 0.5);
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  obstacles.push({
    lane: lane,
    depth: 0.05,
    size: 1
  });
}

function update() {
  if (gameOver) return;

  if (player.jumping) {
    player.jumpHeight += player.velocityY * h;
    player.velocityY -= 0.0018 * h / 1000;

    if (player.jumpHeight <= 0) {
      player.jumpHeight = 0;
      player.velocityY = 0;
      player.jumping = false;
    }
  }

  spawnTimer++;
  if (spawnTimer >= 45) {
    spawnObstacle();
    spawnTimer = 0;
  }

  stripeOffset += speed * 1.4;
  if (stripeOffset > 0.12) stripeOffset = 0;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].depth += speed;

    if (obstacles[i].depth >= 1.02) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;

      if (score % 5 === 0) {
        speed += 0.001;
      }
      continue;
    }

    if (obstacles[i].depth > 0.82 && obstacles[i].lane === player.lane) {
      if (player.jumpHeight < 55) {
        gameOver = true;
        messageEl.textContent = "Game Over 💥";
      }
    }
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#87ceeb");
  sky.addColorStop(1, "#eaf8ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#d8c39a";
  ctx.fillRect(0, horizonY, w, h - horizonY);
}

function drawRoad() {
  const centerX = w / 2;

  const leftTop = centerX - roadTopWidth / 2;
  const rightTop = centerX + roadTopWidth / 2;
  const leftBottom = centerX - roadBottomWidth / 2;
  const rightBottom = centerX + roadBottomWidth / 2;

  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.moveTo(leftTop, horizonY);
  ctx.lineTo(rightTop, horizonY);
  ctx.lineTo(rightBottom, h);
  ctx.lineTo(leftBottom, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;

  for (let i = 1; i <= 2; i++) {
    const topX = leftTop + laneTopSpacing * i;
    const bottomX = leftBottom + laneBottomSpacing * i;

    ctx.beginPath();
    ctx.moveTo(topX, horizonY);
    ctx.lineTo(bottomX, h);
    ctx.stroke();
  }

  for (let d = 0; d < 1; d += 0.12) {
    const z = (d + stripeOffset) % 1;
    const y = horizonY + (h - horizonY) * z;
    const widthAtY = roadTopWidth + (roadBottomWidth - roadTopWidth) * z;
    const x1 = centerX - widthAtY / 2;
    const x2 = centerX + widthAtY / 2;

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const baseX = getLaneX(player.lane, 0.92);
  const baseY = h * 0.82;

  const drawY = baseY - player.jumpHeight;
  const shadowWidth = player.width * 0.9;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(baseX, baseY + player.height * 0.95, shadowWidth / 2, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(
    baseX - player.width / 2,
    drawY - player.height,
    player.width,
    player.height
  );

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(baseX - 12, drawY - player.height + 14, 8, 8);
  ctx.fillRect(baseX + 4, drawY - player.height + 14, 8, 8);
}

function drawObstacles() {
  for (const obs of obstacles) {
    const x = getLaneX(obs.lane, obs.depth);
    const y = horizonY + (h - horizonY) * obs.depth;

    const size = 18 + obs.depth * 70;
    const boxHeight = size;
    const boxWidth = size;

    ctx.fillStyle = "#00aa55";
    ctx.fillRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(x - boxWidth / 2, y - boxHeight, boxWidth, 8);
  }
}

function draw() {
  drawBackground();
  drawRoad();
  drawObstacles();
  drawPlayer();
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

window.addEventListener("resize", resetGame);

resetGame();
loop();
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
