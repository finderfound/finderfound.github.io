/* ---------- NATURAL CAT ENGINE (CALIBRATED FOR FINDERFOUND.COM) ---------- */
document.addEventListener("DOMContentLoaded", () => {

/* ---------- CONFIG ---------- */
const frameCount = 4;
const frameSize = 64;

/* Visual offset to counter sprite padding */
const visualOffsetY = -90;

/* ---------- CAT DEFINITIONS ---------- */
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
    x: 200,
    y: 40,     // SPAWN ABOVE HERO
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
    x: 400,
    y: 40,     // SPAWN ABOVE HERO
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
function pickNewWanderTarget(cat
