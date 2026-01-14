(() => {
  try {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("game");
  if (!canvas) {
    console.error("Canvas #game not found");
    alert("게임을 초기화할 수 없습니다. Canvas 요소를 찾을 수 없습니다.");
    return;
  }
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context not available");
    alert("게임을 초기화할 수 없습니다. Canvas 컨텍스트를 사용할 수 없습니다.");
    return;
  }

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
  
  // 배경음악 관련
  let bgMusicAudio = null;
  let isMusicPlaying = false;
  let audioContext = null; // 효과음용 AudioContext
  let bgMusicGain = null; // 무적음악용 GainNode

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
    if (startScreen) {
      startScreen.style.display = "grid";
      startScreen.style.visibility = "visible";
      startScreen.style.opacity = "1";
    }
    if (mode === "gameover") {
      setStartText("GAME OVER", `점수: ${finalScore ?? 0} · 아이디 입력 후 다시 시작할 수 있어요.`, "다시 시작");
    } else {
      setStartText("돼지띠가 만든 돼지게임", "아이디 입력 후 시작하기를 눌러주세요.", "시작하기");
    }
  }

  function hideStartScreen() {
    if (startScreen) {
      startScreen.style.display = "none";
    }
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
    items: /** @type {Array<{x:number,y:number,w:number,h:number,kind:string,value:number}>} */ ([]),
    fans: /** @type {Array<{x:number,y:number,w:number,h:number,active:boolean}>} */ ([]),
    shake: 0,
    invincible: false,
    invincibleTimer: 0,
    itemSpawnTimer: 0,
    fanSpawnTimer: 0,
    lastJumpHeight: 0, // 마지막 점프 높이 (장애물 높이 결정용)
    mudCount: 0, // 진흙 카운트 (0~3)
    piglets: 0, // 수집한 새끼돼지 개수
    isInSky: false, // 하늘 배경 여부
    skyTransition: 0, // 하늘 배경 전환 진행도 (0~1)
    smileTimer: 0, // 웃는 표정 타이머
    bleonEffectTimer: 0, // bleon 아이템 이펙트 타이머
    groundOffset: 0, // 바닥과 장애물의 오프셋 (무적 시 아래로 내려감)
    postInvincibleTimer: 0, // 무적 후 바닥 도착 시 추가 무적 시간
    wasInvincible: false, // 이전 프레임에 무적이었는지
    ignoreNextObstacle: false, // 무적 이후 첫 장애물 무시
    itemAbsorbEffects: [], // 아이템 흡수 이펙트 배열
    scorePopups: [], // 점수 팝업 배열 {x, y, value, timer}
    obstacleSpawnCooldown: 0, // 장애물 생성 쿨다운 (무적 만료 후)
  };

  const pig = {
    x: Math.round(W * 0.18),
    y: 0,
    w: 54,
    h: 40,
    vy: 0,
    onGround: true,
    jumpVel: -540, // px/s
    doubleJumpVel: -420, // 2단 점프 속도
    gravity: 1550, // px/s^2
    canDoubleJump: false, // 2단 점프 가능 여부
    hasDoubleJumped: false, // 2단 점프 사용 여부
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
    state.items = [];
    state.fans = [];
    state.shake = 0;
    state.invincible = false;
    state.invincibleTimer = 0;
    state.itemSpawnTimer = 0;
    state.fanSpawnTimer = 0;
    state.lastJumpHeight = 0;
    state.mudCount = 0;
    state.piglets = 0;
    state.isInSky = false;
    state.skyTransition = 0;
    state.smileTimer = 0;
    state.bleonEffectTimer = 0;
    state.groundOffset = 0;
    state.postInvincibleTimer = 0;
    state.wasInvincible = false;
    state.ignoreNextObstacle = false;
    state.itemAbsorbEffects = [];
    state.scorePopups = [];
    state.obstacleSpawnCooldown = 0;

    pig.vy = 0;
    pig.onGround = true;
    pig.y = GROUND_Y - pig.h;
    pig.canDoubleJump = false;
    pig.hasDoubleJumped = false;

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
    
    // 점프 높이에 따라 장애물 높이 조정 (높은 점프를 많이 하면 장애물도 높아짐)
    const jumpHeightFactor = clamp(1 + state.lastJumpHeight / 200, 0.7, 1.4);

    if (kind === "fence" || kind === "cone") {
      const w = Math.round(rand(18, 28) * scale);
      // 최대 높이를 3분의 1만큼 줄임: 30~44 -> 20~29 (약 1/3 감소)
      const h = Math.round(rand(20, 29) * scale * jumpHeightFactor);
      return { x: W + 8, y: GROUND_Y - h, w, h, kind, hit: false };
    }
    // tall-ish
    const w = Math.round(rand(26, 40) * scale);
    // 최대 높이를 3분의 1만큼 줄임: 38~66 -> 25~44 (약 1/3 감소)
    const h = Math.round(rand(25, 44) * scale * jumpHeightFactor);
    return { x: W + 8, y: GROUND_Y - h, w, h, kind, hit: false };
  }

  function makeItem() {
    const types = ["coin", "piglet", "bleon"];
    const type = types[Math.floor(Math.random() * types.length)];
    let value = 0;
    let size = 20;
    if (type === "coin") {
      value = 10;
      size = 20;
    } else if (type === "piglet") {
      value = 50;
      size = 24;
    } else if (type === "bleon") {
      value = 0; // 점수 없음, 진흙 제거용
      size = 32; // 크기 증가 (22 -> 32)
    }
    const y = rand(GROUND_Y - 120, GROUND_Y - 40);
    return { x: W + 8, y, w: size, h: size, kind: type, value };
  }

  function makeFan() {
    const w = 60;
    const h = 20;
    return { x: W + 8, y: GROUND_Y - h, w, h, active: true };
  }

  function jump() {
    if (!state.running || state.gameOver) return;
    
    // 바닥에 있을 때: 1단 점프
    if (pig.onGround) {
      pig.vy = pig.jumpVel;
      pig.onGround = false;
      pig.canDoubleJump = true;
      pig.hasDoubleJumped = false;
      const estimatedHeight = (pig.jumpVel * pig.jumpVel) / (2 * pig.gravity);
      state.lastJumpHeight = Math.max(state.lastJumpHeight * 0.95, estimatedHeight);
    }
    // 공중에 있고 2단 점프 가능할 때: 2단 점프
    else if (pig.canDoubleJump && !pig.hasDoubleJumped) {
      pig.vy = pig.doubleJumpVel;
      pig.hasDoubleJumped = true;
      pig.canDoubleJump = false;
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
    stopBackgroundMusic();

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
    startBackgroundMusic();
  }

  function startBackgroundMusic() {
    if (isMusicPlaying) return;
    try {
      if (!bgMusicAudio) {
        bgMusicAudio = new Audio('ready-to-play-349320.mp3');
        bgMusicAudio.loop = true;
        bgMusicAudio.volume = 0.12;
      }
      
      // 무적 상태일 때 재생 속도 10% 빠르게
      bgMusicAudio.playbackRate = state.invincible ? 1.1 : 1.0;
      
      bgMusicAudio.play().catch(e => {
        console.warn("배경음악 재생 실패:", e);
      });
      
      isMusicPlaying = true;
    } catch (e) {
      console.warn("배경음악 재생 실패:", e);
    }
  }

  function stopBackgroundMusic() {
    if (bgMusicAudio) {
      bgMusicAudio.pause();
      bgMusicAudio.currentTime = 0;
    }
    isMusicPlaying = false;
  }

  function playSoundEffect(frequencies, durations, type = 'sine') {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    
    try {
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0.15;
      
      let currentTime = audioContext.currentTime;
      frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        
        const duration = durations[i] || 0.1;
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(gainNode);
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        currentTime += duration;
      });
    } catch (e) {
      console.warn("효과음 재생 실패:", e);
    }
  }

  function playCoinSound() {
    // 띠리링~ 효과음 (상승하는 멜로디)
    playSoundEffect(
      [523.25, 659.25, 783.99, 987.77], // C5, E5, G5, B5
      [0.1, 0.1, 0.1, 0.15],
      'sine'
    );
  }

  function playPigletSound() {
    // 꾸울~ 효과음 (하이톤)
    playSoundEffect(
      [493.88, 523.25], // C5, B4, A4 (하이톤)
      [0.15, 0.15, 0.2],
      'sine'
    );
  }

  function playBleonSound() {
    // 빠밤~ 효과음 (낮은 톤에서 높은 톤으로)
    playSoundEffect(
      [220.00, 293.66, 392.00], // A3, D4, G4
      [0.1, 0.15, 0.2],
      'square'
    );
  }

  function startInvincibleMusic() {
    // 무적 상태 배경음악 (더 긴장감 있는 멜로디)
    if (isMusicPlaying) {
      stopBackgroundMusic();
    }
    
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      bgMusicGain = audioContext.createGain();
      bgMusicGain.connect(audioContext.destination);
      bgMusicGain.gain.value = 0.12;
      
      // 무적 상태 전용 멜로디 (더 빠르고 긴장감 있는)
      const notes = [
        { freq: 659.25, duration: 0.1 }, // E5
        { freq: 783.99, duration: 0.1 }, // G5
        { freq: 987.77, duration: 0.1 }, // B5
        { freq: 783.99, duration: 0.1 }, // G5
        { freq: 659.25, duration: 0.1 }, // E5
        { freq: 523.25, duration: 0.15 }, // C5
        { freq: 659.25, duration: 0.1 }, // E5
        { freq: 783.99, duration: 0.2 }, // G5
      ];
      
      let noteIndex = 0;
      
      function playNextNote() {
        if (!state.invincible || !state.running || state.gameOver) {
          stopBackgroundMusic();
          // 무적이 끝나면 일반 배경음악으로 복귀
          if (state.running && !state.gameOver) {
            startBackgroundMusic();
          }
          return;
        }
        
        const currentTime = audioContext.currentTime;
        const note = notes[noteIndex];
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 0; // 무음 (음계 제거)
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        
        osc.connect(gainNode);
        gainNode.connect(bgMusicGain);
        
        osc.start(currentTime);
        osc.stop(currentTime + note.duration);
        
        noteIndex = (noteIndex + 1) % notes.length;
      }
      
      isMusicPlaying = true;
      playNextNote();
      musicInterval = setInterval(() => {
        if (state.invincible && state.running && !state.gameOver) {
          playNextNote();
        } else {
          stopBackgroundMusic();
          if (state.running && !state.gameOver) {
            startBackgroundMusic();
          }
        }
      }, 150); // 더 빠른 템포
    } catch (e) {
      console.warn("무적 배경음악 재생 실패:", e);
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("시작 버튼 클릭됨");
      startGameFlow();
    });
    console.log("시작 버튼 이벤트 리스너 등록 완료");
  } else {
    console.error("시작 버튼을 찾을 수 없습니다!");
  }

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
    const groundY = GROUND_Y + state.groundOffset;
    // ground block
    ctx.fillStyle = t.ground;
    ctx.fillRect(0, groundY, W, H - groundY);
    // line
    ctx.strokeStyle = t.groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(W, groundY + 0.5);
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
      ctx.moveTo(x, groundY + 5);
      ctx.lineTo(x + dashLen, groundY + 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawPig() {
    const x = pig.x;
    const y = pig.y;

    // shadow
    const groundY = GROUND_Y + state.groundOffset;
    const shadowW = pig.w * (pig.onGround ? 0.9 : 0.6);
    const shadowX = x + (pig.w - shadowW) / 2;
    ctx.save();
    ctx.globalAlpha = pig.onGround ? 0.35 : 0.2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    drawRoundedRect(shadowX, groundY + 10, shadowW, 10, 6);
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
    if (state.smileTimer > 0) {
      // 웃는 눈 (반달 모양)
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(pig.w - 26, 18, 3, 0.3, Math.PI - 0.3);
      ctx.fill();
    } else {
      // 일반 눈
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(pig.w - 26, 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 웃는 표정 (금화 수집 시)
    if (state.smileTimer > 0) {
      // 웃는 입
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pig.w - 15, 28, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    
    // cheek
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(pig.w - 30, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // 진흙 효과
    if (state.mudCount > 0) {
      ctx.fillStyle = "#4a3728";
      ctx.globalAlpha = 0.4 * state.mudCount / 3;
      // 진흙 얼룩
      for (let i = 0; i < state.mudCount; i++) {
        const mudX = 8 + i * 12;
        const mudY = 15 + (i % 2) * 8;
        ctx.beginPath();
        ctx.arc(mudX, mudY, 6 + i * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    
    // 날개 (무적 상태일 때) - 더 크게
    if (state.invincible) {
      ctx.save();
      const wingFlap = Math.sin(state.t * 12) * 0.3; // 파닥이는 모션
      const wingSize = 1.6; // 날개 크기 배율
      // 왼쪽 날개
      ctx.translate(0, pig.h / 2);
      ctx.rotate(-0.6 + wingFlap);
      ctx.translate(0, -pig.h / 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(-12 * wingSize, pig.h / 2);
      ctx.quadraticCurveTo(-18 * wingSize, pig.h / 2 - 12 * wingSize, -15 * wingSize, pig.h / 2 - 18 * wingSize);
      ctx.quadraticCurveTo(-12 * wingSize, pig.h / 2 - 15 * wingSize, -8 * wingSize, pig.h / 2 - 8 * wingSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      // 오른쪽 날개
      ctx.translate(pig.w, pig.h / 2);
      ctx.rotate(0.6 - wingFlap);
      ctx.translate(-pig.w, -pig.h / 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(pig.w + 12 * wingSize, pig.h / 2);
      ctx.quadraticCurveTo(pig.w + 18 * wingSize, pig.h / 2 - 12 * wingSize, pig.w + 15 * wingSize, pig.h / 2 - 18 * wingSize);
      ctx.quadraticCurveTo(pig.w + 12 * wingSize, pig.h / 2 - 15 * wingSize, pig.w + 8 * wingSize, pig.h / 2 - 8 * wingSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

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
    ctx.translate(o.x, o.y + state.groundOffset);
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

  function drawItem(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    const t = theme();
    
    if (item.kind === "coin") {
      // 금화
      ctx.fillStyle = "#ffd700";
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.w / 2, item.h / 2, item.w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // 반짝임 효과
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(item.w * 0.35, item.h * 0.35, item.w * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // $ 표시
      ctx.fillStyle = "#ffaa00";
      ctx.font = `bold ${item.w * 0.5}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", item.w / 2, item.h / 2);
    } else if (item.kind === "piglet") {
      // 새끼돼지
      ctx.fillStyle = t.pig;
      ctx.strokeStyle = t.pigStroke;
      ctx.lineWidth = 1.5;
      
      // 몸통
      drawRoundedRect(2, 4, item.w - 4, item.h - 8, 8);
      ctx.fill();
      ctx.stroke();
      
      // 귀
      ctx.fillStyle = t.pig2;
      ctx.beginPath();
      ctx.moveTo(6, 4);
      ctx.quadraticCurveTo(4, 0, 8, 2);
      ctx.quadraticCurveTo(12, 4, 10, 8);
      ctx.closePath();
      ctx.fill();
      
      // 눈
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(item.w * 0.35, item.h * 0.4, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 코
      ctx.fillStyle = t.pig2;
      drawRoundedRect(item.w * 0.6, item.h * 0.5, item.w * 0.3, item.h * 0.25, 4);
      ctx.fill();
    } else if (item.kind === "bleon") {
      // 초록색 bleon 아이템 - 테두리만, 안에 "Bleon" 글씨
      ctx.strokeStyle = "#22c55e";
      ctx.fillStyle = "#4ade80";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.w / 2, item.h / 2, item.w / 2 - 2, 0, Math.PI * 2);
      ctx.stroke(); // 테두리만 그리기
      
      // "Bleon" 글씨
      ctx.fillStyle = "#22c55e";
      ctx.font = `bold ${item.w * 0.35}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Bleon", item.w / 2, item.h / 2);
    }
    
    ctx.restore();
  }

  function drawPiglet(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    const t = theme();
    
    // 몸통
    ctx.fillStyle = t.pig;
    ctx.strokeStyle = t.pigStroke;
    ctx.lineWidth = 1;
    drawRoundedRect(0, 0, size, size * 0.8, size * 0.2);
    ctx.fill();
    ctx.stroke();
    
    // 귀
    ctx.fillStyle = t.pig2;
    ctx.beginPath();
    ctx.moveTo(size * 0.2, 0);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.1, size * 0.25, -size * 0.05);
    ctx.quadraticCurveTo(size * 0.35, 0, size * 0.3, size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // 눈
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath();
    ctx.arc(size * 0.3, size * 0.3, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // 코
    ctx.fillStyle = t.pig2;
    drawRoundedRect(size * 0.55, size * 0.4, size * 0.3, size * 0.2, size * 0.1);
    ctx.fill();
    
    ctx.restore();
  }

  function drawFan(fan) {
    ctx.save();
    ctx.translate(fan.x, fan.y + state.groundOffset);
    const t = theme();
    
    if (!fan.active) {
      ctx.restore();
      return;
    }
    
    // 환풍기 바닥
    ctx.fillStyle = t.obstacle2;
    drawRoundedRect(0, 0, fan.w, fan.h, 6);
    ctx.fill();
    
    // 환풍기 그릴
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 8; // 팬 두께 2배 더 증가 (4 -> 8)
    ctx.globalAlpha = 0.7;
    const anim = Math.sin(state.t * 8) * 0.5 + 0.5;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + state.t * 6;
      const x1 = fan.w / 2;
      const y1 = fan.h / 2;
      const x2 = x1 + Math.cos(angle) * (fan.w * 0.3);
      const y2 = y1 + Math.sin(angle) * (fan.w * 0.3);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // 바람 효과 (위로 올라가는 선)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = fan.w / 2 + (i - 1) * 8;
      const y = -20 - (state.t * 50) % 30;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
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

    // speed scales with time (difficulty) - 20% 천천히 증가
    state.speed += dt * 7.2 * 0.8; // 7.2 * 0.8 = 5.76
    state.spawnEvery = clamp(1.15 - (state.speed - 330) / 1700, 0.62, 1.15);

    // 타이머 업데이트
    if (state.smileTimer > 0) state.smileTimer -= dt;
    if (state.bleonEffectTimer > 0) state.bleonEffectTimer -= dt;

    // physics (무적 상태일 때는 하늘에 떠다님)
    if (state.invincible) {
      pig.vy += pig.gravity * dt * 0.15; // 하늘에 떠다니는 느낌
      pig.y += pig.vy * dt;
      // 하늘 배경 전환
      if (!state.isInSky) {
        state.skyTransition = Math.min(1, state.skyTransition + dt * 2);
        if (state.skyTransition >= 1) {
          state.isInSky = true;
        }
      }
    } else {
      pig.vy += pig.gravity * dt;
      pig.y += pig.vy * dt;
      // 하늘에서 내려올 때 배경 전환
      if (state.isInSky) {
        state.skyTransition = Math.max(0, state.skyTransition - dt * 2);
        if (state.skyTransition <= 0) {
          state.isInSky = false;
        }
      }
    }
    
    if (pig.y >= GROUND_Y - pig.h) {
      pig.y = GROUND_Y - pig.h;
      pig.vy = 0;
      pig.onGround = true;
      // 바닥에 닿으면 2단 점프 리셋
      pig.canDoubleJump = false;
      pig.hasDoubleJumped = false;
      
      // 무적이 끝났고 이전에 무적이었다면 0.5초 추가 무적 시간 부여, 첫 장애물 무시, 진흙 카운트 -1
      if (!state.invincible && state.wasInvincible && state.postInvincibleTimer <= 0) {
        state.postInvincibleTimer = 0.5;
        state.ignoreNextObstacle = true; // 첫 장애물 무시
        // 진흙 카운트 감소 (최소 0)
        if (state.mudCount > 0) {
          state.mudCount = Math.max(0, state.mudCount - 1);
          updateHUD();
        }
      }
      
      // 바닥에 닿았을 때는 무적 상태를 유지 (타이머로만 관리)
    }
    
    // 이전 프레임 무적 상태 저장
    state.wasInvincible = state.invincible;

    // 무적 타이머 (기본 2초 + 새끼돼지 개수 * 1초)
    if (state.invincible) {
      // 무적 상태일 때 배경음악 재생 속도 10% 빠르게
      if (bgMusicAudio && bgMusicAudio.playbackRate !== 1.1) {
        bgMusicAudio.playbackRate = 1.1;
      }
      state.invincibleTimer -= dt;
      
      // 무적 상태일 때 바닥과 장애물이 아래로 내려감
      const maxOffset = 200; // 최대 오프셋
      const transitionTime = 0.5; // 전환 시간 (내려가는/올라오는 시간)
      const totalTime = 2.0 + state.piglets * 1.0; // 총 무적 시간
      const remainingTime = state.invincibleTimer;
      
      // 무적 만료 3초 전부터 쿨다운 시작
      if (remainingTime <= 3.0 && remainingTime > 0) {
        // 장애물 생성 쿨다운 시작 (만료 후 2초까지)
        if (state.obstacleSpawnCooldown <= 0) {
          // 남은 시간 + 만료 후 2초 = 총 쿨다운 시간
          state.obstacleSpawnCooldown = remainingTime + 2.0;
        }
      }
      
      if (remainingTime > totalTime - transitionTime) {
        // 무적 시작 시 아래로 내려감 (0.5초 동안)
        const progress = (totalTime - remainingTime) / transitionTime;
        state.groundOffset = maxOffset * Math.min(1, progress);
      } else if (remainingTime > transitionTime) {
        // 중간에는 최대 오프셋 유지
        state.groundOffset = maxOffset;
      } else {
        // 무적 종료 시 다시 올라옴 (0.5초 동안)
        const progress = remainingTime / transitionTime;
        state.groundOffset = maxOffset * progress;
      }
      
      if (state.invincibleTimer <= 0) {
        state.invincible = false;
        state.invincibleTimer = 0;
        state.groundOffset = 0;
        // 무적이 끝나면 배경음악 재생 속도를 원래대로 복귀
        if (bgMusicAudio && bgMusicAudio.playbackRate !== 1.0) {
          bgMusicAudio.playbackRate = 1.0;
        }
      }
    } else {
      // 무적이 아닐 때는 천천히 원래 위치로
      if (state.groundOffset > 0) {
        state.groundOffset = Math.max(0, state.groundOffset - dt * 400);
      }
    }
    
    // 무적 후 바닥 도착 시 추가 무적 시간
    if (state.postInvincibleTimer > 0) {
      state.postInvincibleTimer -= dt;
      if (state.postInvincibleTimer <= 0) {
        state.postInvincibleTimer = 0;
      }
    }

    // 장애물 생성 쿨다운 업데이트
    if (state.obstacleSpawnCooldown > 0) {
      state.obstacleSpawnCooldown -= dt;
      if (state.obstacleSpawnCooldown <= 0) {
        state.obstacleSpawnCooldown = 0;
      }
    }

    // 점수 팝업 업데이트
    for (let i = state.scorePopups.length - 1; i >= 0; i--) {
      const popup = state.scorePopups[i];
      popup.timer -= dt;
      popup.y -= dt * 40; // 위로 올라감
      popup.x += dt * 20; // 오른쪽으로 이동
      if (popup.timer <= 0) {
        state.scorePopups.splice(i, 1);
      }
    }

    // spawn obstacles (쿨다운 중이면 생성하지 않음)
    if (state.obstacleSpawnCooldown <= 0) {
      state.spawnTimer += dt;
      const minGap = clamp(160 - (state.speed - 330) * 0.05, 110, 160);
      const last = state.obstacles[state.obstacles.length - 1];
      const farEnough = !last || W - last.x > minGap;
      if (state.spawnTimer >= state.spawnEvery && farEnough) {
      const newObstacle = makeObstacle();
      const minObstacleGap = 100; // 장애물과 다른 오브젝트 간 최소 간격 (80 -> 100으로 증가)
      
      // 아이템과의 간격 체크 (x축과 y축 모두 체크)
      let tooClose = false;
      for (const item of state.items) {
        const xDistance = Math.abs(newObstacle.x - item.x);
        const yDistance = Math.abs((newObstacle.y + newObstacle.h / 2) - (item.y + item.h / 2));
        if (xDistance < minObstacleGap && yDistance < 60) {
          tooClose = true;
          break;
        }
      }
      
      // 환풍기와의 간격 체크 (x축과 y축 모두 체크)
      if (!tooClose) {
        for (const fan of state.fans) {
          const xDistance = Math.abs(newObstacle.x - (fan.x + fan.w / 2));
          const yDistance = Math.abs((newObstacle.y + newObstacle.h / 2) - (fan.y + fan.h / 2));
          if (xDistance < minObstacleGap && yDistance < 60) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 다른 장애물과의 간격 체크 (공중장애물 포함)
      if (!tooClose) {
        for (const o of state.obstacles) {
          const xDistance = Math.abs(newObstacle.x - (o.x + o.w / 2));
          const yDistance = Math.abs((newObstacle.y + newObstacle.h / 2) - (o.y + o.h / 2));
          if (xDistance < minObstacleGap && yDistance < 60) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 충분히 멀리 있으면 장애물 생성
      if (!tooClose) {
        state.spawnTimer = 0;
        state.obstacles.push(newObstacle);
      }
      }
    } // 쿨다운 체크 종료

    // spawn items
    state.itemSpawnTimer += dt;
    if (state.itemSpawnTimer >= 2.5 && Math.random() < 0.4) {
      state.itemSpawnTimer = 0;
      const newItem = makeItem();
      const minItemGap = 100; // 아이템과 다른 오브젝트 간 최소 간격 (80 -> 100으로 증가)
      
      // 장애물과의 간격 체크 (x축과 y축 모두 체크)
      let tooClose = false;
      for (const o of state.obstacles) {
        const xDistance = Math.abs(newItem.x - (o.x + o.w / 2));
        const yDistance = Math.abs((newItem.y + newItem.h / 2) - (o.y + o.h / 2));
        if (xDistance < minItemGap && yDistance < 60) {
          tooClose = true;
          break;
        }
      }
      
      // 다른 아이템과의 간격 체크
      if (!tooClose) {
        for (const item of state.items) {
          const distance = Math.abs(newItem.x - item.x);
          if (distance < minItemGap) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 환풍기와의 간격 체크 (x축과 y축 모두 체크)
      if (!tooClose) {
        for (const fan of state.fans) {
          const xDistance = Math.abs(newItem.x - (fan.x + fan.w / 2));
          const yDistance = Math.abs((newItem.y + newItem.h / 2) - (fan.y + fan.h / 2));
          if (xDistance < minItemGap && yDistance < 60) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 충분히 멀리 있으면 아이템 생성
      if (!tooClose) {
        state.items.push(newItem);
      }
    }

    // spawn fans
    state.fanSpawnTimer += dt;
    if (state.fanSpawnTimer >= 8.0 && Math.random() < 0.3) {
      state.fanSpawnTimer = 0;
      const newFan = makeFan();
      const minFanGap = 100; // 환풍기와 다른 오브젝트 간 최소 간격
      
      // 장애물과의 간격 체크 (x축과 y축 모두 체크)
      let tooClose = false;
      for (const o of state.obstacles) {
        const xDistance = Math.abs(newFan.x - (o.x + o.w / 2));
        const yDistance = Math.abs((newFan.y + newFan.h / 2) - (o.y + o.h / 2));
        if (xDistance < minFanGap && yDistance < 60) {
          tooClose = true;
          break;
        }
      }
      
      // 아이템과의 간격 체크
      if (!tooClose) {
        for (const item of state.items) {
          const xDistance = Math.abs(newFan.x - (item.x + item.w / 2));
          const yDistance = Math.abs((newFan.y + newFan.h / 2) - (item.y + item.h / 2));
          if (xDistance < minFanGap && yDistance < 60) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 다른 환풍기와의 간격 체크
      if (!tooClose) {
        for (const fan of state.fans) {
          const distance = Math.abs(newFan.x - (fan.x + fan.w / 2));
          if (distance < minFanGap) {
            tooClose = true;
            break;
          }
        }
      }
      
      // 충분히 멀리 있으면 환풍기 생성
      if (!tooClose) {
        state.fans.push(newFan);
      }
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

    // items move
    for (const item of state.items) item.x -= state.speed * dt;
    state.items = state.items.filter((item) => item.x + item.w > -40);

    // fans move
    for (const fan of state.fans) fan.x -= state.speed * dt;
    state.fans = state.fans.filter((fan) => fan.x + fan.w > -40);

    // collision detection
    const pigBox = {
      x: pig.x + 6,
      y: pig.y + 6,
      w: pig.w - 12,
      h: pig.h - 8,
    };

    // 무적 상태일 때 아이템 자동 흡수
    if (state.invincible) {
      const absorbRange = 200; // 흡수 범위
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        const dx = (item.x + item.w / 2) - (pig.x + pig.w / 2);
        const dy = (item.y + item.h / 2) - (pig.y + pig.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < absorbRange) {
          // 아이템을 돼지 쪽으로 끌어당김 (속도 증가)
          const pullSpeed = 1200; // 흡수 속도 (800 -> 1200으로 증가)
          const pullX = (dx / distance) * pullSpeed * dt;
          const pullY = (dy / distance) * pullSpeed * dt;
          item.x -= pullX;
          item.y -= pullY;
          
          // 충분히 가까워지면 흡수
          if (distance < 30) {
            // 흡수 이펙트 추가
            state.itemAbsorbEffects.push({
              x: item.x + item.w / 2,
              y: item.y + item.h / 2,
              kind: item.kind,
              timer: 0.4,
              scale: 1.0,
            });
            
            // 아이템 효과 적용
            if (item.kind === "coin") {
              const scoreGain = item.value;
              state.score += scoreGain;
              state.smileTimer = 0.5;
              playCoinSound(); // 띠리링~ 효과음
              // 점수 팝업 추가
              state.scorePopups.push({
                x: pig.x + pig.w,
                y: pig.y + pig.h / 2,
                value: scoreGain,
                timer: 1.0,
              });
            } else if (item.kind === "piglet") {
              state.score += item.value;
              state.piglets++;
              playPigletSound(); // 꾸울~ 효과음
            } else if (item.kind === "bleon") {
              if (state.mudCount > 0) {
                state.mudCount--;
                state.bleonEffectTimer = 0.6;
              }
              playBleonSound(); // 빠밤~ 효과음
            }
            
            state.items.splice(i, 1);
            updateHUD();
          }
        }
      }
    } else {
      // 일반 아이템 수집 (충돌 감지)
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        const itemBox = { x: item.x, y: item.y, w: item.w, h: item.h };
        if (aabb(pigBox, itemBox)) {
          if (item.kind === "coin") {
            // 금화 수집: 점수 추가 + 웃는 표정
            const scoreGain = item.value;
            state.score += scoreGain;
            state.smileTimer = 0.5; // 0.5초 웃는 표정
            playCoinSound(); // 띠리링~ 효과음
            // 점수 팝업 추가
            state.scorePopups.push({
              x: pig.x + pig.w,
              y: pig.y + pig.h / 2,
              value: scoreGain,
              timer: 1.0,
            });
          } else if (item.kind === "piglet") {
            // 새끼돼지 수집: 점수 추가 + 새끼돼지 개수 증가
            state.score += item.value;
            state.piglets++;
            playPigletSound(); // 꾸울~ 효과음
          } else if (item.kind === "bleon") {
            // bleon 아이템: 진흙 제거
            if (state.mudCount > 0) {
              state.mudCount--;
              state.bleonEffectTimer = 0.6; // 이펙트 표시
            }
            playBleonSound(); // 빠밤~ 효과음
          }
          state.items.splice(i, 1);
          updateHUD();
        }
      }
    }
    
    // 아이템 흡수 이펙트 업데이트
    for (let i = state.itemAbsorbEffects.length - 1; i >= 0; i--) {
      const effect = state.itemAbsorbEffects[i];
      effect.timer -= dt;
      effect.scale += dt * 2;
      if (effect.timer <= 0) {
        state.itemAbsorbEffects.splice(i, 1);
      }
    }

    // 환풍기 충돌
    for (const fan of state.fans) {
      if (!fan.active) continue;
      const fanBox = { x: fan.x, y: fan.y, w: fan.w, h: fan.h };
      if (aabb(pigBox, fanBox) && pig.onGround) {
        // 환풍기 밟음 - 무적 상태로 전환
        state.invincible = true;
        // 무적 지속시간: 기본 2초 + 새끼돼지 개수 * 1초
        state.invincibleTimer = 2.0 + state.piglets * 1.0;
        // 새끼돼지 초기화 (한번 무적을 받았으면 0으로)
        state.piglets = 0;
        // 진흙 카운트 초기화
        state.mudCount = 0;
        pig.vy = -500; // 위로 높게 올라감
        pig.onGround = false;
        fan.active = false;
        // 무적 상태일 때 배경음악 재생 속도 10% 빠르게
        if (bgMusicAudio) {
          bgMusicAudio.playbackRate = 1.1;
        }
      }
    }

    // 장애물 충돌 (무적 상태나 추가 무적 시간이 아닐 때만)
    if (!state.invincible && state.postInvincibleTimer <= 0) {
      for (const o of state.obstacles) {
        // 이미 충돌한 장애물은 무시
        if (o.hit) continue;
        
        const ob = { x: o.x + 2, y: o.y + 2 + state.groundOffset, w: o.w - 4, h: o.h - 2 };
        if (aabb(pigBox, ob)) {
          // 무적 이후 첫 장애물 무시
          if (state.ignoreNextObstacle) {
            o.hit = true;
            state.ignoreNextObstacle = false;
            break;
          }
          
          // 이 장애물에 충돌했음을 표시
          o.hit = true;
          
          // 화면 흔들림 효과
          state.shake = 0.2;
          
          // 진흙 카운트 증가
          state.mudCount = Math.min(3, state.mudCount + 1);
          if (state.mudCount >= 3) {
            gameOver();
            break;
          }
          // 장애물을 밀어내기 (약간 뒤로)
          pig.x = Math.max(0, pig.x - 15);
          break;
        }
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
    
    // 하늘 배경 (무적 상태일 때)
    if (state.skyTransition > 0) {
      // 하늘 배경 그라데이션
      const skyG = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyG.addColorStop(0, "#87ceeb");
      skyG.addColorStop(0.5, "#b0e0e6");
      skyG.addColorStop(1, "#e0f6ff");
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 구름들
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 15; i++) {
        const cloudX = (i * 200 + state.t * 20) % (canvas.width + 200) - 100;
        const cloudY = (i * 80) % (canvas.height * 0.6);
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 일반 배경
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, t.skyTop);
    g.addColorStop(1, t.skyBottom);
    ctx.fillStyle = g;
    
    // 그라데이션 전환
    if (state.skyTransition > 0 && state.skyTransition < 1) {
      ctx.globalAlpha = 1 - state.skyTransition;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    } else if (state.skyTransition <= 0) {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 하늘 배경이 아닐 때만 별 표시
    if (activeTheme.id === "space" && state.skyTransition <= 0) {
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

    // fans (환풍기 - 바닥에 그리기)
    for (const fan of state.fans) drawFan(fan);

    // obstacles
    for (const o of state.obstacles) drawObstacle(o);

    // items (아이템)
    for (const item of state.items) drawItem(item);

    // 아이템 흡수 이펙트 그리기
    for (const effect of state.itemAbsorbEffects) {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.globalAlpha = effect.timer / 0.4;
      ctx.scale(effect.scale, effect.scale);
      
      const t = theme();
      if (effect.kind === "coin") {
        // 금화 이펙트
        ctx.fillStyle = "#ffd700";
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 12px ui-sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0);
      } else if (effect.kind === "piglet") {
        // 새끼돼지 이펙트
        ctx.fillStyle = t.pig;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.kind === "bleon") {
        // bleon 이펙트
        ctx.fillStyle = "#4ade80";
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // pig
    drawPig();

    // 점수 팝업 그리기
    for (const popup of state.scorePopups) {
      ctx.save();
      ctx.translate(popup.x, popup.y);
      const alpha = popup.timer / 1.0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffd700";
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 2;
      ctx.font = `bold ${14 + (1 - alpha) * 6}px ui-sans-serif, system-ui`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const text = `+${popup.value}`;
      // 텍스트 외곽선
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    // 새끼돼지들 그리기 (돼지 뒤에 따라다님)
    if (state.piglets > 0) {
      const pigletSize = 18;
      const spacing = 25;
      for (let i = 0; i < state.piglets; i++) {
        const offsetX = -(spacing * (i + 1) + Math.sin(state.t * 2 + i) * 3);
        const offsetY = Math.cos(state.t * 2 + i) * 2;
        const pigletX = pig.x + offsetX;
        const pigletY = pig.y + pig.h - pigletSize + offsetY;
        drawPiglet(pigletX, pigletY, pigletSize);
      }
    }

    // bleon 이펙트 (진흙 제거 시)
    if (state.bleonEffectTimer > 0) {
      ctx.save();
      const alpha = state.bleonEffectTimer / 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#4ade80";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      const radius = 40 + (1 - alpha) * 20;
      ctx.beginPath();
      ctx.arc(pig.x + pig.w / 2, pig.y + pig.h / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(74, 222, 128, 0.2)";
      ctx.fill();
      ctx.restore();
    }

    // 무적 상태 효과 (돼지 주변에 반짝이는 원)
    if (state.invincible || state.postInvincibleTimer > 0) {
      ctx.save();
      const pulse = Math.sin(state.t * 8) * 0.3 + 0.7;
      ctx.globalAlpha = pulse * 0.5;
      ctx.strokeStyle = state.postInvincibleTimer > 0 ? "#88ff88" : "#ffff00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pig.x + pig.w / 2, pig.y + pig.h / 2, pig.w * 0.7 + Math.sin(state.t * 10) * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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
    
    // 무적 상태 표시
    if (state.invincible) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.fillText(`무적: ${Math.ceil(state.invincibleTimer)}초`, 24, 48);
    }
    
    // 진흙 카운트 표시 (2배 크기)
    if (state.mudCount > 0) {
      ctx.fillStyle = state.mudCount >= 3 ? "#ff4d4d" : "#ffaa00";
      ctx.font = "600 24px ui-sans-serif, system-ui";
      ctx.fillText(`진흙: ${state.mudCount}/3`, 24, 70);
    }
    
    // 새끼돼지 개수 표시 (2배 크기)
    if (state.piglets > 0) {
      ctx.fillStyle = theme().accent;
      ctx.font = "600 24px ui-sans-serif, system-ui";
      ctx.fillText(`새끼돼지: ${state.piglets}`, 24, 100);
    }

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
  console.log("게임 초기화 완료, 시작 화면 표시");
  requestAnimationFrame(loop);
  } catch (error) {
    console.error("게임 초기화 중 오류 발생:", error);
    alert("게임을 시작할 수 없습니다. 콘솔을 확인해주세요.\n오류: " + error.message);
  }
})();


