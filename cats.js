/* ---------- CONFIG ---------- */
document.addEventListener("DOMContentLoaded", () => {

const cats = {
  luna: {
    el: null,
    rowWalk: 0,
    rowIdle: 1,
    rowJump: 2,
    rowPet: 3,
    speed: 0.25,
    chaseSpeed: 0.45,
    personality: "gentle"
  },
  midnight: {
    el: null,
    rowWalk: 0,
    rowIdle: 1,
    rowJump: 2,
    rowPet: 3,
    speed: 0.45,
    chaseSpeed: 0.75,
    personality: "mischievous"
  }
};

const frameCount = 4;
const frameSize = 64;
let chaseMode = false;
let randomChase = false;
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let soundEnabled = true;
let nightMode = false;

/* ---------- ELEMENTS ---------- */

const yarn = document.getElementById("yarnBall");
const soundToggle = document.getElementById("soundToggle");
const nightToggle = document.getElementById("nightToggle");

cats.luna.el = document.getElementById("lunaSprite");
cats.midnight.el = document.getElementById("midnightSprite");

/* Initial positions (higher on screen) */
cats.luna.x = window.innerWidth * 0.3;
cats.luna.y = window.innerHeight * 0.35;
cats.midnight.x = window.innerWidth * 0.6;
cats.midnight.y = window.innerHeight * 0.35;

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

/* ---------- MOVEMENT / AI ---------- */

function moveCat(catKey, dt) {
  const cat = cats[catKey];

  let targetX = cat.targetX;
  let targetY = cat.targetY;

  let speed;

  if (chaseMode || randomChase) {
    targetX = mousePos.x;
    targetY = mousePos.y;
    speed = cat.chaseSpeed;
  } else {
    speed = cat.speed;
    if (!cat.targetX || Math.random() < 0.005) {
      cat.targetX = Math.random() * (window.innerWidth - 100) + 50;
      cat.targetY = Math.random() * (window.innerHeight - 150) + 80;
    }
    targetX = cat.targetX;
    targetY = cat.targetY;
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

  cat.x = Math.max(0, Math.min(window.innerWidth - frameSize, cat.x));
  cat.y = Math.max(0, Math.min(window.innerHeight - frameSize, cat.y));

  cat.el.style.transform = `translate(${cat.x}px, ${cat.y}px) scaleX(${dx < 0 ? -1 : 1})`;
}

/* ---------- COLLISION DETECTION ---------- */

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

    a.x -= (dx / dist) * 5;
    a.y -= (dy / dist) * 5;
    b.x += (dx / dist) * 5;
    b.y += (dy / dist) * 5;

    a.state = "jump";
    b.state = "jump";
    playMeow();
  }
}

/* ---------- PET INTERACTION ---------- */

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

/* ---------- YARN / CHASE MODE ---------- */

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

/* Random chase bursts for Midnight */
setInterval(() => {
  if (chaseMode) return;
  if (Math.random() < 0.25) {
    randomChase = true;
    playMeow();
    setTimeout(() => { randomChase = false; }, 2000);
  }
}, 6000);

/* ---------- SOUND TOGGLE ---------- */

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

/* ---------- NIGHT MODE + KONAMI ---------- */

nightToggle.addEventListener("click", toggleNight);

function toggleNight() {
  nightMode = !nightMode;
  document.body.classList.toggle("ff-night", nightMode);
  nightToggle.textContent = nightMode ? "🌙 Night On" : "🌙 Night Off";
}

const konamiSeq = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"
];
let konamiIndex = 0;

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === konamiSeq[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiSeq.length) {
      konamiIndex = 0;
      if (!nightMode) toggleNight();
      cats.luna.state = "jump";
      cats.midnight.state = "jump";
      playMeow();
    }
  } else {
    konamiIndex = 0;
  }
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
