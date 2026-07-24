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
  .quicknav{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:54;
    display:flex;flex-direction:column;gap:3px;padding:6px 0;}
  .quicknav a{display:flex;align-items:center;justify-content:flex-end;gap:.55em;
    height:30px;padding:0 .7em 0 .8em;font-size:.8rem;line-height:1;text-decoration:none;
    color:var(--ink-3);background:var(--bg-elev);border:1px solid var(--line);border-right:0;
    border-radius:100px 0 0 100px;white-space:nowrap;
    transform:translateX(calc(100% - 30px));
    transition:transform .28s var(--ease-out,cubic-bezier(.16,1,.3,1)),color .2s,background .2s,box-shadow .2s;}
  .quicknav a .qn-label{opacity:0;transition:opacity .2s;}
  .quicknav a .qn-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--line-2);
    transition:background .2s,transform .2s;}
  .quicknav a:hover,.quicknav a:focus-visible{transform:translateX(0);color:var(--ink);
    background:var(--surface);box-shadow:var(--shadow-1);outline:none;}
  .quicknav a:hover .qn-label,.quicknav a:focus-visible .qn-label{opacity:1;}
  .quicknav a:hover .qn-dot,.quicknav a:focus-visible .qn-dot{background:var(--accent);}
  .quicknav a.active{color:var(--ink);}
  .quicknav a.active .qn-dot{background:var(--accent);transform:scale(1.25);}
  .quicknav .qn-top{margin-top:6px;color:var(--ink-3);cursor:pointer;font-family:var(--mono);}
  .quicknav .qn-top .qn-dot{background:transparent;width:auto;height:auto;font-size:.9em;}
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
      `<a href="${it.href}"${it.key === act ? ' class="active" aria-current="page"' : ""}>` +
      `<span class="qn-label">${it.label}</span><span class="qn-dot" aria-hidden="true"></span></a>`
    ).join("") +
    `<a class="qn-top" href="#" role="button" aria-label="맨 위로"><span class="qn-label">맨 위로</span><span class="qn-dot" aria-hidden="true">↑</span></a>`;

  function boot() {
    document.body.appendChild(nav);
    nav.querySelector(".qn-top").addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
