/* play.js — Type Playground
   Drives Recursive's five axes (wght, slnt, CASL, MONO, CRSV) plus
   size / leading / tracking, live-updates the preview, and prints
   copy-pasteable CSS. No libraries. */
(() => {
  "use strict";

  const AXES = {
    wght: { min: 300, max: 1000, step: 1, def: 400, label: "무게 <b>wght</b>" },
    slnt: { min: -15, max: 0,    step: 1, def: 0,   label: "기울기 <b>slnt</b>" },
    CASL: { min: 0,   max: 1, step: 0.01, def: 0,   label: "손글씨 <b>CASL</b>" },
    MONO: { min: 0,   max: 1, step: 0.01, def: 0,   label: "모노 <b>MONO</b>" },
    CRSV: { min: 0,   max: 1, step: 0.01, def: 0,   label: "필기체 <b>CRSV</b>" },
  };
  const PROPS = {
    size:     { min: 20,    max: 160,  step: 1,    def: 68,   unit: "px",  label: "크기" },
    leading:  { min: 0.85,  max: 1.9,  step: 0.01, def: 1.06, unit: "",    label: "행간" },
    tracking: { min: -0.05, max: 0.16, step: 0.005,def: 0,    unit: "em",  label: "자간" },
  };

  const PRESETS = {
    "그로테스크": { wght: 520, slnt: 0,  CASL: 0,    MONO: 0, CRSV: 0, size: 72,  leading: 1.05, tracking: -0.01 },
    "에디토리얼": { wght: 360, slnt: -2, CASL: 0.18, MONO: 0, CRSV: 0, size: 84,  leading: 1.08, tracking: -0.015 },
    "코드":       { wght: 460, slnt: 0,  CASL: 0,    MONO: 1, CRSV: 0, size: 52,  leading: 1.5,  tracking: 0 },
    "손글씨":     { wght: 480, slnt: -9, CASL: 1,    MONO: 0, CRSV: 1, size: 76,  leading: 1.1,  tracking: 0 },
    "디스플레이": { wght: 940, slnt: 0,  CASL: 0.35, MONO: 0, CRSV: 0, size: 118, leading: 0.98, tracking: -0.025 },
  };

  const state = {};
  Object.keys(AXES).forEach((k) => (state[k] = AXES[k].def));
  Object.keys(PROPS).forEach((k) => (state[k] = PROPS[k].def));

  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const round = (v, s) => Math.round(v / s) * s;

  const preview = $("#tp-preview");
  const panel = $("#tp-sliders");
  const pad = $("#tp-pad");
  const knob = $("#tp-knob");
  const out = $("#tp-css");
  const presetWrap = $("#tp-presets");

  // ---- build sliders ----
  const sliders = {};
  const all = { ...AXES, ...PROPS };
  Object.keys(all).forEach((key) => {
    if (key === "wght" || key === "slnt") return; // driven by the xy pad
    const cfg = all[key];
    const el = document.createElement("div");
    el.className = "tp-ctrl";
    el.innerHTML =
      `<div class="row"><label>${cfg.label || key}</label><span class="val" data-val="${key}"></span></div>
       <input type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${state[key]}" data-axis="${key}" aria-label="${(cfg.label||key).replace(/<[^>]+>/g,'')}">`;
    panel.appendChild(el);
    sliders[key] = el.querySelector("input");
    sliders[key].addEventListener("input", (e) => {
      state[key] = parseFloat(e.target.value);
      setActivePreset(null);
      render();
    });
  });

  // ---- presets ----
  Object.keys(PRESETS).forEach((name) => {
    const b = document.createElement("button");
    b.className = "tp-preset";
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => {
      tweenTo(PRESETS[name]);
      setActivePreset(b);
    });
    presetWrap.appendChild(b);
  });
  function setActivePreset(btn) {
    presetWrap.querySelectorAll(".tp-preset").forEach((b) => b.classList.toggle("active", b === btn));
  }

  // ---- xy pad (x: wght, y: slnt) ----
  let dragging = false;
  function padFromEvent(e) {
    const r = pad.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, 0, 1);
    const py = clamp((e.clientY - r.top) / r.height, 0, 1);
    state.wght = round(AXES.wght.min + px * (AXES.wght.max - AXES.wght.min), 1);
    state.slnt = round(AXES.slnt.max - py * (AXES.slnt.max - AXES.slnt.min), 1); // top = 0, bottom = -15
    setActivePreset(null);
    render();
  }
  pad.addEventListener("pointerdown", (e) => { dragging = true; pad.setPointerCapture(e.pointerId); padFromEvent(e); });
  pad.addEventListener("pointermove", (e) => { if (dragging) padFromEvent(e); });
  pad.addEventListener("pointerup", () => { dragging = false; });
  pad.addEventListener("pointercancel", () => { dragging = false; });
  // keyboard support on the pad
  pad.setAttribute("tabindex", "0");
  pad.setAttribute("role", "slider");
  pad.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowLeft")  state.wght = clamp(state.wght - 20, 300, 1000);
    else if (k === "ArrowRight") state.wght = clamp(state.wght + 20, 300, 1000);
    else if (k === "ArrowUp")   state.slnt = clamp(state.slnt + 1, -15, 0);
    else if (k === "ArrowDown") state.slnt = clamp(state.slnt - 1, -15, 0);
    else return;
    e.preventDefault(); setActivePreset(null); render();
  });

  // ---- actions ----
  $("#tp-random").addEventListener("click", () => {
    const t = {};
    Object.keys(AXES).forEach((k) => (t[k] = round(AXES[k].min + Math.random() * (AXES[k].max - AXES[k].min), AXES[k].step)));
    t.size = state.size; t.leading = state.leading; t.tracking = state.tracking;
    tweenTo(t); setActivePreset(null);
  });
  $("#tp-reset").addEventListener("click", () => {
    const t = {};
    Object.keys(all).forEach((k) => (t[k] = all[k].def));
    tweenTo(t); setActivePreset(null);
  });
  $("#tp-copy").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(cssText());
      e.target.textContent = "복사됨 ✓"; e.target.classList.add("ok");
      setTimeout(() => { e.target.textContent = "복사"; e.target.classList.remove("ok"); }, 1400);
    } catch (_) {}
  });

  // ---- tween between states ----
  let raf = null;
  function tweenTo(target) {
    const from = { ...state };
    const keys = Object.keys(target);
    const t0 = performance.now();
    const dur = 560;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    if (raf) cancelAnimationFrame(raf);
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = ease(p);
      keys.forEach((k) => (state[k] = from[k] + (target[k] - from[k]) * e));
      render();
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // ---- render ----
  const fmt = (v, step) => (step >= 1 ? Math.round(v) : (Math.round(v / step) * step).toFixed(String(step).split(".")[1]?.length || 2));

  function fvs() {
    return `"wght" ${Math.round(state.wght)}, "slnt" ${Math.round(state.slnt)}, "CASL" ${state.CASL.toFixed(2)}, "MONO" ${state.MONO.toFixed(2)}, "CRSV" ${state.CRSV >= 0.5 ? 1 : 0}`;
  }
  function cssText() {
    return [
      `font-family: "Recursive", sans-serif;`,
      `font-variation-settings: ${fvs()};`,
      `font-size: ${Math.round(state.size)}px;`,
      `line-height: ${state.leading.toFixed(2)};`,
      `letter-spacing: ${state.tracking.toFixed(3)}em;`,
    ].join("\n");
  }

  function render() {
    preview.style.fontVariationSettings = fvs();
    preview.style.fontSize = state.size + "px";
    preview.style.lineHeight = state.leading.toFixed(3);
    preview.style.letterSpacing = state.tracking.toFixed(3) + "em";

    // sliders + value labels
    Object.keys(sliders).forEach((k) => {
      sliders[k].value = state[k];
      const label = panel.querySelector(`[data-val="${k}"]`);
      if (label) label.textContent = fmt(state[k], all[k].step) + (all[k].unit || "");
    });

    // xy knob
    const px = (state.wght - AXES.wght.min) / (AXES.wght.max - AXES.wght.min);
    const py = (AXES.slnt.max - state.slnt) / (AXES.slnt.max - AXES.slnt.min);
    knob.style.left = px * 100 + "%";
    knob.style.top = py * 100 + "%";
    pad.setAttribute("aria-valuetext", `무게 ${Math.round(state.wght)}, 기울기 ${Math.round(state.slnt)}`);

    // css panel (highlight axis line)
    out.innerHTML = cssText().replace(/font-variation-settings/, '<span class="k">font-variation-settings</span>');
  }

  render();
})();
