(() => {
  "use strict";

  const PHRASES = [
    ["ちょっといい？", "cyan"],
    ["相談ある", "amber"],
    ["これ明日まで", "rose"],
    ["あと一件だけ", "amber"],
    ["メール見た？", "cyan"],
    ["会議入って", "lilac"],
    ["資料お願い", "mint"],
    ["今大丈夫？", "cyan"],
    ["5分だけ", "amber"],
    ["確認お願い", "mint"],
    ["急ぎで見て", "rose"],
    ["チャット見た？", "cyan"],
    ["レビュー頼む", "lilac"],
    ["日報まだ？", "amber"],
    ["ハンコ頂戴", "rose"],
    ["今日いける？", "cyan"],
    ["仕様どう？", "lilac"],
    ["見積もり頼む", "mint"],
    ["進捗どう？", "amber"],
    ["修正入った", "rose"],
    ["横から失礼", "cyan"],
    ["1点確認", "mint"],
    ["テストお願い", "lilac"],
    ["承認ほしい", "amber"],
    ["お客様から", "rose"],
    ["議事録頼む", "mint"],
    ["先方待ち", "cyan"],
    ["数字ちょうだい", "rose"],
    ["今朝の件", "amber"],
    ["ちょっとだけ", "cyan"],
  ];

  const BOSS_PHRASES = [
    "ちょっといいか",
    "悪い、今から",
    "役員の前で",
    "今日中に頼む",
    "任せたぞ",
    "話がある",
    "席、外すな",
    "呼ばれてるぞ",
    "お前しかいない",
    "数字、今すぐ",
  ];

  const JOKES = [
    "「ちょっといい？」は、だいたい1時間です。",
    "あと一件だけ、が本日三件目でした。",
    "メールは見ました。心は折れました。",
    "定時は、今日も伝説のままです。",
    "会議は入りました。魂は出ました。",
    "部長の5分は、日付をまたぎます。",
    "タイムカードが、遠くで笑っています。",
    "良い残業はありません。あるのは残業だけです。",
    "明日の自分へ、資料をお願いします。",
    "「今大丈夫？」と聞いた時点で、アウトです。",
    "定時退社は、高度な専門技術です。",
    "未読のまま帰る勇気が、今年の目標でした。",
    "今日のヒーローは、すでに帰った人です。",
    "帰りの電車は、想像の中で快適でした。",
    "資料の期限は明日。魂の期限は今朝です。",
    "残業確定。人間の部分は、まだ残っています。",
  ];

  const LOW_JOKES = [
    "椅子が温まる前に、捕まりました。",
    "出社の挨拶が、そのまま捕球でした。",
  ];

  const MID_JOKES = [
    "定時には届いた。出口に部長がいました。",
    "18時を踏んだ。ここからが本番でした。",
  ];

  const HIGH_JOKES = [
    "これは勤怠ではなく、芸術です。",
    "残業という概念が、先に帰りました。",
  ];

  const MILESTONES = [
    [15, "まだ帰れる"],
    [30, "折り返し"],
    [45, "出口が見えた"],
    [60, "定時到達"],
    [90, "鉄の定時"],
    [120, "伝説の退社"],
  ];

  const INTRO = [
    { t: 0.32, side: "left", text: "ちょっといい？", tone: "cyan", speed: 310 },
    { t: 1.55, side: "right", text: "相談ある", tone: "amber", speed: 340 },
    { t: 2.9, side: "center", text: "メール見た？", tone: "cyan", speed: 360 },
  ];

  const COLORS = {
    cyan: "#5ce1ff",
    amber: "#ffc14d",
    rose: "#ff5d7a",
    lilac: "#c4b0ff",
    mint: "#7dffc3",
    boss: "#ffc14d",
  };

  const BEST_KEY = "teiji-best-v1";
  const MUTE_KEY = "teiji-mute-v1";
  const STAGE_MAX = 480;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playerSprite = new Image();
  playerSprite.src = "sprites/player.png";

  const $ = (id) => document.getElementById(id);
  const app = $("app");
  const canvas = $("view");
  const ctx = canvas.getContext("2d", { alpha: false });

  const ui = {
    hud: $("hud"),
    hudScore: $("hud-score"),
    hudCombo: $("hud-combo"),
    hudBest: $("hud-best"),
    kicker: $("score-kicker"),
    clock: $("clock"),
    handH: $("hand-hour"),
    handM: $("hand-min"),
    clockTime: $("clock-time"),
    banner: $("banner"),
    praise: $("praise"),
    hint: $("hint"),
    title: $("title-screen"),
    titleBest: $("title-best"),
    pause: $("pause-screen"),
    over: $("gameover"),
    overScore: $("over-score"),
    overTime: $("over-time"),
    overBest: $("over-best"),
    badge: $("new-badge"),
    joke: $("joke"),
    toast: $("toast"),
    live: $("live"),
    mute: $("mute"),
    muteIcon: $("mute-icon"),
  };

  const state = {
    mode: "title",
    w: 390,
    h: 844,
    dpr: 1,
    stageW: 390,
    stageLeft: 0,
    time: 0,
    runT: 0,
    score: 0,
    combo: 0,
    best: 0,
    muted: false,
    shake: 0,
    flash: 0,
    flashColor: "255,70,90",
    bossCd: 0,
    spawnAcc: 0,
    introI: 0,
    deadT: 0,
    hitStop: 0,
    overShown: false,
    newBest: false,
    lastJoke: -1,
    seen: {},
    danger: false,
    moved: false,
    hint: false,
    bg: null,
    horizon: 0,
    windows: [],
    bubbles: [],
    particles: [],
    floaters: [],
    motes: [],
    keys: new Set(),
    pointer: null,
    player: null,
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function loadBest() {
    try {
      return Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0);
    } catch {
      return 0;
    }
  }

  function saveBest(n) {
    try {
      localStorage.setItem(BEST_KEY, String(n));
    } catch {
      /* private mode */
    }
  }

  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function saveMute(v) {
    try {
      localStorage.setItem(MUTE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function clockOf(score) {
    const total = 17 * 60 + score;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    const hh = ((h % 12) + m / 60) * 30;
    return {
      h,
      m,
      label: `${h}:${String(m).padStart(2, "0")}`,
      hourDeg: hh,
      minDeg: m * 6,
      overtime: score >= 60,
    };
  }

  function buzz(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }

  const audio = (() => {
    let actx = null;
    let master = null;
    function ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!actx) {
        actx = new AC();
        master = actx.createGain();
        master.gain.value = 0.2;
        master.connect(actx.destination);
      }
      if (actx.state === "suspended") actx.resume();
      return actx;
    }
    function blip(freq, dur, type, gain, to) {
      if (state.muted) return;
      const c = ensure();
      if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    return {
      unlock: ensure,
      start() {
        blip(523, 0.07, "triangle", 0.18, 784);
        setTimeout(() => blip(880, 0.1, "sine", 0.12, 1174), 80);
      },
      dodge() {
        blip(rand(680, 760), 0.055, "sine", 0.1, rand(980, 1100));
      },
      near() {
        blip(880, 0.05, "triangle", 0.12, 1320);
        setTimeout(() => blip(1320, 0.07, "sine", 0.08, 1760), 45);
      },
      boss() {
        blip(150, 0.2, "sawtooth", 0.07, 70);
      },
      hit() {
        blip(210, 0.26, "sawtooth", 0.14, 42);
        blip(90, 0.3, "square", 0.05, 36);
      },
      milestone() {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => blip(f, 0.09, "triangle", 0.1), i * 65);
        });
      },
    };
  })();

  function applyMute() {
    ui.mute.setAttribute("aria-pressed", state.muted ? "true" : "false");
    ui.mute.setAttribute("aria-label", state.muted ? "音を出す" : "音を消す");
    ui.muteIcon.setAttribute(
      "d",
      state.muted
        ? "M3 9.5v5h3.2L11 18.8V5.2L6.2 9.5H3zm13.2 1.1 1.8-1.8 1.2 1.2-1.8 1.8 1.8 1.8-1.2 1.2-1.8-1.8-1.8 1.8-1.2-1.2 1.8-1.8-1.8-1.8 1.2-1.2z"
        : "M3 9.5v5h3.2L11 18.8V5.2L6.2 9.5H3zm12.2 2.5a3.2 3.2 0 0 0-1.7-2.8v5.6a3.2 3.2 0 0 0 1.7-2.8zM13.5 6.1v1.7a5 5 0 0 1 0 8.4v1.7a6.7 6.7 0 0 0 0-11.8z"
    );
  }

  let toastTimer = 0;
  function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      ui.toast.hidden = true;
    }, 1700);
  }

  function showPraise(text) {
    if (!text) return;
    ui.praise.textContent = text;
    ui.praise.classList.remove("show");
    void ui.praise.offsetWidth;
    ui.praise.classList.add("show");
  }

  function showBanner(text) {
    ui.banner.hidden = true;
    ui.banner.textContent = text;
    void ui.banner.offsetWidth;
    ui.banner.hidden = false;
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => {
      ui.banner.hidden = true;
    }, 1350);
  }

  function refreshRecord() {
    ui.hudBest.textContent = String(state.best);
    const strong = ui.titleBest.querySelector("strong");
    if (state.best > 0) {
      ui.titleBest.hidden = false;
      strong.textContent = String(state.best);
    } else {
      ui.titleBest.hidden = true;
    }
  }

  function setHudScore(n) {
    if (ui.hudScore.textContent !== String(n)) {
      ui.hudScore.textContent = String(n);
      ui.hudScore.classList.remove("pop");
      void ui.hudScore.offsetWidth;
      ui.hudScore.classList.add("pop");
    }
    const clock = clockOf(n);
    ui.handH.style.transform = `rotate(${clock.hourDeg}deg)`;
    ui.handM.style.transform = `rotate(${clock.minDeg}deg)`;
    ui.clockTime.textContent = clock.label;
    ui.clock.classList.toggle("overtime", clock.overtime);
    ui.kicker.textContent = clock.overtime ? "延長戦" : "防衛";
    ui.hudCombo.textContent = state.combo >= 2 ? `連続 ${state.combo}` : "";
  }

  function roundRect(g, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr);
    g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr);
    g.closePath();
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resize() {
    const prev = state.stageW || 1;
    state.w = app.clientWidth;
    state.h = app.clientHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.stageW = Math.min(state.w, STAGE_MAX);
    state.stageLeft = (state.w - state.stageW) / 2;
    canvas.width = Math.max(1, Math.floor(state.w * state.dpr));
    canvas.height = Math.max(1, Math.floor(state.h * state.dpr));
    const ratio = state.stageW / prev;
    if (!state.player) {
      state.player = makePlayer();
    } else if (prev > 1 && Math.abs(ratio - 1) > 0.01) {
      state.player.x *= ratio;
      state.player.targetX *= ratio;
      state.bubbles.forEach((b) => {
        b.x *= ratio;
      });
    }
    const p = state.player;
    p.x = clamp(p.x, 28, state.stageW - 28);
    p.targetX = clamp(p.targetX, 28, state.stageW - 28);
    buildCity();
    seedMotes();
  }

  function makePlayer() {
    return {
      x: state.stageW / 2,
      targetX: state.stageW / 2,
      bob: 0,
      blink: 0,
      blinkT: 2.4,
      lean: 0,
      fall: 0,
      rot: 0,
      hitR: 15,
      trail: [],
    };
  }

  function buildCity() {
    const { w, h, dpr } = state;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(w * dpr));
    c.height = Math.max(1, Math.floor(h * dpr));
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const horizon = h * 0.5;
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#05070d");
    sky.addColorStop(0.32, "#10182c");
    sky.addColorStop(0.5, "#1a2742");
    sky.addColorStop(0.5, "#0c1018");
    sky.addColorStop(1, "#07080c");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    const moon = g.createRadialGradient(w * 0.8, h * 0.12, 2, w * 0.8, h * 0.12, 46);
    moon.addColorStop(0, "rgba(255, 236, 210, 0.95)");
    moon.addColorStop(0.35, "rgba(255, 214, 170, 0.35)");
    moon.addColorStop(1, "rgba(255, 214, 170, 0)");
    g.fillStyle = moon;
    g.beginPath();
    g.arc(w * 0.8, h * 0.12, 46, 0, Math.PI * 2);
    g.fill();

    const rng = mulberry32(7);
    const windows = [];
    let x = -10;
    while (x < w + 20) {
      const bw = 36 + rng() * 58;
      const bh = 60 + rng() * h * 0.26;
      g.fillStyle = rng() > 0.5 ? "#090d16" : "#0c121e";
      g.fillRect(x, horizon - bh, bw - 5, bh + 2);
      for (let wy = horizon - bh + 10; wy < horizon - 10; wy += 14) {
        for (let wx = x + 7; wx < x + bw - 14; wx += 11) {
          if (rng() > 0.52) {
            windows.push({
              x: wx,
              y: wy,
              a: 0.25 + rng() * 0.75,
              color: rng() > 0.78 ? "#ffc14d" : "#9fd7ff",
              p: rng() * Math.PI * 2,
            });
          }
        }
      }
      x += bw;
    }

    g.strokeStyle = "rgba(92, 225, 255, 0.055)";
    g.lineWidth = 1;
    const vx = w / 2;
    for (let i = -10; i <= 10; i++) {
      g.beginPath();
      g.moveTo(vx + i * 8, horizon);
      g.lineTo(vx + i * (w / 7), h);
      g.stroke();
    }
    for (let i = 1; i <= 7; i++) {
      const y = horizon + (h - horizon) * Math.pow(i / 7, 1.55);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }

    state.bg = c;
    state.horizon = horizon;
    state.windows = windows;
  }

  function seedMotes() {
    state.motes = Array.from({ length: 16 }, () => ({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      r: rand(0.6, 1.6),
      s: rand(8, 22),
      a: rand(0.08, 0.28),
    }));
  }

  function playerFeetY() {
    return state.h * 0.8;
  }

  function playerHitY() {
    return playerFeetY() - 40;
  }

  function stageX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * state.w - state.stageLeft;
    return clamp(x, 30, state.stageW - 30);
  }

  function difficulty(t) {
    const k = clamp(t / 78, 0, 1);
    const eased = k * k * (3 - 2 * k);
    return {
      interval: lerp(1.05, 0.38, eased),
      speed: lerp(280, 640, eased),
      doubleP: t < 14 ? 0 : lerp(0, 0.62, clamp((t - 14) / 60, 0, 1)),
      bossP: t < 16 ? 0 : 0.07 + clamp((t - 16) / 70, 0, 1) * 0.16,
    };
  }

  function measure(text, boss) {
    let fontPx = boss ? 21 : 17;
    const minPx = boss ? 14 : 13;
    const maxW = state.stageW * (boss ? 0.58 : 0.46);
    let w = maxW;
    let tw = 0;
    while (fontPx >= minPx) {
      ctx.font = `700 ${fontPx}px "Teiji Sans", sans-serif`;
      tw = ctx.measureText(text).width;
      const pad = boss ? 26 : 18;
      w = Math.max(boss ? 120 : 92, tw + pad * 2);
      if (w <= maxW || fontPx === minPx) break;
      fontPx -= 1;
    }
    w = Math.min(w, maxW);
    const h = boss ? 56 : 42;
    return { w, h, fontPx, tw };
  }

  function bubbleScale(y) {
    const end = playerHitY();
    const t = clamp((y + 30) / (end + 50), 0, 1);
    return lerp(0.66, 1.06, t);
  }

  function spawnBubble(opts) {
    const boss = !!opts.boss;
    const text = opts.text || (boss ? pick(BOSS_PHRASES) : pick(PHRASES)[0]);
    const tone = boss ? "boss" : opts.tone || (opts.text ? "cyan" : pick(PHRASES)[1]);
    const metrics = measure(text, boss);
    let x = opts.x;
    if (x == null) x = boss ? placeBoss(metrics.w) : findSafeX(metrics.w, opts.speed || 320);
    if (x == null) return false;
    const speed = (opts.speed || 320) * (boss ? 0.84 : 1);
    state.bubbles.push({
      x,
      y: -metrics.h,
      vy: speed,
      w: metrics.w,
      h: metrics.h,
      text,
      tone,
      boss,
      fontPx: metrics.fontPx,
      phase: Math.random() * Math.PI * 2,
      age: 0,
      scored: false,
      decor: !!opts.decor,
    });
    if (boss) {
      state.bossCd = 11;
      audio.boss();
      if (state.mode === "play") showBanner("部長接近");
      buzz(18);
    }
    return true;
  }

  function placeBoss(w) {
    const margin = 10;
    if ((state.stageW - w) / 2 >= 78) {
      return state.stageW / 2 + rand(-12, 12);
    }
    const left = 82 + w / 2;
    const right = state.stageW - 82 - w / 2;
    const x = Math.random() < 0.5 ? left : right;
    return clamp(x, w / 2 + margin, state.stageW - w / 2 - margin);
  }

  function placeBeside(side, w, gap) {
    const p = state.player;
    const reach = p.hitR + gap;
    let x = side === "left" ? p.x - reach - w / 2 : p.x + reach + w / 2;
    if (side === "left" && x + w / 2 > p.x - reach) x = p.x - reach - w / 2;
    if (side === "right" && x - w / 2 < p.x + reach) x = p.x + reach + w / 2;
    return x;
  }

  function findSafeX(w, speed) {
    const minX = Math.max(w * 0.32, w / 2 + 6);
    const maxX = Math.min(state.stageW - w * 0.32, state.stageW - w / 2 - 6);
    if (maxX <= minX) return state.stageW / 2;
    let best = null;
    let bestScore = -Infinity;
    for (let i = 0; i < 12; i++) {
      const x = lerp(minX, maxX, Math.random());
      const score = safetyScore(x, w, speed);
      if (score > bestScore) {
        bestScore = score;
        best = x;
      }
    }
    if (bestScore < 64) return null;
    return best;
  }

  function safetyScore(x, w, vy) {
    const eta = (playerHitY() + 20) / Math.max(80, vy);
    const blocks = [[x - w / 2 - 8, x + w / 2 + 8]];
    for (const b of state.bubbles) {
      if (b.decor) continue;
      const beta = (playerHitY() - b.y) / Math.max(80, b.vy);
      if (beta > -0.05 && Math.abs(beta - eta) < 0.34) {
        const bw = b.w;
        blocks.push([b.x - bw / 2 - 8, b.x + bw / 2 + 8]);
      }
    }
    blocks.sort((a, b) => a[0] - b[0]);
    let cursor = 22;
    let maxGap = 0;
    const limit = state.stageW - 22;
    for (const [l, r] of blocks) {
      maxGap = Math.max(maxGap, l - cursor);
      cursor = Math.max(cursor, r);
    }
    maxGap = Math.max(maxGap, limit - cursor);
    return maxGap;
  }

  function spawnTitle() {
    const textPair = pick(PHRASES);
    const metrics = measure(textPair[0], false);
    const minX = metrics.w * 0.3;
    const maxX = state.stageW - metrics.w * 0.3;
    spawnBubble({
      text: textPair[0],
      tone: textPair[1],
      x: rand(minX, Math.max(minX + 1, maxX)),
      speed: rand(120, 170),
      decor: true,
    });
  }

  function updatePlayer(dt, control) {
    const p = state.player;
    const speed = 760;
    if (control) {
      if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) {
        p.targetX -= speed * dt;
      }
      if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) {
        p.targetX += speed * dt;
      }
    }
    p.targetX = clamp(p.targetX, 30, state.stageW - 30);
    const prev = p.x;
    const dragging = !!(state.pointer && state.pointer.moved);
    const follow = 1 - Math.exp((dragging ? -30 : -18) * dt);
    p.x += (p.targetX - p.x) * follow;
    p.x = clamp(p.x, 30, state.stageW - 30);
    const vx = (p.x - prev) / Math.max(dt, 0.001);
    p.lean = clamp(vx / 900, -1, 1);
    p.bob += dt * (Math.abs(vx) > 40 ? 14 : 6);
    p.blinkT -= dt;
    if (p.blinkT <= 0) {
      p.blink = 0.12;
      p.blinkT = rand(2.2, 4.6);
    }
    if (p.blink > 0) p.blink -= dt;
    if (!reduced && Math.abs(vx) > 280 && state.mode === "play") {
      burst(state.stageLeft + p.x, playerFeetY() - 20, "#5ce1ff", 1, 40);
    }
    p.trail.push(p.x);
    if (p.trail.length > 5) p.trail.shift();
  }

  function updateBubbles(dt, live) {
    const hitY = playerHitY();
    const p = state.player;
    for (let i = state.bubbles.length - 1; i >= 0; i--) {
      const b = state.bubbles[i];
      const prevY = b.y;
      b.age += dt;
      b.y += b.vy * dt;
      b.phase += dt * (b.boss ? 3.2 : 2.4);
      if (b.decor && b.y > state.h * 0.46) {
        state.bubbles.splice(i, 1);
        continue;
      }
      if (!live || b.scored) {
        if (b.y > state.h + 80) state.bubbles.splice(i, 1);
        continue;
      }
      const scale = bubbleScale(b.y);
      const wobble = Math.sin(b.phase) * 4;
      const bx = b.x + wobble;
      const hw = b.w * scale * 0.74;
      const hh = b.h * scale * 0.68;
      const left = bx - hw / 2;
      const top = b.y - hh / 2;
      const crossed =
        prevY - hh / 2 <= hitY + p.hitR && top + hh >= hitY - p.hitR;
      if (b.age > 0.12 && crossed && circleRect(p.x, hitY, p.hitR, left, top, hw, hh)) {
        state.bubbles.splice(i, 1);
        killPlayer(b);
        return;
      }
      if (!b.scored && b.y - hh / 2 > hitY + p.hitR) {
        b.scored = true;
        const gap = horizontalGap(p.x, left, left + hw);
        const near = gap < p.hitR + 34;
        scoreDodge(b, near);
      }
      if (b.y > state.h + 90) state.bubbles.splice(i, 1);
    }
  }

  function horizontalGap(px, left, right) {
    if (px < left) return left - px;
    if (px > right) return px - right;
    return 0;
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function scoreDodge(b, near) {
    state.combo += 1;
    let gain = b.boss ? 4 : near ? 2 : 1;
    if (state.combo > 0 && state.combo % 5 === 0) gain += 1;
    state.score += gain;
    setHudScore(state.score);
    const sx = state.stageLeft + b.x;
    floatText(`+${gain}`, sx, b.y - 10, near || b.boss ? "#ffc14d" : "#d9fbff");
    burst(sx, b.y, COLORS[b.tone] || COLORS.cyan, near ? 14 : 8, near ? 220 : 140);
    if (near && !reduced) {
      state.shake = Math.max(state.shake, 5);
      state.flash = 0.28;
      state.flashColor = "92,225,255";
    }
    if (b.boss) {
      audio.dodge();
      audio.near();
      buzz([12, 30, 16]);
      showPraise("部長回避");
    } else if (near) {
      audio.near();
      buzz(14);
      showPraise("ギリギリ！");
    } else {
      audio.dodge();
      buzz(8);
      showPraise(praiseFor(state.combo));
    }
    checkMilestones();
  }

  function praiseFor(combo) {
    if (combo === 1) return "回避！";
    if (combo === 5) return "ナイス定時";
    if (combo === 8) return "回避！";
    if (combo === 10) return "神回避";
    if (combo === 12) return "回避！";
    if (combo === 15) return "伝説の定時";
    if (combo === 20) return "残業拒否";
    if (combo === 30) return "もう帰っていい";
    if (combo > 0 && combo % 4 === 0) return "回避！";
    return "";
  }

  function checkMilestones() {
    for (const [at, text] of MILESTONES) {
      if (state.score >= at && !state.seen[at]) {
        state.seen[at] = true;
        showBanner(text);
        audio.milestone();
        burst(state.w / 2, state.h * 0.28, "#ffc14d", 18, 260);
      }
    }
  }

  function killPlayer(b) {
    state.mode = "dead";
    state.deadT = 0;
    state.overShown = false;
    state.shake = reduced ? 0 : 16;
    state.flash = 0.85;
    state.flashColor = "255,70,96";
    state.hitStop = 0.09;
    state.player.fall = 0;
    state.player.rot = 0;
    audio.hit();
    buzz([28, 36, 36, 30, 70]);
    const sx = state.stageLeft + (b ? b.x : state.player.x);
    const sy = b ? b.y : playerHitY();
    burst(sx, sy, "#ff5d7a", 26, 340);
    burst(sx, sy, "#ffe1a8", 10, 180);
    ui.hint.hidden = true;
  }

  function openGameOver() {
    state.mode = "over";
    state.newBest = state.score > state.best;
    if (state.newBest) {
      state.best = state.score;
      saveBest(state.best);
      refreshRecord();
      burst(state.w / 2, state.h * 0.58, "#ffc14d", 30, 380);
    }
    const clock = clockOf(state.score);
    ui.joke.textContent = pickJoke(state.score);
    ui.overTime.textContent =
      state.score >= 60 ? `定時は越えた。${clock.label}` : `${clock.label} で捕捉`;
    ui.overBest.textContent = String(state.best);
    ui.badge.hidden = !state.newBest;
    ui.overScore.textContent = "0";
    ui.hud.hidden = true;
    ui.over.hidden = false;
    ui.live.textContent = `残業確定。${state.score}分死守。${ui.joke.textContent}`;
    animateScore(state.score);
    const retry = $("retry");
    setTimeout(() => retry.focus({ preventScroll: true }), 280);
  }

  function animateScore(target) {
    const start = performance.now();
    const dur = reduced ? 0 : 520;
    function step(now) {
      if (state.mode !== "over") return;
      const t = dur === 0 ? 1 : clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      ui.overScore.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function pickJoke(score) {
    let pool = JOKES;
    if (score <= 2) pool = LOW_JOKES.concat(JOKES.slice(0, 4));
    else if (score >= 100) pool = HIGH_JOKES.concat(MID_JOKES, JOKES);
    else if (score >= 60) pool = MID_JOKES.concat(JOKES);
    let i = (Math.random() * pool.length) | 0;
    if (pool.length > 1 && i === state.lastJoke) i = (i + 1) % pool.length;
    state.lastJoke = i;
    return pool[i];
  }

  function maybeSpawn(dt) {
    if (state.introI < INTRO.length) {
      const step = INTRO[state.introI];
      if (state.runT >= step.t) {
        const metrics = measure(step.text, false);
        const x =
          step.side === "center"
            ? state.player.x
            : placeBeside(step.side, metrics.w, step.side === "left" ? 36 : 40);
        spawnBubble({
          text: step.text,
          tone: step.tone,
          x,
          speed: step.speed,
        });
        state.introI += 1;
      }
      return;
    }
    if (state.runT < INTRO[INTRO.length - 1].t + 0.85) return;
    state.bossCd -= dt;
    const diff = difficulty(state.runT);
    state.spawnAcc += dt;
    if (state.spawnAcc < diff.interval) return;
    state.spawnAcc = 0;
    if (state.bubbles.length >= 6) return;
    const boss = state.bossCd <= 0 && Math.random() < diff.bossP && state.bubbles.length <= 2;
    const ok = spawnBubble({ boss, speed: diff.speed * rand(0.94, 1.06) });
    if (!ok) {
      state.spawnAcc = diff.interval * 0.45;
      return;
    }
    if (!boss && Math.random() < diff.doubleP && state.bubbles.length < 5) {
      spawnBubble({ speed: diff.speed * rand(0.96, 1.05) });
    }
  }

  function burst(x, y, color, n, speed) {
    const count = reduced ? Math.min(4, n) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.25, speed);
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: rand(0.28, 0.55),
        max: 0.55,
        size: rand(1.5, 3.4),
        color,
        rot: rand(0, 6),
        vr: rand(-8, 8),
        g: rand(400, 900),
        kind: Math.random() < 0.45 ? "rect" : "dot",
      });
    }
    if (state.particles.length > 180) {
      state.particles.splice(0, state.particles.length - 180);
    }
  }

  function floatText(text, x, y, color) {
    state.floaters.push({ text, x, y, life: 0.7, max: 0.7, color });
  }

  function updateFx(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 38 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
    for (const m of state.motes) {
      m.y -= m.s * dt;
      m.x += Math.sin(state.time + m.y * 0.01) * 6 * dt;
      if (m.y < -4) {
        m.y = state.h + 4;
        m.x = Math.random() * state.w;
      }
    }
  }

  function updateDanger() {
    const hitY = playerHitY();
    const p = state.player;
    let danger = false;
    if (state.mode === "play") {
      for (const b of state.bubbles) {
        if (b.decor || b.scored) continue;
        const scale = bubbleScale(b.y);
        const hw = (b.w * scale) / 2;
        const dy = hitY - b.y;
        if (dy > 0 && dy < 190 && Math.abs(b.x - p.x) < hw + p.hitR) {
          danger = true;
          break;
        }
      }
    }
    if (danger !== state.danger) {
      state.danger = danger;
      app.classList.toggle("danger", danger);
    }
  }

  function update(dt) {
    state.time += dt;
    if (state.mode === "title") {
      updatePlayer(dt, false);
      updateBubbles(dt, false);
      state.spawnAcc += dt;
      if (state.spawnAcc > 1.35 && state.bubbles.length < 4) {
        state.spawnAcc = 0;
        spawnTitle();
      }
    } else if (state.mode === "play") {
      state.runT += dt;
      updatePlayer(dt, true);
      updateBubbles(dt, true);
      if (state.mode === "play") maybeSpawn(dt);
      if (state.hint && (state.moved || state.runT > 4.2)) {
        state.hint = false;
        ui.hint.hidden = true;
      }
    } else if (state.mode === "dead") {
      const p = state.player;
      p.fall += dt;
      p.rot = Math.min(1.15, p.fall * 2.1);
      updateBubbles(dt * 0.35, false);
    }
    updateFx(dt);
    updateDanger();
  }

  function render() {
    const { w, h, dpr } = state;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (state.bg) ctx.drawImage(state.bg, 0, 0, w, h);

    for (const win of state.windows) {
      const flick = 0.55 + Math.sin(state.time * 1.7 + win.p) * 0.25;
      ctx.globalAlpha = win.a * flick * 0.55;
      ctx.fillStyle = win.color;
      ctx.fillRect(win.x, win.y, 4, 7);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    if (!reduced && state.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    drawCeiling();
    drawMotes();
    drawGround();
    drawExit();
    const ordered = state.bubbles.slice().sort((a, b) => a.y - b.y);
    for (const b of ordered) drawBubble(b);
    drawParticles();
    drawPlayer();
    drawFloaters();
    ctx.restore();

    if (state.flash > 0.02) {
      ctx.fillStyle = `rgba(${state.flashColor},${state.flash * 0.28})`;
      ctx.fillRect(0, 0, w, h);
    }
    drawStageCurtain();
  }

  function drawStageCurtain() {
    const left = state.stageLeft;
    if (left < 16) return;
    const { w, h } = state;
    const rightX = left + state.stageW + 36;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, Math.max(0, left - 36), h);
    ctx.fillRect(rightX, 0, Math.max(0, w - rightX), h);
    const fade = 36;
    const lgrad = ctx.createLinearGradient(left - fade, 0, left, 0);
    lgrad.addColorStop(0, "rgba(0,0,0,0.5)");
    lgrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lgrad;
    ctx.fillRect(left - fade, 0, fade, h);
    const rgrad = ctx.createLinearGradient(left + state.stageW, 0, left + state.stageW + fade, 0);
    rgrad.addColorStop(0, "rgba(0,0,0,0)");
    rgrad.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = rgrad;
    ctx.fillRect(left + state.stageW, 0, fade, h);
  }

  function drawCeiling() {
    const x = state.stageLeft;
    const sw = state.stageW;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ox of [0.28, 0.72]) {
      const gx = x + sw * ox;
      const grd = ctx.createLinearGradient(gx, 0, gx, 150);
      grd.addColorStop(0, "rgba(210, 245, 255, 0.16)");
      grd.addColorStop(1, "rgba(210, 245, 255, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(gx - 46, 0);
      ctx.lineTo(gx + 46, 0);
      ctx.lineTo(gx + 90, 150);
      ctx.lineTo(gx - 90, 150);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMotes() {
    ctx.save();
    for (const m of state.motes) {
      ctx.globalAlpha = m.a;
      ctx.fillStyle = "#d7f4ff";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGround() {
    const y = playerFeetY() + 10;
    const x0 = state.stageLeft + 18;
    const x1 = state.stageLeft + state.stageW - 18;
    const g = ctx.createLinearGradient(x0, y, x1, y);
    g.addColorStop(0, "rgba(92,225,255,0)");
    g.addColorStop(0.2, "rgba(92,225,255,0.35)");
    g.addColorStop(0.8, "rgba(92,225,255,0.35)");
    g.addColorStop(1, "rgba(92,225,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  function drawExit() {
    const x = state.stageLeft + state.stageW / 2;
    const y = state.h - 18;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 4, x, y, 90);
    g.addColorStop(0, "rgba(120, 255, 190, 0.18)");
    g.addColorStop(1, "rgba(120, 255, 190, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 90, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBubble(b) {
    const scale = bubbleScale(b.y) * (b.age < 0.18 ? b.age / 0.18 : 1);
    const wobble = Math.sin(b.phase) * 4;
    const x = state.stageLeft + b.x + wobble;
    const y = b.y;
    const color = COLORS[b.tone] || COLORS.cyan;
    ctx.save();
    ctx.translate(x, y + b.h * 0.72 * scale);
    ctx.scale(1, 0.32);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.arc(0, 0, b.w * scale * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(b.phase) * (b.boss ? 0.035 : 0.02));
    ctx.scale(scale, scale);
    const w = b.w;
    const h = b.h;
    ctx.shadowColor = color;
    ctx.shadowBlur = b.boss ? 22 : 14;
    roundRect(ctx, -w / 2, -h / 2, w, h, 16);
    const fill = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    if (b.boss) {
      fill.addColorStop(0, "rgba(64, 16, 28, 0.96)");
      fill.addColorStop(1, "rgba(18, 8, 14, 0.96)");
    } else {
      fill.addColorStop(0, "rgba(18, 28, 44, 0.94)");
      fill.addColorStop(1, "rgba(8, 12, 22, 0.94)");
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = b.boss ? 3 : 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, h / 2 - 1);
    ctx.lineTo(0, h / 2 + 12);
    ctx.lineTo(11, h / 2 - 1);
    ctx.closePath();
    ctx.fillStyle = b.boss ? "rgba(40, 12, 20, 0.96)" : "rgba(10, 14, 24, 0.96)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.font = `700 ${b.fontPx}px "Teiji Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7fbff";
    ctx.fillText(b.text, 0, b.boss ? 2 : 0);
    if (b.boss) {
      ctx.font = `700 12px "Teiji Sans", sans-serif`;
      ctx.fillStyle = "#ffc14d";
      ctx.fillText("部長", 0, -h / 2 - 12);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = state.player;
    const feet = playerFeetY() + (state.mode === "dead" ? Math.min(26, p.fall * 50) : Math.sin(p.bob) * 1.4);
    const x = state.stageLeft + p.x;
    const comboGlow = clamp(state.combo / 18, 0, 1);

    if (!reduced && state.mode === "play") {
      p.trail.forEach((tx, i) => {
        const a = (i / p.trail.length) * 0.18;
        ctx.save();
        ctx.globalAlpha = a;
        drawBody(state.stageLeft + tx, feet, 0, 1);
        ctx.restore();
      });
    }

    ctx.save();
    ctx.translate(x, feet);
    ctx.rotate(state.mode === "dead" ? p.rot : p.lean * 0.12);
    const glow = ctx.createRadialGradient(0, -8, 4, 0, -8, 40 + comboGlow * 18);
    glow.addColorStop(0, `rgba(92, 225, 255, ${0.14 + comboGlow * 0.28})`);
    glow.addColorStop(1, "rgba(92, 225, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -6, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawBody(x, feet, state.mode === "dead" ? p.rot : p.lean * 0.12, 1);
  }

  function playerDrawSize() {
    const nw = playerSprite.naturalWidth || 531;
    const nh = playerSprite.naturalHeight || 720;
    const aspect = nw / nh;
    let h = clamp(state.h * 0.28, 156, 236);
    let w = h * aspect;
    const maxW = Math.max(96, state.stageW * 0.48);
    if (w > maxW) {
      w = maxW;
      h = w / aspect;
    }
    return { w, h };
  }

  function drawBody(x, feet, rot, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, feet);
    ctx.rotate(rot);

    const { w, h } = playerDrawSize();
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(0, 6, Math.min(48, w * 0.28), 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (playerSprite.complete && playerSprite.naturalWidth) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(playerSprite, -w / 2, -h + 8, w, h);
    }

    ctx.restore();
  }

  function drawParticles() {
    for (const p of state.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.kind === "rect") {
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloaters() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 18px "Teiji Sans", sans-serif`;
    for (const f of state.floaters) {
      ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function startGame() {
    audio.unlock();
    audio.start();
    buzz(12);
    const p = state.player;
    p.x = state.stageW / 2;
    p.targetX = state.stageW / 2;
    p.fall = 0;
    p.rot = 0;
    p.trail = [];
    state.mode = "play";
    state.score = 0;
    state.combo = 0;
    state.runT = 0;
    state.deadT = 0;
    state.overShown = false;
    state.newBest = false;
    state.introI = 0;
    state.spawnAcc = 0;
    state.bossCd = 8;
    state.seen = {};
    state.shake = 0;
    state.flash = 0;
    state.hitStop = 0;
    state.moved = false;
    state.hint = true;
    state.bubbles = [];
    state.particles = [];
    state.floaters = [];
    ui.title.hidden = true;
    ui.over.hidden = true;
    ui.pause.hidden = true;
    ui.hud.hidden = false;
    ui.hint.hidden = false;
    ui.banner.hidden = true;
    setHudScore(0);
    ui.live.textContent = "退社を開始。左右にかわしてください。";
  }

  function resume() {
    if (state.mode !== "paused") return;
    state.mode = "play";
    ui.pause.hidden = true;
  }

  function onPointerDown(e) {
    if (e.target.closest("button, a, .timecard, .pause-card")) return;
    audio.unlock();
    if (state.mode === "paused") {
      resume();
      return;
    }
    if (state.mode !== "play") return;
    state.pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e) {
    const ptr = state.pointer;
    if (!ptr || e.pointerId !== ptr.id || state.mode !== "play") return;
    const dx = e.clientX - ptr.x;
    if (Math.abs(dx) > 8 || Math.abs(e.clientY - ptr.y) > 8) ptr.moved = true;
    if (ptr.moved) {
      state.player.targetX = stageX(e.clientX);
      state.moved = true;
    }
  }

  function onPointerUp(e) {
    const ptr = state.pointer;
    if (!ptr || e.pointerId !== ptr.id) return;
    state.pointer = null;
    if (state.mode !== "play") return;
    if (!ptr.moved) {
      const local = stageX(e.clientX);
      const dir = local < state.stageW / 2 ? -1 : 1;
      const step = Math.max(78, state.stageW * 0.3);
      state.player.targetX = clamp(state.player.x + dir * step, 30, state.stageW - 30);
      state.moved = true;
      buzz(10);
    }
  }

  function onKeyDown(e) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.repeat) {
      state.keys.add(e.code);
      return;
    }
    state.keys.add(e.code);
    if (e.key === " " || e.key === "Enter") {
      if (state.mode === "title" || state.mode === "over") startGame();
      else if (state.mode === "paused") resume();
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "d") && state.mode === "play") {
      state.moved = true;
    }
    if ((e.key === "m" || e.key === "M") && !e.repeat) toggleMute();
  }

  function onKeyUp(e) {
    state.keys.delete(e.code);
  }

  function toggleMute() {
    state.muted = !state.muted;
    saveMute(state.muted);
    applyMute();
    if (!state.muted) {
      audio.unlock();
      audio.dodge();
    }
  }

  async function shareScore() {
    const text = `定時を${state.score}分死守した。次は、本当に帰る。`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "定時", text });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("戦績をコピーしました");
    } catch {
      toast(text);
    }
  }

  function bind() {
    $("start").addEventListener("click", startGame);
    $("retry").addEventListener("click", startGame);
    $("resume").addEventListener("click", resume);
    $("share").addEventListener("click", shareScore);
    ui.mute.addEventListener("click", toggleMute);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.mode === "play") {
        state.mode = "paused";
        state.keys.clear();
        state.pointer = null;
        ui.pause.hidden = false;
      }
    });
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    window.addEventListener("resize", resize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
    new ResizeObserver(resize).observe(app);
  }

  let last = performance.now();
  function frame(now) {
    try {
      let raw = (now - last) / 1000;
      last = now;
      if (raw > 0.05) raw = 0.05;
      if (raw < 0) raw = 0;
      if (state.mode === "paused") raw = 0;
      if (state.hitStop > 0) {
        state.hitStop -= raw;
      } else {
        update(state.mode === "paused" ? 0 : raw);
      }
      if (!reduced) state.shake *= Math.exp(-7 * Math.max(raw, 0.008));
      else state.shake = 0;
      state.flash *= Math.exp(-5 * Math.max(raw, 0.008));
      if (state.mode === "dead") {
        state.deadT += raw;
        if (!state.overShown && state.deadT >= 0.66) {
          state.overShown = true;
          openGameOver();
        }
      }
      render();
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(frame);
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  state.best = loadBest();
  state.muted = loadMute();
  applyMute();
  refreshRecord();
  setHudScore(0);
  bind();
  resize();
  spawnTitle();
  requestAnimationFrame(frame);
  registerSW();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (state.mode === "title") state.bubbles = [];
    });
  }

  window.__TEIJI = {
    state,
    start: startGame,
    resize,
  };
})();
