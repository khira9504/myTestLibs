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
  const btnViewSide = document.getElementById('btnViewSide');
  const btnViewOverlay = document.getElementById('btnViewOverlay');
  const canvasA = document.getElementById('canvasA');
  const canvasB = document.getElementById('canvasB');
  const canvasOverlay = document.getElementById('canvasOverlay');

  let viewMode = 'overlay'; // デフォルトを重ね表示に

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
  let offlineHzDirty = true;
  let offlineHzA = NaN;
  let offlineHzB = NaN;
  let offlineHzComputing = false;
  // Hz安定化用パラメータと状態
  const HZ_MIN = 60;               // 帯域下限
  const HZ_MAX = 10000;            // 帯域上限
  const HZ_MIN_DB = -85;           // 最低許容レベル(dB)
  const HZ_SNR_DB_MIN = 8;         // 最低SNR(dB)
  const HZ_SNR_DB_STRONG = 18;     // 強SNR(dB)
  const HZ_SMOOTH_ALPHA = 0.2;     // スムージング係数
  const HZ_JITTER_GUARD_PCT = 0.12;// ジッター抑制閾値
  let stableHzA = NaN, stableHzB = NaN;
  let lastShownHzA = NaN, lastShownHzB = NaN;

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
    toggleBtn.setAttribute('aria-label', isPlaying ? '一時停止' : '再生');
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

  function getViewMode() { return viewMode; }

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

      // 周波数ピーク推定
      let hzA = NaN, hzB = NaN;
      if (isPlaying && analyserA && analyserB && audioCtx) {
        const sr = audioCtx.sampleRate;
        if (!arrA || arrA.length !== analyserA.frequencyBinCount) arrA = new Float32Array(analyserA.frequencyBinCount);
        if (!arrB || arrB.length !== analyserB.frequencyBinCount) arrB = new Float32Array(analyserB.frequencyBinCount);
        analyserA.getFloatFrequencyData(arrA);
        analyserB.getFloatFrequencyData(arrB);
        const minHz = HZ_MIN;
        const maxHz = Math.min(HZ_MAX, sr / 2);
        const minBin = Math.max(1, Math.floor(minHz / (sr / analyserA.fftSize)));
        const maxBin = Math.min(arrA.length - 1, Math.floor(maxHz / (sr / analyserA.fftSize)));
        const infoA = peakFreqWithDb(arrA, minBin, maxBin, sr, analyserA.fftSize);
        // B側も同様
        const minBinB = Math.max(1, Math.floor(minHz / (sr / analyserB.fftSize)));
        const maxBinB = Math.min(arrB.length - 1, Math.floor(maxHz / (sr / analyserB.fftSize)));
        const infoB = peakFreqWithDb(arrB, minBinB, maxBinB, sr, analyserB.fftSize);
        stableHzA = stabilizeHz(stableHzA, infoA.hz, infoA.peakDb, infoA.avgDb);
        stableHzB = stabilizeHz(stableHzB, infoB.hz, infoB.peakDb, infoB.avgDb);
        hzA = stableHzA; hzB = stableHzB;
        offlineHzA = hzA; // 再生中の最新をキャッシュ
        offlineHzB = hzB;
        offlineHzDirty = true; // 再生停止直後に再計算するため
      } else {
        // 停止中はオフラインでFFTを実行（必要時のみ）
        if (offlineHzDirty && !offlineHzComputing) {
          offlineHzComputing = true;
          setTimeout(() => { // UIスレッド占有を避けるため次タスクで実行
            try {
              const oA = computePeakInfoAt(bufferA, playheadSec);
              const oB = computePeakInfoAt(bufferB, playheadSec);
              stableHzA = stabilizeHz(stableHzA, oA.hz, oA.peakDb, oA.avgDb);
              stableHzB = stabilizeHz(stableHzB, oB.hz, oB.peakDb, oB.avgDb);
              offlineHzA = stableHzA;
              offlineHzB = stableHzB;
            } finally {
              offlineHzDirty = false;
              offlineHzComputing = false;
            }
          }, 0);
        }
        hzA = offlineHzA;
        hzB = offlineHzB;
      }
      lastShownHzA = Number.isFinite(hzA) ? hzA : NaN;
      lastShownHzB = Number.isFinite(hzB) ? hzB : NaN;
      hzAEl.textContent = Number.isFinite(lastShownHzA) ? lastShownHzA.toFixed(1) : '--';
      hzBEl.textContent = Number.isFinite(lastShownHzB) ? lastShownHzB.toFixed(1) : '--';

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

  // dB配列からピーク周波数とレベル情報
  function peakFreqWithDb(dbArray, minBin, maxBin, sampleRate, fftSize) {
    if (!dbArray || dbArray.length === 0) return { hz: NaN, peakDb: -Infinity, avgDb: -Infinity };
    let maxDb = -Infinity;
    let idx = -1;
    let sum = 0;
    let count = 0;
    for (let i = minBin; i <= maxBin; i++) {
      const v = dbArray[i];
      if (v > maxDb) { maxDb = v; idx = i; }
      sum += v; count++;
    }
    const avgDb = count ? (sum / count) : -Infinity;
    if (idx < 0 || maxDb < HZ_MIN_DB) return { hz: NaN, peakDb: maxDb, avgDb };
    const binHz = sampleRate / fftSize;
    // パラボラ補間
    const alpha = dbArray[idx - 1] ?? maxDb - 1;
    const beta = maxDb;
    const gamma = dbArray[idx + 1] ?? maxDb - 1;
    const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta - gamma);
    const peakIndex = idx + (Number.isFinite(p) ? p : 0);
    return { hz: peakIndex * binHz, peakDb: maxDb, avgDb };
  }

  // 安定化: スムージング+しきい値+ヒステリシス
  function stabilizeHz(prev, cand, peakDb, avgDb) {
    if (!Number.isFinite(cand)) return prev;
    if (!Number.isFinite(prev)) return cand; // 初期値
    if (peakDb < HZ_MIN_DB) return prev;
    const snr = peakDb - (Number.isFinite(avgDb) ? avgDb : -120);
    if (snr < HZ_SNR_DB_MIN) return prev;
    const diff = Math.abs(cand - prev) / Math.max(1, prev);
    if (diff > HZ_JITTER_GUARD_PCT && snr < HZ_SNR_DB_STRONG) return prev;
    return prev * (1 - HZ_SMOOTH_ALPHA) + cand * HZ_SMOOTH_ALPHA;
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
    offlineHzDirty = true; // 再生中はアナライザ優先、停止後に再計算

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
    updateButtons();
    offlineHzDirty = true; // 停止したのでオフライン再計算対象
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
    // 表示モードを重ねへ
    viewMode = 'overlay';
    applyViewMode();
    offlineHzDirty = true;
    updateTimeUI();
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
    // ボタンの選択状態
    btnViewOverlay.classList.toggle('active', mode === 'overlay');
    btnViewSide.classList.toggle('active', mode === 'side');
    redraw();
  }

  // イベント
  fileAEl.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    bufferA = file ? await loadFileToBuffer(file) : null;
    playheadSec = 0;
    offlineHzDirty = true;
    redraw();
    updateButtons();
  });

  fileBEl.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    bufferB = file ? await loadFileToBuffer(file) : null;
    playheadSec = 0;
    offlineHzDirty = true;
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

  btnViewOverlay.addEventListener('click', () => { viewMode = 'overlay'; applyViewMode(); });
  btnViewSide.addEventListener('click', () => { viewMode = 'side'; applyViewMode(); });

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

  // Hzラベル描画
  function drawHzBadge(canvas, t, duration, hz, color, yOffset = 6) {
    if (!canvas || !Number.isFinite(duration) || !Number.isFinite(hz)) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;
    const ratio = Math.max(0, Math.min(1, t / duration));
    const x = Math.floor(ratio * w);
    const text = `${hz.toFixed(1)} Hz`;
    ctx.save();
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI';
    const pad = 4; const tw = Math.ceil(ctx.measureText(text).width);
    const bx = Math.min(w - tw - pad*2 - 4, Math.max(4, x + 6));
    const by = yOffset;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, bx, by, tw + pad*2, 18, 6); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, bx + pad, by + 13);
    ctx.restore();
  }

  function drawHzBadgesOverlay(canvas, t, duration) {
    drawHzBadge(canvas, t, duration, lastShownHzA, COLORS.a, 6);
    drawHzBadge(canvas, t, duration, lastShownHzB, COLORS.b, 28);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function drawPlayheads() {
    const total = computeOverlayDuration();
    const t = Math.max(0, Math.min(playheadSec, total || Infinity));
    const mode = getViewMode();

    if (mode === 'overlay') {
      // 波形を再描画
      drawOverlay();
      drawPlayheadLine(canvasOverlay, t, total);
      drawHzBadgesOverlay(canvasOverlay, t, total);
    } else {
      drawSideBySide();
      if (bufferA) { drawPlayheadLine(canvasA, t, total); drawHzBadge(canvasA, t, total, lastShownHzA, COLORS.a); }
      if (bufferB) { drawPlayheadLine(canvasB, t, total); drawHzBadge(canvasB, t, total, lastShownHzB, COLORS.b); }
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
      timeTotalEl.textContent = formatClock(total);
      const cur = Math.max(0, Math.min(playheadSec, total));
      timeCurrentEl.textContent = formatClock(cur);
    } else {
      timeCurrentEl.textContent = '--:--';
      timeTotalEl.textContent = '--:--';
    }
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const mm = (h > 0 ? String(m).padStart(2, '0') : String(m));
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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
    offlineHzDirty = true; // 位置が変わったので再計算
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

  // ==== 停止中のHz推定（オフラインFFT） ====
  function computePeakInfoAt(buffer, tSec) {
    if (!buffer || !Number.isFinite(tSec)) return { hz: NaN, peakDb: -Infinity, avgDb: -Infinity };
    const sr = buffer.sampleRate || 44100;
    const N = 4096; // 解析窓
    const minHz = HZ_MIN;
    const maxHz = Math.min(HZ_MAX, sr / 2);
    const start = Math.floor(tSec * sr);
    const re = new Float32Array(N);
    const im = new Float32Array(N);
    const data = buffer.getChannelData(0);
    // 窓関数（Hann）
    for (let n = 0; n < N; n++) {
      const idx = start + n;
      const s = (idx >= 0 && idx < data.length) ? data[idx] : 0;
      const w = 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)));
      re[n] = s * w;
      im[n] = 0;
    }
    fftRadix2(re, im); // in-place FFT
    const binHz = sr / N;
    const minBin = Math.max(1, Math.floor(minHz / binHz));
    const maxBin = Math.min(N / 2 - 1, Math.floor(maxHz / binHz));
    let maxMag = 0;
    let idxMax = -1;
    let sumDb = 0; let count = 0;
    for (let k = minBin; k <= maxBin; k++) {
      const mag = re[k] * re[k] + im[k] * im[k];
      if (mag > maxMag) { maxMag = mag; idxMax = k; }
      const db = 10 * Math.log10(mag + 1e-20);
      sumDb += db; count++;
    }
    if (idxMax < 0 || maxMag < 1e-8) return { hz: NaN, peakDb: -Infinity, avgDb: -Infinity };
    // 近傍補間（線形空間で）
    const magL = (idxMax > 0) ? (re[idxMax - 1] * re[idxMax - 1] + im[idxMax - 1] * im[idxMax - 1]) : maxMag;
    const magC = maxMag;
    const magR = (idxMax + 1 < re.length) ? (re[idxMax + 1] * re[idxMax + 1] + im[idxMax + 1] * im[idxMax + 1]) : maxMag;
    const p = 0.5 * (magL - magR) / (magL - 2 * magC - magR);
    const peakIndex = idxMax + (Number.isFinite(p) ? p : 0);
    const peakHz = peakIndex * binHz;
    const peakDb = 10 * Math.log10(maxMag + 1e-20);
    const avgDb = count ? (sumDb / count) : -Infinity;
    return { hz: peakHz, peakDb, avgDb };
  }

  function fftRadix2(re, im) {
    const n = re.length;
    // ビット反転並べ替え
    for (let i = 0, j = 0; i < n; i++) {
      if (i < j) { const tr = re[i]; const ti = im[i]; re[i] = re[j]; im[i] = im[j]; re[j] = tr; im[j] = ti; }
      let m = n >> 1;
      while (j >= m && m >= 1) { j -= m; m >>= 1; }
      j += m;
    }
    // 段階的バタフライ
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const theta = -2 * Math.PI / size;
      const wpr = Math.cos(theta);
      const wpi = Math.sin(theta);
      for (let i = 0; i < n; i += size) {
        let wr = 1, wi = 0;
        for (let j = 0; j < half; j++) {
          const k = i + j;
          const l = k + half;
          const tr = wr * re[l] - wi * im[l];
          const ti = wr * im[l] + wi * re[l];
          re[l] = re[k] - tr;
          im[l] = im[k] - ti;
          re[k] += tr;
          im[k] += ti;
          const wrn = wr * wpr - wi * wpi;
          wi = wr * wpi + wi * wpr;
          wr = wrn;
        }
      }
    }
  }
})();
