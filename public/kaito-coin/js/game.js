(() => {
  "use strict";

  const TUNE = {
    speed0: 310,
    speedMax: 490,
    gravity: 2700,
    jumpTap: 780,
    jumpHigh: 840,
    holdTime: 0.16,
    magnetR: 136,
    crateH: 158,
    crateW: 54,
    kaitoFrac: 0.36,
    bipFrac: 0.44,
  };

  const BEST_KEY = "suicoin-best";
  const DEBUG = new URLSearchParams(location.search).has("debug");

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const title = document.getElementById("title");
  const over = document.getElementById("over");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const titleBest = document.getElementById("title-best");
  const overTitle = document.getElementById("over-title");
  const overScore = document.getElementById("over-score");
  const overBest = document.getElementById("over-best");
  const startBtn = document.getElementById("start");
  const retryBtn = document.getElementById("retry");
  const banner = document.getElementById("banner");

  const kaitoImg = new Image();
  const bipImg = new Image();
  kaitoImg.src = "sprites/kaito.png";
  bipImg.src = "sprites/bipbo.png";

  let viewW = 390;
  let viewH = 844;
  let dpr = 1;
  let S = 1;
  let state = "boot";
  let best = readBest();
  let score = 0;
  let cam = 0;
  let speed = 0;
  let runT = 0;
  let py = 0;
  let vy = 0;
  let bipY = 0;
  let grounded = true;
  let coyote = 0;
  let hold = false;
  let jumpT = 0;
  let wantHigh = false;
  let landT = 0;
  let shake = 0;
  let spawnX = 0;
  let rng = 1;
  let deathKind = "pit";
  let last = 0;
  let pointerId = null;
  let pointerY0 = 0;
  let audioCtx = null;
  let grounds = [];
  let crates = [];
  let coins = [];
  let parts = [];
  let floaters = [];
  let titleCoins = [];
  let titleSpawn = 0;
  let warned = false;
  let warnT = 0;
  let started = false;

  function readBest() {
    try {
      return Math.max(0, parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0);
    } catch (err) {
      return 0;
    }
  }

  function writeBest(n) {
    try {
      localStorage.setItem(BEST_KEY, String(n));
    } catch (err) {
      /* private mode */
    }
  }

  function rand() {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    viewW = Math.max(280, window.innerWidth);
    viewH = Math.max(420, window.innerHeight);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    canvas.style.width = viewW + "px";
    canvas.style.height = viewH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (state !== "play") S = viewH / 844;
  }

  function groundY() {
    return viewH * 0.78;
  }

  function kaitoH() {
    return Math.min(viewH * TUNE.kaitoFrac, viewW * 1.15);
  }

  function bipH() {
    return kaitoH() * TUNE.bipFrac;
  }

  function spriteW(img, h) {
    if (!img.width) return h * 0.4;
    return (h * img.width) / img.height;
  }

  function playerScreenX() {
    return Math.min(viewW * 0.28, 148);
  }

  function bipScreenX() {
    return playerScreenX() + spriteW(kaitoImg, kaitoH()) * 0.48;
  }

  function playerWorldX() {
    return cam + playerScreenX();
  }

  function magnetCenter() {
    const feet = state === "title" ? groundY() : bipY;
    return {
      x: state === "title" ? bipScreenX() : cam + bipScreenX(),
      y: feet - bipH() * 0.56,
    };
  }

  function refreshBestLabels() {
    titleBest.textContent = "ベスト " + best + "枚";
    bestEl.textContent = String(best);
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
    scoreEl.classList.remove("pop");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("pop");
  }

  function unlockAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function tone(freq, dur, type, gain, slide) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function sfxJump() {
    tone(420, 0.09, "square", 0.04, 220);
  }

  function sfxCoin() {
    tone(880, 0.06, "square", 0.045, 1320);
  }

  function sfxDie() {
    tone(180, 0.28, "sawtooth", 0.05, 50);
  }

  function makeCoin(x, y, tier) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      tier,
      caught: false,
      spin: rand() < 0.5 ? -1 : 1,
      hot: false,
    };
  }

  function resetRun() {
    S = viewH / 844;
    score = 0;
    cam = 0;
    speed = TUNE.speed0 * S;
    runT = 0;
    py = groundY();
    bipY = py;
    vy = 0;
    grounded = true;
    coyote = 0;
    hold = false;
    jumpT = 0;
    wantHigh = false;
    landT = 0;
    shake = 0;
    grounds = [];
    crates = [];
    coins = [];
    parts = [];
    floaters = [];
    warned = false;
    banner.hidden = true;
    rng = (Date.now() & 0xfffff) || 1;
    layIntro();
    updateHud();
  }

  function layIntro() {
    const g0 = 1780 * S;
    grounds.push({ x: -240 * S, w: g0 + 240 * S });
    spawnX = g0;
    for (let i = 0; i < 8; i++) {
      coins.push(makeCoin((300 + i * 62) * S, groundY() - 78 * S, 0));
    }
    crates.push({ x: 1280 * S, w: TUNE.crateW * S, h: TUNE.crateH * S });
    for (let i = 0; i < 3; i++) {
      coins.push(makeCoin((1240 + i * 56) * S, groundY() - 330 * S, 2));
    }
    const gap = 128 * S;
    spawnX += gap;
    const plat = 420 * S;
    grounds.push({ x: spawnX, w: plat });
    for (let i = 0; i < 4; i++) {
      const u = (i + 1) / 5;
      coins.push(makeCoin(spawnX - gap * (1 - u), groundY() - (90 + u * 80) * S, 1));
    }
    spawnX += plat;
  }

  function ensureWorld() {
    const horizon = cam + viewW + 640;
    let guard = 0;
    while (spawnX < horizon && guard++ < 8) {
      const travel = spawnX / S;
      const t = Math.min(1, travel / 5200);
      if (rand() < 0.28 + t * 0.22) {
        const gap = (110 + rand() * 36 + t * 90) * S;
        const plat = (240 + rand() * 200) * S;
        spawnX += gap;
        grounds.push({ x: spawnX, w: plat });
        const n = 3;
        for (let i = 0; i < n; i++) {
          const u = (i + 1) / (n + 1);
          coins.push(makeCoin(spawnX - gap * (1 - u), groundY() - (70 + u * 120) * S, 1));
        }
        maybeCrate(spawnX, plat, t);
        maybeCoins(spawnX, plat, t);
        spawnX += plat;
      } else {
        const plat = (300 + rand() * 240) * S;
        grounds.push({ x: spawnX, w: plat });
        maybeCoins(spawnX, plat, t);
        maybeCrate(spawnX, plat, t);
        spawnX += plat;
      }
    }
  }

  function maybeCrate(x, plat, t) {
    const margin = 120 * S;
    if (plat < margin + 80 * S) return;
    if (rand() > 0.72) return;
    crates.push({
      x: x + margin + rand() * (plat - margin - 70 * S),
      w: TUNE.crateW * S,
      h: (TUNE.crateH + t * 18) * S,
    });
  }

  function maybeCoins(x, plat, t) {
    const roll = rand();
    if (roll < 0.4) {
      const count = 4 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        coins.push(makeCoin(x + 36 * S + i * 58 * S, groundY() - 78 * S, 0));
      }
    } else if (roll < 0.72) {
      const count = 5;
      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const y = groundY() - (120 + Math.sin(u * Math.PI) * 140) * S;
        coins.push(makeCoin(x + 28 * S + i * 54 * S, y, 1));
      }
    } else {
      for (let i = 0; i < 3; i++) {
        coins.push(makeCoin(x + 48 * S + i * 56 * S, groundY() - (330 + t * 16) * S, 2));
      }
    }
  }

  function groundUnder(x) {
    for (let i = 0; i < grounds.length; i++) {
      const g = grounds[i];
      if (x >= g.x && x <= g.x + g.w) return groundY();
    }
    return null;
  }

  function hitbox() {
    const h = kaitoH();
    const w = spriteW(kaitoImg, h) * 0.5;
    const top = py - h * 0.76;
    return { x: playerWorldX() - w / 2, y: top, w, h: py - 4 - top };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function startJump(high) {
    if (state !== "play") return;
    if (!(grounded || coyote > 0)) return;
    grounded = false;
    coyote = 0;
    hold = true;
    jumpT = 0;
    wantHigh = !!high;
    vy = -(high ? TUNE.jumpHigh : TUNE.jumpTap) * S;
    sfxJump();
  }

  function releaseJump() {
    hold = false;
  }

  function boostHigh() {
    if (state !== "play" || grounded) return;
    wantHigh = true;
    vy = Math.min(vy, -TUNE.jumpHigh * S);
  }

  function kill(kind) {
    if (state !== "play") return;
    state = "dead";
    deathKind = kind;
    hold = false;
    shake = 16;
    if (score > best) {
      best = score;
      writeBest(best);
    }
    overTitle.textContent = kind === "crate" ? "ぶつかった" : "おちた";
    overScore.textContent = String(score);
    overBest.textContent = String(best);
    refreshBestLabels();
    over.hidden = false;
    hud.hidden = true;
    sfxDie();
  }

  function begin() {
    unlockAudio();
    resetRun();
    state = "play";
    title.hidden = true;
    over.hidden = true;
    hud.hidden = false;
  }

  function burst(x, y, n, kind) {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const sp = (50 + rand() * 160) * S;
      parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40 * S,
        t: 0,
        life: 0.28 + rand() * 0.28,
        kind,
      });
    }
  }

  function collect(coin, at) {
    coin.caught = true;
    burst(at.x, at.y, 8, "spark");
    if (state !== "play") {
      sfxCoin();
      return;
    }
    score += 1;
    shake = Math.max(shake, 4);
    floaters.push({ x: at.x, y: at.y - 12 * S, t: 0 });
    sfxCoin();
    updateHud();
  }

  function suckCoins(list, worldSpace, dt) {
    const m = magnetCenter();
    const R = TUNE.magnetR * S;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.caught) continue;
      const dx = m.x - c.x;
      const dy = m.y - c.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      if (state !== "dead" && dist < R) {
        c.hot = true;
        const nx = dx / dist;
        const ny = dy / dist;
        const pull = 1 - dist / R;
        const tangent = 0.62 * pull * Math.min(1, dist / (42 * S));
        const accel = (820 + pull * 2400) * S;
        c.vx += (nx * accel + -ny * c.spin * accel * tangent) * dt;
        c.vy += (ny * accel + nx * c.spin * accel * tangent) * dt;
        const drag = Math.pow(0.05, dt);
        c.vx *= drag;
        c.vy *= drag;
        const maxV = 980 * S;
        const sp = Math.hypot(c.vx, c.vy);
        if (sp > maxV) {
          c.vx = (c.vx / sp) * maxV;
          c.vy = (c.vy / sp) * maxV;
        }
      } else if (c.hot) {
        c.vx *= Math.pow(0.12, dt);
        c.vy *= Math.pow(0.12, dt);
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (!worldSpace) {
        c.x += c.drift * dt;
      }
      if (dist < 22 * S) collect(c, m);
    }
  }

  function updatePlay(dt) {
    runT += dt;
    const ramp = Math.min(1, runT / 50);
    speed = (TUNE.speed0 + (TUNE.speedMax - TUNE.speed0) * ramp) * S;
    cam += speed * dt;

    if (hold && !wantHigh && vy < 0 && jumpT < TUNE.holdTime) {
      jumpT += dt;
      if (jumpT > 0.05) {
        const u = Math.min(1, (jumpT - 0.05) / (TUNE.holdTime - 0.05));
        const target = -(TUNE.jumpTap + (TUNE.jumpHigh - TUNE.jumpTap) * u) * S;
        if (vy > target) vy = target;
      }
    }

    vy += TUNE.gravity * S * dt;
    if (vy > 1400 * S) vy = 1400 * S;
    const prevY = py;
    py += vy * dt;

    const foot = playerWorldX();
    const gy = groundUnder(foot);
    if (gy != null && vy >= 0 && prevY <= gy + 6 * S && py >= gy) {
      py = gy;
      vy = 0;
      if (!grounded) landT = 1;
      grounded = true;
      coyote = 0.1;
      jumpT = 0;
      wantHigh = false;
    } else {
      if (grounded) coyote = 0.1;
      grounded = false;
      if (coyote > 0) coyote -= dt;
    }

    if (!grounded && gy == null && py > groundY() + 28 * S) kill("pit");
    if (py > viewH + 80) kill("pit");

    if (!warned) {
      for (let i = 0; i < crates.length; i++) {
        const ahead = crates[i].x - foot;
        if (ahead > 0 && ahead < 420 * S) {
          warned = true;
          warnT = 1.5;
          banner.hidden = false;
          break;
        }
      }
    } else if (warnT > 0) {
      warnT -= dt;
      if (warnT <= 0) banner.hidden = true;
    }

    const body = hitbox();
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      const box = { x: c.x + 4 * S, y: groundY() - c.h, w: c.w - 8 * S, h: c.h };
      if (overlaps(body, box)) {
        kill("crate");
        break;
      }
    }

    const follow = 1 - Math.pow(0.0015, dt);
    bipY += (py - bipY) * follow;

    if (grounded && rand() < dt * 18) {
      parts.push({
        x: foot - 10 * S,
        y: py,
        vx: (-80 - rand() * 80) * S,
        vy: (-20 - rand() * 40) * S,
        t: 0,
        life: 0.35,
        kind: "dust",
      });
    }

    suckCoins(coins, true, dt);
    ensureWorld();
  }

  function updateTitle(dt) {
    runT += dt;
    S = viewH / 844;
    py = groundY();
    bipY = py;
    vy = 0;
    grounded = true;
    cam = 0;
    titleSpawn -= dt;
    if (titleSpawn <= 0 && titleCoins.length < 7) {
      titleSpawn = 0.42;
      titleCoins.push({
        x: viewW + 24,
        y: groundY() - (50 + rand() * 210) * S,
        vx: 0,
        vy: 0,
        drift: (-70 - rand() * 40) * S,
        caught: false,
        spin: rand() < 0.5 ? -1 : 1,
        hot: false,
        tier: 0,
      });
    }
    suckCoins(titleCoins, false, dt);
    titleCoins = titleCoins.filter((c) => !c.caught && c.x > -40);
  }

  function updateDead(dt) {
    vy += TUNE.gravity * S * dt;
    py += vy * dt;
    bipY += (py - bipY) * (1 - Math.pow(0.02, dt));
  }

  function updateParts(dt) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * S * dt;
    }
    parts = parts.filter((p) => p.t < p.life);
    for (let i = 0; i < floaters.length; i++) floaters[i].t += dt;
    floaters = floaters.filter((f) => f.t < 0.55);
    if (landT > 0) landT = Math.max(0, landT - dt * 5);
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    const left = cam - 360;
    if (state === "play") {
      grounds = grounds.filter((g) => g.x + g.w > left);
      crates = crates.filter((c) => c.x + c.w > left);
      coins = coins.filter((c) => !c.caught && c.x > left);
    }
  }

  function step(dt) {
    if (state === "title") updateTitle(dt);
    else if (state === "play") updatePlay(dt);
    else if (state === "dead") updateDead(dt);
    updateParts(dt);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, "#8ecfff");
    sky.addColorStop(0.42, "#e5f6ff");
    sky.addColorStop(1, "#fff3df");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, viewW + 40, viewH + 40);

    ctx.fillStyle = "#ffe38a";
    ctx.beginPath();
    ctx.arc(viewW * 0.8, viewH * 0.14, 34 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b1b1b";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const par = (state === "title" ? runT * 24 : cam * 0.22);
    for (let i = 0; i < 5; i++) {
      const span = viewW + 280;
      let x = (i * 230 * S - par) % span;
      if (x < -90) x += span;
      cloud(x, viewH * (0.1 + (i % 3) * 0.06), (40 + (i % 3) * 10) * S);
    }

    ctx.fillStyle = "#9ad67a";
    ctx.beginPath();
    const par2 = state === "title" ? runT * 40 : cam * 0.45;
    ctx.moveTo(0, groundY());
    for (let x = 0; x <= viewW; x += 16) {
      const y =
        groundY() -
        78 * S +
        Math.sin((x + par2) * 0.012) * 16 * S +
        Math.sin((x + par2) * 0.028) * 7 * S;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, groundY() + 4);
    ctx.lineTo(0, groundY() + 4);
    ctx.fill();
  }

  function cloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.arc(x + r * 0.62, y + r * 0.08, r * 0.48, 0, Math.PI * 2);
    ctx.arc(x - r * 0.55, y + r * 0.1, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    const gy = groundY();
    ctx.fillStyle = "#243041";
    ctx.fillRect(0, gy, viewW, viewH - gy);
    ctx.fillStyle = "#17202b";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(0, gy + 18 * S + i * 18 * S, viewW, 3);
    }
    if (state === "title") {
      platform(-30, gy, viewW + 60);
      return;
    }
    for (let i = 0; i < grounds.length; i++) {
      const g = grounds[i];
      const x = g.x - cam;
      if (x > viewW + 8 || x + g.w < -8) continue;
      platform(x, gy, g.w);
    }
  }

  function platform(x, y, w) {
    ctx.fillStyle = "#d7b07a";
    ctx.fillRect(x, y + 14 * S, w, viewH - y);
    ctx.fillStyle = "#6fce55";
    ctx.fillRect(x, y, w, 18 * S);
    ctx.strokeStyle = "#1b1b1b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + viewH);
    ctx.lineTo(x, y + 8);
    ctx.quadraticCurveTo(x, y, x + 8, y);
    ctx.lineTo(x + w - 8, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 8);
    ctx.lineTo(x + w, y + viewH);
    ctx.stroke();
  }

  function drawCrates() {
    if (state === "title") return;
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      const x = c.x - cam;
      const y = groundY() - c.h;
      if (x > viewW + 30 || x + c.w < -30) continue;
      ctx.fillStyle = "#e7a45a";
      ctx.strokeStyle = "#1b1b1b";
      ctx.lineWidth = 4;
      roundRect(x, y, c.w, c.h, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + c.w - 8, y + c.h - 8);
      ctx.moveTo(x + c.w - 8, y + 8);
      ctx.lineTo(x + 8, y + c.h - 8);
      ctx.moveTo(x + 6, y + c.h * 0.5);
      ctx.lineTo(x + c.w - 6, y + c.h * 0.5);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawMagnet() {
    if (state === "dead") return;
    const m = magnetCenter();
    const x = state === "title" ? m.x : m.x - cam;
    const y = m.y;
    const R = TUNE.magnetR * S;
    const pulse = 0.55 + 0.45 * Math.sin(runT * 5.2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R);
    glow.addColorStop(0, "rgba(90, 230, 255, 0.16)");
    glow.addColorStop(1, "rgba(90, 230, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.setLineDash([7 * S, 7 * S]);
    ctx.lineDashOffset = -runT * 46;
    ctx.strokeStyle = "rgba(20, 170, 210, " + (0.45 + pulse * 0.4) + ")";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawCoinList(list, world) {
    const R = TUNE.magnetR * S;
    const m = magnetCenter();
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.caught) continue;
      const x = world ? c.x - cam : c.x;
      const y = c.y;
      if (x < -40 || x > viewW + 40) continue;
      if (c.hot) {
        const mx = world ? m.x - cam : m.x;
        ctx.strokeStyle = "rgba(70, 210, 240, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - c.vx * 0.04, y - c.vy * 0.04, mx, m.y);
        ctx.stroke();
      }
      const r = (c.tier === 2 ? 13 : 15) * S;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(runT * 7 + i) * 0.25);
      ctx.fillStyle = c.tier === 2 ? "#ffe16a" : "#ffc83d";
      ctx.strokeStyle = "#1b1b1b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff6cf";
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.32, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const dx = m.x - c.x;
      const dy = m.y - c.y;
      if (Math.hypot(dx, dy) < R) c.near = true;
    }
  }

  function drawActor(img, screenX, feet, h, phase) {
    if (!img.complete || !img.naturalWidth) return;
    const w = spriteW(img, h);
    const bob = grounded ? Math.sin(runT * 13 + phase) * 4 * S : 0;
    const stretch = vy < -200 * S ? 1.06 : 1;
    const squash = 1 + (grounded ? Math.sin(runT * 13 + phase) * 0.035 : 0) + landT * 0.14;
    const sy = stretch / squash;
    const sx = 1 / sy;
    const rot = grounded ? Math.sin(runT * 13 + phase) * 0.035 : vy < 0 ? -0.06 : 0.1;
    ctx.save();
    ctx.translate(screenX, feet + bob);
    ctx.fillStyle = "rgba(40, 40, 40, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 6 * S, w * 0.28, 8 * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(state === "dead" ? Math.min(0.7, Math.max(-0.2, vy / (900 * S))) : rot);
    ctx.scale(sx, sy);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawPeople() {
    const feet = state === "title" ? groundY() : py;
    const bipFeet = state === "title" ? groundY() : bipY;
    drawActor(kaitoImg, playerScreenX(), feet, kaitoH(), 0);
    drawActor(bipImg, bipScreenX(), bipFeet, bipH(), 1.4);
  }

  function drawFx() {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const x = state === "title" ? p.x : p.x - cam;
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.kind === "dust" ? "#c4a574" : "#ffe16a";
      ctx.beginPath();
      ctx.arc(x, p.y, (p.kind === "dust" ? 5 : 4) * S * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#1b1b1b";
    ctx.font = "700 " + Math.round(18 * S) + "px MPlus, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      ctx.globalAlpha = 1 - f.t / 0.55;
      ctx.fillText("+1", f.x - cam, f.y - f.t * 40 * S);
    }
    ctx.globalAlpha = 1;
  }

  function drawDebug() {
    if (!DEBUG || state === "title") return;
    const b = hitbox();
    ctx.strokeStyle = "#ff3b6a";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - cam, b.y, b.w, b.h);
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((rand() - 0.5) * shake, (rand() - 0.5) * shake * 0.6);
    }
    drawBackground();
    drawGround();
    drawCrates();
    drawCoinList(state === "title" ? titleCoins : coins, state !== "title");
    drawMagnet();
    drawPeople();
    drawFx();
    drawDebug();
    ctx.restore();
  }

  function frame(now) {
    if (!last) last = now;
    const dt = Math.min(0.034, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function onDown(e) {
    if (state === "boot") return;
    if (e.target && e.target.closest && e.target.closest("button")) return;
    unlockAudio();
    if (state !== "play") {
      begin();
      pointerId = e.pointerId;
      return;
    }
    pointerId = e.pointerId;
    pointerY0 = e.clientY;
    startJump(false);
  }

  function onMove(e) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    if (pointerY0 - e.clientY > 34) boostHigh();
  }

  function onUp(e) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    pointerId = null;
    releaseJump();
  }

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.code !== "ArrowUp") return;
    e.preventDefault();
    if (e.repeat) return;
    unlockAudio();
    if (state !== "play") {
      begin();
      return;
    }
    startJump(e.code === "ArrowUp");
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") releaseJump();
  });

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    begin();
  });
  retryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    begin();
  });

  window.addEventListener("resize", () => {
    const wasGround = grounded;
    resize();
    if (wasGround && state !== "dead") {
      py = groundY();
      bipY = py;
    }
  });

  document.addEventListener("contextmenu", (e) => e.preventDefault());

  function boot() {
    if (started) return;
    if (!kaitoImg.complete || !bipImg.complete) return;
    if (!kaitoImg.naturalWidth || !bipImg.naturalWidth) return;
    started = true;
    resize();
    py = groundY();
    bipY = py;
    refreshBestLabels();
    state = "title";
    requestAnimationFrame(frame);
  }

  kaitoImg.onload = boot;
  bipImg.onload = boot;
  boot();

  if (DEBUG) {
    window.__suicoin = {
      begin,
      kill,
      get score() {
        return score;
      },
      get state() {
        return state;
      },
      get py() {
        return py;
      },
      get vy() {
        return vy;
      },
      get S() {
        return S;
      },
      get viewH() {
        return viewH;
      },
      get grounded() {
        return grounded;
      },
      get coins() {
        return coins.length;
      },
    };
  }
})();
