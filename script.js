// === Constants & Canvas ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');

const GRID_SIZE = 20;              // 20x20 Felder
const TILE = canvas.width / GRID_SIZE; // Pixel pro Feld

// === Game State ===
let snake, dir, nextDir, apple, score, highscore, loopId, running, gameOver, tickMs;

function resetGame() {
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  snake = [ {x: startX, y: startY}, {x: startX-1, y: startY}, {x: startX-2, y: startY} ];
  dir = {x: 1, y: 0};
  nextDir = {x: 1, y: 0};
  apple = randomFreeCell();
  score = 0;
  tickMs = 180;      // Start-Geschwindigkeit (kleiner = schneller)
  running = false;
  gameOver = false;
  updateScore();
  draw();
}

function loadHighscore() {
  const raw = localStorage.getItem('snake_highscore');
  highscore = raw ? parseInt(raw, 10) : 0;
  highscoreEl.textContent = highscore;
}

function saveHighscore() {
  localStorage.setItem('snake_highscore', String(highscore));
}

// === Utils ===
function cellsEqual(a, b) { return a.x === b.x && a.y === b.y; }

function randomFreeCell() {
  while (true) {
    const pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some(s => cellsEqual(s, pos))) return pos;
  }
}

// === Drawing ===
function clear() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_SIZE; i++) {
    // vertical lines
    ctx.beginPath();
    ctx.moveTo(i*TILE + 0.5, 0);
    ctx.lineTo(i*TILE + 0.5, canvas.height);
    ctx.stroke();
    // horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, i*TILE + 0.5);
    ctx.lineTo(canvas.width, i*TILE + 0.5);
    ctx.stroke();
  }
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const {x, y} = snake[i];
    // Body
    ctx.fillStyle = i === 0 ? '#35d07f' : '#1fbf72';
    ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
    // Outline
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x*TILE + 1, y*TILE + 1, TILE - 2, TILE - 2);
  }
}

function drawApple() {
  const {x, y} = apple;
  const r = TILE * 0.4;
  const cx = x*TILE + TILE/2;
  const cy = y*TILE + TILE/2;
  ctx.fillStyle = '#ff4d4f';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();
}

function drawMessage(text) {
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width/2, canvas.height/2);
}

function draw() {
  clear();
  drawGrid();
  drawApple();
  drawSnake();
  if (!running && !gameOver) drawMessage('Drücke Start (oder Leertaste)');
  if (gameOver) drawMessage('Game Over – R für Neustart');
}

// === Game Loop ===
function startLoop() {
  if (loopId) return; // bereits laufend
  running = true;
  loopId = setInterval(tick, tickMs);
}

function stopLoop() {
  running = false;
  clearInterval(loopId);
  loopId = null;
}

function speedUp() {
  // alle 5 Punkte minimal schneller
  if (score > 0 && score % 5 === 0 && tickMs > 70) {
    tickMs -= 5;
    if (running) { stopLoop(); startLoop(); }
  }
}

function tick() {
  if (gameOver) { stopLoop(); return; }
  // Richtung updaten (Key-Buffer)
  dir = nextDir;

  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wand-Kollision
  if (
    newHead.x < 0 || newHead.x >= GRID_SIZE ||
    newHead.y < 0 || newHead.y >= GRID_SIZE
  ) {
    endGame();
    return;
  }

  // Selbst-Kollision
  if (snake.some((seg, i) => i !== 0 && cellsEqual(seg, newHead))) {
    endGame();
    return;
  }

  // Bewegung
  snake.unshift(newHead);

  // Apfel gegessen?
  if (cellsEqual(newHead, apple)) {
    score += 1;
    updateScore();
    apple = randomFreeCell();
    speedUp();
  } else {
    snake.pop(); // kein Wachstum
  }

  draw();
}

function endGame() {
  gameOver = true;
  running = false;
  if (loopId) { clearInterval(loopId); loopId = null; }
  // Highscore
  if (score > highscore) {
    highscore = score;
    highscoreEl.textContent = highscore;
    saveHighscore();
  }
  draw();
}

function updateScore() { scoreEl.textContent = score; }

// === Input ===
function setDirection(nx, ny) {
  // keine 180° Wendung
  if (nx === -dir.x && ny === -dir.y) return;
  nextDir = {x: nx, y: ny};
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') setDirection(0, -1);
  else if (k === 'arrowdown' || k === 's') setDirection(0, 1);
  else if (k === 'arrowleft' || k === 'a') setDirection(-1, 0);
  else if (k === 'arrowright' || k === 'd') setDirection(1, 0);
  else if (k === 'p') togglePause();
  else if (k === 'r') { resetGame(); }
  else if (k === ' ' || k === 'spacebar') { // Leertaste
    if (!running && !gameOver) startLoop();
  }
});

function togglePause() {
  if (gameOver) return;
  if (running) stopLoop(); else startLoop();
}

btnStart.addEventListener('click', () => { if (!running && !gameOver) startLoop(); });
btnPause.addEventListener('click', togglePause);
btnRestart.addEventListener('click', resetGame);

// === Init ===
loadHighscore();
resetGame();