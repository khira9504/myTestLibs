(() => {
  'use strict';

  // UI 要素
  const fileAEl = document.getElementById('fileA');
  const fileBEl = document.getElementById('fileB');
  const toggleBtn = document.getElementById('toggleBtn');
  const resetBtn = document.getElementById('resetBtn');
  const hzAEl = document.getElementById('hzA');
  const hzBEl = document.getElementById('hzB');
  const timeCurrentEl = document.getElementById('timeCurrent');
  const timeTotalEl = document.getElementById('timeTotal');
  const sideWrap = document.getElementById('sideBySide');
  const overlayWrap = document.getElementById('overlayWrap');
  const canvasA = document.getElementById('canvasA');
  const canvasB = document.getElementById('canvasB');
  const canvasOverlay = document.getElementById('canvasOverlay');

  const viewRadios = Array.from(document.querySelectorAll('input[name="view"]'));

  // Web Audio 状態
  let audioCtx = null;
  let bufferA = null;
  let bufferB = null;
  let sourceA = null;
  let sourceB = null;
  let analyserA = null;
  let analyserB = null;
  let rafId = null;
  let isPlaying = false;
  let playheadSec = 0; // 現在位置（秒）
  let playheadBase = 0; // currentTime - playheadSec の基準（再生中に使用）
  let dragging = false;
  let wasPlayingOnDrag = false;
  let dragCanvas = null;

  const COLORS = {
    a: getCSS('--accent-a') || '#2E86DE',
    b: getCSS('--accent-b') || '#E74C3C',
    grid: getCSS('--grid') || '#293042',
    mid: '#9aa0aa'
  };

  function getCSS(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  // ファイル読み込み＆デコード
  async function loadFileToBuffer(file) {
    if (!file) return null;
    ensureAudioContext();
    const arrayBuf = await file.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuf);
  }

  function updateButtons() {
    const ready = !!bufferA && !!bufferB;
    toggleBtn.disabled = !ready && !isPlaying; // 再生中は押せる（停止用）
    toggleBtn.classList.toggle('playing', isPlaying);
    toggleBtn.setAttribute('aria-pressed', String(isPlaying));
    toggleBtn.setAttribute('aria-label', isPlaying ? '停止' : '同時再生');
  }

  function clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    // 背景グリッド（軽め）
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += Math.floor(w / 12)) {
      ctx.beginPath();
      ctx.moveTo(x + .5, 0);
      ctx.lineTo(x + .5, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaveformToCanvas(buffer, canvas, color, opts = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const { clear = true, drawMid = true } = opts;
    if (clear) clearCanvas(ctx, width, height);

    if (!buffer) return;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    // 中央線
    if (drawMid) {
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + .5);
      ctx.lineTo(width, height / 2 + .5);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const start = i * step;
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step && start + j < data.length; j++) {
        const v = data[start + j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = (1 - (max + 1) / 2) * height;
      const y2 = (1 - (min + 1) / 2) * height;
      ctx.moveTo(i + .5, y1);
      ctx.lineTo(i + .5, y2);
    }
    ctx.stroke();
  }

  function drawOverlay() {
    const ctx = canvasOverlay.getContext('2d');
    const width = canvasOverlay.width;
    const height = canvasOverlay.height;
    clearCanvas(ctx, width, height);

    // どちらかがあれば最低1回は描画（中央線含む）
    const first = bufferA || bufferB;
    const second = first === bufferA ? bufferB : bufferA;

    if (first) {
      drawWaveformToCanvas(first, canvasOverlay, first === bufferA ? COLORS.a : COLORS.b, { clear: false, drawMid: true });
    }
    if (second) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawWaveformToCanvas(second, canvasOverlay, second === bufferB ? COLORS.b : COLORS.a, { clear: false, drawMid: false });
      ctx.restore();
    }
  }

  function drawSideBySide() {
    drawWaveformToCanvas(bufferA, canvasA, COLORS.a);
    drawWaveformToCanvas(bufferB, canvasB, COLORS.b);
  }

  function redraw() {
    const mode = getViewMode();
    if (mode === 'overlay') {
      drawOverlay();
    } else {
      drawSideBySide();
    }
  }

  function getViewMode() {
    const sel = viewRadios.find(r => r.checked);
    return sel ? sel.value : 'side';
  }

  // 再生セットアップ
  function setupAnalysers() {
    analyserA = audioCtx.createAnalyser();
    analyserB = audioCtx.createAnalyser();
    analyserA.fftSize = 4096;
    analyserB.fftSize = 4096;
    analyserA.smoothingTimeConstant = 0.7;
    analyserB.smoothingTimeConstant = 0.7;
  }

  function startVisualLoop() {
    if (rafId) return; // 多重起動防止
    let arrA = null;
    let arrB = null;
    const tick = () => {
      // 再生中は進行更新
      if (isPlaying && audioCtx) {
        playheadSec = Math.max(0, audioCtx.currentTime - playheadBase);
      }

      // 周波数ピーク推定（再生中のみ、かつアナライザがある場合）
      let hzA = NaN, hzB = NaN;
      if (analyserA && analyserB && audioCtx) {
        const sr = audioCtx.sampleRate;
        if (!arrA || arrA.length !== analyserA.frequencyBinCount) arrA = new Float32Array(analyserA.frequencyBinCount);
        if (!arrB || arrB.length !== analyserB.frequencyBinCount) arrB = new Float32Array(analyserB.frequencyBinCount);
        analyserA.getFloatFrequencyData(arrA);
        analyserB.getFloatFrequencyData(arrB);
        const minHz = 40;
        const maxHz = Math.min(12000, sr / 2);
        const minBin = Math.max(1, Math.floor(minHz / (sr / analyserA.fftSize)));
        const maxBin = Math.min(arrA.length - 1, Math.floor(maxHz / (sr / analyserA.fftSize)));
        hzA = peakFreq(arrA, minBin, maxBin, sr, analyserA.fftSize);
        // B側も同様
        const minBinB = Math.max(1, Math.floor(minHz / (sr / analyserB.fftSize)));
        const maxBinB = Math.min(arrB.length - 1, Math.floor(maxHz / (sr / analyserB.fftSize)));
        hzB = peakFreq(arrB, minBinB, maxBinB, sr, analyserB.fftSize);
      }
      hzAEl.textContent = Number.isFinite(hzA) ? hzA.toFixed(1) : '--';
      hzBEl.textContent = Number.isFinite(hzB) ? hzB.toFixed(1) : '--';

      // 時間表示更新 & 再生位置バー描画
      updateTimeUI();
      drawPlayheads();

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function cancelVisualLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function peakFreq(dbArray, minBin, maxBin, sampleRate, fftSize) {
    if (!dbArray || dbArray.length === 0) return NaN;
    let maxDb = -Infinity;
    let idx = -1;
    for (let i = minBin; i <= maxBin; i++) {
      const v = dbArray[i];
      if (v > maxDb) { maxDb = v; idx = i; }
    }
    if (idx < 0 || maxDb < -110) return NaN; // ノイズっぽい場合は無視
    const binHz = sampleRate / fftSize;
    // 近傍補間（パラボラ補間）で精度を少し上げる
    const alpha = dbArray[idx - 1] ?? maxDb - 1;
    const beta = maxDb;
    const gamma = dbArray[idx + 1] ?? maxDb - 1;
    const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta - gamma);
    const peakIndex = idx + (Number.isFinite(p) ? p : 0);
    return peakIndex * binHz;
  }

  function createSource(buffer, analyser) {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
    return src;
  }

  async function handlePlay() {
    // 現在の playheadSec から再生
    await startPlaybackFrom(playheadSec);
  }

  async function startPlaybackFrom(offsetSec) {
    if (!bufferA || !bufferB) return;
    ensureAudioContext();
    await audioCtx.resume();

    // オフセットを共通の再生長（min）に収める
    const total = computeOverlayDuration();
    const epsilon = 1e-3;
    const safeOffset = Math.min(Math.max(0, offsetSec), Math.max(0, (total || 0) - epsilon));
    playheadSec = safeOffset;

    setupAnalysers();
    sourceA = createSource(bufferA, analyserA);
    sourceB = createSource(bufferB, analyserB);

    const startAt = audioCtx.currentTime + 0.05; // わずかに先送りで同期
    try {
      sourceA.start(startAt, Math.min(safeOffset, Math.max(0, bufferA.duration - epsilon)));
      sourceB.start(startAt, Math.min(safeOffset, Math.max(0, bufferB.duration - epsilon)));
    } catch (_) { /* no-op */ }

    // 再生中時間 = currentTime - base
    playheadBase = startAt - safeOffset;
    isPlaying = true;
    updateButtons();

    const onEnded = () => stopPlayback();
    sourceA.addEventListener('ended', onEnded, { once: true });
    sourceB.addEventListener('ended', onEnded, { once: true });
  }

  function stopPlayback() {
    if (sourceA) { try { sourceA.stop(); } catch(_){} }
    if (sourceB) { try { sourceB.stop(); } catch(_){} }
    sourceA = null;
    sourceB = null;
    analyserA = null;
    analyserB = null;
    isPlaying = false;
    hzAEl.textContent = '--';
    hzBEl.textContent = '--';
    updateButtons();
    // 再生バーを消して静止波形を再描画
    redraw();
  }

  function resetAll() {
    stopPlayback();
    bufferA = null;
    bufferB = null;
    fileAEl.value = '';
    fileBEl.value = '';
    playheadSec = 0;
    hzAEl.textContent = '--';
    hzBEl.textContent = '--';
    // キャンバス消去
    [canvasA, canvasB, canvasOverlay].forEach(c => {
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
    });
    // 表示モードを横並びへ
    viewRadios.forEach(r => r.checked = r.value === 'side');
    applyViewMode();
    updateButtons();
  }

  function applyViewMode() {
    const mode = getViewMode();
    if (mode === 'overlay') {
      sideWrap.classList.add('hidden');
      overlayWrap.classList.remove('hidden');
    } else {
      overlayWrap.classList.add('hidden');
      sideWrap.classList.remove('hidden');
    }
    redraw();
  }

  // イベント
  fileAEl.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    bufferA = file ? await loadFileToBuffer(file) : null;
    playheadSec = 0;
    redraw();
    updateButtons();
  });

  fileBEl.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    bufferB = file ? await loadFileToBuffer(file) : null;
    playheadSec = 0;
    redraw();
    updateButtons();
  });

  toggleBtn.addEventListener('click', async () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      await handlePlay();
    }
  });
  resetBtn.addEventListener('click', () => {
    resetAll();
  });

  viewRadios.forEach(r => r.addEventListener('change', applyViewMode));

  // 初期描画
  applyViewMode();
  startVisualLoop();

  // 再生位置用ヘルパー
  function drawPlayheadLine(canvas, t, duration) {
    if (!canvas || !duration || !isFinite(duration)) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const ratio = Math.max(0, Math.min(1, t / duration));
    const x = Math.floor(ratio * w) + 0.5;
    ctx.save();
    ctx.strokeStyle = getCSS('--text') || '#e6e6e6';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayheads() {
    const total = computeOverlayDuration();
    const t = Math.max(0, Math.min(playheadSec, total || Infinity));
    const mode = getViewMode();

    if (mode === 'overlay') {
      // 波形を再描画
      drawOverlay();
      drawPlayheadLine(canvasOverlay, t, total);
    } else {
      drawSideBySide();
      if (bufferA) drawPlayheadLine(canvasA, t, total);
      if (bufferB) drawPlayheadLine(canvasB, t, total);
    }
  }

  function computeOverlayDuration() {
    const dA = bufferA?.duration || NaN;
    const dB = bufferB?.duration || NaN;
    if (Number.isFinite(dA) && Number.isFinite(dB)) return Math.min(dA, dB);
    if (Number.isFinite(dA)) return dA;
    if (Number.isFinite(dB)) return dB;
    return NaN;
  }

  function updateTimeUI() {
    const total = computeOverlayDuration();
    if (Number.isFinite(total)) {
      timeTotalEl.textContent = total.toFixed(2);
      const cur = Math.max(0, Math.min(playheadSec, total));
      timeCurrentEl.textContent = cur.toFixed(2);
    } else {
      timeCurrentEl.textContent = '--';
      timeTotalEl.textContent = '--';
    }
  }

  // ==== シーク（ドラッグ） ====
  function canvasClientXToRatio(canvas, clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return rect.width > 0 ? x / rect.width : 0;
  }

  function beginDrag(e, canvas) {
    if (!bufferA && !bufferB) return;
    dragging = true;
    wasPlayingOnDrag = isPlaying;
    if (isPlaying) stopPlayback();
    dragCanvas = canvas;
    updateDrag(e, canvas);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', endDrag, { once: true });
  }

  function updateDrag(e, canvas) {
    const total = computeOverlayDuration();
    if (!Number.isFinite(total)) return;
    const ratio = canvasClientXToRatio(canvas, e.clientX);
    playheadSec = Math.max(0, Math.min(total, ratio * total));
    updateTimeUI();
    drawPlayheads();
  }

  function onDragMove(e) {
    const mode = getViewMode();
    if (mode === 'overlay') updateDrag(e, canvasOverlay);
    else updateDrag(e, dragCanvas || canvasA); // 横並び時は開始したキャンバス基準
  }

  async function endDrag() {
    window.removeEventListener('pointermove', onDragMove);
    dragging = false;
    if (wasPlayingOnDrag) {
      await startPlaybackFrom(playheadSec);
    }
  }

  // クリック/ドラッグ シーク登録
  canvasOverlay.addEventListener('pointerdown', (e) => beginDrag(e, canvasOverlay));
  canvasA.addEventListener('pointerdown', (e) => beginDrag(e, canvasA));
  canvasB.addEventListener('pointerdown', (e) => beginDrag(e, canvasB));
})();
