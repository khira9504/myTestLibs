(() => {
  const $ = (sel) => document.querySelector(sel);
  const leftUrl = $('#left-url');
  const rightUrl = $('#right-url');
  const leftLoad = $('#left-load');
  const rightLoad = $('#right-load');
  const leftFrame = $('#left-frame');
  const rightFrame = $('#right-frame');
  const btnPc = $('#btn-pc');
  const btnSp = $('#btn-sp');
  const syncToggle = $('#sync-toggle');
  const leftSizeLabel = $('#left-size');
  const rightSizeLabel = $('#right-size');

  // 現在のフレーム幅（px）を管理
  let currentWidth = 1920;
  updateSizeLabels();

  // 片側読み込み
  leftLoad.addEventListener('click', () => loadFrame('left', leftUrl.value));
  rightLoad.addEventListener('click', () => loadFrame('right', rightUrl.value));

  leftUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadFrame('left', leftUrl.value);
  });
  rightUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadFrame('right', rightUrl.value);
  });

  // 幅切り替え
  btnPc.addEventListener('click', () => setFrameWidth(1920));
  btnSp.addEventListener('click', () => setFrameWidth(375));

  function setFrameWidth(px) {
    currentWidth = px;
    document.documentElement.style.setProperty('--frame-width', `${px}px`);
    updateSizeLabels();
  }
  function updateSizeLabels() {
    leftSizeLabel.textContent = `${currentWidth}px`;
    rightSizeLabel.textContent = `${currentWidth}px`;
  }

  function normalizeUrl(u) {
    if (!u) return '';
    try {
      // 既にスキーム付き
      return new URL(u).toString();
    } catch {
      // スキーム無しは https を付加
      try {
        return new URL(`https://${u}`).toString();
      } catch {
        return '';
      }
    }
  }

  function proxied(url) {
    return `/proxy?url=${encodeURIComponent(url)}`;
  }

  function loadFrame(side, inputUrl) {
    const url = normalizeUrl(inputUrl);
    if (!url) return;
    const frame = side === 'left' ? leftFrame : rightFrame;
    // 読み込み前にリスナー解除
    detachScrollListeners();
    frame.src = proxied(url);
    frame.addEventListener('load', onFrameLoadOnce, { once: true });
  }

  // 同期スクロール実装
  let isSyncing = false;

  function onFrameLoadOnce() {
    // 両方のiframeが読み込まれたタイミングで同期を再アタッチ
    // 片方ずつでも随時アタッチできるよう個別にも呼ぶ
    attachScrollListeners();
  }

  function attachScrollListeners() {
    detachScrollListeners();
    tryAttach(leftFrame, 'left');
    tryAttach(rightFrame, 'right');
  }

  function detachScrollListeners() {
    // 動的に付け外しするため、一旦古いハンドラを無効化（匿名関数につきリロードで解消）
    // ここでは特別な処理は不要
  }

  function tryAttach(frame, side) {
    if (!frame || !frame.contentWindow || !frame.contentDocument) return;
    try {
      const win = frame.contentWindow;
      win.addEventListener('scroll', () => onScroll(side), { passive: true });
    } catch (e) {
      // 同一オリジンでない場合例外になるが、/proxy を通せばOK
      // 何もしない
    }
  }

  function onScroll(source) {
    if (!syncToggle.checked) return;
    if (isSyncing) return;

    const srcWin = source === 'left' ? leftFrame.contentWindow : rightFrame.contentWindow;
    const dstWin = source === 'left' ? rightFrame.contentWindow : leftFrame.contentWindow;
    if (!srcWin || !dstWin) return;

    try {
      const sMax = scrollMax(srcWin);
      const dMax = scrollMax(dstWin);
      if (sMax <= 0 || dMax < 0) return;
      const ratio = sMax === 0 ? 0 : srcWin.scrollY / sMax;
      const target = Math.round(ratio * dMax);
      isSyncing = true;
      dstWin.scrollTo({ top: target, behavior: 'auto' });
    } catch (e) {
      // アクセス不可（クロスオリジン）の場合は何もしない
    } finally {
      // 次のtickで解除
      setTimeout(() => (isSyncing = false), 0);
    }
  }

  function scrollMax(win) {
    // ドキュメントのスクロール可能高さを計算
    const doc = win.document;
    const el = doc.documentElement;
    const body = doc.body;
    const scrollHeight = Math.max(
      el ? el.scrollHeight : 0,
      body ? body.scrollHeight : 0
    );
    const innerH = win.innerHeight || (el ? el.clientHeight : 0);
    return Math.max(0, scrollHeight - innerH);
  }

  // デモ用の初期値
  leftUrl.value = 'https://example.com';
  rightUrl.value = 'https://example.org';
  // 自動読み込みは安全のため手動にとどめる
})();

