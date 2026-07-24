/* critters.js — 페이지를 자유롭게 돌아다니는 작은 동물 친구들.
   순수 JS·SVG, 의존성 0. 마우스와 상호작용하고, 페이지를 옮겨도
   sessionStorage로 위치가 이어집니다. 우하단 발자국 버튼으로 켜고 끕니다.
   prefers-reduced-motion이면 조용히 앉아만 있습니다. */
(() => {
  "use strict";
  if (window.__critters) return;
  window.__critters = true;

  const KEY_STATE = "critters:v1";       // sessionStorage — 위치 이어받기
  const KEY_PREF = "critters:on";         // localStorage — 켜짐/꺼짐
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  /* ---------------- 스타일 주입 ---------------- */
  const css = `
  .critters-layer{position:fixed;inset:0;pointer-events:none;z-index:55;overflow:hidden;contain:layout size style;}
  /* 놀이터 배경 — 은은하게, 콘텐츠 뒤가 아니라 레이어 안(투명·클릭통과) */
  .cr-scene{position:absolute;inset:0;pointer-events:none;}
  .cr-ground{position:absolute;left:0;right:0;bottom:0;height:96px;
    background:linear-gradient(to top,rgba(120,168,120,.16),rgba(120,168,120,.05) 55%,transparent);}
  :root[data-theme="dark"] .cr-ground{background:linear-gradient(to top,rgba(90,150,110,.14),rgba(90,150,110,.04) 55%,transparent);}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cr-ground{background:linear-gradient(to top,rgba(90,150,110,.14),rgba(90,150,110,.04) 55%,transparent);}}
  .cr-paws{position:absolute;inset:auto 0 0 0;height:120px;opacity:.5;
    background-repeat:repeat-x;background-position:left bottom;background-size:220px 120px;}
  .cr-prop{position:absolute;bottom:14px;opacity:.85;}
  .cr-prop.bush{left:4%;width:70px;height:46px;}
  .cr-prop.tree{right:5%;width:66px;height:96px;bottom:14px;}
  .cr-prop.ball{left:64%;width:22px;height:22px;bottom:16px;}
  @media (max-width:640px){.cr-prop.ball{display:none;}.cr-ground,.cr-paws{height:76px;}}
  /* 밤(다크): 발자국이 옅어지고 방석이 깔림 */
  .critters-layer.is-night .cr-paws{opacity:.24;}
  .critters-layer.is-night .cr-prop.ball{opacity:.35;}
  .cr-beds{position:absolute;inset:0;}
  .cr-bed{position:absolute;bottom:12px;width:66px;height:30px;transform:translateX(-50%);opacity:.92;}
  .cr-bed svg{width:100%;height:100%;display:block;}
  .critter.sleeping .leg{animation:none!important;}
  .critter.sleeping .tail{animation-duration:2.6s;}
  .critter.sleeping .body-bob{animation:cr-breathe 2.9s infinite ease-in-out!important;}
  @keyframes cr-breathe{0%,100%{transform:translateY(0) scaleY(1);}50%{transform:translateY(1px) scaleY(.95);}}
  .critter .emote.zzz{font-size:13px;}
  .critter{position:absolute;width:46px;height:38px;will-change:transform;transform:translate3d(0,0,0);}
  .critter svg{width:100%;height:100%;overflow:visible;display:block;
    filter:drop-shadow(0 1.5px 1.5px rgba(30,25,18,.18));}
  :root[data-theme="dark"] .critter svg{
    filter:drop-shadow(0 0 1.5px rgba(237,231,218,.35)) drop-shadow(0 1px 1px rgba(0,0,0,.5));}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .critter svg{
    filter:drop-shadow(0 0 1.5px rgba(237,231,218,.35)) drop-shadow(0 1px 1px rgba(0,0,0,.5));}}
  .critter .cr-flip{transform-origin:50% 50%;transition:transform .18s ease;}
  .critter .leg{transform-origin:top center;}
  .critter.walk .leg-a{animation:cr-step .34s infinite ease-in-out;}
  .critter.walk .leg-b{animation:cr-step .34s infinite ease-in-out reverse;}
  .critter .tail{transform-origin:left center;animation:cr-wag 1.1s infinite ease-in-out;}
  .critter .body-bob{transform-origin:50% 100%;}
  .critter.walk .body-bob{animation:cr-bob .34s infinite ease-in-out;}
  .critter .emote{opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s;
    font-size:15px;position:absolute;left:50%;top:-16px;transform-origin:center;pointer-events:none;}
  .critter.emoting .emote{opacity:1;transform:translate(-50%,-2px);}
  @keyframes cr-step{0%,100%{transform:rotate(11deg);}50%{transform:rotate(-11deg);}}
  @keyframes cr-wag{0%,100%{transform:rotate(-8deg);}50%{transform:rotate(14deg);}}
  @keyframes cr-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-1.5px);}}
  .critter.hop{animation:cr-hop .5s ease;}
  @keyframes cr-hop{0%{transform:translateY(0);}30%{transform:translateY(-16px);}60%{transform:translateY(0);}80%{transform:translateY(-5px);}100%{transform:translateY(0);}}
  .critters-toggle{position:fixed;left:16px;bottom:16px;z-index:56;width:38px;height:38px;
    border-radius:50%;display:grid;place-items:center;background:var(--bg-elev,#fff);
    border:1px solid var(--line-2,#d8cfbd);color:var(--ink-3,#8a8172);font-size:16px;line-height:1;
    box-shadow:0 2px 8px rgba(30,25,18,.12);cursor:pointer;transition:color .2s,border-color .2s,transform .2s;}
  .critters-toggle:hover{color:var(--accent,#db4322);border-color:var(--accent,#db4322);transform:translateY(-1px) rotate(-8deg);}
  .critters-toggle[aria-pressed="false"]{opacity:.55;}
  @media print{.critters-layer,.critters-toggle{display:none!important;}}
  @media (max-width:640px){.critters-toggle{left:12px;bottom:12px;}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------- SVG 스프라이트 ----------------
     각 종은 색만 파라미터로 받는다. 다리 4개(leg-a/leg-b 교차), 꼬리, 몸통. */
  function dogSVG(c) {
    return `<svg viewBox="0 0 46 38" fill="none">
      <g class="body-bob">
        <path class="tail" d="M8 20 C2 16 1 12 4 11" stroke="${c.d}" stroke-width="3.4" stroke-linecap="round"/>
        <g class="leg leg-a"><rect x="12" y="24" width="3.4" height="10" rx="1.7" fill="${c.d}"/></g>
        <g class="leg leg-b"><rect x="30" y="24" width="3.4" height="10" rx="1.7" fill="${c.d}"/></g>
        <g class="leg leg-b"><rect x="17" y="25" width="3.4" height="9" rx="1.7" fill="${c.b}"/></g>
        <g class="leg leg-a"><rect x="25" y="25" width="3.4" height="9" rx="1.7" fill="${c.b}"/></g>
        <rect x="10" y="15" width="26" height="13" rx="6.5" fill="${c.b}"/>
        <circle cx="35" cy="15" r="7.5" fill="${c.b}"/>
        <path d="M35 10 C40 8 43 10 41 15" fill="${c.d}"/>
        <ellipse cx="41" cy="16.5" rx="2.4" ry="2" fill="${c.d}"/>
        <circle cx="37.5" cy="14" r="1.1" fill="#1a1712"/>
        <circle cx="41.6" cy="16" r=".9" fill="#1a1712"/>
      </g>
      <div class="emote">‼</div></svg>`;
  }
  function catSVG(c) {
    return `<svg viewBox="0 0 46 38" fill="none">
      <g class="body-bob">
        <path class="tail" d="M8 22 C1 20 0 12 6 10" stroke="${c.b}" stroke-width="3.2" stroke-linecap="round"/>
        <g class="leg leg-a"><rect x="12" y="25" width="3" height="9" rx="1.5" fill="${c.d}"/></g>
        <g class="leg leg-b"><rect x="29" y="25" width="3" height="9" rx="1.5" fill="${c.d}"/></g>
        <g class="leg leg-b"><rect x="17" y="26" width="3" height="8" rx="1.5" fill="${c.b}"/></g>
        <g class="leg leg-a"><rect x="24" y="26" width="3" height="8" rx="1.5" fill="${c.b}"/></g>
        <rect x="11" y="17" width="24" height="11" rx="5.5" fill="${c.b}"/>
        <circle cx="34" cy="16" r="6.6" fill="${c.b}"/>
        <path d="M29 11 L31 5 L34.5 10 Z" fill="${c.b}"/>
        <path d="M39 11 L38 5 L34.5 10 Z" fill="${c.b}"/>
        <circle cx="32" cy="15.5" r="1" fill="#1a1712"/>
        <circle cx="36.5" cy="15.5" r="1" fill="#1a1712"/>
        <path d="M34.2 18 l1.2 1" stroke="${c.d}" stroke-width="1" stroke-linecap="round"/>
      </g>
      <div class="emote">?</div></svg>`;
  }

  /* 놀이터 소품 SVG */
  const PAW = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120">` +
    [[30, 92], [96, 74], [150, 98], [188, 66]].map(([x, y]) =>
      `<g fill="#7a8a6a" transform="translate(${x},${y})"><ellipse cx="0" cy="4" rx="4.2" ry="5.2"/>` +
      `<circle cx="-5" cy="-3" r="1.8"/><circle cx="-1.5" cy="-5.5" r="1.8"/><circle cx="2.5" cy="-5" r="1.8"/><circle cx="5.5" cy="-2" r="1.8"/></g>`
    ).join("") + `</svg>`);
  const BED_SVG = `<svg viewBox="0 0 66 30" fill="none">
    <ellipse cx="33" cy="20" rx="31" ry="9" fill="#5b4c3d"/>
    <ellipse cx="33" cy="17" rx="27" ry="7.5" fill="#7a6552"/>
    <ellipse cx="33" cy="16" rx="20" ry="5" fill="#8f7761"/></svg>`;
  function sceneHTML() {
    return `<div class="cr-scene" aria-hidden="true">
      <div class="cr-ground"></div>
      <div class="cr-paws" style="background-image:url('data:image/svg+xml,${PAW}')"></div>
      <div class="cr-beds"></div>
      <div class="cr-prop bush"><svg viewBox="0 0 70 46" fill="none">
        <ellipse cx="20" cy="34" rx="18" ry="12" fill="#7ea36a"/><ellipse cx="42" cy="30" rx="20" ry="15" fill="#6f9a5c"/>
        <ellipse cx="56" cy="36" rx="12" ry="9" fill="#84ad70"/><ellipse cx="34" cy="24" rx="12" ry="9" fill="#8cb679"/></svg></div>
      <div class="cr-prop tree"><svg viewBox="0 0 66 96" fill="none">
        <rect x="29" y="56" width="8" height="36" rx="3" fill="#9c6531"/>
        <circle cx="33" cy="34" r="22" fill="#6f9a5c"/><circle cx="20" cy="44" r="15" fill="#7ea36a"/>
        <circle cx="47" cy="44" r="15" fill="#84ad70"/><circle cx="33" cy="22" r="14" fill="#8cb679"/></svg></div>
      <div class="cr-prop ball"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="var(--accent,#db4322)"/>
        <path d="M2 11 h18 M11 2 a12 12 0 0 1 0 18 a12 12 0 0 1 0 -18" stroke="rgba(255,255,255,.55)" stroke-width="1.3" fill="none"/></svg></div>
    </div>`;
  }

  const SPECIES = {
    dog: { svg: dogSVG, palettes: [{ b: "#c98a4b", d: "#9c6531" }, { b: "#e5d6c3", d: "#b9a488" }, { b: "#8a8172", d: "#5f584c" }] },
    cat: { svg: catSVG, palettes: [{ b: "#463f37", d: "#2b2620" }, { b: "#d98b5f", d: "#a86338" }, { b: "#b9b2a4", d: "#847c6c" }] },
  };

  /* ---------------- 개체 ---------------- */
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TOP = 74; // 헤더 아래
  const clampX = (x) => Math.max(6, Math.min(W() - 52, x));
  const clampY = (y) => Math.max(TOP, Math.min(H() - 46, y));

  class Critter {
    constructor(sp, pal, x, y) {
      this.sp = sp; this.pal = pal;
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.dir = Math.random() < 0.5 ? 1 : -1;
      this.state = "idle"; this.timer = rand(0.4, 1.6);
      this.tx = x; this.ty = y;
      this.speed = rand(26, 42);
      this.curious = Math.random() < 0.4; // 마우스에 다가가는 성향
      this.emoteT = 0;
      this.bedEl = null; this.inBed = false; // 밤에 잘 방석
      this.playing = false;

      const el = document.createElement("div");
      el.className = "critter";
      const palettes = SPECIES[sp].palettes;
      el.innerHTML = `<div class="cr-flip">${SPECIES[sp].svg(palettes[pal])}</div>`;
      this.el = el; this.flip = el.querySelector(".cr-flip");
      this.emoteEl = el.querySelector(".emote");
      layer.appendChild(el);
      this.place();
    }
    pickTarget() {
      // 25% 확률로 소품 근처에서 '놀기'
      if (Math.random() < 0.25 && layer) {
        const props = layer.querySelectorAll(".cr-prop");
        if (props.length) {
          const r = props[(Math.random() * props.length) | 0].getBoundingClientRect();
          this.tx = clampX(r.left + rand(-24, r.width + 4));
          this.ty = clampY(r.top + r.height - 34);
          this.playing = true;
          return;
        }
      }
      this.playing = false;
      this.tx = clampX(rand(20, W() - 60));
      this.ty = clampY(rand(TOP, H() - 60));
    }
    say(sym, dur) {
      if (reduced) return;
      this.emoteEl.textContent = sym;
      this.el.classList.add("emoting");
      this.emoteT = dur || 1;
    }
    hop() {
      if (reduced || this.el.classList.contains("hop")) return;
      this.el.classList.add("hop");
      this.say("♥", 0.9);
      setTimeout(() => this.el.classList.remove("hop"), 500);
    }
    sleepEmote(on) {
      if (on) { this.emoteEl.textContent = "💤"; this.emoteEl.classList.add("zzz"); this.el.classList.add("emoting"); }
      else { this.emoteEl.classList.remove("zzz"); this.el.classList.remove("emoting"); this.emoteEl.textContent = "‼"; }
    }
    update(dt, mouse) {
      if (reduced) { this.place(); return; }
      // ---- 밤: 방석으로 가서 잔다 ----
      if (night && this.bedEl) {
        const r = this.bedEl.getBoundingClientRect();
        const bx = clampX(r.left + r.width / 2 - 23);
        const by = clampY(r.top + r.height / 2 - 22);
        if (!this.inBed) {
          const gx = bx - this.x, gy = by - this.y, gd = Math.hypot(gx, gy);
          if (gd > 4) {
            this.x += (gx / gd) * this.speed * 1.7 * dt; this.y += (gy / gd) * this.speed * 1.7 * dt;
            if (Math.abs(gx) > 2) this.dir = gx > 0 ? 1 : -1;
            this.el.classList.add("walk");
          } else {
            this.inBed = true; this.el.classList.remove("walk");
            this.el.classList.add("sleeping"); this.sleepEmote(true);
          }
        } else {
          // 자는 중 — 마우스가 가까이 오면 잠깐 깼다가 다시 눕는다
          if (mouse.on) {
            const d = Math.hypot((this.x + 23) - mouse.x, (this.y + 20) - mouse.y);
            if (d < 62) {
              this.inBed = false; this.el.classList.remove("sleeping"); this.sleepEmote(false);
              this.say("?", 0.7);
              this.x = clampX(this.x + ((this.x + 23 - mouse.x) / (d || 1)) * 10);
            }
          }
        }
        if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.el.classList.remove("emoting"); }
        this.x = clampX(this.x); this.y = clampY(this.y); this.place(); return;
      }
      if (this.el.classList.contains("sleeping")) { this.el.classList.remove("sleeping"); this.sleepEmote(false); }
      // 마우스 반응
      if (mouse.on) {
        const dx = (this.x + 23) - mouse.x, dy = (this.y + 20) - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 96) {
          if (this.curious && d > 40) {
            this.state = "seek"; this.tx = clampX(mouse.x - 23); this.ty = clampY(mouse.y - 20);
            if (this.emoteT <= 0) this.say("♥", 0.6);
          } else {
            this.state = "flee";
            this.tx = clampX(this.x + (dx / (d || 1)) * 160);
            this.ty = clampY(this.y + (dy / (d || 1)) * 160);
            if (this.emoteT <= 0) this.say("‼", 0.6);
          }
        }
      }
      // 상태 전이
      this.timer -= dt;
      if (this.state === "idle") {
        if (this.timer <= 0) { this.state = "walk"; this.pickTarget(); this.timer = rand(2, 5); }
      } else if (this.timer <= 0 && (this.state === "walk")) {
        this.state = "idle"; this.timer = this.playing ? rand(2, 4.5) : rand(0.6, 2.4);
        if (this.playing) { this.say("♪", 0.9); this.playing = false; }
      }
      // 목표로 이동
      const gx = this.tx - this.x, gy = this.ty - this.y;
      const gd = Math.hypot(gx, gy);
      const moving = this.state !== "idle" && gd > 3;
      if (moving) {
        const sp = this.state === "flee" ? this.speed * 2.4 : this.state === "seek" ? this.speed * 1.5 : this.speed;
        this.x += (gx / gd) * sp * dt;
        this.y += (gy / gd) * sp * dt;
        if (Math.abs(gx) > 2) this.dir = gx > 0 ? 1 : -1;
      } else if (this.state !== "idle" && gd <= 3) {
        this.state = (this.state === "flee" || this.state === "seek") ? "walk" : this.state;
        if (this.state === "walk") { this.state = "idle"; this.timer = rand(0.6, 2.2); }
      }
      this.x = clampX(this.x); this.y = clampY(this.y);
      this.el.classList.toggle("walk", moving);
      // 이모트 타이머
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.el.classList.remove("emoting"); }
      this.place();
    }
    place() {
      this.el.style.transform = `translate3d(${this.x}px,${this.y}px,0)`;
      this.flip.style.transform = `scaleX(${this.dir})`;
    }
    remove() { this.el.remove(); }
  }

  /* ---------------- 무대 ---------------- */
  let layer, toggleBtn, critters = [], raf = 0, last = 0, night = false;
  const mouse = { x: 0, y: 0, on: false };
  const darkMQ = matchMedia("(prefers-color-scheme: dark)");

  function computeNight() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return darkMQ.matches;
  }
  function applyNight(v) {
    night = v;
    if (!layer) return;
    layer.classList.toggle("is-night", v);
    const beds = layer.querySelector(".cr-beds");
    if (!beds) return;
    beds.innerHTML = "";
    if (v) {
      const c = Math.max(1, critters.length);
      for (let i = 0; i < c; i++) {
        const b = document.createElement("div");
        b.className = "cr-bed";
        b.style.left = (9 + (82 * (i + 0.5) / c)) + "%";
        b.innerHTML = BED_SVG;
        beds.appendChild(b);
      }
      const bedEls = beds.querySelectorAll(".cr-bed");
      critters.forEach((cr, i) => { cr.bedEl = bedEls[i % bedEls.length]; cr.inBed = false; });
    } else {
      critters.forEach((cr) => { cr.bedEl = null; cr.inBed = false; cr.el.classList.remove("sleeping"); cr.sleepEmote(false); });
    }
  }
  darkMQ.addEventListener("change", () => applyNight(computeNight()));
  new MutationObserver(() => applyNight(computeNight()))
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function spawnFresh() {
    const specs = [["dog", 0], ["cat", 0], ["dog", 1], ["cat", 1]];
    const n = coarse ? 2 : (W() < 900 ? 3 : 4);
    critters = specs.slice(0, n).map(([sp, pal]) =>
      new Critter(sp, pal, clampX(rand(40, W() - 80)), clampY(rand(TOP + 20, H() - 80))));
  }
  function restore() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY_STATE)); } catch (e) {}
    if (saved && saved.list && Date.now() - saved.t < 30 * 60 * 1000) {
      critters = saved.list.map((s) => {
        const c = new Critter(s.sp, s.pal, clampX(s.fx * W()), clampY(s.fy * H()));
        c.dir = s.dir || 1; c.place(); return c;
      });
    } else spawnFresh();
  }
  function save() {
    try {
      sessionStorage.setItem(KEY_STATE, JSON.stringify({
        t: Date.now(),
        list: critters.map((c) => ({ sp: c.sp, pal: c.pal, fx: c.x / W(), fy: c.y / H(), dir: c.dir })),
      }));
    } catch (e) {}
  }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    for (const c of critters) c.update(dt, mouse);
    mouse.on = false; // 한 프레임만 반응(mousemove가 다시 켬)
    raf = requestAnimationFrame(loop);
  }

  function start() {
    layer = document.createElement("div");
    layer.className = "critters-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = sceneHTML();
    document.body.appendChild(layer);
    restore();
    applyNight(computeNight());
    if (!reduced) { last = performance.now(); raf = requestAnimationFrame(loop); }
    else { for (const c of critters) c.place(); }
  }
  function stop() {
    cancelAnimationFrame(raf);
    for (const c of critters) c.remove();
    critters = [];
    if (layer) { layer.remove(); layer = null; }
  }

  /* 마우스·클릭 상호작용 */
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });
  window.addEventListener("click", (e) => {
    for (const c of critters) {
      if (Math.hypot((c.x + 23) - e.clientX, (c.y + 20) - e.clientY) < 60) c.hop();
    }
  }, { passive: true });
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  /* 켜기/끄기 토글 */
  let on = true;
  try { on = localStorage.getItem(KEY_PREF) !== "0"; } catch (e) {}
  toggleBtn = document.createElement("button");
  toggleBtn.className = "critters-toggle";
  toggleBtn.type = "button";
  toggleBtn.textContent = "🐾";
  toggleBtn.title = "동물 친구 켜기/끄기";
  toggleBtn.setAttribute("aria-label", "동물 친구 켜고 끄기");
  toggleBtn.addEventListener("click", () => {
    on = !on;
    toggleBtn.setAttribute("aria-pressed", String(on));
    try { localStorage.setItem(KEY_PREF, on ? "1" : "0"); } catch (e) {}
    if (on) start(); else { save(); stop(); }
  });
  toggleBtn.setAttribute("aria-pressed", String(on));

  function boot() {
    document.body.appendChild(toggleBtn);
    if (on) start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
