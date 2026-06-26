/* ---------- NATURAL CAT ENGINE (with visual offsets + fixed bounds) ---------- */
document.addEventListener("DOMContentLoaded", () => {

/* ---------- CONFIG ---------- */
const frameCount = 4;
const frameSize = 64;

/* Visual offset to lift the visible sprite upward */
const visualOffsetY = -140;   // adjust between -40 and -60 depending on sprite padding

const cats = {
  luna: {
    el: document.getElementById("lunaSprite"),
    rowWalk: 0,
    rowIdle: 1,
    rowJump: 2,
    rowPet: 3,
    speed: 90,
    chaseSpeed: 150,
    wanderTimer: 0,
    wanderCooldown: 0,
    jitter: 0,
    x: 200,   // higher spawn
    y: 120,
    state: "idle"
  },
  midnight: {
    el: document.getElementById("midnightSprite"),
    rowWalk: 0,
    rowIdle: 1,
    rowJump: 2,
    rowPet: 3,
    speed: 120,
    chaseSpeed: 200,
    wanderTimer: 0,
    wanderCooldown: 0,
    jitter: 0,
    x: 400,   // higher spawn
    y: 120,
    state: "idle"
  }
};

let chaseMode = false;
let randomChase = false;
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let soundEnabled = true;
let nightMode = false;

/* ---------- ELEMENTS ---------- */
const yarn = document.getElementById("yarnBall");
const soundToggle = document.getElementById("soundToggle");
const nightToggle = document.getElementById("nightToggle");

/* ---------- AUDIO ---------- */
const meows = [
  new Audio("assets/audio/meow1.mp3"),
  new Audio("assets/audio/meow2.mp3")
];

const purr = new Audio("assets/audio/purr.mp3");
purr.loop = true;

function playMeow() {
  if (!soundEnabled) return;
  const s = meows[Math.floor(Math.random() * meows.length)];
  s.volume = 0.7;
  s.currentTime = 0;
  s.play();
}

function startPurr() {
  if (!soundEnabled) return;
  purr.volume = 0.35;
  if (purr.paused) purr.play();
}

function stopPurr() {
  purr.pause();
}

/* ---------- SPRITE ANIMATION ---------- */
let animFrame = 0;
let frameTimer = 0;
const frameInterval = 0.12;

function setSpriteFrame(cat, row, frame) {
  const x = -frame * frameSize;
  const y = -row * frameSize;
  cat.el.style.backgroundPosition = `${x}px ${y}px`;
}

/* ---------- NATURAL WANDER LOGIC ---------- */
function pickNewWanderTarget(cat) {
  const padding = 140; // increased padding to avoid bottom drift

  cat.targetX = Math.random() * (window.innerWidth - padding * 2) + padding;
  cat.targetY = Math.random() * (window.innerHeight - padding * 2) + padding;

  cat.jitter = (Math.random() - 0.5) * 40;
  cat.wanderCooldown = 0.8 + Math.random() * 1.4;
}

/* ---------- MOVEMENT ---------- */
function moveCat(catKey, dt) {
  const cat = cats[catKey];

  let targetX, targetY, speed;

  /* --- CHASE MODE --- */
  if (chaseMode) {
    if (Math.random() < 0.85) {
      targetX = mousePos.x;
      targetY = mousePos.y;
    } else {
      targetX = mousePos.x + (Math.random() - 0.5) * 300;
      targetY = mousePos.y + (Math.random() - 0.5) * 300;
    }
    speed = cat.chaseSpeed;
  }

  /* --- RANDOM CHASE BURSTS --- */
  else if (randomChase) {
    targetX = mousePos.x;
    targetY = mousePos.y;
    speed = cat.chaseSpeed;
  }

  /* --- NATURAL WANDERING --- */
  else {
    speed = cat.speed;

    cat.wanderTimer += dt;

    if (!cat.targetX || cat.wanderTimer > cat.wanderCooldown) {
      pickNewWanderTarget(cat);
      cat.wanderTimer = 0;
    }

    targetX = cat.targetX + cat.jitter;
    targetY = cat.targetY + cat.jitter;
  }

  /* --- MOVEMENT CALCULATION --- */
  const dx = targetX - cat.x;
  const dy = targetY - cat.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 4) {
    cat.x += (dx / dist) * speed * dt;
    cat.y += (dy / dist) * speed * dt;
    cat.state = "walk";
  } else {
    cat.state = "idle";
  }

  /* ---------- FIXED SCREEN BOUNDS ---------- */
  const topBound = 0;
  const bottomBound = window.innerHeight - 140; // raised to prevent sinking
  const leftBound = 0;
  const rightBound = window.innerWidth - 64;

  cat.x = Math.max(leftBound, Math.min(rightBound, cat.x));
  cat.y = Math.max(topBound, Math.min(bottomBound, cat.y));

  /* ---------- APPLY VISUAL OFFSET ---------- */
  cat.el.style.transform =
    `translate(${cat.x}px, ${cat.y + visualOffsetY}px) scaleX(${dx < 0 ? -1 : 1})`;
}

/* ---------- COLLISION ---------- */
function handleCollision() {
  const a = cats.luna;
  const b = cats.midnight;

  const ra = a.el.getBoundingClientRect();
  const rb = b.el.getBoundingClientRect();

  const overlap = !(
    ra.right < rb.left ||
    ra.left > rb.right ||
    ra.bottom < rb.top ||
    ra.top > rb.bottom
  );

  if (overlap) {
    const dx = b.x - a.x || 1;
    const dy = b.y - a.y || 1;
    const dist = Math.hypot(dx, dy);

    a.x -= (dx / dist) * 10;
    a.y -= (dy / dist) * 10;
    b.x += (dx / dist) * 10;
    b.y +=
