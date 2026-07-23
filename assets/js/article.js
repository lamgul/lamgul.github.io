/* article.js — heading ids + anchors, table of contents, active-section
   highlight for post pages. No dependencies; pairs with article.css.
   Smooth vs. instant anchor jumps are handled by CSS scroll-behavior,
   which base.css already switches off under prefers-reduced-motion. */
(function () {
  "use strict";

  var container =
    document.querySelector(".post-body") ||
    document.querySelector("article .prose");
  if (!container) return;

  var heads = Array.prototype.slice.call(container.querySelectorAll("h2"));
  if (!heads.length) return;

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  // ---- slugify: keep hangul, spaces → hyphens, dedupe with -2, -3 … ----
  function slugify(text) {
    var s = String(text).trim().toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^0-9a-z가-힣ㄱ-ㆎ_-]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
    return s || "section";
  }

  var used = Object.create(null);
  var entries = heads.map(function (h) {
    var text = h.textContent.trim();
    var id = h.id;
    if (!id) {
      id = slugify(text);
      var base = id;
      var n = 2;
      while (used[id] || document.getElementById(id)) {
        id = base + "-" + n;
        n += 1;
      }
      h.id = id;
    }
    used[id] = true;
    return { h: h, id: id, text: text };
  });

  // ---- # anchor at the end of each h2 ----
  entries.forEach(function (e) {
    var a = document.createElement("a");
    a.className = "h-anchor";
    a.href = "#" + e.id;
    a.textContent = "#";
    a.setAttribute("aria-label", "“" + e.text + "” 섹션 링크");
    e.h.appendChild(a);
  });

  // ---- table of contents (3+ sections only) ----
  if (entries.length < 3) return;

  var toc = document.createElement("nav");
  toc.className = "toc";
  toc.setAttribute("aria-label", "목차");

  var label = document.createElement("span");
  label.className = "toc-label";
  label.textContent = "목차";
  toc.appendChild(label);

  var linkOf = Object.create(null);
  var ol = document.createElement("ol");
  entries.forEach(function (e) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + e.id;
    a.textContent = e.text;
    li.appendChild(a);
    ol.appendChild(li);
    linkOf[e.id] = a;
  });
  toc.appendChild(ol);

  var lead = container.querySelector(".lead");
  if (lead) lead.insertAdjacentElement("afterend", toc);
  else container.insertBefore(toc, container.firstChild);

  // ---- active section highlight ----
  function setActive(id) {
    entries.forEach(function (e) {
      linkOf[e.id].classList.toggle("active", e.id === id);
    });
  }

  // reference line: upper quarter of the viewport (middle under reduced
  // motion, so the highlight changes less often while scrolling)
  var LINE = reduced ? 0.5 : 0.25;

  // pick the last heading that has crossed the reference line
  function pick() {
    var line = window.innerHeight * LINE;
    var current = null;
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].h.getBoundingClientRect().top <= line) current = entries[i].id;
      else break;
    }
    setActive(current);
  }

  // clicking a toc link marks it right away (scroll settles per CSS)
  toc.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t && t.tagName === "A") {
      var id = t.getAttribute("href").slice(1);
      if (linkOf[id]) setActive(id);
    }
  });

  if ("IntersectionObserver" in window) {
    // a heading crossing the reference line triggers a cheap full recompute
    var pct = LINE * 100;
    var io = new IntersectionObserver(pick, {
      rootMargin: "-" + pct + "% 0px -" + (100 - pct) + "% 0px",
      threshold: 0
    });
    entries.forEach(function (e) { io.observe(e.h); });
    pick();
  } else {
    pick();
  }
})();
