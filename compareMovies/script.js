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

  let url1 = null;
  let url2 = null;
  let overlayTop = 'v2'; // overlay時に前面にくる動画（初期はv2）
  let dragCounter = 0; // dragenter/dragleave の入れ子制御

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function updateButtonsState() {
    const ready = Boolean(v1.src && v2.src);
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
  }

  function pauseBoth() {
    v1.pause();
    v2.pause();
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
    // ボタン状態更新
    updateAudioUI();
    updateButtonsState();
  }

  function applyOverlayState() {
    // 前面の動画を60%透過（= opacity 0.4）にする
    const topIsV2 = overlayTop === 'v2';
    v1.classList.toggle('top', overlayTop === 'v1');
    v2.classList.toggle('top', overlayTop === 'v2');
    v1.style.opacity = overlayTop === 'v1' ? '0.4' : '1';
    v2.style.opacity = overlayTop === 'v2' ? '0.4' : '1';
  }

  function toggleTransparency() {
    if (!videosWrap.classList.contains('overlay')) return; // overlay時のみ有効
    overlayTop = overlayTop === 'v1' ? 'v2' : 'v1';
    applyOverlayState();
  }

  function updateMaxHeight() {
    const header = document.querySelector('.app-header');
    const controls = document.querySelector('.controls');
    const extra = 40; // 余白調整
    const h = window.innerHeight - (header?.offsetHeight || 0) - (controls?.offsetHeight || 0) - extra;
    const maxH = Math.max(180, Math.round(h));
    document.documentElement.style.setProperty('--maxH', maxH + 'px');
  }

  // ===== オーディオ制御 =====
  function updateAudioUI() {
    const muted = v1.muted && v2.muted;
    toggleMuteBtn.textContent = muted ? '音声オン' : '音声オフ';
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

  // Drag & Drop イベント登録（viewer全体）
  viewerEl.addEventListener('dragenter', onDragEnter);
  viewerEl.addEventListener('dragover', onDragOver);
  viewerEl.addEventListener('dragleave', onDragLeave);
  viewerEl.addEventListener('drop', onDrop);

  // ページ離脱時にURL解放
  window.addEventListener('beforeunload', () => { revoke(url1); revoke(url2); });

  // 画面内に収めるための最大高さを更新
  updateMaxHeight();
  window.addEventListener('resize', updateMaxHeight);
  updateButtonsState();
  updateAudioUI();
})();
