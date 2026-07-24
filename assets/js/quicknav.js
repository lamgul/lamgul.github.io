/* quicknav.js — 오른쪽 사이드 빠른 이동 탭.
   화면 오른쪽 가장자리에 접혀 있다가 hover/포커스로 펼쳐지는 세로 도크.
   현재 위치를 강조하고, 긴 페이지에선 맨 위로 버튼을 함께 노출. */
(() => {
  "use strict";
  if (window.__quicknav) return;
  window.__quicknav = true;

  const ITEMS = [
    { key: "home", label: "홈", href: "/", sym: "⌂" },
    { key: "cases", label: "사례", href: "/cases/", sym: "◆" },
    { key: "demos", label: "데모", href: "/#products", sym: "▸" },
    { key: "labs", label: "실험", href: "/#work", sym: "✦" },
    { key: "writing", label: "글", href: "/writing/", sym: "✎" },
    { key: "about", label: "소개", href: "/about.html", sym: "@" },
  ];
  const DEMO_SLUGS = ["safein", "ddangddeul", "lookie", "sums", "ether-archive", "mumyeong", "majsoul"];

  function activeKey() {
    const p = location.pathname.replace(/\/index\.html$/, "/");
    if (/^\/cases\//.test(p)) return "cases";
    if (/^\/writing\//.test(p)) return "writing";
    if (/^\/about\.html$/.test(p)) return "about";
    if (/^\/projects\//.test(p)) {
      const slug = p.split("/")[2] || "";
      return DEMO_SLUGS.indexOf(slug) >= 0 ? "demos" : "labs";
    }
    if (p === "/" || p === "") return "home";
    return "";
  }

  const css = `
  .quicknav{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:54;
    display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 6px;
    background:color-mix(in srgb,var(--bg-elev) 82%,transparent);
    border:1px solid var(--line);border-radius:100px;box-shadow:var(--shadow-1);
    -webkit-backdrop-filter:saturate(1.3) blur(8px);backdrop-filter:saturate(1.3) blur(8px);}
  .quicknav a{position:relative;display:grid;place-items:center;width:26px;height:26px;
    text-decoration:none;border-radius:50%;transition:background .2s;outline:none;}
  .quicknav a:hover,.quicknav a:focus-visible{background:var(--surface);}
  .quicknav a .qn-dot{width:7px;height:7px;border-radius:50%;background:var(--line-2);
    transition:background .2s,transform .2s,box-shadow .2s;}
  .quicknav a:hover .qn-dot,.quicknav a:focus-visible .qn-dot{background:var(--accent);transform:scale(1.35);}
  .quicknav a.active .qn-dot{background:var(--accent);box-shadow:0 0 0 3px var(--accent-tint);}
  /* 왼쪽으로 나오는 툴팁 라벨 (화면 밖으로 안 잘리게) */
  .quicknav a .qn-label{position:absolute;right:calc(100% + 9px);top:50%;
    transform:translateY(-50%) translateX(5px);white-space:nowrap;
    background:var(--ink);color:var(--bg);font-size:.72rem;font-weight:500;
    padding:.32em .6em;border-radius:6px;opacity:0;pointer-events:none;
    box-shadow:var(--shadow-1);transition:opacity .16s,transform .16s;}
  .quicknav a .qn-label::after{content:"";position:absolute;left:100%;top:50%;
    transform:translateY(-50%);border:4px solid transparent;border-left-color:var(--ink);}
  .quicknav a:hover .qn-label,.quicknav a:focus-visible .qn-label{opacity:1;transform:translateY(-50%) translateX(0);}
  .quicknav .qn-sep{width:14px;height:1px;background:var(--line);margin:4px 0;}
  .quicknav .qn-top .qn-dot{width:auto;height:auto;background:transparent!important;
    box-shadow:none!important;font-family:var(--mono);font-size:.8rem;color:var(--ink-3);line-height:1;}
  .quicknav .qn-top:hover .qn-dot{color:var(--accent);transform:none;}
  @media (max-width:900px){.quicknav{display:none;}}
  @media print{.quicknav{display:none!important;}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const act = activeKey();
  const nav = document.createElement("nav");
  nav.className = "quicknav";
  nav.setAttribute("aria-label", "빠른 이동");
  nav.innerHTML =
    ITEMS.map((it) =>
      `<a href="${it.href}" data-k="${it.key}"${it.key === act ? ' class="active" aria-current="page"' : ""}>` +
      `<span class="qn-label">${it.label}</span><span class="qn-dot" aria-hidden="true"></span></a>`
    ).join("") +
    `<span class="qn-sep" aria-hidden="true"></span>` +
    `<a class="qn-top" href="#" role="button" aria-label="맨 위로"><span class="qn-label">맨 위로</span><span class="qn-dot" aria-hidden="true">↑</span></a>`;

  function setActive(key) {
    nav.querySelectorAll("a[data-k]").forEach((a) => {
      const on = a.dataset.k === key;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* 스크롤스파이 — 홈처럼 섹션이 있는 페이지에서 현재 섹션의 점을 강조 */
  function scrollspy() {
    const SEC = { cases: "cases", products: "demos", work: "labs", about: "about" };
    const secs = Object.keys(SEC).map((id) => document.getElementById(id)).filter(Boolean);
    if (secs.length < 2) return; // 섹션형 페이지가 아니면 스킵
    const ratios = new Map();
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      if ((window.scrollY || 0) < 140) { setActive("home"); return; }
      let best = null, br = 0;
      ratios.forEach((r, id) => { if (r > br) { br = r; best = id; } });
      setActive(best && br > 0 ? SEC[best] : "home");
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01, 0.5, 1] });
    secs.forEach((s) => io.observe(s));
  }

  function boot() {
    document.body.appendChild(nav);
    nav.querySelector(".qn-top").addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    scrollspy();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
