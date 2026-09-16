const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const startOverlay = document.querySelector("#startOverlay");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const scoreDisplay = document.querySelector("#scoreDisplay");
const livesHud = document.querySelector("#livesHud");
const livesDisplay = document.querySelector("#livesDisplay");
const lifeStatusLabel = document.querySelector("#lifeStatusLabel");
const bestScoreEl = document.querySelector("#bestScore");
const finalScoreEl = document.querySelector("#finalScore");
const finalBestEl = document.querySelector("#finalBest");

const STATE = Object.freeze({ READY: "ready", PLAYING: "playing", OVER: "over" });
const world = {
  width: 960, height: 600, dpr: 1, state: STATE.READY, time: 0, lastTime: 0,
  score: 0, lives: 3, invulnerable: 0,
  best: Number(localStorage.getItem("flappy-buddy-best") || 0), shake: 0, flash: 0,
  pipes: [], particles: [],
  stars: Array.from({ length: 86 }, (_, index) => ({
    x: ((index * 137.53) % 100) / 100,
    y: ((index * 83.17) % 82) / 100,
    size: index % 11 === 0 ? 2 : 1,
    speed: 0.05 + (index % 5) * 0.025,
  })),
  buddy: { x: 270, y: 300, vy: 0, radius: 25, rotation: 0 },
};

bestScoreEl.textContent = String(world.best).padStart(2, "0");

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  world.width = rect.width;
  world.height = rect.height;
  world.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * world.dpr);
  canvas.height = Math.round(rect.height * world.dpr);
  ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);
  world.buddy.x = world.width * 0.28;
  if (world.state === STATE.READY) world.buddy.y = world.height * 0.46;
}

function resetGame() {
  world.score = 0;
  world.lives = 3;
  world.invulnerable = 0;
  world.pipes = [];
  world.particles = [];
  world.shake = 0;
  world.flash = 0;
  Object.assign(world.buddy, { x: world.width * 0.28, y: world.height * 0.46, vy: 0, rotation: 0 });
  scoreDisplay.textContent = "0";
  livesDisplay.textContent = "03";
  lifeStatusLabel.textContent = "LIVES";
  livesHud.classList.remove("invulnerable");
}

function startGame() {
  resetGame();
  world.state = STATE.PLAYING;
  startOverlay.hidden = true;
  gameOverOverlay.hidden = true;
  scoreDisplay.classList.add("visible");
  livesHud.classList.add("visible");
  flap();
}

function takeHit() {
  if (world.state !== STATE.PLAYING || world.invulnerable > 0) return;
  world.lives -= 1;
  livesDisplay.textContent = String(world.lives).padStart(2, "0");
  world.shake = 8;
  world.flash = 0.7;
  burst(world.buddy.x, world.buddy.y, 12, "#ff6b36");
  if (world.lives === 0) {
    endGame();
    return;
  }
  world.invulnerable = 1.8;
  lifeStatusLabel.textContent = "SHIELD";
  livesHud.classList.add("invulnerable");
  playTone(220, 0.12, "sawtooth", 0.03);
}

function endGame() {
  if (world.state !== STATE.PLAYING) return;
  world.state = STATE.OVER;
  world.shake = 12;
  world.flash = 1;
  world.best = Math.max(world.best, world.score);
  localStorage.setItem("flappy-buddy-best", String(world.best));
  bestScoreEl.textContent = String(world.best).padStart(2, "0");
  finalScoreEl.textContent = String(world.score).padStart(2, "0");
  finalBestEl.textContent = String(world.best).padStart(2, "0");
  playTone(110, 0.2, "sawtooth", 0.035);
  window.setTimeout(() => {
    if (world.state !== STATE.OVER) return;
    scoreDisplay.classList.remove("visible");
    livesHud.classList.remove("visible");
    gameOverOverlay.hidden = false;
    restartButton.focus({ preventScroll: true });
  }, 420);
}

function flap() {
  if (world.state !== STATE.PLAYING) return;
  world.buddy.vy = -Math.min(500, world.height * 0.84);
  world.buddy.rotation = -0.38;
  burst(world.buddy.x - 20, world.buddy.y + 11, 5, "#c8ff31");
  playTone(440, 0.035, "square", 0.025);
}

function burst(x, y, amount, color) {
  for (let i = 0; i < amount; i += 1) {
    world.particles.push({
      x, y, vx: -60 - Math.random() * 90, vy: (Math.random() - 0.5) * 100,
      life: 0.35 + Math.random() * 0.3, maxLife: 0.65,
      size: 2 + Math.random() * 4, color,
    });
  }
}

let audioContext;
function playTone(frequency, duration, type = "sine", volume = 0.03) {
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Sound is optional. */ }
}

function spawnPipe() {
  const minGap = Math.max(120, Math.min(145, world.height * 0.22));
  const maxGap = Math.min(220, world.height * 0.34);
  const difficulty = Math.min(world.score * 2, 24);
  const gap = Math.max(112, minGap + Math.random() * (maxGap - minGap) - difficulty);
  const margin = Math.max(92, world.height * 0.18);
  const center = margin + gap / 2 + Math.random() * (world.height - 36 - margin * 2 - gap);
  world.pipes.push({
    x: world.width + 50,
    width: Math.max(72, Math.min(96, world.width * 0.085)),
    center, gap, counted: false,
  });
}

function update(dt) {
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt * 34);
  world.flash = Math.max(0, world.flash - dt * 3.5);
  if (world.invulnerable > 0) {
    world.invulnerable = Math.max(0, world.invulnerable - dt);
    if (world.invulnerable === 0) {
      lifeStatusLabel.textContent = "LIVES";
      livesHud.classList.remove("invulnerable");
    }
  }
  world.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  world.particles = world.particles.filter((particle) => particle.life > 0);

  if (world.state === STATE.READY) {
    world.buddy.y = world.height * 0.46 + Math.sin(world.time * 3) * 10;
    world.buddy.rotation = Math.sin(world.time * 2) * 0.05;
    return;
  }
  if (world.state !== STATE.PLAYING) {
    world.buddy.vy += world.height * 2.45 * dt;
    world.buddy.y = Math.min(world.height - 57, world.buddy.y + world.buddy.vy * dt);
    world.buddy.rotation = Math.min(1.3, world.buddy.rotation + dt * 2.8);
    return;
  }

  const buddy = world.buddy;
  buddy.vy += world.height * 2.45 * dt;
  buddy.y += buddy.vy * dt;
  buddy.rotation = Math.min(1.15, buddy.rotation + dt * 1.9);
  const speed = Math.max(180, Math.min(245, world.width * 0.24));
  const lastPipe = world.pipes.at(-1);
  if (!lastPipe || lastPipe.x < world.width - Math.max(260, world.width * 0.38)) spawnPipe();

  for (const pipe of world.pipes) {
    pipe.x -= speed * dt;
    if (!pipe.counted && pipe.x + pipe.width < buddy.x) {
      pipe.counted = true;
      world.score += 1;
      scoreDisplay.textContent = String(world.score);
      burst(buddy.x, buddy.y, 10, "#f4f6f1");
      playTone(660, 0.08, "sine", 0.04);
      if (world.score === 5) {
        endGame();
        return;
      }
    }
    const hitX = buddy.x + buddy.radius * 0.72 > pipe.x && buddy.x - buddy.radius * 0.72 < pipe.x + pipe.width;
    const hitY = buddy.y - buddy.radius * 0.72 < pipe.center - pipe.gap / 2 || buddy.y + buddy.radius * 0.72 > pipe.center + pipe.gap / 2;
    if (hitX && hitY) takeHit();
  }
  world.pipes = world.pipes.filter((pipe) => pipe.x + pipe.width > -20);
  const ceiling = buddy.radius + 8;
  const floor = world.height - 35 - buddy.radius - 8;
  if (buddy.y < ceiling) {
    buddy.y = ceiling;
    buddy.vy = 160;
    takeHit();
  } else if (buddy.y > floor) {
    buddy.y = floor;
    buddy.vy = -Math.min(280, world.height * 0.45);
    takeHit();
  }
}

function drawBackdrop() {
  const { width, height } = world;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#14374c");
  gradient.addColorStop(0.58, "#0d2232");
  gradient.addColorStop(1, "#07141f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(176, 222, 230, .58)";
  for (const star of world.stars) {
    const x = ((star.x * width - world.time * star.speed * 40) % width + width) % width;
    ctx.globalAlpha = 0.45 + Math.sin(world.time * 2 + star.x * 20) * 0.2;
    ctx.fillRect(x, star.y * height, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  const horizon = height - 35;
  ctx.fillStyle = "rgba(31, 65, 80, .72)";
  for (let i = -1; i < Math.ceil(width / 130) + 1; i += 1) {
    const x = ((i * 132 - world.time * 9) % (width + 132)) - 10;
    const tower = 70 + ((i + 20) % 4) * 25;
    ctx.fillRect(x, horizon - tower, 82, tower);
    ctx.fillRect(x + 18, horizon - tower - 20, 9, 20);
    ctx.fillStyle = "rgba(200, 255, 49, .22)";
    for (let row = 0; row < 3; row += 1) ctx.fillRect(x + 15 + row * 20, horizon - tower + 20, 4, 4);
    ctx.fillStyle = "rgba(31, 65, 80, .72)";
  }
  ctx.fillStyle = "#07121b";
  ctx.fillRect(0, horizon, width, 35);
  ctx.fillStyle = "rgba(200, 255, 49, .36)";
  ctx.fillRect(0, horizon, width, 1);
  ctx.fillStyle = "rgba(200, 255, 49, .12)";
  for (let x = -(world.time * 90) % 80; x < width; x += 80) ctx.fillRect(x, horizon + 13, 42, 2);
}

function drawPipe(pipe) {
  const topEnd = pipe.center - pipe.gap / 2;
  const bottomStart = pipe.center + pipe.gap / 2;
  const cap = 15;
  const bodyGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
  bodyGradient.addColorStop(0, "#5b8790");
  bodyGradient.addColorStop(0.18, "#b9d3ce");
  bodyGradient.addColorStop(0.65, "#547a82");
  bodyGradient.addColorStop(1, "#203e4b");
  ctx.fillStyle = "rgba(3, 10, 15, .28)";
  ctx.fillRect(pipe.x + 9, 0, pipe.width, topEnd + 9);
  ctx.fillRect(pipe.x + 9, bottomStart + 9, pipe.width, world.height - bottomStart);
  ctx.fillStyle = bodyGradient;
  ctx.fillRect(pipe.x, 0, pipe.width, topEnd);
  ctx.fillRect(pipe.x, bottomStart, pipe.width, world.height - bottomStart);
  ctx.fillStyle = "#b9d3ce";
  ctx.fillRect(pipe.x - 7, topEnd - cap, pipe.width + 14, cap);
  ctx.fillRect(pipe.x - 7, bottomStart, pipe.width + 14, cap);
  ctx.fillStyle = "#1a3440";
  ctx.fillRect(pipe.x - 7, topEnd - 3, pipe.width + 14, 3);
  ctx.fillRect(pipe.x - 7, bottomStart + cap, pipe.width + 14, 3);
  ctx.fillStyle = "rgba(200, 255, 49, .64)";
  ctx.fillRect(pipe.x + 10, topEnd - 10, 16, 3);
  ctx.fillRect(pipe.x + pipe.width - 26, bottomStart + 7, 16, 3);
}

function drawBuddy() {
  const buddy = world.buddy;
  ctx.save();
  if (world.invulnerable > 0) {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    ctx.globalAlpha = reducedMotion ? 0.55 : Math.floor(world.time * 8) % 2 === 0 ? 1 : 0.22;
  }
  ctx.translate(buddy.x, buddy.y);
  ctx.rotate(buddy.rotation);
  ctx.fillStyle = "rgba(2, 9, 14, .28)";
  ctx.beginPath(); ctx.ellipse(5, 25, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff6b36";
  ctx.beginPath(); ctx.moveTo(-24, 5); ctx.lineTo(-39, 18); ctx.lineTo(-20, 17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e8eee9";
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#97afb4"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#183848";
  ctx.beginPath(); ctx.arc(5, -4, 17, -2.65, 0.75); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(111, 211, 224, .55)";
  ctx.beginPath(); ctx.ellipse(7, -8, 9, 5, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#c8ff31"; ctx.fillRect(-4, 16, 14, 5);
  ctx.fillStyle = "#071421"; ctx.font = "bold 7px DM Mono"; ctx.fillText("B-01", -3, 21);
  ctx.fillStyle = "#e8eee9";
  ctx.beginPath(); ctx.ellipse(-1, 25, 9, 5, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.save();
  if (world.shake > 0) ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  drawBackdrop();
  world.pipes.forEach(drawPipe);
  drawParticles();
  drawBuddy();
  ctx.restore();
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 107, 54, ${world.flash * 0.28})`;
    ctx.fillRect(0, 0, world.width, world.height);
  }
}

function loop(timestamp) {
  const dt = Math.min((timestamp - world.lastTime) / 1000 || 0, 0.034);
  world.lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
canvas.addEventListener("pointerdown", () => world.state === STATE.PLAYING && flap());
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (world.state === STATE.READY || world.state === STATE.OVER) startGame(); else flap();
  }
  if (event.code === "KeyR") startGame();
});
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(loop);

// Expose the primary action to browsers that support WebMCP.
if (document.modelContext?.registerTool) {
  Promise.resolve(document.modelContext.registerTool({
    name: "start_flappy_buddy_game",
    title: "Start Flappy Buddy",
    description: "Start a fresh Flappy Buddy game and reset the visible score.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      startGame();
      return { status: world.state, score: world.score };
    },
  })).catch(() => {});
}
