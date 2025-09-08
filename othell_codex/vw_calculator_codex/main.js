(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    baseWidth: $("baseWidth"),
    decimals: $("decimals"),
    roundMode: $("roundMode"),
    pxInput: $("pxInput"),
    vwInput: $("vwInput"),
    vwResult: $("vwResult"),
    pxResult: $("pxResult"),
    vwSnippet: $("vwSnippet"),
    pxSnippet: $("pxSnippet"),
    copyVw: $("copyVw"),
    copyPx: $("copyPx"),
  };

  const toHalfWidth = (str) => str.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  const parseTextNumber = (value) => {
    if (typeof value !== "string") return NaN;
    const s = toHalfWidth(value).trim()
      .replace(/[，,]/g, ".")
      .replace(/[＾^]/g, "")
      .replace(/[^0-9+\-\.eE]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const getBaseWidth = () => {
    const v = parseInt(els.baseWidth.value, 10);
    return Number.isFinite(v) && v > 0 ? v : NaN;
  };

  const getDecimals = () => {
    const d = parseInt(els.decimals.value, 10);
    if (!Number.isFinite(d)) return 4;
    return Math.min(10, Math.max(0, d));
  };

  const getRoundMode = () => (els.roundMode.value || "round");

  const roundBy = (value, decimals, mode) => {
    const m = Math.pow(10, decimals);
    if (!Number.isFinite(value)) return NaN;
    switch (mode) {
      case "floor": return Math.floor(value * m) / m;
      case "ceil": return Math.ceil(value * m) / m;
      default: return Math.round(value * m) / m; // round
    }
  };

  const formatUnit = (n, unit) => Number.isFinite(n) ? `${n}${unit}` : "-";
  const enableCopyIf = (btn, ok) => { btn.disabled = !ok; };

  const computeVw = (px, base) => (px / base) * 100;
  const computePx = (vw, base) => (vw / 100) * base;

  const renderPxToVw = () => {
    const base = getBaseWidth();
    const decimals = getDecimals();
    const mode = getRoundMode();
    const px = parseTextNumber(els.pxInput.value);

    if (!Number.isFinite(base) || !Number.isFinite(px)) {
      els.vwResult.textContent = "-";
      els.vwSnippet.textContent = "-";
      enableCopyIf(els.copyVw, false);
      return;
    }

    const vwRaw = computeVw(px, base);
    const vw = roundBy(vwRaw, decimals, mode);
    els.vwResult.textContent = formatUnit(vw, "vw");
    els.vwSnippet.textContent = formatUnit(vw, "vw");
    enableCopyIf(els.copyVw, Number.isFinite(vw));
  };

  const renderVwToPx = () => {
    const base = getBaseWidth();
    const decimals = getDecimals();
    const mode = getRoundMode();
    const vw = parseTextNumber(els.vwInput.value);

    if (!Number.isFinite(base) || !Number.isFinite(vw)) {
      els.pxResult.textContent = "-";
      els.pxSnippet.textContent = "-";
      enableCopyIf(els.copyPx, false);
      return;
    }

    const pxRaw = computePx(vw, base);
    const px = roundBy(pxRaw, decimals, mode);
    els.pxResult.textContent = formatUnit(px, "px");
    els.pxSnippet.textContent = formatUnit(px, "px");
    enableCopyIf(els.copyPx, Number.isFinite(px));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("vwcalc.settings", JSON.stringify({
        baseWidth: getBaseWidth(),
        decimals: getDecimals(),
        roundMode: getRoundMode(),
      }));
    } catch (_) {}
  };

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem("vwcalc.settings");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Number.isFinite(s.baseWidth) && s.baseWidth > 0) els.baseWidth.value = String(s.baseWidth);
      if (Number.isFinite(s.decimals)) els.decimals.value = String(Math.min(10, Math.max(0, s.decimals)));
      if (typeof s.roundMode === "string") els.roundMode.value = s.roundMode;
    } catch (_) {}
  };

  const copyText = async (text, btn) => {
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = "コピー済み";
      btn.disabled = true;
      setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
    } catch (e) {
      console.warn("clipboard error", e);
    }
  };

  // Events
  ["input", "change"].forEach((evt) => {
    els.baseWidth.addEventListener(evt, () => { saveSettings(); renderPxToVw(); renderVwToPx(); });
    els.decimals.addEventListener(evt, () => { saveSettings(); renderPxToVw(); renderVwToPx(); });
    els.roundMode.addEventListener(evt, () => { saveSettings(); renderPxToVw(); renderVwToPx(); });
  });

  els.pxInput.addEventListener("input", renderPxToVw);
  els.vwInput.addEventListener("input", renderVwToPx);

  els.copyVw.addEventListener("click", () => {
    const t = els.vwResult.textContent || "";
    if (t !== "-") copyText(t, els.copyVw);
  });
  els.copyPx.addEventListener("click", () => {
    const t = els.pxResult.textContent || "";
    if (t !== "-") copyText(t, els.copyPx);
  });

  // Init
  loadSettings();
  renderPxToVw();
  renderVwToPx();
})();

