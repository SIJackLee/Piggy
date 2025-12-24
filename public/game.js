(() => {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("game");
  if (!canvas) throw new Error("Canvas #game not found");
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startScreen = document.getElementById("startScreen");
  const startBtn = document.getElementById("startBtn");
  const startTitle = document.getElementById("startTitle");
  const startSubtitle = document.getElementById("startSubtitle");
  const themeSelect = document.getElementById("theme");
  const randomThemeToggle = document.getElementById("randomTheme");
  const playerIdInput = document.getElementById("playerId");
  const boardEl = document.getElementById("leaderboard");
  const boardMsgEl = document.getElementById("boardMsg");

  const BEST_KEY = "pigjump_best_v1";
  let best = Number(localStorage.getItem(BEST_KEY) || "0") || 0;
  if (bestEl) bestEl.textContent = String(best);

  const PLAYER_KEY = "pigjump_player_id_v1";
  let playerId = localStorage.getItem(PLAYER_KEY) || "";

  const THEME_KEY = "pigjump_theme_v1";
  const RANDOM_THEME_KEY = "pigjump_random_theme_v1";
  const THEMES = [
    {
      id: "farm",
      name: "Farm",
      obstacleKinds: ["fence", "hay"],
      palette: {
        skyTop: "#0f1020",
        skyBottom: "#090a12",
        ground: "#141621",
        groundLine: "rgba(255,255,255,0.14)",
        grass: "rgba(126,231,135,0.7)",
        accent: "#ff5aa5",
        pig: "#ff9ac9",
        pig2: "#ff6fb3",
        pigStroke: "rgba(0,0,0,0.35)",
        obstacle: "#c9cbd6",
        obstacle2: "#9aa0b6",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.55)",
      },
    },
    {
      id: "space",
      name: "Space",
      obstacleKinds: ["asteroid", "satellite"],
      palette: {
        skyTop: "#060615",
        skyBottom: "#02020a",
        ground: "#0b0c11",
        groundLine: "rgba(255,255,255,0.10)",
        grass: "rgba(125, 211, 252, 0.35)",
        accent: "#60a5fa",
        pig: "#ffd1e8",
        pig2: "#ff8cc8",
        pigStroke: "rgba(0,0,0,0.35)",
        obstacle: "#a3a3a3",
        obstacle2: "#5b5b5b",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.55)",
      },
    },
    {
      id: "factory",
      name: "Factory",
      obstacleKinds: ["barrel", "cone"],
      palette: {
        skyTop: "#0b1020",
        skyBottom: "#070a12",
        ground: "#0f1218",
        groundLine: "rgba(255,255,255,0.10)",
        grass: "rgba(250, 204, 21, 0.55)",
        accent: "#f59e0b",
        pig: "#ffc3dd",
        pig2: "#ff73b6",
        pigStroke: "rgba(0,0,0,0.35)",
        obstacle: "#cbd5e1",
        obstacle2: "#64748b",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.55)",
      },
    },
    {
      id: "candy",
      name: "Candy",
      obstacleKinds: ["lollipop", "cupcake"],
      palette: {
        skyTop: "#2a0b2e",
        skyBottom: "#140515",
        ground: "#1b1020",
        groundLine: "rgba(255,255,255,0.12)",
        grass: "rgba(251, 113, 133, 0.65)",
        accent: "#fb7185",
        pig: "#ffd1dc",
        pig2: "#ff7ab8",
        pigStroke: "rgba(0,0,0,0.35)",
        obstacle: "#f8fafc",
        obstacle2: "#a78bfa",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.55)",
      },
    },
  ];

  function getThemeById(id) {
    return THEMES.find((t) => t.id === id) ?? THEMES[0];
  }

  let activeTheme = getThemeById(localStorage.getItem(THEME_KEY) || "farm");
  let randomThemeEnabled = (localStorage.getItem(RANDOM_THEME_KEY) || "0") === "1";

  function setRandomThemeEnabled(enabled) {
    randomThemeEnabled = Boolean(enabled);
    localStorage.setItem(RANDOM_THEME_KEY, randomThemeEnabled ? "1" : "0");
    if (randomThemeToggle) randomThemeToggle.checked = randomThemeEnabled;
    if (themeSelect) themeSelect.disabled = randomThemeEnabled;
  }

  function applyTheme(themeId) {
    activeTheme = getThemeById(themeId);
    localStorage.setItem(THEME_KEY, activeTheme.id);
    if (themeSelect) themeSelect.value = activeTheme.id;
  }

  function pickRandomTheme(excludeId) {
    const pool = THEMES.filter((t) => t.id !== excludeId);
    const pickFrom = pool.length > 0 ? pool : THEMES;
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  }

  function applyRandomTheme() {
    const next = pickRandomTheme(activeTheme?.id);
    applyTheme(next.id);
  }

  function setBoardMsg(msg) {
    if (boardMsgEl) boardMsgEl.textContent = msg;
  }

  function setStartText(title, subtitle, buttonLabel) {
    if (startTitle) startTitle.textContent = title;
    if (startSubtitle) startSubtitle.textContent = subtitle;
    if (startBtn) startBtn.textContent = buttonLabel;
  }

  function showStartScreen(mode, finalScore) {
    if (startScreen) startScreen.style.display = "grid";
    if (mode === "gameover") {
      setStartText("GAME OVER", `점수: ${finalScore ?? 0} · 아이디 입력 후 다시 시작할 수 있어요.`, "다시 시작");
    } else {
      setStartText("돼지띠가 만든 돼지게임", "아이디 입력 후 시작하기를 눌러주세요.", "시작하기");
    }
  }

  function hideStartScreen() {
    if (startScreen) startScreen.style.display = "none";
  }

  function isValidPlayerId(id) {
    return (
      typeof id === "string" &&
      id.length >= 2 &&
      id.length <= 20 &&
      /^[a-zA-Z0-9가-힣 _-]+$/.test(id)
    );
  }

  function savePlayerId(next) {
    const trimmed = String(next || "").trim();
    if (!isValidPlayerId(trimmed)) {
      setBoardMsg("아이디는 2~20자 (영문/숫자/한글/공백/_/-)만 가능합니다.");
      return false;
    }
    playerId = trimmed;
    localStorage.setItem(PLAYER_KEY, playerId);
    if (playerIdInput) playerIdInput.value = playerId;
    setBoardMsg(`아이디 저장됨: ${playerId}`);
    return true;
  }

  function ensurePlayerIdFromInput() {
    const typed = String(playerIdInput?.value || "").trim();
    if (!typed) return false;
    if (!isValidPlayerId(typed)) return false;
    if (typed !== playerId) {
      playerId = typed;
      localStorage.setItem(PLAYER_KEY, playerId);
    }
    return true;
  }

  async function refreshLeaderboard() {
    if (!boardEl) return;
    setBoardMsg("리더보드 불러오는 중...");
    boardEl.innerHTML = "";
    try {
      const res = await fetch("/api/leaderboard?top=50", { method: "GET" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");

      if (!Array.isArray(data.items) || data.items.length === 0) {
        setBoardMsg("아직 기록이 없습니다. 첫 기록을 남겨보세요!");
        return;
      }
      data.items.forEach((it, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${it.playerId} — ${it.bestScore}`;
        boardEl.appendChild(li);
      });
      setBoardMsg("리더보드 업데이트 완료");
    } catch (e) {
      setBoardMsg("리더보드를 불러오지 못했습니다. (Supabase/Vercel 설정 확인)");
      console.error(e);
    }
  }

  // World coordinates (keep gameplay feel consistent)
  const WORLD_W = 900;
  const WORLD_H = 360;

  // Viewport scaling: width 180%, height 3x (letterboxed to keep aspect for sprites)
  const VIEW_SCALE_X = 1.8;
  const VIEW_SCALE_Y = 3.0;
  const VIEW_W = Math.round(WORLD_W * VIEW_SCALE_X);
  const VIEW_H = Math.round(WORLD_H * VIEW_SCALE_Y);

  // Ensure the actual canvas buffer matches the intended viewport.
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  const W = WORLD_W;
  const H = WORLD_H;
  const GROUND_Y = Math.round(H * 0.78);

  const RENDER_SCALE = VIEW_SCALE_X; // keep uniform scaling (no stretching)
  const RENDER_OX = Math.round((canvas.width - W * RENDER_SCALE) / 2);
  const RENDER_OY = Math.round((canvas.height - H * RENDER_SCALE) / 2);

  const rand = (min, max) => Math.random() * (max - min) + min;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const aabb = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const theme = () => ({ ...activeTheme.palette, danger: "#ff4d4d" });

  const state = {
    running: false,
    gameOver: false,
    lastScore: 0,
    t: 0,
    score: 0,
    speed: 330, // px/s
    spawnTimer: 0,
    spawnEvery: 1.15, // s (dynamic)
    obstacles: /** @type {Array<{x:number,y:number,w:number,h:number,kind:string}>} */ ([]),
    clouds: /** @type {Array<{x:number,y:number,w:number,h:number,spd:number}>} */ ([]),
    shake: 0,
  };

  const pig = {
    x: Math.round(W * 0.18),
    y: 0,
    w: 54,
    h: 40,
    vy: 0,
    onGround: true,
    jumpVel: -540, // px/s
    gravity: 1550, // px/s^2
  };
  pig.y = GROUND_Y - pig.h;

  function reset() {
    if (randomThemeEnabled) applyRandomTheme();
    state.running = true;
    state.gameOver = false;
    state.lastScore = 0;
    state.t = 0;
    state.score = 0;
    state.speed = 330;
    state.spawnTimer = 0;
    state.spawnEvery = 1.15;
    state.obstacles = [];
    state.clouds = [];
    state.shake = 0;

    pig.vy = 0;
    pig.onGround = true;
    pig.y = GROUND_Y - pig.h;

    // seed some clouds
    for (let i = 0; i < 4; i++) state.clouds.push(makeCloud(true));
    updateHUD();
  }

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(Math.floor(state.score));
    if (bestEl) bestEl.textContent = String(best);
  }

  function makeCloud(seed = false) {
    const w = rand(60, 130);
    const h = rand(18, 34);
    const y = rand(24, Math.round(H * 0.38));
    const x = seed ? rand(0, W) : W + rand(40, 180);
    const spd = rand(14, 36);
    return { x, y, w, h, spd };
  }

  function makeObstacle() {
    const kinds = activeTheme.obstacleKinds ?? ["fence", "hay"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const scale = clamp(1 + (state.speed - 330) / 900, 1, 1.55);

    if (kind === "fence" || kind === "cone") {
      const w = Math.round(rand(18, 28) * scale);
      const h = Math.round(rand(30, 44) * scale);
      return { x: W + 8, y: GROUND_Y - h, w, h, kind };
    }
    // tall-ish
    const w = Math.round(rand(26, 40) * scale);
    const h = Math.round(rand(38, 66) * scale);
    return { x: W + 8, y: GROUND_Y - h, w, h, kind };
  }

  function jump() {
    if (!state.running || state.gameOver) return;
    if (pig.onGround) {
      pig.vy = pig.jumpVel;
      pig.onGround = false;
    }
  }

  function gameOver() {
    state.gameOver = true;
    state.running = false;
    state.shake = 0.2;
    state.lastScore = Math.floor(state.score);
    best = Math.max(best, Math.floor(state.score));
    localStorage.setItem(BEST_KEY, String(best));
    updateHUD();

    // Send best score to server (optional)
    ensurePlayerIdFromInput();
    if (playerId) {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, score: Math.floor(state.score) }),
      })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok || !j?.ok) throw new Error(j?.error || "score save failed");
          refreshLeaderboard();
        })
        .catch((e) => {
          setBoardMsg("점수 저장 실패 (서버 설정 확인)");
          console.error(e);
        });
    } else {
      setBoardMsg("아이디를 저장하면 리더보드에 기록할 수 있어요.");
    }

    showStartScreen("gameover", state.lastScore);
  }

  function shouldIgnoreGlobalTap(target) {
    if (!target) return false;
    const t = /** @type {HTMLElement} */ (target);
    const tag = (t.tagName || "").toLowerCase();
    return tag === "input" || tag === "select" || tag === "button" || !!t.closest("button, input, select, label");
  }

  // Input
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (state.running) jump();
    }
    if (e.code === "KeyR") {
      // Keep "Start" as the primary entry; R is only for quick restart during/after a run.
      if (!state.running && !state.gameOver) return;
      reset();
      hideStartScreen();
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (state.running) jump();
  });

  // Mobile-friendly: tap anywhere (except controls) to jump
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (shouldIgnoreGlobalTap(e.target)) return;
      // don't double-trigger if canvas already handled it
      if (e.target === canvas) return;
      if (state.running) jump();
    },
    { passive: true },
  );

  if (playerIdInput) playerIdInput.value = playerId;
  applyTheme(activeTheme.id);
  setRandomThemeEnabled(randomThemeEnabled);
  if (randomThemeToggle) {
    randomThemeToggle.addEventListener("change", () => {
      setRandomThemeEnabled(randomThemeToggle.checked);
      if (randomThemeEnabled) applyRandomTheme();
    });
  }
  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
    });
  }
  if (playerIdInput) {
    playerIdInput.addEventListener("change", () => {
      // no button needed: just changing the value will persist when valid
      if (ensurePlayerIdFromInput()) setBoardMsg(`아이디 저장됨: ${playerId}`);
    });
    playerIdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startGameFlow();
      }
    });
  }

  function startGameFlow() {
    const typed = String(playerIdInput?.value || "").trim();
    if (!isValidPlayerId(typed)) {
      setBoardMsg("아이디는 2~20자 (영문/숫자/한글/공백/_/-)만 가능합니다.");
      return;
    }
    savePlayerId(typed);
    if (randomThemeEnabled) applyRandomTheme();
    reset();
    hideStartScreen();
    setBoardMsg("");
  }

  if (startBtn) startBtn.addEventListener("click", startGameFlow);

  // Render helpers
  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawCloud(c) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    const t = theme();
    ctx.fillStyle =
      activeTheme.id === "space" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)";
    drawRoundedRect(c.x, c.y, c.w, c.h, c.h / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    const t = theme();
    // ground block
    ctx.fillStyle = t.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    // line
    ctx.strokeStyle = t.groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 0.5);
    ctx.lineTo(W, GROUND_Y + 0.5);
    ctx.stroke();

    if (activeTheme.id === "space") {
      // simple craters
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 220 - (state.t * state.speed * 0.25) % 1100) + 1100) % 1100;
        const cx = x - 100;
        const cy = GROUND_Y + 24 + (i % 2) * 8;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // grass dashes
    ctx.strokeStyle = t.grass;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2;
    const dashLen = 14;
    const gap = 16;
    const offset = (state.t * state.speed * 0.7) % (dashLen + gap);
    for (let x = -offset; x < W; x += dashLen + gap) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 5);
      ctx.lineTo(x + dashLen, GROUND_Y + 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawPig() {
    const x = pig.x;
    const y = pig.y;

    // shadow
    const shadowW = pig.w * (pig.onGround ? 0.9 : 0.6);
    const shadowX = x + (pig.w - shadowW) / 2;
    ctx.save();
    ctx.globalAlpha = pig.onGround ? 0.35 : 0.2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    drawRoundedRect(shadowX, GROUND_Y + 10, shadowW, 10, 6);
    ctx.fill();
    ctx.restore();

    // body
    ctx.save();
    ctx.translate(x, y);

    // bounce tilt
    const tilt = clamp(pig.vy / 1100, -0.12, 0.12);
    ctx.translate(pig.w / 2, pig.h / 2);
    ctx.rotate(tilt);
    ctx.translate(-pig.w / 2, -pig.h / 2);

    // body base
    const t = theme();
    ctx.fillStyle = t.pig;
    ctx.strokeStyle = t.pigStroke;
    ctx.lineWidth = 2;
    drawRoundedRect(2, 6, pig.w - 4, pig.h - 10, 16);
    ctx.fill();
    ctx.stroke();

    // belly highlight
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(10, 12, pig.w - 20, pig.h - 20, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ear
    ctx.fillStyle = t.pig2;
    ctx.beginPath();
    ctx.moveTo(14, 6);
    ctx.quadraticCurveTo(10, -2, 18, 1);
    ctx.quadraticCurveTo(24, 4, 22, 10);
    ctx.closePath();
    ctx.fill();

    // snout
    ctx.fillStyle = t.pig2;
    drawRoundedRect(pig.w - 20, 16, 16, 14, 7);
    ctx.fill();
    ctx.stroke();
    // nostrils
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(pig.w - 15, 23, 2.2, 0, Math.PI * 2);
    ctx.arc(pig.w - 9, 23, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath();
    ctx.arc(pig.w - 26, 18, 3, 0, Math.PI * 2);
    ctx.fill();
    // cheek
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(pig.w - 30, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // legs
    ctx.fillStyle = t.pig2;
    const legY = pig.h - 6;
    drawRoundedRect(12, legY, 8, 10, 4);
    drawRoundedRect(pig.w - 24, legY, 8, 10, 4);
    ctx.fill();

    ctx.restore();
  }

  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    const t = theme();

    if (o.kind === "fence") {
      // fence: two posts + bars
      ctx.fillStyle = t.obstacle2;
      drawRoundedRect(0, 0, o.w, o.h, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, o.w - 2, o.h - 2);

      ctx.fillStyle = t.obstacle;
      const barH = Math.max(4, Math.round(o.h * 0.14));
      const y1 = Math.round(o.h * 0.25);
      const y2 = Math.round(o.h * 0.55);
      drawRoundedRect(2, y1, o.w - 4, barH, 6);
      drawRoundedRect(2, y2, o.w - 4, barH, 6);
      ctx.fill();
    } else if (o.kind === "hay") {
      // hay: stack
      ctx.fillStyle = "#d7b15a";
      drawRoundedRect(0, 0, o.w, o.h, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      for (let i = 6; i < o.h; i += 10) {
        ctx.beginPath();
        ctx.moveTo(6, i);
        ctx.lineTo(o.w - 6, i);
        ctx.stroke();
      }
    } else if (o.kind === "asteroid") {
      ctx.fillStyle = t.obstacle2;
      ctx.beginPath();
      ctx.ellipse(o.w / 2, o.h / 2, o.w / 2, o.h / 2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.ellipse(o.w * 0.35, o.h * 0.35, o.w * 0.12, o.h * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === "satellite") {
      ctx.fillStyle = t.obstacle;
      drawRoundedRect(o.w * 0.25, o.h * 0.2, o.w * 0.5, o.h * 0.6, 6);
      ctx.fill();
      ctx.fillStyle = t.accent;
      drawRoundedRect(0, o.h * 0.35, o.w * 0.22, o.h * 0.3, 5);
      drawRoundedRect(o.w * 0.78, o.h * 0.35, o.w * 0.22, o.h * 0.3, 5);
      ctx.fill();
    } else if (o.kind === "barrel") {
      ctx.fillStyle = t.obstacle2;
      drawRoundedRect(0, 0, o.w, o.h, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, o.h * 0.35);
      ctx.lineTo(o.w - 6, o.h * 0.35);
      ctx.moveTo(6, o.h * 0.65);
      ctx.lineTo(o.w - 6, o.h * 0.65);
      ctx.stroke();
    } else if (o.kind === "cone") {
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.moveTo(o.w / 2, 0);
      ctx.lineTo(o.w, o.h);
      ctx.lineTo(0, o.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      drawRoundedRect(0, o.h * 0.78, o.w, o.h * 0.22, 6);
      ctx.fill();
    } else if (o.kind === "lollipop") {
      // stick + candy head
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      drawRoundedRect(o.w * 0.45, o.h * 0.25, o.w * 0.1, o.h * 0.75, 6);
      ctx.fill();
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.arc(o.w * 0.5, o.h * 0.25, Math.min(o.w, o.h) * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(o.w * 0.5, o.h * 0.25, Math.min(o.w, o.h) * 0.18, 0.3, 4.6);
      ctx.stroke();
    } else if (o.kind === "cupcake") {
      ctx.fillStyle = t.obstacle2;
      drawRoundedRect(o.w * 0.15, o.h * 0.45, o.w * 0.7, o.h * 0.55, 10);
      ctx.fill();
      ctx.fillStyle = t.obstacle;
      ctx.beginPath();
      ctx.arc(o.w * 0.5, o.h * 0.45, o.w * 0.32, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.arc(o.w * 0.5, o.h * 0.15, o.w * 0.10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = t.obstacle2;
      drawRoundedRect(0, 0, o.w, o.h, 10);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = theme().text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "700 30px ui-sans-serif, system-ui";
    ctx.fillText(state.gameOver ? "GAME OVER" : "돼지 점프", W / 2, H * 0.38);

    ctx.font = "500 15px ui-sans-serif, system-ui";
    const hint = state.gameOver ? "SPACE/↑/터치로 다시 시작 · R 재시작" : "SPACE/↑/터치로 시작";
    ctx.fillStyle = theme().muted;
    ctx.fillText(hint, W / 2, H * 0.52);

    ctx.restore();
  }

  function step(dt) {
    state.t += dt;

    // speed scales with time (difficulty)
    state.speed += dt * 7.2;
    state.spawnEvery = clamp(1.15 - (state.speed - 330) / 1700, 0.62, 1.15);

    // physics
    pig.vy += pig.gravity * dt;
    pig.y += pig.vy * dt;
    if (pig.y >= GROUND_Y - pig.h) {
      pig.y = GROUND_Y - pig.h;
      pig.vy = 0;
      pig.onGround = true;
    }

    // spawn
    state.spawnTimer += dt;
    const minGap = clamp(160 - (state.speed - 330) * 0.05, 110, 160);
    const last = state.obstacles[state.obstacles.length - 1];
    const farEnough = !last || W - last.x > minGap;
    if (state.spawnTimer >= state.spawnEvery && farEnough) {
      state.spawnTimer = 0;
      state.obstacles.push(makeObstacle());
    }

    // clouds
    if (state.clouds.length < 6 && Math.random() < dt * 0.35) {
      state.clouds.push(makeCloud(false));
    }
    for (const c of state.clouds) c.x -= c.spd * dt;
    state.clouds = state.clouds.filter((c) => c.x + c.w > -60);

    // obstacles move
    for (const o of state.obstacles) o.x -= state.speed * dt;
    state.obstacles = state.obstacles.filter((o) => o.x + o.w > -40);

    // collision (tight-ish hitboxes)
    const pigBox = {
      x: pig.x + 6,
      y: pig.y + 6,
      w: pig.w - 12,
      h: pig.h - 8,
    };
    for (const o of state.obstacles) {
      const ob = { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 2 };
      if (aabb(pigBox, ob)) {
        gameOver();
        break;
      }
    }

    // score
    state.score += dt * 10 * (1 + (state.speed - 330) / 950);
    updateHUD();
  }

  function render() {
    const shakePx = state.shake > 0 ? Math.round(rand(-5, 5) * state.shake * 10) : 0;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - 0.02);

    // Full-viewport background (unscaled)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const t = theme();
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, t.skyTop);
    g.addColorStop(1, t.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (activeTheme.id === "space") {
      // stars across the whole viewport
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 90; i++) {
        const x = (i * 97 + Math.floor(state.t * 30)) % canvas.width;
        const y = (i * 53) % Math.floor(canvas.height * 0.65);
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    }

    // World rendering (uniform scale + letterbox)
    ctx.save();
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, RENDER_OX, RENDER_OY);
    ctx.translate(shakePx, 0);

    // clouds
    for (const c of state.clouds) drawCloud(c);

    // ground
    drawGround();

    // obstacles
    for (const o of state.obstacles) drawObstacle(o);

    // pig
    drawPig();

    // top in-canvas mini HUD (world space)
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(14, 14, 150, 34);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.strokeRect(14, 14, 150, 34);
    ctx.fillStyle = theme().text;
    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`속도: ${Math.round(state.speed)}`, 24, 31);

    if (!state.running || state.gameOver) drawOverlay();

    ctx.restore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.033);
    last = now;

    if (state.running && !state.gameOver) step(dt);
    render();

    requestAnimationFrame(loop);
  }

  // Start in idle state with overlay
  state.running = false;
  state.gameOver = false;
  for (let i = 0; i < 4; i++) state.clouds.push(makeCloud(true));
  updateHUD();
  refreshLeaderboard();
  showStartScreen("menu");
  requestAnimationFrame(loop);
})();


