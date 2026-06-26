/* ---------- NATURAL CAT ENGINE (FINAL CALIBRATED VERSION) ---------- */
document.addEventListener("DOMContentLoaded", () => {

const frameCount = 4;
const frameSize = 64;

/* Adjusted offset so cats appear on-screen */
const visualOffsetY = -70;

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
    y: 140,   // visible spawn
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
    y: 140,   // visible spawn
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
  const padding = 160;

  cat.targetX = Math.random() * (window.innerWidth - padding * 2) + padding;
  cat.targetY = Math.random() * (window.innerHeight - padding * 2) + padding;

  cat.jitter = (Math.random() - 0.5) * 40;
  cat.wanderCooldown = 0.8 + Math.random() * 1.4;
}

/* ---------- MOVEMENT ---------- */
function moveCat(catKey, dt) {
  const cat = cats[catKey];

  let targetX, targetY, speed;

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

  else if (randomChase) {
    targetX = mousePos.x;
    targetY = mousePos.y;
    speed = cat.chaseSpeed;
  }

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
  const topBound = 60;                         // calibrated
  const bottomBound = window.innerHeight - 160;
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
    b.y += (dy / dist) * 10;

    a.state = "jump";
    b.state = "jump";
    playMeow();
  }
}

/* ---------- PETTING ---------- */
function setupPet(catKey) {
  const cat = cats[catKey];
  cat.el.addEventListener("mouseenter", () => {
    cat.state = "pet";
    startPurr();
  });
  cat.el.addEventListener("mouseleave", () => {
    cat.state = "idle";
  });
}

setupPet("luna");
setupPet("midnight");

/* ---------- YARN MODE ---------- */
yarn.addEventListener("click", () => {
  chaseMode = !chaseMode;

  if (chaseMode) {
    document.body.style.cursor = "url('assets/sprites/yarnball.png') 0 0, auto";
    yarn.classList.add("ff-yarn-active");
    playMeow();
    stopPurr();
  } else {
    document.body.style.cursor = "default";
    yarn.classList.remove("ff-yarn-active");
    startPurr();
  }
});

/* Midnight zoomies */
setInterval(() => {
  if (chaseMode) return;
  if (Math.random() < 0.25) {
    randomChase = true;
    playMeow();
    setTimeout(() => { randomChase = false; }, 2000);
  }
}, 6000);

/* ---------- SOUND ---------- */
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) {
    stopPurr();
    soundToggle.textContent = "🔇 Sound Off";
  } else {
    soundToggle.textContent = "🔊 Sound On";
    startPurr();
  }
});

/* ---------- NIGHT MODE ---------- */
nightToggle.addEventListener("click", () => {
  nightMode = !nightMode;
  document.body.classList.toggle("ff-night", nightMode);
  nightToggle.textContent = nightMode ? "🌙 Night On" : "🌙 Night Off";
});

/* ---------- MOUSE TRACKING ---------- */
document.addEventListener("mousemove", (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

/* ---------- MAIN LOOP ---------- */
let lastTime = performance.now();

function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  moveCat("luna", dt);
  moveCat("midnight", dt);
  handleCollision();

  frameTimer += dt;
  if (frameTimer >= frameInterval) {
    frameTimer = 0;
    animFrame = (animFrame + 1) % frameCount;
  }

  Object.values(cats).forEach(cat => {
    let row = cat.rowIdle;
    if (cat.state === "walk") row = cat.rowWalk;
    if (cat.state === "jump") row = cat.rowJump;
    if (cat.state === "pet")  row = cat.rowPet;
    setSpriteFrame(cat, row, animFrame);
  });

  requestAnimationFrame(loop);
}

startPurr();
requestAnimationFrame(loop);

}); // end DOMContentLoaded
