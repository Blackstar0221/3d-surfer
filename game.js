let scene, camera, renderer;
let player;
let obstacles = [];
let roadSegments = [];

let lane = 0;
let targetX = 0;
let velocityY = 0;
let isJumping = false;

let score = 0;
let gameOver = false;

const lanePositions = [-2, 0, 2];

init();
animate();
setInterval(spawnObstacle, 900);

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 6, 10);
  camera.lookAt(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  addLights();
  createRoad();
  createPlayer();

  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);
}

function addLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
}

function createRoad() {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  for (let i = 0; i < 5; i++) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 40),
      roadMaterial
    );
    road.position.set(0, -0.5, -i * 40);
    scene.add(road);
    roadSegments.push(road);

    for (let x of [-1, 1]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.02, 40),
        lineMaterial
      );
      line.position.set(x, 0.02, -i * 40);
      scene.add(line);
      roadSegments.push(line);
    }
  }
}

function createPlayer() {
  const body = new THREE.BoxGeometry(1, 1.5, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  player = new THREE.Mesh(body, material);
  player.position.set(0, 0.75, 3);
  scene.add(player);
}

function handleKeyDown(event) {
  if (gameOver) return;

  if (event.key === "ArrowLeft" && lane > -1) {
    lane--;
    targetX = lanePositions[lane + 1];
  }

  if (event.key === "ArrowRight" && lane < 1) {
    lane++;
    targetX = lanePositions[lane + 1];
  }

  if (event.code === "Space" && !isJumping) {
    velocityY = 0.2;
    isJumping = true;
  }
}

function spawnObstacle() {
  if (gameOver) return;

  const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const material = new THREE.MeshStandardMaterial({ color: 0x00cc66 });
  const obstacle = new THREE.Mesh(geometry, material);

  const randomLane = Math.floor(Math.random() * 3);
  obstacle.position.set(lanePositions[randomLane], 0.6, -60);

  scene.add(obstacle);
  obstacles.push(obstacle);
}

function updatePlayer() {
  player.position.x += (targetX - player.position.x) * 0.2;

  if (isJumping) {
    player.position.y += velocityY;
    velocityY -= 0.012;

    if (player.position.y <= 0.75) {
      player.position.y = 0.75;
      velocityY = 0;
      isJumping = false;
    }
  }
}

function updateRoad() {
  for (let segment of roadSegments) {
    segment.position.z += 0.5;

    if (segment.position.z > 20) {
      segment.position.z -= 200;
    }
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].position.z += 0.5;

    if (checkCollision(player, obstacles[i])) {
      endGame();
    }

    if (obstacles[i].position.z > 12) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
      score++;
      document.getElementById("score").textContent = score;
    }
  }
}

function checkCollision(a, b) {
  const dx = Math.abs(a.position.x - b.position.x);
  const dy = Math.abs(a.position.y - b.position.y);
  const dz = Math.abs(a.position.z - b.position.z);

  return dx < 1 && dy < 1 && dz < 1;
}

function endGame() {
  gameOver = true;
  document.getElementById("message").textContent = "Game Over 💥";
}

function restartGame() {
  for (let obstacle of obstacles) {
    scene.remove(obstacle);
  }

  obstacles = [];
  score = 0;
  lane = 0;
  targetX = 0;
  velocityY = 0;
  isJumping = false;
  gameOver = false;

  player.position.set(0, 0.75, 3);

  document.getElementById("score").textContent = score;
  document.getElementById("message").textContent = "";
}

function animate() {
  requestAnimationFrame(animate);

  if (!gameOver) {
    updatePlayer();
    updateRoad();
    updateObstacles();
  }

  renderer.render(scene, camera);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
      }
