/* ============================================================
   FINDERFOUND — NATURAL CAT ENGINE (FIXED & POLISHED)
   - Fixed: visual offset causing persistent "below cursor" chase
   - Fixed: cats going off-screen (now visual-based clamping)
   - Added: resize handler, initial positioning, smoother feel
   - Cleaned: better structure, comments, no blocking z-index
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const frameCount = 4;
  const frameSize = 64;

  /* Visual offset corrects for sprite sheet padding so the drawn cat
     aligns naturally with its logical position point. */
  const VISUAL_OFFSET_Y = -110;

  /* Safe margins for visual sprites (prevents clipping + respects header)
     Lowered MARGIN_TOP to allow wandering near the top of the screen. */
  const SPRITE_W = 64;
  const SPRITE_H = 64;
  const MARGIN_X = 28;
  const MARGIN_TOP = 28;   // allows cats near top (can slightly overlap header)
  const MARGIN_BOTTOM = 75;

  /* ---------- CAT DEFINITIONS ---------- */
  const cats = {
    luna: {
      el: document.getElementById("lunaSprite"),
      rowWalk: 0,
      rowIdle: 1,
      rowJump: 2,
      rowPet: 3,
      speed: 88,          // Luna: calmer, slower wanderer
      chaseSpeed: 155,
      wanderTimer: 0,
      wanderCooldown: 0,
      jitter: 0,
      x: 0,
      y: 0,
      targetX: null,
      targetY: null,
      state: "idle",
      personality: "calm"   // more idle time, gentler
    },
    midnight: {
      el: document.getElementById("midnightSprite"),
      rowWalk: 0,
      rowIdle: 1,
      rowJump: 2,
      rowPet: 3,
      speed: 132,         // Midnight: energetic, zoomier
      chaseSpeed: 225,
      wanderTimer: 0,
      wanderCooldown: 0,
      jitter: 0,
      x: 0,
      y: 0,
      targetX: null,
      targetY: null,
      state: "idle",
      personality: "energetic"
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
    s.volume = 0.65;
    s.currentTime = 0;
    s.play().catch(() => {});
  }

  function startPurr() {
    if (!soundEnabled) return;
    purr.volume = 0.32;
    if (purr.paused) purr.play().catch(() => {});
  }

  function stopPurr() {
    purr.pause();
  }

  /* ---------- SPRITE ANIMATION ---------- */
  let animFrame = 0;
  let frameTimer = 0;
  const frameInterval = 0.115;

  function setSpriteFrame(cat, row, frame) {
    const x = -frame * frameSize;
    const y = -row * frameSize;
    cat.el.style.backgroundPosition = `${x}px ${y}px`;
  }

  /* ---------- SAFE VISUAL-AWARE BOUNDS ---------- */
  function clampToScreen(cat) {
    let visX = cat.x;
    let visY = cat.y + VISUAL_OFFSET_Y;

    visX = Math.max(MARGIN_X, Math.min(window.innerWidth - SPRITE_W - MARGIN_X, visX));
    visY = Math.max(MARGIN_TOP, Math.min(window.innerHeight - SPRITE_H - MARGIN_BOTTOM, visY));

    cat.x = visX;
    cat.y = visY - VISUAL_OFFSET_Y;
  }

  /* ---------- NATURAL WANDER (visual-safe targets + personality) ---------- */
  function pickNewWanderTarget(cat) {
    const visMinX = MARGIN_X + 20;
    const visMaxX = window.innerWidth - SPRITE_W - MARGIN_X - 20;
    const visMinY = MARGIN_TOP + 30;
    const visMaxY = window.innerHeight - SPRITE_H - MARGIN_BOTTOM - 30;

    const targetVisX = Math.random() * (visMaxX - visMinX) + visMinX;
    const targetVisY = Math.random() * (visMaxY - visMinY) + visMinY;

    cat.targetX = targetVisX;
    cat.targetY = targetVisY - VISUAL_OFFSET_Y;

    cat.jitter = (Math.random() - 0.5) * (cat.personality === "calm" ? 22 : 34);

    // Personality-based wander cooldown
    if (cat.personality === "calm") {
      cat.wanderCooldown = 1.6 + Math.random() * 2.4; // Luna lingers longer
    } else {
      cat.wanderCooldown = 0.9 + Math.random() * 1.6;  // Midnight moves more often
    }
  }

  /* ---------- MOVEMENT (core fixed logic) ---------- */
  function moveCat(catKey, dt) {
    const cat = cats[catKey];
    let targetX, targetY, speed;

    if (chaseMode) {
      targetX = mousePos.x;
      targetY = mousePos.y - VISUAL_OFFSET_Y; // KEY FIX: align visual cat with cursor
      if (Math.random() < 0.28) {
        targetX += (Math.random() - 0.5) * 90;
        targetY += (Math.random() - 0.5) * 55;
      }
      speed = cat.chaseSpeed;
    } 
    else if (randomChase) {
      targetX = mousePos.x;
      targetY = mousePos.y - VISUAL_OFFSET_Y;
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

    if (dist > 3.5) {
      cat.x += (dx / dist) * speed * dt;
      cat.y += (dy / dist) * speed * dt;
      cat.state = "walk";
    } else {
      cat.state = (cat.state === "pet" || cat.state === "jump") ? cat.state : "idle";
    }

    clampToScreen(cat);

    /* Apply visual transform (offset only affects rendering) */
    const facing = dx < 0 ? -1 : 1;
    cat.el.style.transform =
      `translate(${cat.x}px, ${cat.y + VISUAL_OFFSET_Y}px) scaleX(${facing})`;
  }

  /* ---------- COLLISION (gentle push + meow) ---------- */
  function handleCollision() {
    const a = cats.luna;
    const b = cats.midnight;

    const ra = a.el.getBoundingClientRect();
    const rb = b.el.getBoundingClientRect();

    const overlap = !(
      ra.right < rb.left || ra.left > rb.right ||
      ra.bottom < rb.top || ra.top > rb.bottom
    );

    if (overlap) {
      const dx = (b.x - a.x) || 1;
      const dy = (b.y - a.y) || 1;
      const dist = Math.hypot(dx, dy) || 1;

      const push = 9;
      a.x -= (dx / dist) * push;
      a.y -= (dy / dist) * push;
      b.x += (dx / dist) * push;
      b.y += (dy / dist) * push;

      a.state = "jump";
      b.state = "jump";
      playMeow();
      clampToScreen(a);
      clampToScreen(b);
    }
  }

  /* ---------- PETTING (hover, click, touch — shows pet frames) ---------- */
  function setupPet(catKey) {
    const cat = cats[catKey];
    const triggerPet = () => {
      if (chaseMode) return; // Don't interrupt chase mode
      cat.state = "pet";
      startPurr();
      playMeow();
      // Auto-return to idle after short pet session
      setTimeout(() => {
        if (cat.state === "pet") cat.state = "idle";
        stopPurr();
      }, 1400);
    };

    cat.el.addEventListener("mouseenter", () => {
      if (!chaseMode) triggerPet();
    });

    cat.el.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerPet();
    });

    // Touch support for mobile
    cat.el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!chaseMode) triggerPet();
    }, { passive: false });

    cat.el.addEventListener("mouseleave", () => {
      if (cat.state === "pet" && !chaseMode) {
        cat.state = "idle";
        stopPurr();
      }
    });
  }

  setupPet("luna");
  setupPet("midnight");

  /* ---------- YARN / CHASE MODE ---------- */
  yarn.addEventListener("click", () => {
    chaseMode = !chaseMode;

    if (chaseMode) {
      document.body.style.cursor = "url('assets/sprites/yarnball.png') 16 16, auto";
      yarn.classList.add("ff-yarn-active");
      playMeow();
      stopPurr();
    } else {
      document.body.style.cursor = "default";
      yarn.classList.remove("ff-yarn-active");
      startPurr();
    }
  });

  /* Occasional zoomies — more frequent for energetic Midnight */
  setInterval(() => {
    if (chaseMode || randomChase) return;
    // Luna occasionally too, but rarer
    const chance = Math.random() < (cats.midnight.personality === "energetic" ? 0.28 : 0.09);
    if (chance) {
      randomChase = true;
      playMeow();
      setTimeout(() => { randomChase = false; }, 1450 + Math.random() * 800);
    }
  }, 5200);

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

  /* ---------- RESIZE HANDLER (keep cats on screen) ---------- */
  window.addEventListener("resize", () => {
    Object.values(cats).forEach(cat => clampToScreen(cat));
  });

  /* ---------- INITIAL POSITIONING (no flash at 0,0) ---------- */
  function initCats() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Luna starts leftish
    cats.luna.x = Math.max(MARGIN_X + 40, w * 0.18);
    cats.luna.y = 280;
    clampToScreen(cats.luna);
    cats.luna.el.style.transform = `translate(${cats.luna.x}px, ${cats.luna.y + VISUAL_OFFSET_Y}px) scaleX(1)`;

    // Midnight starts rightish
    cats.midnight.x = Math.min(w * 0.78, w - SPRITE_W - MARGIN_X - 40);
    cats.midnight.y = 310;
    clampToScreen(cats.midnight);
    cats.midnight.el.style.transform = `translate(${cats.midnight.x}px, ${cats.midnight.y + VISUAL_OFFSET_Y}px) scaleX(1)`;
  }

  initCats();

  /* ---------- MAIN LOOP ---------- */
  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt for stability
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