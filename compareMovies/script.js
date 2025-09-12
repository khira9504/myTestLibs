(() => {
  const file1 = document.getElementById('file1');
  const file2 = document.getElementById('file2');
  const v1 = document.getElementById('v1');
  const v2 = document.getElementById('v2');
  const videosWrap = document.getElementById('videos');
  const playBothBtn = document.getElementById('playBoth');
  const pauseBothBtn = document.getElementById('pauseBoth');
  const resetBothBtn = document.getElementById('resetBoth');
  const sideBySideBtn = document.getElementById('sideBySide');
  const overlayBtn = document.getElementById('overlay');
  const toggleTransBtn = document.getElementById('toggleTransparency');
  const viewerEl = document.querySelector('.viewer');
  const dropHint = document.getElementById('dropHint');
  const toggleMuteBtn = document.getElementById('toggleMute');
  const volumeSlider = document.getElementById('volume');
  const volDownBtn = document.getElementById('volDown');
  const volUpBtn = document.getElementById('volUp');
  const seekSlider = document.getElementById('seek');
  const alphaSlider = document.getElementById('alpha');

  let url1 = null;
  let url2 = null;
  let overlayTop = 'v2'; // overlay時に前面にくる動画（初期はv2）
  let dragCounter = 0; // dragenter/dragleave の入れ子制御
  let isSeeking = false;

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function updateButtonsState() {
    const ready = Boolean(v1.src && v2.src);
    const anyLoaded = Boolean(v1.src || v2.src);
    const anyPlaying = (!v1.paused && !v1.ended && v1.readyState > 2) || (!v2.paused && !v2.ended && v2.readyState > 2);
    const isOverlay = videosWrap.classList.contains('overlay');
    playBothBtn.disabled = !ready;
    pauseBothBtn.disabled = !ready;
    resetBothBtn.disabled = !ready;
    sideBySideBtn.disabled = !ready;
    overlayBtn.disabled = !ready;
    toggleTransBtn.disabled = !ready || !isOverlay;
    toggleMuteBtn.disabled = !ready;
    volumeSlider.disabled = !ready;
    volDownBtn.disabled = !ready;
    volUpBtn.disabled = !ready;
    seekSlider.disabled = !ready;
    alphaSlider.disabled = !ready || !isOverlay;

    // 再生/一時停止のトグル表示（未準備時は再生ボタンを表示）
    if (!ready) {
      playBothBtn.style.display = '';
      pauseBothBtn.style.display = 'none';
    } else {
      if (anyPlaying) {
        playBothBtn.style.display = 'none';
        pauseBothBtn.style.display = '';
      } else {
        playBothBtn.style.display = '';
        pauseBothBtn.style.display = 'none';
      }
    }

    // D&Dヒントの表示状態更新
    updateDropHints(anyLoaded);
  }

  function toSideBySide() {
    videosWrap.classList.remove('overlay');
    videosWrap.classList.add('side-by-side');
    v1.style.opacity = '1';
    v2.style.opacity = '1';
    v1.classList.remove('top');
    v2.classList.remove('top');
    updateButtonsState();
  }

  function toOverlay() {
    videosWrap.classList.remove('side-by-side');
    videosWrap.classList.add('overlay');
    overlayTop = 'v2';
    applyOverlayState();
    updateButtonsState();
  }

  async function playBoth() {
    if (!v1.src || !v2.src) return;
    try { await Promise.allSettled([v1.play(), v2.play()]); } catch (_) {}
    updateButtonsState();
  }

  function pauseBoth() {
    v1.pause();
    v2.pause();
    updateButtonsState();
  }

  function resetBoth() {
    // 一時停止
    pauseBoth();
    // アップロード動画を削除（URL開放 & src解除）
    try { v1.removeAttribute('src'); v1.load(); } catch (_) {}
    try { v2.removeAttribute('src'); v2.load(); } catch (_) {}
    revoke(url1); revoke(url2);
    url1 = null; url2 = null;
    // ファイル入力をクリア
    try { file1.value = ''; } catch (_) {}
    try { file2.value = ''; } catch (_) {}
    // 表示モードを初期化
    toSideBySide();
    overlayTop = 'v2';
    // オーディオ初期化
    v1.muted = true; v2.muted = true;
    setVolume(1);
    // シーク初期化
    try { seekSlider.value = '0'; } catch (_) {}
    try { alphaSlider.value = '60'; } catch (_) {}
    // ボタン状態更新
    updateAudioUI();
    updateButtonsState();
    updateDropHints(false);
  }

  function applyOverlayState() {
    // 透過率スライダーに基づき、前面の動画を透過
    const transparency = Math.min(100, Math.max(0, Number(alphaSlider.value) || 60)) / 100;
    const topOpacity = 1 - transparency; // 透過率60% => opacity 0.4
    v1.classList.toggle('top', overlayTop === 'v1');
    v2.classList.toggle('top', overlayTop === 'v2');
    v1.style.opacity = overlayTop === 'v1' ? String(topOpacity) : '1';
    v2.style.opacity = overlayTop === 'v2' ? String(topOpacity) : '1';
  }

  function toggleTransparency() {
    if (!videosWrap.classList.contains('overlay')) return; // overlay時のみ有効
    overlayTop = overlayTop === 'v1' ? 'v2' : 'v1';
    applyOverlayState();
  }

  function updateMaxHeight() {
    const header = document.querySelector('.app-header');
    const controls = document.querySelector('.controls');
    const extra = 100; // 余白調整
    const h = window.innerHeight - (header?.offsetHeight || 0) - (controls?.offsetHeight || 0) - extra;
    const maxH = Math.max(180, Math.round(h));
    document.documentElement.style.setProperty('--maxH', maxH + 'px');
  }

  // ===== オーディオ制御 =====
  function updateAudioUI() {
    const muted = v1.muted && v2.muted;
    // 音量アイコンを動的に切替
    if (muted) {
      toggleMuteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <polygon points="3,9 7,9 12,5 12,19 7,15 3,15" fill="currentColor"></polygon>
          <line x1="16" y1="8" x2="20" y2="12" stroke="currentColor" stroke-width="2"></line>
          <line x1="20" y1="8" x2="16" y2="12" stroke="currentColor" stroke-width="2"></line>
        </svg>`;
      toggleMuteBtn.setAttribute('title', '音量オフ（クリックでオン）');
      toggleMuteBtn.setAttribute('aria-label', '音量オフ（クリックでオン）');
    } else {
      toggleMuteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <polygon points="3,9 7,9 12,5 12,19 7,15 3,15" fill="currentColor"></polygon>
          <path d="M15 8 C17 9.5, 17 14.5, 15 16" stroke="currentColor" stroke-width="2" fill="none"></path>
        </svg>`;
      toggleMuteBtn.setAttribute('title', '音量オン（クリックでオフ）');
      toggleMuteBtn.setAttribute('aria-label', '音量オン（クリックでオフ）');
    }
  }

  function setVolume(norm) {
    const vol = Math.min(1, Math.max(0, norm));
    v1.volume = vol;
    v2.volume = vol;
    volumeSlider.value = String(Math.round(vol * 100));
  }

  function stepVolume(delta) {
    const current = Number(volumeSlider.value) / 100;
    setVolume(current + delta);
  }

  // ===== シーク制御 =====
  function dur(v) { return Number.isFinite(v?.duration) ? v.duration : 0; }
  function cur(v) { return Number.isFinite(v?.currentTime) ? v.currentTime : 0; }
  function masterDuration() { return Math.max(dur(v1), dur(v2)); }

  function updateSeekUI() {
    if (isSeeking) return; // ユーザー操作中はUI更新を止める
    const max = masterDuration();
    seekSlider.max = String(max || 0);
    // 進捗は両者の平均（どちらか未読み込みなら読み込み済み側）
    const has1 = dur(v1) > 0; const has2 = dur(v2) > 0;
    const value = has1 && has2 ? (cur(v1) + cur(v2)) / 2 : (has1 ? cur(v1) : cur(v2));
    seekSlider.value = String(Math.min(max || 0, value || 0));
  }

  function seekTo(t) {
    const time = Math.max(0, Number(t) || 0);
    try { v1.currentTime = Math.min(time, dur(v1) || time); } catch(_) {}
    try { v2.currentTime = Math.min(time, dur(v2) || time); } catch(_) {}
  }

  // ===== Drag & Drop =====
  function filesFromEvent(e) {
    const list = Array.from(e.dataTransfer?.files || []);
    return list.filter(f => f.type.startsWith('video/'));
  }

  function loadFileInto(slot, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (slot === 'v1') {
      revoke(url1);
      url1 = url;
      v1.src = url1;
      v1.load();
      v1.muted = true;
      v1.volume = Number(volumeSlider.value) / 100;
    } else {
      revoke(url2);
      url2 = url;
      v2.src = url2;
      v2.load();
      v2.muted = true;
      v2.volume = Number(volumeSlider.value) / 100;
    }
    updateButtonsState();
    updateAudioUI();
  }

  function decideSlotForDrop(e) {
    // どちらも空→位置で判断、どちらか空→空の方、両方埋まっている→位置/ターゲットで判断
    const rect = videosWrap.getBoundingClientRect();
    const leftHalf = e.clientX < rect.left + rect.width / 2;
    const target = e.target;
    if (!v1.src && v2.src) return 'v1';
    if (!v2.src && v1.src) return 'v2';
    if (!v1.src && !v2.src) return leftHalf ? 'v1' : 'v2';
    // 両方埋まっている場合、ターゲット優先
    if (target && target.id === 'v1') return 'v1';
    if (target && target.id === 'v2') return 'v2';
    if (target && target.closest) {
      if (target.closest('#v1')) return 'v1';
      if (target.closest('#v2')) return 'v2';
    }
    return leftHalf ? 'v1' : 'v2';
  }

  function onDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    viewerEl.classList.add('dragover');
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    viewerEl.classList.add('dragover');
  }
  function onDragLeave(e) {
    e.preventDefault();
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) viewerEl.classList.remove('dragover');
  }
  function onDrop(e) {
    e.preventDefault();
    dragCounter = 0;
    viewerEl.classList.remove('dragover');
    const vids = filesFromEvent(e);
    if (vids.length === 0) return;
    if (vids.length >= 2) {
      loadFileInto('v1', vids[0]);
      loadFileInto('v2', vids[1]);
      return;
    }
    const slot = decideSlotForDrop(e);
    loadFileInto(slot, vids[0]);
  }

  // ファイル変更ハンドラ
  file1.addEventListener('change', () => {
    const f = file1.files?.[0];
    if (!f) return;
    revoke(url1);
    url1 = URL.createObjectURL(f);
    v1.src = url1;
    v1.load();
    // 音量/ミュート状態を同期
    v1.muted = true;
    v1.volume = Number(volumeSlider.value) / 100;
    updateButtonsState();
    updateAudioUI();
    v1.addEventListener('loadedmetadata', updateSeekUI, { once: true });
    updateDropHints(true);
  });

  file2.addEventListener('change', () => {
    const f = file2.files?.[0];
    if (!f) return;
    revoke(url2);
    url2 = URL.createObjectURL(f);
    v2.src = url2;
    v2.load();
    // 音量/ミュート状態を同期
    v2.muted = true;
    v2.volume = Number(volumeSlider.value) / 100;
    updateButtonsState();
    updateAudioUI();
    v2.addEventListener('loadedmetadata', updateSeekUI, { once: true });
    updateDropHints(true);
  });

  // ボタン
  playBothBtn.addEventListener('click', playBoth);
  pauseBothBtn.addEventListener('click', pauseBoth);
  resetBothBtn.addEventListener('click', resetBoth);
  sideBySideBtn.addEventListener('click', toSideBySide);
  overlayBtn.addEventListener('click', toOverlay);
  toggleTransBtn.addEventListener('click', toggleTransparency);
  toggleMuteBtn.addEventListener('click', () => {
    const nextMuted = !(v1.muted && v2.muted);
    v1.muted = !nextMuted ? false : true;
    v2.muted = !nextMuted ? false : true;
    updateAudioUI();
  });
  volumeSlider.addEventListener('input', (e) => {
    const val = Number(volumeSlider.value);
    setVolume(val / 100);
    // 音量が0より大きければ自動でミュート解除（利便性）
    if (val > 0 && v1.muted && v2.muted) {
      v1.muted = false; v2.muted = false; updateAudioUI();
    }
  });
  volDownBtn.addEventListener('click', () => stepVolume(-0.1));
  volUpBtn.addEventListener('click', () => stepVolume(+0.1));

  // シークバー操作
  seekSlider.addEventListener('mousedown', () => { isSeeking = true; });
  document.addEventListener('mouseup', () => { if (isSeeking) { isSeeking = false; } });
  seekSlider.addEventListener('input', () => { isSeeking = true; seekTo(Number(seekSlider.value)); });
  seekSlider.addEventListener('change', () => { isSeeking = false; seekTo(Number(seekSlider.value)); });

  // 透過率スライダー
  alphaSlider.addEventListener('input', () => { if (videosWrap.classList.contains('overlay')) applyOverlayState(); });

  // Drag & Drop イベント登録（viewer全体）
  viewerEl.addEventListener('dragenter', onDragEnter);
  viewerEl.addEventListener('dragover', onDragOver);
  viewerEl.addEventListener('dragleave', onDragLeave);
  viewerEl.addEventListener('drop', onDrop);

  // 再生中の進捗反映
  v1.addEventListener('timeupdate', updateSeekUI);
  v2.addEventListener('timeupdate', updateSeekUI);

  // 再生/一時停止状態の変化でボタン表示を更新
  ['play','pause','ended','seeking','seeked'].forEach(ev => {
    v1.addEventListener(ev, updateButtonsState);
    v2.addEventListener(ev, updateButtonsState);
  });

  // ページ離脱時にURL解放
  window.addEventListener('beforeunload', () => { revoke(url1); revoke(url2); });

  // 画面内に収めるための最大高さを更新
  updateMaxHeight();
  window.addEventListener('resize', updateMaxHeight);
  updateButtonsState();
  updateAudioUI();
  updateSeekUI();

  // ===== D&Dヒントの表示制御 =====
  function updateDropHints(loaded) {
    const isLoaded = typeof loaded === 'boolean' ? loaded : Boolean(v1.src || v2.src);
    viewerEl.classList.toggle('loaded', isLoaded);
  }
  updateDropHints(false);
})();
