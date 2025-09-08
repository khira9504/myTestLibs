(() => {
  const $ = (id) => document.getElementById(id);

  const MAX_DECIMALS = 6; // 表示は最大6桁（7桁目を四捨五入）

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

  const roundTo6 = (value) => {
    if (!Number.isFinite(value)) return NaN;
    const m = 1e6;
    return Math.round(value * m) / m;
  };

  const formatNum = (value) => {
    const r = roundTo6(value);
    if (!Number.isFinite(r)) return "";
    // toFixed(6) で丸め、末尾の0や小数点を削除
    let s = r.toFixed(MAX_DECIMALS);
    s = s.replace(/\.0+$/, ""); // 小数が .0 のみの場合の早期処理
    if (s.includes('.')) s = s.replace(/0+$/, "").replace(/\.$/, "");
    if (s === "-0") s = "0";
    return s;
  };

  const enableCopyIf = (btn, ok) => { btn.disabled = !ok; };

  const convertCssPxToVw = (text, base) => {
    if (!text) return "";
    const re = /(-?\d*\.?\d+)\s*px\b/gi;
    return text.replace(re, (_, num) => {
      const px = parseFloat(num);
      const vw = (px / base) * 100;
      return `${formatNum(vw)}vw`;
    });
  };

  const convertCssVwToPx = (text, base) => {
    if (!text) return "";
    const re = /(-?\d*\.?\d+)\s*vw\b/gi;
    return text.replace(re, (_, num) => {
      const vw = parseFloat(num);
      const px = (vw / 100) * base;
      return `${formatNum(px)}px`;
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
