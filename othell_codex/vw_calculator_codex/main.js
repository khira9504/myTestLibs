(() => {
  const $ = (id) => document.getElementById(id);

  const DECIMALS = 4; // 固定

  const els = {
    baseWidth: $("baseWidth"),
    cssPxInput: $("cssPxInput"),
    cssVwOutput: $("cssVwOutput"),
    copyCssVw: $("copyCssVw"),
    cssVwInput: $("cssVwInput"),
    cssPxOutput: $("cssPxOutput"),
    copyCssPx: $("copyCssPx"),
  };

  const getBaseWidth = () => {
    const v = parseInt(els.baseWidth.value, 10);
    return Number.isFinite(v) && v > 0 ? v : NaN;
  };

  const roundTo = (value, decimals = DECIMALS) => {
    if (!Number.isFinite(value)) return NaN;
    const m = Math.pow(10, decimals);
    return Math.round(value * m) / m;
  };

  const enableCopyIf = (btn, ok) => { btn.disabled = !ok; };

  const convertCssPxToVw = (text, base) => {
    if (!text) return "";
    const re = /(-?\d*\.?\d+)\s*px\b/gi;
    return text.replace(re, (_, num) => {
      const px = parseFloat(num);
      const vw = roundTo((px / base) * 100, DECIMALS);
      return `${vw.toFixed(DECIMALS)}vw`;
    });
  };

  const convertCssVwToPx = (text, base) => {
    if (!text) return "";
    const re = /(-?\d*\.?\d+)\s*vw\b/gi;
    return text.replace(re, (_, num) => {
      const vw = parseFloat(num);
      const px = roundTo((vw / 100) * base, DECIMALS);
      return `${px.toFixed(DECIMALS)}px`;
    });
  };

  const synthesizePxToVw = () => {
    const base = getBaseWidth();
    if (!Number.isFinite(base)) {
      els.cssVwOutput.value = "";
      enableCopyIf(els.copyCssVw, false);
      return;
    }
    const out = convertCssPxToVw(els.cssPxInput.value, base);
    els.cssVwOutput.value = out;
    enableCopyIf(els.copyCssVw, !!out);
  };

  const synthesizeVwToPx = () => {
    const base = getBaseWidth();
    if (!Number.isFinite(base)) {
      els.cssPxOutput.value = "";
      enableCopyIf(els.copyCssPx, false);
      return;
    }
    const out = convertCssVwToPx(els.cssVwInput.value, base);
    els.cssPxOutput.value = out;
    enableCopyIf(els.copyCssPx, !!out);
  };

  const saveBaseWidth = () => {
    try { localStorage.setItem("vwcalc.baseWidth", String(getBaseWidth() || "")); } catch (_) {}
  };
  const loadBaseWidth = () => {
    try {
      const v = localStorage.getItem("vwcalc.baseWidth");
      if (v) els.baseWidth.value = v;
    } catch (_) {}
  };

  const copyText = async (text, btn) => {
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = "コピー済み";
      btn.disabled = true;
      setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
    } catch (e) { console.warn("clipboard error", e); }
  };

  // Events
  ["input", "change"].forEach((evt) => {
    els.baseWidth.addEventListener(evt, () => { saveBaseWidth(); synthesizePxToVw(); synthesizeVwToPx(); });
  });
  els.cssPxInput.addEventListener("input", synthesizePxToVw);
  els.cssVwInput.addEventListener("input", synthesizeVwToPx);
  els.copyCssVw.addEventListener("click", () => { if (els.cssVwOutput.value) copyText(els.cssVwOutput.value, els.copyCssVw); });
  els.copyCssPx.addEventListener("click", () => { if (els.cssPxOutput.value) copyText(els.cssPxOutput.value, els.copyCssPx); });

  // Init
  loadBaseWidth();
  synthesizePxToVw();
  synthesizeVwToPx();
})();
