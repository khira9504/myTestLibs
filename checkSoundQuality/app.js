(() => {
  'use strict';

  // UI 要素
  const fileAEl = document.getElementById('fileA');
  const fileBEl = document.getElementById('fileB');
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const hzAEl = document.getElementById('hzA');
  const hzBEl = document.getElementById('hzB');
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
    playBtn.disabled = !ready || isPlaying;
    stopBtn.disabled = !ready || !isPlaying;
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
    cancelVisualLoop();
    const binCount = analyserA ? analyserA.frequencyBinCount : 0;
    const arrA = new Float32Array(binCount);
    const arrB = new Float32Array(binCount);
    const sr = audioCtx.sampleRate;

    const minHz = 40;
    const maxHz = Math.min(12000, sr / 2);
    const minBin = Math.max(1, Math.floor(minHz / (sr / analyserA.fftSize)));
    const maxBin = Math.min(binCount - 1, Math.floor(maxHz / (sr / analyserA.fftSize)));

    const tick = () => {
      if (!isPlaying) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (analyserA) analyserA.getFloatFrequencyData(arrA);
      if (analyserB) analyserB.getFloatFrequencyData(arrB);

      const hzA = peakFreq(arrA, minBin, maxBin, sr, analyserA?.fftSize || 2048);
      const hzB = peakFreq(arrB, minBin, maxBin, sr, analyserB?.fftSize || 2048);

      hzAEl.textContent = Number.isFinite(hzA) ? hzA.toFixed(1) : '--';
      hzBEl.textContent = Number.isFinite(hzB) ? hzB.toFixed(1) : '--';

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
    if (!bufferA || !bufferB) return;
    ensureAudioContext();
    await audioCtx.resume();

    setupAnalysers();
    sourceA = createSource(bufferA, analyserA);
    sourceB = createSource(bufferB, analyserB);

    const startAt = audioCtx.currentTime + 0.08; // 同期のため少し先に
    try {
      sourceA.start(startAt);
      sourceB.start(startAt);
    } catch (_) {
      // すでにスタート済みなどは握りつぶし
    }

    isPlaying = true;
    updateButtons();
    startVisualLoop();

    const onEnded = () => {
      // どちらかが終了したら停止扱い
      stopPlayback();
    };
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
    cancelVisualLoop();
    hzAEl.textContent = '--';
    hzBEl.textContent = '--';
    updateButtons();
  }

  function resetAll() {
    stopPlayback();
    bufferA = null;
    bufferB = null;
    fileAEl.value = '';
    fileBEl.value = '';
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
    redraw();
    updateButtons();
  });

  fileBEl.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    bufferB = file ? await loadFileToBuffer(file) : null;
    redraw();
    updateButtons();
  });

  playBtn.addEventListener('click', handlePlay);
  stopBtn.addEventListener('click', () => {
    stopPlayback();
  });
  resetBtn.addEventListener('click', () => {
    resetAll();
  });

  viewRadios.forEach(r => r.addEventListener('change', applyViewMode));

  // 初期描画
  applyViewMode();
})();
