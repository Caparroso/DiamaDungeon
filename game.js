(() => {
  "use strict";

  // ============================================================
  // DIAMA DUNGEON V2
  // Juego estático sin dependencias, listo para GitHub Pages.
  // ============================================================

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const WALL = 18;
  const DOOR_SIZE = 74;
  const MAX_HP = 3;

  // La primera versión exigía orientación horizontal. Si un navegador conserva
  // aquel HTML en caché, eliminamos físicamente su pantalla de bloqueo.
  document.getElementById("rotate-device")?.remove();

  const ui = {
    hearts: document.getElementById("hearts"),
    keyCount: document.getElementById("key-count"),
    discCount: document.getElementById("disc-count"),
    fragmentCount: document.getElementById("fragment-count"),
    zoneTitle: document.getElementById("zone-title"),
    toast: document.getElementById("game-toast"),
    interactionHint: document.getElementById("interaction-hint"),
    startModal: document.getElementById("start-modal"),
    startButton: document.getElementById("start-button"),
    startButtonText: document.getElementById("start-button-text"),
    loadStatus: document.getElementById("load-status"),
    deathModal: document.getElementById("death-modal"),
    retryButton: document.getElementById("retry-button"),
    discModal: document.getElementById("disc-modal"),
    discModalTitle: document.getElementById("disc-modal-title"),
    discModalLocation: document.getElementById("disc-modal-location"),
    discPlayButton: document.getElementById("disc-play-button"),
    discCloseButton: document.getElementById("disc-close-button"),
    revealModal: document.getElementById("reveal-modal"),
    finalDiscMessage: document.getElementById("final-disc-message"),
    playAgainButton: document.getElementById("play-again-button"),
    creditsModal: document.getElementById("credits-modal"),
    creditsCloseButton: document.getElementById("credits-close-button"),
    creditsXButton: document.getElementById("credits-x-button"),
    nowPlaying: document.getElementById("now-playing"),
    playerToggle: document.getElementById("player-toggle"),
    trackPlay: document.getElementById("track-play"),
    trackBack: document.getElementById("track-back"),
    trackForward: document.getElementById("track-forward"),
    trackPrevious: document.getElementById("track-previous"),
    trackNext: document.getElementById("track-next"),
    trackSeek: document.getElementById("track-seek"),
    playerCollapse: document.getElementById("player-collapse"),
    trackTitle: document.getElementById("track-title"),
    trackStatus: document.getElementById("track-status"),
    trackCurrent: document.getElementById("track-current"),
    trackDuration: document.getElementById("track-duration"),
    inAppNote: document.getElementById("in-app-note"),
    copyLinkButton: document.getElementById("copy-link-button")
  };

  // Las barras de Safari y de los navegadores integrados cambian el área
  // realmente visible. Usamos VisualViewport para mantener la consola completa.
  const userAgent = navigator.userAgent || "";
  const isInAppBrowser = /Instagram|FBAN|FBAV|MessengerForiOS/i.test(userAgent);
  const isIPadDesktopMode = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
  const isTouchDevice = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(userAgent)
    || isIPadDesktopMode
    || isInAppBrowser;

  document.body.classList.toggle("in-app-browser", isInAppBrowser);
  document.body.classList.toggle("touch-layout", isTouchDevice);
  ui.inAppNote.classList.toggle("hidden", !isInAppBrowser);

  function syncVisibleViewport() {
    const viewport = window.visualViewport;
    const width = Math.round(viewport?.width || window.innerWidth);
    const height = Math.round(viewport?.height || window.innerHeight);
    document.documentElement.style.setProperty("--app-width", `${width}px`);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    document.documentElement.style.setProperty("--app-top", `${Math.round(viewport?.offsetTop || 0)}px`);
    document.body.classList.toggle("portrait-layout", width <= height);
    document.body.classList.toggle("tablet-layout", isTouchDevice && width >= 600);
    document.body.classList.toggle("compact-landscape", width > height && height < 590);
  }

  syncVisibleViewport();
  window.addEventListener("resize", syncVisibleViewport, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(syncVisibleViewport, 120));
  window.visualViewport?.addEventListener("resize", syncVisibleViewport, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncVisibleViewport, { passive: true });

  ui.copyLinkButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const temporary = document.createElement("textarea");
      temporary.value = window.location.href;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.appendChild(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
    }
    ui.copyLinkButton.textContent = "ENLACE COPIADO";
  });

  // Frecuencias ambientales: sólo animamos transform y opacidad para cuidar móviles.
  const signalField = document.getElementById("signal-field");
  const signalLabels = [
    "13.7 kHz", "DIAMA::SYNC", "0101 1100", "PHANTOM_02", "88.4 MHz",
    "READY //", "WAVE 07", "CDMX SIGNAL", "∆ 440 Hz", "Y2K_LINK", "D. NETWORK"
  ];
  const signalCount = window.matchMedia("(max-width: 900px)").matches ? 9 : 18;
  for (let index = 0; index < signalCount; index += 1) {
    const signal = document.createElement("span");
    signal.className = "frequency-signal";
    signal.textContent = signalLabels[index % signalLabels.length];
    signal.style.setProperty("--signal-x", `${4 + ((index * 37) % 92)}%`);
    signal.style.setProperty("--signal-y", `${8 + ((index * 47) % 88)}%`);
    signal.style.setProperty("--signal-size", `${8 + (index % 4) * 2}px`);
    signal.style.setProperty("--signal-speed", `${8 + (index % 7) * 1.7}s`);
    signal.style.setProperty("--signal-delay", `${-(index % 9) * 1.35}s`);
    signal.style.setProperty("--signal-sway", `${(index % 2 ? 1 : -1) * (18 + (index % 5) * 8)}px`);
    signalField.appendChild(signal);
  }

  // ---------------------------
  // Recursos
  // ---------------------------

  const spriteRoot = "assets/sprites/";
  const imagePaths = {
    player_idle_down: `${spriteRoot}Char_Sprites/char_idle_down_anim_strip_6.png`,
    player_idle_up: `${spriteRoot}Char_Sprites/char_idle_up_anim_strip_6.png`,
    player_idle_left: `${spriteRoot}Char_Sprites/char_idle_left_anim_strip_6.png`,
    player_idle_right: `${spriteRoot}Char_Sprites/char_idle_right_anim_strip_6.png`,
    player_run_down: `${spriteRoot}Char_Sprites/char_run_down_anim_strip_6.png`,
    player_run_up: `${spriteRoot}Char_Sprites/char_run_up_anim_strip_6.png`,
    player_run_left: `${spriteRoot}Char_Sprites/char_run_left_anim_strip_6.png`,
    player_run_right: `${spriteRoot}Char_Sprites/char_run_right_anim_strip_6.png`,
    player_attack_down: `${spriteRoot}Char_Sprites/char_attack_down_anim_strip_6.png`,
    player_attack_up: `${spriteRoot}Char_Sprites/char_attack_up_anim_strip_6.png`,
    player_attack_left: `${spriteRoot}Char_Sprites/char_attack_left_anim_strip_6.png`,
    player_attack_right: `${spriteRoot}Char_Sprites/char_attack_right_anim_strip_6.png`,
    slime: `${spriteRoot}Enemies_Sprites/Pinkslime_Sprites/pinkslime_run_anim_anim_all_dir_strip_6.png`,
    bat: `${spriteRoot}Enemies_Sprites/Pinkbat_Sprites/pinkbat_idle_right_anim_strip_5.png`,
    spider: `${spriteRoot}Enemies_Sprites/Spider_Sprites/spider_run_anim_all_dir_strip_4.png`,
    phantom: `${spriteRoot}Enemies_Sprites/Phantom_Sprites/phantom_run_anim_right_strip_6.png`,
    bomberplant: `${spriteRoot}Enemies_Sprites/Bomberplant_Sprites/bomberplant_idle_anim_all_dir_strip_5.png`,
    key: `${spriteRoot}Props_Items_(animated)/key_item_anim_strip_6.png`,
    crystal: `${spriteRoot}Props_Items_(animated)/crystal_item_anim_strip_6.png`,
    chestOpening: `${spriteRoot}Props_Items_(animated)/lootchest_item_anim_opening_strip_5.png`,
    chestOpen: `${spriteRoot}Props_Items_(animated)/lootchest_item_static_open.png`,
    potion: `${spriteRoot}Props_Items_(animated)/health_potion_item.png`
  };

  const images = {};

  function loadImage(name, path) {
    return new Promise((resolve) => {
      const image = new Image();
      let settled = false;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        images[name] = loaded ? image : null;
        resolve(loaded);
      };
      const timeout = setTimeout(() => finish(false), 6500);
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = path;
    });
  }

  let startUnlocked = false;

  function unlockStart(compatibleMode = false) {
    if (startUnlocked) return;
    startUnlocked = true;
    ui.startButton.disabled = false;
    ui.startButtonText.textContent = "INICIAR JUEGO";
    ui.loadStatus.textContent = compatibleMode
      ? "DIAMA Games · modo compatible"
      : "DIAMA Games";
  }

  async function preloadAssets() {
    const entries = Object.entries(imagePaths);
    let completed = 0;
    let failed = 0;

    await Promise.all(entries.map(async ([name, path]) => {
      const loaded = await loadImage(name, path);
      completed += 1;
      if (!loaded) failed += 1;
      ui.loadStatus.textContent = `Recursos ${completed}/${entries.length}`;
    }));

    unlockStart(failed > 0);
  }

  // Algunos WebViews dejan solicitudes suspendidas. Los gráficos de respaldo
  // permiten jugar aunque eso ocurra, así que la portada nunca queda bloqueada.
  setTimeout(() => unlockStart(true), isInAppBrowser ? 2200 : 7200);

  // ---------------------------
  // Entrada: teclado y táctil
  // ---------------------------

  const input = {
    down: new Set(),
    pressed: new Set()
  };

  function normalizeKey(key) {
    if (key.length === 1) return key.toLowerCase();
    return key;
  }

  function pressKey(rawKey) {
    const key = normalizeKey(rawKey);
    if (!input.down.has(key)) input.pressed.add(key);
    input.down.add(key);
  }

  function releaseKey(rawKey) {
    input.down.delete(normalizeKey(rawKey));
  }

  window.addEventListener("keydown", (event) => {
    const key = normalizeKey(event.key);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d", "z", "x", "e"].includes(key)) {
      event.preventDefault();
    }
    pressKey(key);
  });

  window.addEventListener("keyup", (event) => releaseKey(event.key));
  window.addEventListener("blur", () => {
    input.down.clear();
    input.pressed.clear();
  });

  // Los botones A/B conservan pulsación independiente para permitir atacar al caminar.
  document.querySelectorAll(".action-button[data-key]").forEach((button) => {
    const key = button.dataset.key;

    const start = (event) => {
      event.preventDefault();
      if (event.pointerId != null) button.setPointerCapture?.(event.pointerId);
      button.classList.add("active");
      pressKey(key);
    };

    const end = (event) => {
      event.preventDefault();
      button.classList.remove("active");
      releaseKey(key);
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("lostpointercapture", end);
    button.addEventListener("contextmenu", (event) => event.preventDefault());

    if (!("PointerEvent" in window)) {
      button.addEventListener("touchstart", start, { passive: false });
      button.addEventListener("touchend", end, { passive: false });
      button.addEventListener("touchcancel", end, { passive: false });
    }
  });

  // Joystick táctil: todo el círculo responde y permite movimiento diagonal.
  const dpad = document.getElementById("dpad");
  const joystickKnob = dpad.querySelector(".dpad-center");
  const joystickButtons = [...dpad.querySelectorAll("[data-key]")];
  const joystickKeys = new Set();
  const joystickVector = { x: 0, y: 0, active: false };
  let joystickPointerId = null;

  function releaseJoystickKeys() {
    joystickKeys.forEach((key) => releaseKey(key));
    joystickKeys.clear();
    joystickButtons.forEach((button) => button.classList.remove("active"));
    joystickVector.x = 0;
    joystickVector.y = 0;
    joystickVector.active = false;
  }

  function applyJoystickDirection(event) {
    const rect = dpad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
    const distance = Math.hypot(rawX, rawY);
    const maxTravel = radius * 0.34;
    const scale = distance > maxTravel ? maxTravel / distance : 1;
    const visualX = rawX * scale;
    const visualY = rawY * scale;
    const deadZone = radius * 0.18;
    const nextKeys = new Set();

    if (distance > deadZone) {
      const absX = Math.abs(rawX);
      const absY = Math.abs(rawY);
      const diagonalThreshold = 0.72;
      const inputStrength = Math.min(1, Math.max(0.32, (distance - deadZone) / (radius - deadZone)));

      if (absX >= absY && absY / Math.max(1, absX) <= diagonalThreshold) {
        joystickVector.x = Math.sign(rawX) * inputStrength;
        joystickVector.y = 0;
        nextKeys.add(rawX < 0 ? "ArrowLeft" : "ArrowRight");
      } else if (absY > absX && absX / Math.max(1, absY) <= diagonalThreshold) {
        joystickVector.x = 0;
        joystickVector.y = Math.sign(rawY) * inputStrength;
        nextKeys.add(rawY < 0 ? "ArrowUp" : "ArrowDown");
      } else {
        joystickVector.x = Math.sign(rawX) * Math.SQRT1_2 * inputStrength;
        joystickVector.y = Math.sign(rawY) * Math.SQRT1_2 * inputStrength;
        nextKeys.add(rawX < 0 ? "ArrowLeft" : "ArrowRight");
        nextKeys.add(rawY < 0 ? "ArrowUp" : "ArrowDown");
      }
      joystickVector.active = true;
    } else {
      joystickVector.x = 0;
      joystickVector.y = 0;
      joystickVector.active = false;
    }

    joystickKeys.forEach((key) => {
      if (!nextKeys.has(key)) releaseKey(key);
    });
    nextKeys.forEach((key) => {
      if (!joystickKeys.has(key)) pressKey(key);
    });
    joystickKeys.clear();
    nextKeys.forEach((key) => joystickKeys.add(key));
    joystickButtons.forEach((button) => {
      button.classList.toggle("active", joystickKeys.has(button.dataset.key));
    });
    joystickKnob.style.transform = `translate(${visualX}px, ${visualY}px)`;
  }

  function endJoystick(event) {
    if (joystickPointerId !== null && event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    releaseJoystickKeys();
    joystickKnob.style.transform = "translate(0, 0)";
    dpad.classList.remove("joystick-active");
    joystickPointerId = null;
  }

  dpad.addEventListener("pointerdown", (event) => {
    if (joystickPointerId !== null) return;
    event.preventDefault();
    joystickPointerId = event.pointerId;
    dpad.setPointerCapture?.(event.pointerId);
    dpad.classList.add("joystick-active");
    applyJoystickDirection(event);
  });
  dpad.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickPointerId) applyJoystickDirection(event);
  });
  dpad.addEventListener("pointerup", endJoystick);
  dpad.addEventListener("pointercancel", endJoystick);
  dpad.addEventListener("lostpointercapture", endJoystick);
  dpad.addEventListener("contextmenu", (event) => event.preventDefault());

  if (!("PointerEvent" in window)) {
    let legacyTouchId = null;
    const changedTouch = (event) => Array.from(event.changedTouches)
      .find((touch) => touch.identifier === legacyTouchId) || event.changedTouches[0];
    dpad.addEventListener("touchstart", (event) => {
      if (legacyTouchId !== null) return;
      event.preventDefault();
      const touch = event.changedTouches[0];
      legacyTouchId = touch.identifier;
      dpad.classList.add("joystick-active");
      applyJoystickDirection(touch);
    }, { passive: false });
    dpad.addEventListener("touchmove", (event) => {
      if (legacyTouchId === null) return;
      event.preventDefault();
      applyJoystickDirection(changedTouch(event));
    }, { passive: false });
    const endLegacyTouch = (event) => {
      if (legacyTouchId === null) return;
      event.preventDefault();
      releaseJoystickKeys();
      joystickKnob.style.transform = "translate(0, 0)";
      dpad.classList.remove("joystick-active");
      legacyTouchId = null;
    };
    dpad.addEventListener("touchend", endLegacyTouch, { passive: false });
    dpad.addEventListener("touchcancel", endLegacyTouch, { passive: false });
  }
  window.addEventListener("blur", () => {
    releaseJoystickKeys();
    joystickKnob.style.transform = "translate(0, 0)";
    dpad.classList.remove("joystick-active");
    joystickPointerId = null;
  });

  function isDown(...keys) {
    return keys.some((key) => input.down.has(key));
  }

  function wasPressed(...keys) {
    return keys.some((key) => input.pressed.has(key));
  }

  // ---------------------------
  // Música y discos
  // ---------------------------

  const discs = {
    ready: {
      id: "ready",
      title: "CAPARROSO — READY",
      shortTitle: "Ready",
      room: 3.5,
      x: 320,
      y: 170,
      audio: document.getElementById("audio-ready")
    },
    phantoms: {
      id: "phantoms",
      title: "CAPARROSO — PHANTOMS",
      shortTitle: "Phantoms",
      room: 7,
      x: 520,
      y: 83,
      audio: document.getElementById("audio-phantoms")
    },
    dk: {
      id: "dk",
      title: "CAPARROSO — DK (Y2K)",
      shortTitle: "DK (Y2K)",
      room: 11,
      x: 520,
      y: 238,
      audio: document.getElementById("audio-dk")
    }
  };

  const music = {
    currentDisc: null,
    collected: new Set(),
    modalDisc: null
  };

  const ambience = {
    tracks: [
      document.getElementById("ambience-a"),
      document.getElementById("ambience-b")
    ],
    activeIndex: 0,
    started: false,
    crossfading: false,
    crossfadeTime: 0,
    crossfadeDuration: 0.32,
    baseVolume: 0.48,
    suspendedForDisc: false
  };
  let pageAudioSuspended = document.hidden;

  Object.values(discs).forEach((disc) => {
    disc.audio.volume = 0.78;
  });

  ambience.tracks.forEach((track) => {
    track.loop = true; // Respaldo si un navegador bloquea el segundo reproductor.
    track.volume = 0;
  });

  function discMusicIsPlaying() {
    return Object.values(discs).some((disc) => !disc.audio.paused);
  }

  async function startAmbience() {
    if (ambience.started) return;
    ambience.started = true;
    const active = ambience.tracks[ambience.activeIndex];
    active.currentTime = 0;
    active.muted = false;
    active.volume = ambience.baseVolume;
    try {
      await active.play();
    } catch {
      ambience.started = false;
    }
  }

  function updateAmbience(dt) {
    if (!ambience.started) return;

    if (discMusicIsPlaying()) {
      pauseAmbienceForDisc();
      return;
    }
    if (ambience.suspendedForDisc) {
      resumeAmbienceAfterDisc();
      return;
    }

    const targetVolume = ambience.baseVolume;
    const active = ambience.tracks[ambience.activeIndex];
    const standbyIndex = 1 - ambience.activeIndex;
    const standby = ambience.tracks[standbyIndex];

    if (!ambience.crossfading) {
      active.volume += (targetVolume - active.volume) * Math.min(1, dt * 7);
      const remaining = active.duration - active.currentTime;
      if (Number.isFinite(remaining) && remaining <= ambience.crossfadeDuration + 0.08) {
        ambience.crossfading = true;
        ambience.crossfadeTime = 0;
        standby.currentTime = 0;
        standby.volume = 0;
        standby.play().catch(() => {
          ambience.crossfading = false;
        });
      }
      return;
    }

    ambience.crossfadeTime += dt;
    const mix = Math.min(1, ambience.crossfadeTime / ambience.crossfadeDuration);
    active.volume = targetVolume * (1 - mix);
    standby.volume = targetVolume * mix;

    if (mix >= 1) {
      active.pause();
      active.currentTime = 0;
      active.volume = 0;
      ambience.activeIndex = standbyIndex;
      ambience.crossfading = false;
      ambience.crossfadeTime = 0;
    }
  }

  function loadCollection() {
    try {
      const saved = JSON.parse(localStorage.getItem("diamaDungeonDiscs") || "[]");
      if (Array.isArray(saved)) {
        saved.filter((id) => discs[id]).forEach((id) => music.collected.add(id));
      }
    } catch {
      music.collected.clear();
    }
    updateDiscHud();
  }

  function saveCollection() {
    try {
      localStorage.setItem("diamaDungeonDiscs", JSON.stringify([...music.collected]));
    } catch {
      // El juego sigue funcionando si el navegador bloquea localStorage.
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  }

  function stopOtherTracks(exceptAudio) {
    Object.values(discs).forEach((disc) => {
      if (disc.audio !== exceptAudio) disc.audio.pause();
    });
  }

  function pauseAmbienceForDisc() {
    if (!ambience.started) return;
    if (ambience.crossfading
      && ambience.crossfadeTime >= ambience.crossfadeDuration / 2) {
      ambience.activeIndex = 1 - ambience.activeIndex;
    }
    ambience.crossfading = false;
    ambience.crossfadeTime = 0;
    ambience.suspendedForDisc = true;
    ambience.tracks.forEach((track) => {
      track.muted = true;
      track.volume = 0;
      track.pause();
    });
  }

  async function resumeAmbienceAfterDisc() {
    if (pageAudioSuspended
      || !ambience.started
      || discMusicIsPlaying()
      || !ambience.suspendedForDisc) return;
    ambience.suspendedForDisc = false;
    const active = ambience.tracks[ambience.activeIndex];
    ambience.tracks.forEach((track, index) => {
      track.muted = false;
      track.volume = index === ambience.activeIndex ? ambience.baseVolume : 0;
    });
    try {
      await active.play();
    } catch {
      ambience.suspendedForDisc = true;
    }
  }

  function suspendAllAudioForPage() {
    pageAudioSuspended = true;
    clearTimeout(playerCollapseTimer);
    Object.values(discs).forEach((disc) => disc.audio.pause());
    if (!ambience.started) return;
    ambience.suspendedForDisc = true;
    ambience.crossfading = false;
    ambience.crossfadeTime = 0;
    ambience.tracks.forEach((track) => {
      track.muted = true;
      track.volume = 0;
      track.pause();
    });
  }

  function restorePageAudio() {
    if (document.hidden) return;
    pageAudioSuspended = false;
    resumeAmbienceAfterDisc();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspendAllAudioForPage();
    else restorePageAudio();
  });
  window.addEventListener("pagehide", suspendAllAudioForPage);
  window.addEventListener("pageshow", restorePageAudio);

  let playerCollapseTimer = null;
  const compactPlayer = window.matchMedia("(max-width: 900px), (max-height: 570px)");

  function setPlayerCollapsed(collapsed) {
    ui.nowPlaying.classList.toggle("collapsed", collapsed);
    ui.playerCollapse.textContent = collapsed ? "⌃" : "⌄";
    ui.playerCollapse.setAttribute(
      "aria-label",
      collapsed ? "Abrir reproductor" : "Minimizar reproductor"
    );
  }

  function schedulePlayerCollapse(delay = 4800) {
    clearTimeout(playerCollapseTimer);
    if (!compactPlayer.matches) return;
    playerCollapseTimer = setTimeout(() => setPlayerCollapsed(true), delay);
  }

  async function playDisc(discId) {
    const disc = discs[discId];
    if (!disc) return;

    pauseAmbienceForDisc();
    stopOtherTracks(disc.audio);
    music.currentDisc = disc;
    ui.nowPlaying.classList.remove("hidden");
    setPlayerCollapsed(false);
    schedulePlayerCollapse();
    ui.trackTitle.textContent = disc.title;

    try {
      await disc.audio.play();
      updatePlayerUi();
    } catch {
      resumeAmbienceAfterDisc();
      showToast("El navegador bloqueó el audio. Pulsa ▶ para reproducir.");
      updatePlayerUi();
    }
  }

  function toggleCurrentTrack() {
    if (!music.currentDisc) return;
    const audio = music.currentDisc.audio;
    if (audio.paused) {
      playDisc(music.currentDisc.id);
    } else {
      audio.pause();
      updatePlayerUi();
    }
  }

  function seekCurrentTrack(seconds) {
    if (!music.currentDisc) return;
    const audio = music.currentDisc.audio;
    const target = Math.max(0, audio.currentTime + seconds);
    audio.currentTime = Number.isFinite(audio.duration) ? Math.min(audio.duration, target) : target;
    updatePlayerUi();
  }

  function selectCollectedDisc(offset) {
    const available = Object.keys(discs).filter((id) => music.collected.has(id));
    if (!available.length) return;
    const currentIndex = Math.max(0, available.indexOf(music.currentDisc?.id));
    const nextIndex = (currentIndex + offset + available.length) % available.length;
    playDisc(available[nextIndex]);
  }

  function updatePlayerUi() {
    if (!music.currentDisc) return;
    const audio = music.currentDisc.audio;
    ui.playerToggle.textContent = audio.paused ? "▶" : "Ⅱ";
    ui.trackStatus.textContent = audio.paused ? "En pausa" : "Reproduciendo";
    ui.trackCurrent.textContent = formatTime(audio.currentTime);
    ui.trackDuration.textContent = formatTime(audio.duration);
    const progress = Number.isFinite(audio.duration) && audio.duration > 0
      ? (audio.currentTime / audio.duration) * 100
      : 0;
    const safeProgress = Math.min(100, Math.max(0, progress));
    ui.trackSeek.value = String(Math.round(safeProgress * 10));
    ui.trackSeek.style.setProperty("--seek-progress", `${safeProgress}%`);
    ui.trackPlay.textContent = audio.paused ? "▶" : "Ⅱ";
  }

  Object.values(discs).forEach((disc) => {
    disc.audio.addEventListener("timeupdate", updatePlayerUi);
    disc.audio.addEventListener("loadedmetadata", updatePlayerUi);
    disc.audio.addEventListener("play", () => {
      pauseAmbienceForDisc();
      updatePlayerUi();
    });
    disc.audio.addEventListener("playing", pauseAmbienceForDisc);
    disc.audio.addEventListener("pause", () => {
      updatePlayerUi();
      setTimeout(resumeAmbienceAfterDisc, 0);
    });
    disc.audio.addEventListener("ended", () => {
      updatePlayerUi();
      setTimeout(resumeAmbienceAfterDisc, 0);
    });
  });

  ui.playerToggle.addEventListener("click", toggleCurrentTrack);
  ui.trackPlay.addEventListener("click", toggleCurrentTrack);
  ui.trackBack.addEventListener("click", () => seekCurrentTrack(-10));
  ui.trackForward.addEventListener("click", () => seekCurrentTrack(10));
  ui.trackPrevious.addEventListener("click", () => selectCollectedDisc(-1));
  ui.trackNext.addEventListener("click", () => selectCollectedDisc(1));
  ui.trackSeek.addEventListener("input", () => {
    if (!music.currentDisc) return;
    const audio = music.currentDisc.audio;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(ui.trackSeek.value) / 1000) * audio.duration;
    updatePlayerUi();
  });
  ui.playerCollapse.addEventListener("click", (event) => {
    event.stopPropagation();
    clearTimeout(playerCollapseTimer);
    setPlayerCollapsed(!ui.nowPlaying.classList.contains("collapsed"));
  });
  ui.nowPlaying.addEventListener("click", (event) => {
    if (!ui.nowPlaying.classList.contains("collapsed")) return;
    if (event.target === ui.playerToggle || event.target === ui.playerCollapse) return;
    setPlayerCollapsed(false);
    schedulePlayerCollapse(7000);
  });
  ui.nowPlaying.addEventListener("pointerdown", () => clearTimeout(playerCollapseTimer));
  ui.nowPlaying.addEventListener("pointerup", () => {
    if (!ui.nowPlaying.classList.contains("collapsed")) schedulePlayerCollapse(7000);
  });

  function discoverDisc(disc) {
    const isNew = !music.collected.has(disc.id);
    if (!isNew) {
      if (music.currentDisc?.id === disc.id) toggleCurrentTrack();
      else playDisc(disc.id);
      return;
    }

    music.collected.add(disc.id);
    saveCollection();
    updateDiscHud();
    music.modalDisc = disc;
    game.modalPause = true;
    ui.discModalTitle.textContent = disc.title;
    ui.discModalLocation.textContent = `ARCHIVO ${String(music.collected.size).padStart(2, "0")}/03`;
    ui.discModal.classList.remove("hidden");
  }

  ui.discPlayButton.addEventListener("click", () => {
    if (music.modalDisc) playDisc(music.modalDisc.id);
    ui.discModal.classList.add("hidden");
    game.modalPause = false;
  });

  ui.discCloseButton.addEventListener("click", () => {
    ui.discModal.classList.add("hidden");
    game.modalPause = false;
  });

  function closeCredits() {
    ui.creditsModal.classList.add("hidden");
    game.modalPause = false;
    showToast("Créditos desbloqueados · gracias por jugar.", 2600);
  }

  ui.creditsCloseButton.addEventListener("click", closeCredits);
  ui.creditsXButton.addEventListener("click", closeCredits);

  // ---------------------------
  // Configuración del mapa
  // ---------------------------

  const enemyTypes = {
    slime: { sprite: "slime", frames: 6, hp: 2, speed: 42, damage: 1, size: 28 },
    bat: { sprite: "bat", frames: 5, hp: 2, speed: 56, damage: 1, size: 27 },
    spider: { sprite: "spider", frames: 4, hp: 3, speed: 50, damage: 1, size: 29 },
    phantom: { sprite: "phantom", frames: 6, hp: 4, speed: 43, damage: 1, size: 31 },
    bomberplant: { sprite: "bomberplant", frames: 5, hp: 3, speed: 38, damage: 1, size: 31 }
  };

  const rooms = {
    1: {
      id: 1,
      name: "CUARTO 1 · ENTRADA",
      subtitle: "DIAMA ROOM",
      doors: { N: 4, W: 2, E: 3 },
      enemies: [],
      obstacles: []
    },
    2: {
      id: 2,
      name: "CUARTO 2 · NÚCLEOS",
      subtitle: "ENERGY STORAGE",
      doors: { E: 1 },
      enemies: [
        { type: "bat", x: 140, y: 84 },
        { type: "bat", x: 470, y: 220 },
        { type: "bat", x: 330, y: 82 }
      ],
      obstacles: [],
      puzzle: "push"
    },
    3: {
      id: 3,
      name: "CUARTO 3 · CRISTALES",
      subtitle: "DIAMA CRYSTAL SEQUENCE",
      doors: { W: 1, N: 3.5 },
      enemies: [
        { type: "slime", x: 175, y: 112 },
        { type: "slime", x: 450, y: 228 }
      ],
      obstacles: [
        { x: 210, y: 148, w: 48, h: 46 },
        { x: 382, y: 148, w: 48, h: 46 }
      ],
      puzzle: "crystals"
    },
    3.5: {
      id: 3.5,
      name: "CUARTO 3.5 · READY",
      subtitle: "DIAMA SECRET ROOM",
      doors: { S: 3 },
      enemies: [],
      obstacles: []
    },
    4: {
      id: 4,
      name: "CUARTO 4 · UPLINK",
      subtitle: "DIAMA UPLINK",
      doors: { S: 1, N: 5 },
      enemies: [
        { type: "slime", x: 320, y: 105 }
      ],
      obstacles: [
        { x: 250, y: 165, w: 140, h: 40 }
      ]
    },
    5: {
      id: 5,
      name: "CUARTO 5 · CIRCUITO",
      subtitle: "DIAMA LIGHT ROUTER",
      doors: { S: 4, W: 6 },
      forwardDoor: "W",
      enemies: [
        { type: "slime", x: 145, y: 90 },
        { type: "slime", x: 485, y: 92 }
      ],
      obstacles: [
        { x: 260, y: 92, w: 36, h: 36 },
        { x: 344, y: 232, w: 36, h: 36 }
      ],
      puzzle: "circuit"
    },
    6: {
      id: 6,
      name: "CUARTO 6 · VUELO",
      subtitle: "DIAMA SKY ROOM",
      doors: { E: 5, N: 7 },
      enemies: [
        { type: "bat", x: 145, y: 75 },
        { type: "bat", x: 495, y: 85 },
        { type: "bat", x: 320, y: 178 }
      ],
      obstacles: []
    },
    7: {
      id: 7,
      name: "CUARTO 7 · MEMORIA",
      subtitle: "DIAMA MEMORY ROOM",
      doors: { S: 6, E: 8 },
      forwardDoor: "E",
      enemies: [
        { type: "spider", x: 170, y: 110 },
        { type: "spider", x: 455, y: 210 }
      ],
      obstacles: [],
      puzzle: "memory"
    },
    8: {
      id: 8,
      name: "CUARTO 8 · JARDÍN",
      subtitle: "DIAMA GARDEN",
      doors: { W: 7, E: 9 },
      enemies: [
        { type: "spider", x: 225, y: 95 },
        { type: "spider", x: 430, y: 225 }
      ],
      obstacles: [
        { x: 110, y: 92, w: 54, h: 54 },
        { x: 476, y: 214, w: 54, h: 54 }
      ]
    },
    9: {
      id: 9,
      name: "CUARTO 9 · REACTOR",
      subtitle: "DIAMA REACTOR",
      doors: { W: 8, E: 10 },
      enemies: [
        { type: "bomberplant", x: 175, y: 82 },
        { type: "bomberplant", x: 465, y: 82 },
        { type: "bomberplant", x: 320, y: 238 }
      ],
      obstacles: [
        { x: 286, y: 124, w: 68, h: 68 }
      ]
    },
    10: {
      id: 10,
      name: "CUARTO 10 · SEÑAL PHANTOM",
      subtitle: "DIAMA PHANTOM SIGNAL",
      doors: { W: 9, N: 11 },
      forwardDoor: "N",
      enemies: [
        { type: "phantom", x: 155, y: 95 },
        { type: "phantom", x: 470, y: 220 }
      ],
      obstacles: [],
      puzzle: "phantomSignal"
    },
    11: {
      id: 11,
      name: "CUARTO 11 · FRECUENCIA",
      subtitle: "DIAMA FREQUENCY TUNER",
      doors: { S: 10, E: 12 },
      forwardDoor: "E",
      enemies: [
        { type: "bomberplant", x: 185, y: 82 },
        { type: "phantom", x: 410, y: 205 }
      ],
      obstacles: [],
      puzzle: "tuner"
    },
    12: {
      id: 12,
      name: "CUARTO 12 · TESORO",
      subtitle: "DIAMA PENTHOUSE ARCHIVE",
      doors: { W: 11 },
      enemies: [],
      obstacles: []
    }
  };

  const puzzleState = {
    push: {
      completed: false,
      blocks: [
        { x: 215, y: 91, w: 30, h: 30 },
        { x: 320, y: 198, w: 30, h: 30 },
        { x: 425, y: 91, w: 30, h: 30 }
      ],
      pads: [
        { x: 130, y: 92, r: 22 },
        { x: 320, y: 88, r: 22 },
        { x: 510, y: 92, r: 22 }
      ],
      keyCollected: false
    },
    crystals: {
      completed: false,
      step: 0,
      consumed: new Set(),
      order: [2, 4, 0, 3, 1],
      symbols: ["○", "△", "□", "✦", "◇"],
      positions: [
        { x: 120, y: 92 },
        { x: 520, y: 92 },
        { x: 125, y: 246 },
        { x: 515, y: 246 },
        { x: 320, y: 115 }
      ]
    },
    circuit: {
      completed: false,
      nodes: [
        { x: 170, y: 103, orientation: 0, target: 1 },
        { x: 320, y: 178, orientation: 0, target: 2 },
        { x: 470, y: 103, orientation: 0, target: 3 },
        { x: 320, y: 275, orientation: 0, target: 1 }
      ]
    },
    memory: {
      completed: false,
      phase: "waiting",
      sequence: [0, 3, 1, 2, 0],
      step: 0,
      previewIndex: -1,
      previewTimer: 0,
      lastTile: -1,
      tiles: [
        { x: 232, y: 115, w: 72, h: 72 },
        { x: 336, y: 115, w: 72, h: 72 },
        { x: 232, y: 219, w: 72, h: 72 },
        { x: 336, y: 219, w: 72, h: 72 }
      ]
    },
    phantomSignal: {
      completed: false,
      step: 0,
      order: [2, 0, 3, 1, 2],
      symbols: ["◇", "○", "△", "✦"],
      positions: [
        { x: 170, y: 220 },
        { x: 270, y: 120 },
        { x: 370, y: 120 },
        { x: 470, y: 220 }
      ]
    },
    tuner: {
      completed: false,
      controls: [
        { x: 220, y: 205, value: 0, target: 3 },
        { x: 320, y: 205, value: 0, target: 1 },
        { x: 420, y: 205, value: 0, target: 4 }
      ]
    }
  };

  const roomProgress = {};
  Object.keys(rooms).forEach((id) => {
    roomProgress[id] = {
      enemiesCleared: rooms[id].enemies.length === 0,
      heartCollected: false
    };
  });

  // Corazones garantizados para equilibrar el recorrido.
  // Cada cápsula restaura un punto y permanece en el mapa si el jugador está lleno.
  const healingPickups = {
    4: { x: 118, y: 94, amount: 1 },
    6: { x: 510, y: 255, amount: 1 },
    8: { x: 320, y: 178, amount: 1 },
    10: { x: 92, y: 258, amount: 1 }
  };

  // Ocho fragmentos animados, uno por cada crédito de Team DIAMA.
  const fragments = [
    { id: "fragment-01", room: 1, x: 92, y: 252, collected: false },
    { id: "fragment-02", room: 2, x: 542, y: 254, collected: false },
    { id: "fragment-03", room: 4, x: 520, y: 88, collected: false },
    { id: "fragment-04", room: 5, x: 88, y: 262, collected: false },
    { id: "fragment-05", room: 6, x: 112, y: 250, collected: false },
    { id: "fragment-06", room: 8, x: 548, y: 92, collected: false },
    { id: "fragment-07", room: 9, x: 92, y: 262, collected: false },
    { id: "fragment-08", room: 11, x: 105, y: 88, collected: false }
  ];

  const game = {
    started: false,
    modalPause: false,
    currentRoomId: 1,
    activeEnemies: [],
    activeObstacles: [],
    lockedMainDoor: true,
    creditsShown: false,
    toastTimer: null,
    doorToastCooldown: 0,
    time: 0,
    checkpoint: { roomId: 1, enteringFrom: "S" },
    chest: {
      x: 304,
      y: 145,
      w: 38,
      h: 38,
      opening: false,
      open: false,
      frame: 0,
      timer: 0
    }
  };

  const player = {
    x: 310,
    y: 286,
    w: 20,
    h: 22,
    speed: 142,
    direction: "up",
    moving: false,
    attacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    attackHitIds: new Set(),
    hp: MAX_HP,
    keys: 0,
    dead: false,
    invulnerable: 0,
    frame: 0,
    animationTimer: 0
  };

  // ---------------------------
  // Utilidades
  // ---------------------------

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
  }

  function distanceBetween(aX, aY, bX, bY) {
    return Math.hypot(aX - bX, aY - bY);
  }

  function playerCenter() {
    return { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  }

  function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function showToast(message, duration = 2200) {
    clearTimeout(game.toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    game.toastTimer = setTimeout(() => ui.toast.classList.remove("show"), duration);
  }

  function updateHud() {
    const hp = Math.max(0, Math.min(MAX_HP, player.hp));
    ui.hearts.textContent = `${"♥ ".repeat(hp)}${"♡ ".repeat(MAX_HP - hp)}`.trim();
    ui.keyCount.textContent = `◇ ${player.keys}`;
    updateDiscHud();
    updateFragmentHud();
  }

  function updateDiscHud() {
    ui.discCount.textContent = `◉ ${music.collected.size}/3`;
  }

  function updateFragmentHud() {
    const collected = fragments.filter((fragment) => fragment.collected).length;
    ui.fragmentCount.textContent = `✦ ${collected}/${fragments.length}`;
  }

  function currentRoom() {
    return rooms[game.currentRoomId];
  }

  function puzzleComplete(type) {
    return !type || puzzleState[type]?.completed;
  }

  function roomIsClear() {
    return game.activeEnemies.length === 0;
  }

  function allModalLayersClosed() {
    return ui.deathModal.classList.contains("hidden")
      && ui.discModal.classList.contains("hidden")
      && ui.creditsModal.classList.contains("hidden")
      && ui.revealModal.classList.contains("hidden");
  }

  // ---------------------------
  // Carga y transición de cuartos
  // ---------------------------

  function spawnEnemies(room) {
    if (roomProgress[room.id].enemiesCleared) return [];
    return room.enemies.map((source, index) => {
      const config = enemyTypes[source.type];
      return {
        id: `${room.id}-${index}`,
        type: source.type,
        x: source.x,
        y: source.y,
        w: config.size,
        h: config.size,
        hp: config.hp,
        cooldown: 0,
        invulnerable: 0,
        hitFlash: 0,
        frame: 0,
        animationTimer: 0
      };
    });
  }

  function loadRoom(roomId, enteringFrom = "S") {
    game.currentRoomId = roomId;
    game.checkpoint = { roomId, enteringFrom };
    const room = currentRoom();
    game.activeEnemies = spawnEnemies(room);
    game.activeObstacles = room.obstacles.map((obstacle) => ({ ...obstacle }));
    ui.zoneTitle.textContent = room.name;

    const spawnMargin = WALL + 12;
    if (enteringFrom === "N") {
      player.x = WIDTH / 2 - player.w / 2;
      player.y = spawnMargin;
    } else if (enteringFrom === "S") {
      player.x = WIDTH / 2 - player.w / 2;
      player.y = HEIGHT - spawnMargin - player.h;
    } else if (enteringFrom === "W") {
      player.x = spawnMargin;
      player.y = HEIGHT / 2 - player.h / 2;
    } else if (enteringFrom === "E") {
      player.x = WIDTH - spawnMargin - player.w;
      player.y = HEIGHT / 2 - player.h / 2;
    }

    if (room.id === 7 && roomIsClear() && !puzzleState.memory.completed && puzzleState.memory.phase === "waiting") {
      startMemoryPreview();
    }

    input.down.clear();
    input.pressed.clear();
    showToast(room.subtitle, 1300);
  }

  function oppositeDirection(direction) {
    return { N: "S", S: "N", W: "E", E: "W" }[direction];
  }

  function doorTarget(direction) {
    const room = currentRoom();
    if (room.id === 3 && direction === "N" && !puzzleState.crystals.completed) return null;
    return room.doors[direction] ?? null;
  }

  function doorVisualState(direction) {
    const target = doorTarget(direction);
    if (target == null) return "hidden";
    if (!roomIsClear()) return "enemies";

    const room = currentRoom();
    if (room.id === 1 && direction === "N" && game.lockedMainDoor) {
      return player.keys > 0 ? "key-ready" : "locked";
    }

    if (room.forwardDoor === direction && !puzzleComplete(room.puzzle)) return "puzzle";
    return "open";
  }

  function canUseDoor(direction) {
    const state = doorVisualState(direction);
    if (state === "open") return true;

    if (state === "key-ready") {
      player.keys -= 1;
      game.lockedMainDoor = false;
      updateHud();
      showToast("Puerta principal desbloqueada.");
      return true;
    }

    if (game.doorToastCooldown <= 0) {
      if (state === "locked") showToast("Necesitas la llave de los Núcleos.");
      else if (state === "enemies") showToast("Elimina a los enemigos para liberar las puertas.");
      else if (state === "puzzle") showToast("Completa el puzle para abrir este canal.");
      game.doorToastCooldown = 1.1;
    }
    return false;
  }

  function transitionRoom(direction) {
    const target = doorTarget(direction);
    if (target == null || !canUseDoor(direction)) return false;
    loadRoom(target, oppositeDirection(direction));
    return true;
  }

  function alignedWithDoor(direction, rect) {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    if (direction === "N" || direction === "S") {
      return Math.abs(centerX - WIDTH / 2) < DOOR_SIZE / 2 - 5;
    }
    return Math.abs(centerY - HEIGHT / 2) < DOOR_SIZE / 2 - 5;
  }

  // ---------------------------
  // Colisiones y movimiento
  // ---------------------------

  function staticCollision(rect, ignoreBlock = null) {
    for (const obstacle of game.activeObstacles) {
      if (rectsOverlap(rect, obstacle)) return true;
    }

    if (game.currentRoomId === 2 && !puzzleState.push.completed) {
      for (const block of puzzleState.push.blocks) {
        if (block !== ignoreBlock && rectsOverlap(rect, block)) return true;
      }
    }

    for (const object of physicalObjectBlockers()) {
      if (rectsOverlap(rect, object)) return true;
    }

    return false;
  }

  function physicalObjectBlockers() {
    const blockers = [];
    const addCentered = (x, y, w, h = w) => blockers.push({
      x: x - w / 2,
      y: y - h / 2,
      w,
      h
    });

    if (game.currentRoomId === 2 && puzzleState.push.completed && !puzzleState.push.keyCollected) {
      addCentered(320, 178, 22);
    }

    if (game.currentRoomId === 3 && !puzzleState.crystals.completed) {
      puzzleState.crystals.positions.forEach((position, index) => {
        if (!puzzleState.crystals.consumed.has(index)) addCentered(position.x, position.y, 24, 30);
      });
    }

    const healing = healingPickups[game.currentRoomId];
    if (healing && !roomProgress[game.currentRoomId].heartCollected) {
      addCentered(healing.x, healing.y, 22);
    }

    const fragment = fragments.find((item) => item.room === game.currentRoomId && !item.collected);
    if (fragment) addCentered(fragment.x, fragment.y, 22);

    const disc = availableDiscInRoom();
    if (disc) addCentered(disc.x, disc.y, 34);

    if (game.currentRoomId === 12) {
      blockers.push({ x: game.chest.x, y: game.chest.y, w: game.chest.w, h: game.chest.h });
    }

    return blockers;
  }

  function insideRoomForEnemy(rect) {
    return rect.x >= WALL
      && rect.y >= WALL
      && rect.x + rect.w <= WIDTH - WALL
      && rect.y + rect.h <= HEIGHT - WALL;
  }

  function tryPushBlock(block, axis, amount) {
    const candidate = { ...block };
    candidate[axis] += amount;
    const padding = 3;
    const inside = candidate.x >= WALL + padding
      && candidate.y >= WALL + padding
      && candidate.x + candidate.w <= WIDTH - WALL - padding
      && candidate.y + candidate.h <= HEIGHT - WALL - padding;

    if (!inside || staticCollision(candidate, block)) return false;
    block[axis] += amount;
    checkPushPuzzle();
    return true;
  }

  function movePlayerAxis(axis, amount) {
    if (!amount) return;
    const candidate = {
      x: player.x,
      y: player.y,
      w: player.w,
      h: player.h
    };
    candidate[axis] += amount;

    let crossingDirection = null;
    if (candidate.y < WALL) crossingDirection = "N";
    else if (candidate.y + candidate.h > HEIGHT - WALL) crossingDirection = "S";
    else if (candidate.x < WALL) crossingDirection = "W";
    else if (candidate.x + candidate.w > WIDTH - WALL) crossingDirection = "E";

    if (crossingDirection) {
      if (!alignedWithDoor(crossingDirection, candidate) || doorTarget(crossingDirection) == null) return;

      const beyond = crossingDirection === "N"
        ? candidate.y < -player.h * 0.35
        : crossingDirection === "S"
          ? candidate.y + candidate.h > HEIGHT + player.h * 0.35
          : crossingDirection === "W"
            ? candidate.x < -player.w * 0.35
            : candidate.x + candidate.w > WIDTH + player.w * 0.35;

      if (!canUseDoor(crossingDirection)) return;
      if (beyond) {
        transitionRoom(crossingDirection);
        return;
      }
    }

    let collidedBlock = null;
    if (game.currentRoomId === 2 && !puzzleState.push.completed) {
      collidedBlock = puzzleState.push.blocks.find((block) => rectsOverlap(candidate, block)) || null;
    }

    if (collidedBlock) {
      if (!tryPushBlock(collidedBlock, axis, amount)) return;
    }

    const collisionWithoutBlocks = game.activeObstacles.some((obstacle) => rectsOverlap(candidate, obstacle));
    if (collisionWithoutBlocks) return;
    player[axis] += amount;
  }

  function updatePlayerMovement(dt) {
    let moveX = 0;
    let moveY = 0;
    if (joystickVector.active) {
      moveX = joystickVector.x;
      moveY = joystickVector.y;
    } else {
      if (isDown("ArrowUp", "w")) moveY -= 1;
      if (isDown("ArrowDown", "s")) moveY += 1;
      if (isDown("ArrowLeft", "a")) moveX -= 1;
      if (isDown("ArrowRight", "d")) moveX += 1;
    }

    const length = Math.hypot(moveX, moveY);
    player.moving = length > 0;
    if (!player.moving) return;

    const inputStrength = Math.min(1, length);
    moveX /= length;
    moveY /= length;

    if (Math.abs(moveX) > Math.abs(moveY)) player.direction = moveX > 0 ? "right" : "left";
    else player.direction = moveY > 0 ? "down" : "up";

    const attackMovement = player.attacking ? 0.72 : 1;
    const movement = player.speed * inputStrength * attackMovement * dt;
    movePlayerAxis("x", moveX * movement);
    movePlayerAxis("y", moveY * movement);
  }

  // ---------------------------
  // Combate
  // ---------------------------

  function attackHitbox() {
    const reach = 39;
    const sidePadding = 9;
    const box = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (player.direction === "up") {
      box.y -= reach;
      box.h += reach;
      box.x -= sidePadding;
      box.w += sidePadding * 2;
    } else if (player.direction === "down") {
      box.h += reach;
      box.x -= sidePadding;
      box.w += sidePadding * 2;
    } else if (player.direction === "left") {
      box.x -= reach;
      box.w += reach;
      box.y -= sidePadding;
      box.h += sidePadding * 2;
    } else {
      box.w += reach;
      box.y -= sidePadding;
      box.h += sidePadding * 2;
    }
    return box;
  }

  function applyAttackHits() {
    const hitbox = attackHitbox();
    game.activeEnemies.forEach((enemy) => {
      if (!player.attackHitIds.has(enemy.id) && rectsOverlap(hitbox, enemy)) {
        player.attackHitIds.add(enemy.id);
        enemy.hp -= 1;
        enemy.invulnerable = 0.22;
        enemy.hitFlash = 0.15;

        const p = playerCenter();
        const eX = enemy.x + enemy.w / 2;
        const eY = enemy.y + enemy.h / 2;
        const angle = Math.atan2(eY - p.y, eX - p.x);
        const pushed = {
          ...enemy,
          x: enemy.x + Math.cos(angle) * 24,
          y: enemy.y + Math.sin(angle) * 24
        };
        if (insideRoomForEnemy(pushed) && !game.activeObstacles.some((obstacle) => rectsOverlap(pushed, obstacle))) {
          enemy.x = pushed.x;
          enemy.y = pushed.y;
        }
      }
    });
  }

  function startAttack() {
    if (player.attacking || player.attackCooldown > 0) return;
    player.attacking = true;
    player.attackTimer = 0.3;
    player.attackCooldown = 0.32;
    player.attackHitIds.clear();
    player.frame = 0;
    applyAttackHits();
  }

  function damagePlayer(amount, source = null) {
    if (player.invulnerable > 0 || player.dead) return;
    player.hp -= amount;
    player.invulnerable = 1.25;

    if (source) {
      const p = playerCenter();
      const sourceX = source.x + source.w / 2;
      const sourceY = source.y + source.h / 2;
      const angle = Math.atan2(p.y - sourceY, p.x - sourceX);
      const pushed = {
        x: player.x + Math.cos(angle) * 24,
        y: player.y + Math.sin(angle) * 24,
        w: player.w,
        h: player.h
      };
      if (insideRoomForEnemy(pushed)
        && !game.activeObstacles.some((obstacle) => rectsOverlap(pushed, obstacle))) {
        player.x = pushed.x;
        player.y = pushed.y;
      }
    }
    updateHud();

    if (player.hp <= 0) {
      player.dead = true;
      game.modalPause = true;
      ui.deathModal.classList.remove("hidden");
    }
  }

  function updateEnemies(dt) {
    for (let index = game.activeEnemies.length - 1; index >= 0; index -= 1) {
      const enemy = game.activeEnemies[index];
      const config = enemyTypes[enemy.type];

      enemy.invulnerable = Math.max(0, enemy.invulnerable - dt);
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.animationTimer += dt;
      if (enemy.animationTimer >= 0.12) {
        enemy.animationTimer = 0;
        enemy.frame = (enemy.frame + 1) % config.frames;
      }

      if (enemy.hp <= 0) {
        game.activeEnemies.splice(index, 1);
        continue;
      }

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4 && distance < 175) {
        const move = config.speed * dt;
        const candidateX = { ...enemy, x: enemy.x + (dx / distance) * move };
        const candidateY = { ...enemy, y: enemy.y + (dy / distance) * move };

        if (insideRoomForEnemy(candidateX)
          && !game.activeObstacles.some((obstacle) => rectsOverlap(candidateX, obstacle))) {
          enemy.x = candidateX.x;
        }
        if (insideRoomForEnemy(candidateY)
          && !game.activeObstacles.some((obstacle) => rectsOverlap(candidateY, obstacle))) {
          enemy.y = candidateY.y;
        }
      }

      if (rectsOverlap(player, enemy) && enemy.cooldown <= 0) {
        damagePlayer(config.damage, enemy);
        enemy.cooldown = 1;
      }
    }

    if (game.activeEnemies.length === 0 && !roomProgress[game.currentRoomId].enemiesCleared) {
      roomProgress[game.currentRoomId].enemiesCleared = true;
      showToast("Canal despejado. Sistema de puzle disponible.");

      if (game.currentRoomId === 7 && !puzzleState.memory.completed) {
        startMemoryPreview();
      }
    }
  }

  function updateHealingPickup() {
    const pickup = healingPickups[game.currentRoomId];
    const progress = roomProgress[game.currentRoomId];
    if (!pickup || progress.heartCollected || player.hp >= MAX_HP) return;

    const center = playerCenter();
    if (distanceBetween(center.x, center.y, pickup.x, pickup.y) < 30) {
      progress.heartCollected = true;
      player.hp = Math.min(MAX_HP, player.hp + pickup.amount);
      updateHud();
      showToast(`Corazón DIAMA · +${pickup.amount} de energía`);
    }
  }

  function updateFragmentPickup() {
    const fragment = fragments.find((item) => item.room === game.currentRoomId && !item.collected);
    if (!fragment) return;

    const center = playerCenter();
    if (distanceBetween(center.x, center.y, fragment.x, fragment.y) >= 27) return;

    fragment.collected = true;
    const collected = fragments.filter((item) => item.collected).length;
    updateFragmentHud();
    showToast(`Fragmento DIAMA ${collected}/${fragments.length}`, 1800);

    if (collected === fragments.length && !game.creditsShown) {
      game.creditsShown = true;
      game.modalPause = true;
      ui.creditsModal.classList.remove("hidden");
    }
  }

  // ---------------------------
  // Puzles
  // ---------------------------

  function checkPushPuzzle() {
    const state = puzzleState.push;
    const everyPadCovered = state.pads.every((pad) => state.blocks.some((block) => {
      const blockX = block.x + block.w / 2;
      const blockY = block.y + block.h / 2;
      return distanceBetween(blockX, blockY, pad.x, pad.y) < pad.r;
    }));

    if (!state.completed && everyPadCovered) {
      state.completed = true;
      state.blocks.forEach((block) => {
        const nearest = state.pads.reduce((best, pad) => {
          const distance = distanceBetween(block.x + block.w / 2, block.y + block.h / 2, pad.x, pad.y);
          return !best || distance < best.distance ? { pad, distance } : best;
        }, null);
        if (nearest) {
          block.x = nearest.pad.x - block.w / 2;
          block.y = nearest.pad.y - block.h / 2;
        }
      });
      showToast("Núcleos sincronizados. ¡Apareció una llave!");
    }
  }

  function interactCrystal() {
    const state = puzzleState.crystals;
    if (state.completed || !roomIsClear()) return false;
    const center = playerCenter();
    const index = state.positions.findIndex((position, positionIndex) => (
      !state.consumed.has(positionIndex)
      && distanceBetween(center.x, center.y, position.x, position.y) < 42
    ));
    if (index < 0) return false;

    if (index === state.order[state.step]) {
      state.consumed.add(index);
      state.step += 1;
      if (state.step >= state.order.length) {
        state.completed = true;
        showToast("Secuencia completa. Cuarto secreto desbloqueado.", 2800);
      } else {
        showToast(`Cristal correcto · ${state.step}/5`, 1000);
      }
    } else {
      state.step = 0;
      state.consumed.clear();
      showToast("Secuencia incorrecta. Los cristales se reiniciaron.");
    }
    return true;
  }

  function interactCircuit() {
    const state = puzzleState.circuit;
    if (state.completed || !roomIsClear()) return false;
    const center = playerCenter();
    const node = state.nodes.find((item) => distanceBetween(center.x, center.y, item.x, item.y) < 43);
    if (!node) return false;

    node.orientation = (node.orientation + 1) % 4;
    if (state.nodes.every((item) => item.orientation === item.target)) {
      state.completed = true;
      showToast("Circuito de luz conectado. Canal 6 abierto.");
    } else {
      showToast("Nodo girado.", 750);
    }
    return true;
  }

  function startMemoryPreview() {
    const state = puzzleState.memory;
    state.phase = "preview";
    state.previewIndex = -1;
    state.previewTimer = 0.35;
    state.step = 0;
    state.lastTile = -1;
    showToast("Memoriza la secuencia luminosa.", 1500);
  }

  function updateMemoryPuzzle(dt) {
    const state = puzzleState.memory;
    if (game.currentRoomId !== 7 || state.completed || !roomIsClear()) return;

    if (state.phase === "preview") {
      state.previewTimer -= dt;
      if (state.previewTimer <= 0) {
        state.previewIndex += 1;
        state.previewTimer = 0.62;
        if (state.previewIndex >= state.sequence.length) {
          state.phase = "playing";
          state.previewIndex = -1;
          showToast("Ahora repite la secuencia.");
        }
      }
      return;
    }

    if (state.phase !== "playing") return;
    const center = playerCenter();
    const tileIndex = state.tiles.findIndex((tile) => pointInRect(center.x, center.y, tile));

    if (tileIndex < 0) {
      state.lastTile = -1;
      return;
    }
    if (tileIndex === state.lastTile) return;
    state.lastTile = tileIndex;

    if (tileIndex === state.sequence[state.step]) {
      state.step += 1;
      if (state.step >= state.sequence.length) {
        state.completed = true;
        state.phase = "complete";
        showToast("Memoria restaurada. Disco secreto revelado.", 2600);
      }
    } else {
      showToast("Patrón incorrecto. Observa otra vez.");
      startMemoryPreview();
    }
  }

  function interactPhantomSignal() {
    const state = puzzleState.phantomSignal;
    if (state.completed || !roomIsClear()) return false;
    const center = playerCenter();
    const index = state.positions.findIndex((item) => (
      distanceBetween(center.x, center.y, item.x, item.y) < 46
    ));
    if (index < 0) return false;

    if (index === state.order[state.step]) {
      state.step += 1;
      if (state.step >= state.order.length) {
        state.completed = true;
        showToast("Señal Phantom reconstruida. Canal 11 abierto.", 2600);
      } else {
        showToast(`Eco correcto · ${state.step}/${state.order.length}`, 900);
      }
    } else {
      state.step = 0;
      showToast("La señal se perdió. Repite la secuencia.");
    }
    return true;
  }

  function interactTuner() {
    const state = puzzleState.tuner;
    if (state.completed || !roomIsClear()) return false;
    const center = playerCenter();
    const control = state.controls.find((item) => distanceBetween(center.x, center.y, item.x, item.y) < 48);
    if (!control) return false;

    control.value = (control.value + 1) % 5;
    if (state.controls.every((item) => item.value === item.target)) {
      state.completed = true;
      showToast("Frecuencia DIAMA sincronizada. Tesoro desbloqueado.", 2700);
    } else {
      showToast(`Frecuencia ajustada: ${control.value + 1}`, 850);
    }
    return true;
  }

  function availableDiscInRoom() {
    if (game.currentRoomId === 3.5) return discs.ready;
    if (game.currentRoomId === 7 && puzzleState.memory.completed) return discs.phantoms;
    if (game.currentRoomId === 11 && puzzleState.tuner.completed) return discs.dk;
    return null;
  }

  function interactDisc() {
    const disc = availableDiscInRoom();
    if (!disc) return false;
    const center = playerCenter();
    if (distanceBetween(center.x, center.y, disc.x, disc.y) > 48) return false;
    discoverDisc(disc);
    return true;
  }

  function updateKeyPickup() {
    const state = puzzleState.push;
    if (game.currentRoomId !== 2 || !state.completed || state.keyCollected) return;
    const center = playerCenter();
    if (distanceBetween(center.x, center.y, 320, 178) < 35) {
      state.keyCollected = true;
      player.keys += 1;
      updateHud();
      showToast("Llave de acceso obtenida.");
    }
  }

  function interactChest(dt) {
    const chest = game.chest;
    if (!chest.opening) return;
    chest.timer += dt;
    if (chest.timer >= 0.13) {
      chest.timer = 0;
      chest.frame += 1;
      if (chest.frame >= 5) {
        chest.opening = false;
        chest.open = true;
        game.modalPause = true;
        ui.finalDiscMessage.textContent = music.collected.size === 3
          ? "Colección completa · 3/3 DIAMA Discs"
          : `Discos encontrados: ${music.collected.size}/3`;
        ui.revealModal.classList.remove("hidden");
      }
    }
  }

  function tryInteractChest() {
    if (game.currentRoomId !== 12 || game.chest.open || game.chest.opening) return false;
    const center = playerCenter();
    const chestCenterX = game.chest.x + game.chest.w / 2;
    const chestCenterY = game.chest.y + game.chest.h / 2;
    if (distanceBetween(center.x, center.y, chestCenterX, chestCenterY) > 52) return false;

    game.chest.opening = true;
    game.chest.frame = 0;
    game.chest.timer = 0;
    showToast("Abriendo archivo DIAMA Penthouse…");
    return true;
  }

  function handleInteraction() {
    if (!wasPressed("e", "x")) return;
    if (interactDisc()) return;
    if (tryInteractChest()) return;

    if (game.currentRoomId === 3 && interactCrystal()) return;
    if (game.currentRoomId === 5 && interactCircuit()) return;
    if (game.currentRoomId === 10 && interactPhantomSignal()) return;
    if (game.currentRoomId === 11 && interactTuner()) return;

    showToast("No hay nada que activar aquí.", 850);
  }

  function interactionLabel() {
    if (!roomIsClear()) return null;
    const center = playerCenter();
    const disc = availableDiscInRoom();
    if (disc && distanceBetween(center.x, center.y, disc.x, disc.y) < 48) {
      return music.collected.has(disc.id) ? "E · PLAY / PAUSA" : "E · DESCUBRIR DISCO";
    }

    if (game.currentRoomId === 3 && !puzzleState.crystals.completed
      && puzzleState.crystals.positions.some((p, index) => (
        !puzzleState.crystals.consumed.has(index)
        && distanceBetween(center.x, center.y, p.x, p.y) < 42
      ))) {
      return "E · ACTIVAR CRISTAL";
    }
    if (game.currentRoomId === 5 && !puzzleState.circuit.completed
      && puzzleState.circuit.nodes.some((p) => distanceBetween(center.x, center.y, p.x, p.y) < 43)) {
      return "E · GIRAR NODO";
    }
    if (game.currentRoomId === 10 && !puzzleState.phantomSignal.completed
      && puzzleState.phantomSignal.positions.some((p) => distanceBetween(center.x, center.y, p.x, p.y) < 46)) {
      return "E · ACTIVAR ECO";
    }
    if (game.currentRoomId === 11 && !puzzleState.tuner.completed
      && puzzleState.tuner.controls.some((p) => distanceBetween(center.x, center.y, p.x, p.y) < 48)) {
      return "E · AJUSTAR FRECUENCIA";
    }
    if (game.currentRoomId === 12 && !game.chest.open
      && distanceBetween(center.x, center.y, game.chest.x + 19, game.chest.y + 19) < 52) {
      return "E · ABRIR ARCHIVO";
    }
    return null;
  }

  function updateInteractionHint() {
    const label = interactionLabel();
    if (label) {
      ui.interactionHint.textContent = label;
      ui.interactionHint.classList.remove("hidden");
    } else {
      ui.interactionHint.classList.add("hidden");
    }
  }

  // ---------------------------
  // Actualización principal
  // ---------------------------

  function update(dt) {
    updateAmbience(dt);

    if (!game.started || game.modalPause || player.dead) {
      input.pressed.clear();
      return;
    }

    game.time += dt;
    game.doorToastCooldown = Math.max(0, game.doorToastCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);

    if (wasPressed(" ", "z")) startAttack();

    if (player.attacking) {
      player.attackTimer -= dt;
      applyAttackHits();
      if (player.attackTimer <= 0) player.attacking = false;
    }

    updatePlayerMovement(dt);
    updateEnemies(dt);
    updateMemoryPuzzle(dt);
    updateKeyPickup();
    updateHealingPickup();
    updateFragmentPickup();
    if (game.modalPause) {
      input.pressed.clear();
      return;
    }
    handleInteraction();
    interactChest(dt);
    updateInteractionHint();

    player.animationTimer += dt;
    const frameDuration = player.attacking ? 0.045 : player.moving ? 0.09 : 0.16;
    if (player.animationTimer >= frameDuration) {
      player.animationTimer = 0;
      player.frame = (player.frame + 1) % 6;
    }

    input.pressed.clear();
  }

  // ---------------------------
  // Render: utilidades
  // ---------------------------

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawGlassRect(x, y, width, height, radius = 10, accent = "#69d9e8") {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.45, "rgba(211,249,252,0.78)");
    gradient.addColorStop(1, "rgba(116,214,229,0.63)");
    roundedRect(x, y, width, height, radius);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 2;
    ctx.stroke();
    roundedRect(x + 3, y + 3, width - 6, Math.max(5, height * 0.36), Math.max(2, radius - 2));
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    roundedRect(x + 1, y + 1, width - 2, height - 2, radius - 1);
    ctx.stroke();
  }

  function drawStripSprite(image, frame, frames, x, y, width, height, alpha = 1) {
    if (!image || !image.naturalWidth) return false;
    const sourceWidth = image.naturalWidth / frames;
    const sourceHeight = image.naturalHeight;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      image,
      (frame % frames) * sourceWidth,
      0,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );
    ctx.restore();
    return true;
  }

  function drawFallbackCharacter(x, y, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    roundedRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawRoomBackground() {
    const room = currentRoom();
    const hueShift = (Math.floor(room.id * 17) % 40);
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, `hsl(${186 + hueShift}, 78%, 92%)`);
    gradient.addColorStop(0.5, "rgba(246,255,255,0.95)");
    gradient.addColorStop(1, `hsl(${94 + hueShift / 2}, 63%, 88%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.19;
    ctx.strokeStyle = "#1689bd";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();

    // Formas aero decorativas.
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(130, 70, 110, 42, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#67d9eb";
    ctx.beginPath();
    ctx.arc(555, 300, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8bdc36";
    ctx.beginPath();
    ctx.ellipse(70, 315, 120, 40, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(34,101,121,0.55)";
    ctx.font = "800 10px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(room.subtitle, WIDTH / 2, 35);
  }

  function drawDoor(direction) {
    const target = doorTarget(direction);
    const roomHasDoor = target != null;
    const state = roomHasDoor ? doorVisualState(direction) : "wall";
    const half = DOOR_SIZE / 2;
    const colors = {
      open: ["#dffff2", "#72d832", "#4aa615"],
      "key-ready": ["#f3ffe2", "#92e644", "#57b812"],
      locked: ["#ffe3f1", "#ff5aa6", "#c52770"],
      enemies: ["#fff2d6", "#ffbf42", "#e18416"],
      puzzle: ["#e0f7ff", "#4fc7e6", "#167faf"],
      wall: ["#e3f8fa", "#9cdde4", "#5faec2"]
    };
    const palette = colors[state] || colors.wall;

    let x = 0;
    let y = 0;
    let w = WIDTH;
    let h = WALL;
    if (direction === "S") y = HEIGHT - WALL;
    if (direction === "W") {
      w = WALL;
      h = HEIGHT;
    }
    if (direction === "E") {
      x = WIDTH - WALL;
      w = WALL;
      h = HEIGHT;
    }

    ctx.fillStyle = "rgba(70,155,176,0.48)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;

    if (direction === "N" || direction === "S") {
      const doorX = WIDTH / 2 - half;
      ctx.fillStyle = roomHasDoor ? palette[1] : palette[0];
      ctx.fillRect(doorX, y, DOOR_SIZE, h);
      ctx.strokeRect(doorX, y, DOOR_SIZE, h);
      if (roomHasDoor) {
        const glow = ctx.createLinearGradient(doorX, y, doorX + DOOR_SIZE, y);
        glow.addColorStop(0, palette[2]);
        glow.addColorStop(0.5, palette[0]);
        glow.addColorStop(1, palette[2]);
        ctx.fillStyle = glow;
        ctx.fillRect(doorX + 6, y + 4, DOOR_SIZE - 12, Math.max(4, h - 8));
      }
    } else {
      const doorY = HEIGHT / 2 - half;
      ctx.fillStyle = roomHasDoor ? palette[1] : palette[0];
      ctx.fillRect(x, doorY, w, DOOR_SIZE);
      ctx.strokeRect(x, doorY, w, DOOR_SIZE);
      if (roomHasDoor) {
        const glow = ctx.createLinearGradient(x, doorY, x, doorY + DOOR_SIZE);
        glow.addColorStop(0, palette[2]);
        glow.addColorStop(0.5, palette[0]);
        glow.addColorStop(1, palette[2]);
        ctx.fillStyle = glow;
        ctx.fillRect(x + 4, doorY + 6, Math.max(4, w - 8), DOOR_SIZE - 12);
      }
    }
  }

  function drawObstacles() {
    game.activeObstacles.forEach((obstacle) => {
      ctx.save();
      ctx.shadowColor = "rgba(25,137,199,0.25)";
      ctx.shadowBlur = 12;
      drawGlassRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 10, "#6ad6e7");
      ctx.restore();
    });
  }

  // ---------------------------
  // Render: puzles y objetos
  // ---------------------------

  function drawPushPuzzle() {
    if (game.currentRoomId !== 2) return;
    const state = puzzleState.push;

    state.pads.forEach((pad) => {
      const occupied = state.blocks.some((block) => (
        distanceBetween(block.x + block.w / 2, block.y + block.h / 2, pad.x, pad.y) < pad.r
      ));
      ctx.save();
      ctx.shadowColor = occupied ? "#7ed321" : "#37b9dc";
      ctx.shadowBlur = occupied ? 18 : 8;
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, pad.r, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? "rgba(126,211,33,0.45)" : "rgba(64,193,222,0.22)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = occupied ? "#78cf2c" : "#42b9d4";
      ctx.stroke();
      ctx.restore();
    });

    state.blocks.forEach((block) => {
      ctx.save();
      ctx.shadowColor = "#1989c7";
      ctx.shadowBlur = 10;
      drawGlassRect(block.x, block.y, block.w, block.h, 8, "#65cbe1");
      ctx.fillStyle = "#5ab810";
      ctx.font = "900 15px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("D.", block.x + block.w / 2, block.y + block.h / 2 + 5);
      ctx.restore();
    });

    if (state.completed && !state.keyCollected) {
      const image = images.key;
      const bob = Math.sin(game.time * 4) * 4;
      ctx.save();
      ctx.shadowColor = "#8cdb31";
      ctx.shadowBlur = 18;
      if (!drawStripSprite(image, Math.floor(game.time * 9) % 6, 6, 306, 163 + bob, 28, 28)) {
        drawFallbackCharacter(307, 164 + bob, 26, 26, "#7ed321");
      }
      ctx.restore();
    }

    if (!state.completed && roomIsClear()) {
      ctx.fillStyle = "rgba(42,101,119,0.75)";
      ctx.font = "800 10px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("EMPUJA LOS 3 NÚCLEOS HACIA LOS PUERTOS LUMINOSOS", WIDTH / 2, 332);
    }
  }

  function drawCrystalPuzzle() {
    if (game.currentRoomId !== 3) return;
    const state = puzzleState.crystals;

    if (!state.completed) {
      state.positions.forEach((position, index) => {
        if (state.consumed.has(index)) return;
        const frame = Math.floor(game.time * 8 + index) % 6;
        ctx.save();
        ctx.shadowColor = "#35bad9";
        ctx.shadowBlur = 12;
        if (!drawStripSprite(images.crystal, frame, 6, position.x - 16, position.y - 21, 32, 40)) {
          drawFallbackCharacter(position.x - 13, position.y - 17, 26, 34, "#36b7d5");
        }
        ctx.fillStyle = "#2f7388";
        ctx.font = "900 12px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(state.symbols[index], position.x, position.y + 31);
        ctx.restore();
      });

      if (roomIsClear()) {
        const clue = state.order.map((index) => state.symbols[index]).join("  ");
        ctx.fillStyle = "rgba(43,105,124,0.82)";
        ctx.font = "900 11px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(`SECUENCIA:  ${clue}`, WIDTH / 2, 328);
      }
    } else {
      ctx.save();
      ctx.fillStyle = "rgba(126,211,33,0.18)";
      ctx.beginPath();
      ctx.arc(WIDTH / 2, 82, 38 + Math.sin(game.time * 3) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#79d128";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#4d9c1b";
      ctx.font = "900 11px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("CUARTO SECRETO", WIDTH / 2, 86);
      ctx.restore();
    }
  }

  function drawCircuitPuzzle() {
    if (game.currentRoomId !== 5) return;
    const state = puzzleState.circuit;

    ctx.save();
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = state.completed ? "rgba(126,211,33,0.62)" : "rgba(61,187,216,0.22)";
    ctx.beginPath();
    ctx.moveTo(18, 180);
    state.nodes.forEach((node) => ctx.lineTo(node.x, node.y));
    ctx.lineTo(320, 342);
    ctx.stroke();
    ctx.restore();

    state.nodes.forEach((node, index) => {
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(node.orientation * Math.PI / 2);
      ctx.shadowColor = state.completed ? "#7ed321" : "#39bbd9";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = state.completed ? "rgba(126,211,33,0.56)" : "rgba(225,253,255,0.88)";
      ctx.fill();
      ctx.strokeStyle = state.completed ? "#62b815" : "#259ec5";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(8, 0);
      ctx.lineTo(2, -7);
      ctx.moveTo(8, 0);
      ctx.lineTo(2, 7);
      ctx.stroke();
      ctx.restore();

      if (!state.completed) {
        ctx.fillStyle = "rgba(45,100,117,0.58)";
        ctx.font = "800 8px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(`N${index + 1}`, node.x, node.y + 39);
      }
    });

    if (!state.completed && roomIsClear()) {
      ctx.fillStyle = "rgba(42,101,119,0.75)";
      ctx.font = "800 10px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("CLAVE:  N1 ↓   ·   N2 ←   ·   N3 ↑   ·   N4 ↓", WIDTH / 2, 319);
      ctx.font = "800 9px Trebuchet MS";
      ctx.fillText("ACÉRCATE Y PRESIONA E / B PARA GIRAR CADA NODO", WIDTH / 2, 334);
    }
  }

  function drawMemoryPuzzle() {
    if (game.currentRoomId !== 7) return;
    const state = puzzleState.memory;
    const activePreviewTile = state.phase === "preview" && state.previewIndex >= 0
      ? state.sequence[state.previewIndex]
      : -1;

    state.tiles.forEach((tile, index) => {
      const active = activePreviewTile === index;
      const passed = state.phase === "playing"
        && state.sequence.slice(0, state.step).includes(index);
      const complete = state.completed;
      ctx.save();
      ctx.shadowColor = active || complete ? "#7ed321" : "#3cbad7";
      ctx.shadowBlur = active ? 28 : complete ? 18 : 8;
      const gradient = ctx.createLinearGradient(tile.x, tile.y, tile.x, tile.y + tile.h);
      gradient.addColorStop(0, active || complete ? "rgba(221,255,181,0.92)" : "rgba(255,255,255,0.84)");
      gradient.addColorStop(1, active || complete ? "rgba(126,211,33,0.62)" : "rgba(89,203,225,0.38)");
      roundedRect(tile.x, tile.y, tile.w, tile.h, 15);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = active || complete ? "#67bd1b" : "#46b8d1";
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();
      ctx.fillStyle = complete ? "#4ba50e" : passed ? "#4ba50e" : "#3184a0";
      ctx.font = "900 20px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(String(index + 1), tile.x + tile.w / 2, tile.y + tile.h / 2 + 7);
      ctx.restore();
    });

    if (roomIsClear() && !state.completed) {
      ctx.fillStyle = "rgba(42,101,119,0.75)";
      ctx.font = "800 10px Trebuchet MS";
      ctx.textAlign = "center";
      const label = state.phase === "preview" ? "OBSERVA" : `REPITE · ${state.step}/${state.sequence.length}`;
      ctx.fillText(label, WIDTH / 2, 328);
    }
  }

  function drawPhantomSignalPuzzle() {
    if (game.currentRoomId !== 10) return;
    const state = puzzleState.phantomSignal;
    const coreX = WIDTH / 2;
    const coreY = 210;

    ctx.save();
    ctx.beginPath();
    ctx.arc(coreX, coreY, 34 + Math.sin(game.time * 4) * 3, 0, Math.PI * 2);
    ctx.fillStyle = state.completed ? "rgba(126,211,33,0.46)" : "rgba(255,79,160,0.22)";
    ctx.fill();
    ctx.strokeStyle = state.completed ? "#6fc423" : "#dd4c91";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = state.completed ? "#4ea20e" : "#b43a73";
    ctx.font = "900 10px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(state.completed ? "SIGNAL OK" : "PHANTOM", coreX, coreY + 4);
    ctx.restore();

    state.positions.forEach((position, index) => {
      const activated = state.order.slice(0, state.step).includes(index);
      const pulse = 1 + Math.sin(game.time * 5 + index) * 0.06;
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = activated || state.completed ? "#7ed321" : "#ff4fa0";
      ctx.shadowBlur = activated ? 22 : 14;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fillStyle = activated || state.completed
        ? "rgba(206,255,161,0.82)"
        : "rgba(255,226,241,0.82)";
      ctx.fill();
      ctx.strokeStyle = activated || state.completed ? "#69bd1d" : "#d64589";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = activated || state.completed ? "#4e9f14" : "#a9376c";
      ctx.font = "900 18px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(state.symbols[index], 0, 6);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = state.completed ? 0.4 : 0.12;
      ctx.strokeStyle = state.completed ? "#75ce2b" : "#d94e91";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(position.x, position.y);
      ctx.lineTo(coreX, coreY);
      ctx.stroke();
      ctx.restore();
    });

    if (!state.completed && roomIsClear()) {
      const clue = state.order.map((index) => state.symbols[index]).join("  ");
      ctx.fillStyle = "rgba(42,101,119,0.75)";
      ctx.font = "900 11px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(`SEÑAL PHANTOM:  ${clue}`, WIDTH / 2, 320);
      ctx.font = "800 9px Trebuchet MS";
      ctx.fillText(`ACTIVA LOS ECOS EN ORDEN · ${state.step}/${state.order.length}`, WIDTH / 2, 336);
    }
  }

  function drawTunerPuzzle() {
    if (game.currentRoomId !== 11) return;
    const state = puzzleState.tuner;

    ctx.save();
    ctx.strokeStyle = state.completed ? "#76ce2c" : "#2fa9cb";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 85; x <= 555; x += 4) {
      const amplitude = 18 + state.controls.reduce((sum, control) => sum + control.value, 0) * 0.9;
      const y = 92 + Math.sin((x + game.time * 80) * 0.055) * amplitude;
      if (x === 85) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    state.controls.forEach((control, index) => {
      ctx.save();
      drawGlassRect(control.x - 31, control.y - 52, 62, 104, 18, "#45bdd6");
      for (let level = 0; level < 5; level += 1) {
        const barY = control.y + 30 - level * 15;
        ctx.fillStyle = level <= control.value
          ? (state.completed ? "#7ed321" : "#28a8cb")
          : "rgba(50,142,166,0.18)";
        roundedRect(control.x - 18, barY, 36, 8, 4);
        ctx.fill();
      }
      ctx.fillStyle = "#316e82";
      ctx.font = "900 9px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(`F${index + 1}`, control.x, control.y + 45);
      ctx.restore();
    });

    if (!state.completed && roomIsClear()) {
      ctx.fillStyle = "rgba(42,101,119,0.75)";
      ctx.font = "800 10px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("CLAVE DE ONDA · 4 / 2 / 5", WIDTH / 2, 330);
    }
  }

  function drawDisc(disc) {
    const collected = music.collected.has(disc.id);
    const pulse = 1 + Math.sin(game.time * 4) * 0.06;
    ctx.save();
    ctx.translate(disc.x, disc.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = collected ? "#7ed321" : "#2fb8d8";
    ctx.shadowBlur = 22;

    const gradient = ctx.createConicGradient(game.time * 0.7, 0, 0);
    gradient.addColorStop(0, "#72e4f2");
    gradient.addColorStop(0.22, "#ffffff");
    gradient.addColorStop(0.48, "#8ce23a");
    gradient.addColorStop(0.74, "#278fbd");
    gradient.addColorStop(1, "#72e4f2");
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#2c8eb2";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#397789";
    ctx.font = "900 9px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(collected ? `${disc.shortTitle} · PLAY` : "DIAMA DISC ???", disc.x, disc.y + 36);
  }

  function drawAvailableDisc() {
    const disc = availableDiscInRoom();
    if (disc) drawDisc(disc);
  }

  function drawFragmentPickup() {
    const fragment = fragments.find((item) => item.room === game.currentRoomId && !item.collected);
    if (!fragment) return;

    const bob = Math.sin(game.time * 4.6 + fragment.room) * 4;
    const frame = Math.floor(game.time * 8) % 6;
    ctx.save();
    ctx.translate(fragment.x, fragment.y + bob);
    ctx.rotate(Math.sin(game.time * 2.2) * 0.08);
    ctx.shadowColor = "#72e4f2";
    ctx.shadowBlur = 22;

    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
    halo.addColorStop(0, "rgba(255,255,255,0.88)");
    halo.addColorStop(0.45, "rgba(114,228,242,0.34)");
    halo.addColorStop(1, "rgba(114,228,242,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    if (!drawStripSprite(images.crystal, frame, 6, -15, -15, 30, 30)) {
      ctx.fillStyle = "#65dce9";
      ctx.font = "900 25px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("✦", 0, 8);
    }
    ctx.restore();

    ctx.fillStyle = "rgba(46,113,132,0.84)";
    ctx.font = "900 8px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("FRAGMENTO DIAMA", fragment.x, fragment.y + 32 + bob);
  }

  function drawHealingPickup() {
    const pickup = healingPickups[game.currentRoomId];
    const progress = roomProgress[game.currentRoomId];
    if (!pickup || progress.heartCollected) return;

    const bob = Math.sin(game.time * 4) * 4;
    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.shadowColor = "#ff4fa0";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff77b7";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (images.potion) {
      ctx.drawImage(images.potion, -11, -11, 22, 22);
    } else {
      ctx.fillStyle = "#ff4fa0";
      ctx.font = "900 21px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("♥", 0, 7);
    }
    ctx.restore();

    ctx.fillStyle = "#b43572";
    ctx.font = "900 8px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(`ENERGÍA +${pickup.amount}`, pickup.x, pickup.y + 36 + bob);
  }

  function drawChest() {
    if (game.currentRoomId !== 12) return;
    const chest = game.chest;
    ctx.save();
    ctx.shadowColor = "#7ed321";
    ctx.shadowBlur = 20;
    if (chest.open && images.chestOpen) {
      ctx.drawImage(images.chestOpen, chest.x, chest.y, chest.w, chest.h);
    } else if (images.chestOpening) {
      const sourceWidth = images.chestOpening.naturalWidth / 5;
      ctx.drawImage(
        images.chestOpening,
        Math.min(4, chest.frame) * sourceWidth,
        0,
        sourceWidth,
        images.chestOpening.naturalHeight,
        chest.x,
        chest.y,
        chest.w,
        chest.h
      );
    } else {
      drawGlassRect(chest.x, chest.y, chest.w, chest.h, 8, "#7ed321");
    }
    ctx.restore();

    ctx.fillStyle = "#397789";
    ctx.font = "900 9px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(chest.open ? "ARCHIVO ABIERTO" : "DIAMA ARCHIVE", chest.x + chest.w / 2, chest.y + 55);
  }

  // ---------------------------
  // Render: entidades
  // ---------------------------

  function drawEnemies() {
    game.activeEnemies.forEach((enemy) => {
      const config = enemyTypes[enemy.type];
      const image = images[config.sprite];
      const alpha = enemy.hitFlash > 0 ? 0.35 : 1;
      const bob = enemy.type === "bat" || enemy.type === "phantom"
        ? Math.sin(game.time * 5 + enemy.x) * 3
        : 0;
      ctx.save();
      ctx.shadowColor = enemy.type === "phantom" ? "#ff4fa0" : "#228db8";
      ctx.shadowBlur = 8;
      if (!drawStripSprite(image, enemy.frame, config.frames, enemy.x, enemy.y + bob, enemy.w, enemy.h, alpha)) {
        drawFallbackCharacter(enemy.x, enemy.y + bob, enemy.w, enemy.h, "#ff76b5");
      }
      ctx.restore();

      if (enemy.hp < config.hp) {
        const width = enemy.w;
        ctx.fillStyle = "rgba(42,91,106,0.22)";
        ctx.fillRect(enemy.x, enemy.y - 6, width, 3);
        ctx.fillStyle = "#7ed321";
        ctx.fillRect(enemy.x, enemy.y - 6, width * (enemy.hp / config.hp), 3);
      }
    });
  }

  function playerSpriteKey() {
    const action = player.attacking ? "attack" : player.moving ? "run" : "idle";
    return `player_${action}_${player.direction}`;
  }

  function drawPlayer() {
    if (player.dead) return;
    const renderSize = 36;
    const drawX = player.x - (renderSize - player.w) / 2;
    const drawY = player.y - (renderSize - player.h) / 2 - 4;
    const alpha = player.invulnerable > 0 && Math.floor(game.time * 18) % 2 === 0 ? 0.35 : 1;
    const image = images[playerSpriteKey()];

    ctx.save();
    ctx.shadowColor = "#279fc5";
    ctx.shadowBlur = 8;
    if (!drawStripSprite(image, player.frame, 6, drawX, drawY, renderSize, renderSize, alpha)) {
      drawFallbackCharacter(drawX, drawY, renderSize, renderSize, "#7ed321");
    }
    ctx.restore();
  }

  function drawPuzzleForCurrentRoom() {
    drawPushPuzzle();
    drawCrystalPuzzle();
    drawCircuitPuzzle();
    drawMemoryPuzzle();
    drawPhantomSignalPuzzle();
    drawTunerPuzzle();
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawRoomBackground();
    drawDoor("N");
    drawDoor("S");
    drawDoor("W");
    drawDoor("E");
    drawObstacles();
    drawPuzzleForCurrentRoom();
    drawHealingPickup();
    drawFragmentPickup();
    drawAvailableDisc();
    drawChest();
    drawEnemies();
    drawPlayer();

    // Vignette suave dentro del monitor.
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, 390);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(1, "rgba(19,116,149,0.13)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // ---------------------------
  // Inicio, reinicio y loop
  // ---------------------------

  function beginGame() {
    ui.startModal.classList.add("hidden");
    game.started = true;
    game.modalPause = false;
    loadRoom(1, "S");
    updateHud();
    startAmbience();
  }

  function retryFromCheckpoint() {
    ui.deathModal.classList.add("hidden");
    player.dead = false;
    player.hp = MAX_HP;
    player.invulnerable = 1.5;
    player.attacking = false;
    player.attackTimer = 0;
    player.attackCooldown = 0;
    player.attackHitIds.clear();
    game.modalPause = false;
    loadRoom(game.checkpoint.roomId, game.checkpoint.enteringFrom);
    updateHud();
    showToast("Checkpoint recuperado. Tu progreso sigue intacto.", 2600);
  }

  ui.startButton.addEventListener("click", beginGame);
  ui.retryButton.addEventListener("click", retryFromCheckpoint);
  ui.playAgainButton.addEventListener("click", () => window.location.reload());

  let previousTime = performance.now();
  function gameLoop(time) {
    const rawDelta = (time - previousTime) / 1000;
    previousTime = time;
    const dt = Math.min(0.033, Math.max(0, rawDelta));
    update(dt);
    render();
    requestAnimationFrame(gameLoop);
  }

  loadCollection();
  updateHud();
  loadRoom(1, "S");
  game.started = false;
  preloadAssets();
  requestAnimationFrame(gameLoop);

})();
