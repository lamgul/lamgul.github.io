/* majsoul.js — Shanten Lab.
   majsoul-helper-android(비공개)의 ShantenCalculator.java / MahjongAdvisor.java를
   함수 단위로 JS에 그대로 포팅한 엔진 + 손패 편집 UI.
   원본과 다른 점은 브라우저용 DFS 메모이제이션 하나뿐이다. 의존성 0. */
(() => {
  "use strict";

  /* ================= TileMapper 포팅 ================= */
  const TILES = [
    "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
    "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
    "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
    "E", "S", "W", "N", "P", "F", "C"
  ];
  const ORPHANS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const HONOR_NAMES = ["동", "남", "서", "북", "백", "발", "중"];
  const GLYPHS = [
    "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
    "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡",
    "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘",
    "🀀", "🀁", "🀂", "🀃", "🀆", "🀅", "🀄︎"
  ];

  function toIndex(tile) { return TILES.indexOf(tile); }
  function display(index) {
    if (index >= 0 && index <= 8) return (index + 1) + "만";
    if (index >= 9 && index <= 17) return (index - 8) + "통";
    if (index >= 18 && index <= 26) return (index - 17) + "삭";
    if (index >= 27 && index <= 33) return HONOR_NAMES[index - 27];
    return "?";
  }
  function suitClass(index) {
    if (index < 9) return "t-m";
    if (index < 18) return "t-p";
    if (index < 27) return "t-s";
    return "t-z";
  }
  function isHonor(index) { return index >= 27 && index <= 33; }
  function isTerminalOrHonor(index) {
    if (isHonor(index)) return true;
    const number = index % 9;
    return number === 0 || number === 8;
  }
  function isSimple(index) { return index >= 0 && index < 27 && !isTerminalOrHonor(index); }

  /* ================= ShantenCalculator 포팅 =================
     일반형: 8 - 멘쯔*2 - 타아츠 - 머리 를 DFS로 최소화. 원본 dfs()의 다섯 갈래 그대로. */
  let best = 8;

  function dfsRegular(counts) {
    const work = counts.slice();
    best = 8;
    dfs(work, 0, 0, 0);
    return best;
  }

  function dfs(counts, melds, pairs, taatsu) {
    const index = firstNonZero(counts);
    if (index === -1) {
      const usableTaatsu = Math.min(taatsu, 4 - melds);
      const shanten = 8 - melds * 2 - usableTaatsu - pairs;
      if (shanten < best) best = shanten;
      return;
    }

    const theoretical = 8 - melds * 2 - Math.min(taatsu, 4 - melds) - pairs;
    if (theoretical >= best && melds >= 4) return;

    if (counts[index] >= 3) {                                  // 코쯔로 묶는다
      counts[index] -= 3;
      dfs(counts, melds + 1, pairs, taatsu);
      counts[index] += 3;
    }

    if (canSequence(index) && counts[index + 1] > 0 && counts[index + 2] > 0) {
      counts[index]--; counts[index + 1]--; counts[index + 2]--;   // 슌쯔로 묶는다
      dfs(counts, melds + 1, pairs, taatsu);
      counts[index]++; counts[index + 1]++; counts[index + 2]++;
    }

    if (counts[index] >= 2) {                                  // 머리 또는 또이츠 타아츠
      counts[index] -= 2;
      if (pairs === 0) dfs(counts, melds, 1, taatsu);
      dfs(counts, melds, pairs, taatsu + 1);
      counts[index] += 2;
    }

    if (canRyanmen(index) && counts[index + 1] > 0) {          // 양면/변짱 타아츠
      counts[index]--; counts[index + 1]--;
      dfs(counts, melds, pairs, taatsu + 1);
      counts[index]++; counts[index + 1]++;
    }

    if (canKanchan(index) && counts[index + 2] > 0) {          // 간짱 타아츠
      counts[index]--; counts[index + 2]--;
      dfs(counts, melds, pairs, taatsu + 1);
      counts[index]++; counts[index + 2]++;
    }

    counts[index]--;                                           // 버리는 갈래
    dfs(counts, melds, pairs, taatsu);
    counts[index]++;
  }

  function firstNonZero(counts) {
    for (let i = 0; i < counts.length; i++) if (counts[i] > 0) return i;
    return -1;
  }
  function canSequence(index) { return index < 27 && index % 9 <= 6; }
  function canRyanmen(index) { return index < 27 && index % 9 <= 7; }
  function canKanchan(index) { return index < 27 && index % 9 <= 6; }

  /* 분석 1회 동안만 사는 DFS 캐시 — 포팅하며 보탠 유일한 부분 */
  const shMemo = new Map();
  function regularShanten(counts) {
    const key = counts.join("");
    let value = shMemo.get(key);
    if (value === undefined) {
      value = dfsRegular(counts);
      shMemo.set(key, value);
    }
    return value;
  }

  function chiitoiShanten(counts) {
    let pairs = 0, unique = 0;
    for (const count of counts) {
      if (count > 0) unique++;
      if (count >= 2) pairs++;
    }
    return 6 - pairs + Math.max(0, 7 - unique);
  }

  function kokushiShanten(counts) {
    let unique = 0, hasPair = false;
    for (const index of ORPHANS) {
      if (counts[index] > 0) unique++;
      if (counts[index] >= 2) hasPair = true;
    }
    return 13 - unique - (hasPair ? 1 : 0);
  }

  function minShanten(counts) {
    return Math.min(regularShanten(counts), chiitoiShanten(counts), kokushiShanten(counts));
  }

  /* ================= MahjongAdvisor 포팅 =================
     루트별 최적 타패 + 유효패. 이름·설명·점수식·타이브레이크 모두 원본 값. */
  const ROUTE_DEFS = [
    { mode: "FAST",    name: "최단 화료",   reason: "샹텐 감소와 유효패 수를 가장 크게 봅니다." },
    { mode: "REGULAR", name: "일반형/리치", reason: "멘쯔 네 개와 머리 한 개를 만드는 기본 루트입니다." },
    { mode: "TANYAO",  name: "탕야오",     reason: "요구패와 자패를 줄이고 중장패 중심으로 갑니다." },
    { mode: "CHIITOI", name: "치또이츠",   reason: "또이츠 수가 많을 때 일곱 쌍을 노립니다." },
    { mode: "KOKUSHI", name: "국사무쌍",   reason: "13종 요구패와 자패를 모으는 특수 루트입니다." }
  ];

  function routeShanten(counts, mode) {
    switch (mode) {
      case "REGULAR": return regularShanten(counts);
      case "CHIITOI": return chiitoiShanten(counts);
      case "KOKUSHI": return kokushiShanten(counts);
      case "TANYAO":  return regularShanten(counts) + terminalHonorCount(counts);
      default:        return minShanten(counts);
    }
  }

  /* 34종을 한 장씩 뽑아 넣어 보고, 샹텐이 줄면 남은 장수(4 - 손에 보이는 장수)를 더한다.
     데모에는 도라·버림패·후로 입력이 없어 visibleCounts 차감은 생략 — 원본보다 후하게 센다. */
  function countUkeire(afterDiscard, discardedTile, mode, baseShanten) {
    let total = 0;
    const accepted = [];
    for (let draw = 0; draw < 34; draw++) {
      const unavailable = afterDiscard[draw] + (draw === discardedTile ? 1 : 0);
      if (unavailable >= 4) continue;
      if (mode === "TANYAO" && !isSimple(draw)) continue;
      afterDiscard[draw]++;
      if (routeShanten(afterDiscard, mode) < baseShanten) {
        total += 4 - unavailable;
        accepted.push(draw);
      }
      afterDiscard[draw]--;
    }
    return { total, accepted };
  }

  function routeTieScore(afterDiscard, mode, discard) {
    switch (mode) {
      case "TANYAO":  return isTerminalOrHonor(discard) ? 100 : -terminalHonorCount(afterDiscard);
      case "KOKUSHI": return isTerminalOrHonor(discard) ? -100 : 100;
      case "CHIITOI": return pairCount(afterDiscard) * 10 + isolatedCount(afterDiscard);
      default:        return -terminalHonorCount(afterDiscard);
    }
  }

  function findBestDiscard(counts, mode) {
    const bestD = { discardIndex: -1, shanten: 99, ukeire: 0, tieScore: -Infinity };
    for (let discard = 0; discard < 34; discard++) {
      if (counts[discard] === 0) continue;
      const afterDiscard = counts.slice();
      afterDiscard[discard]--;
      const shanten = routeShanten(afterDiscard, mode);
      const uke = countUkeire(afterDiscard, discard, mode, shanten);
      const tieScore = routeTieScore(afterDiscard, mode, discard);
      if (bestD.discardIndex < 0
          || shanten < bestD.shanten
          || (shanten === bestD.shanten && uke.total > bestD.ukeire)
          || (shanten === bestD.shanten && uke.total === bestD.ukeire && tieScore > bestD.tieScore)) {
        bestD.discardIndex = discard;
        bestD.shanten = shanten;
        bestD.ukeire = uke.total;
        bestD.tieScore = tieScore;
      }
    }
    return bestD;
  }

  function terminalHonorCount(counts) {
    let total = 0;
    for (let i = 0; i < counts.length; i++) if (isTerminalOrHonor(i)) total += counts[i];
    return total;
  }
  function pairCount(counts) {
    let pairs = 0;
    for (const count of counts) if (count >= 2) pairs++;
    return pairs;
  }
  function isolatedCount(counts) {
    let isolated = 0;
    for (const count of counts) if (count === 1) isolated++;
    return isolated;
  }

  function advise(counts) {
    const tileCount = counts.reduce((a, b) => a + b, 0);
    if (tileCount % 3 !== 2 || tileCount < 2) return [];

    const candidates = [];
    for (const def of ROUTE_DEFS) {
      if (def.mode === "CHIITOI" && chiitoiShanten(counts) > 4) continue;
      if (def.mode === "KOKUSHI" && kokushiShanten(counts) > 4) continue;
      const bestD = findBestDiscard(counts, def.mode);
      let sortShanten = bestD.shanten;
      let score;
      if (def.mode === "FAST") {
        score = bestD.ukeire * 10 - bestD.shanten * 100;
      } else if (def.mode === "REGULAR") {
        score = bestD.ukeire * 8 - bestD.shanten * 100;
      } else if (def.mode === "TANYAO") {
        const after = counts.slice();
        if (bestD.discardIndex >= 0) after[bestD.discardIndex]--;
        const terminalPenalty = terminalHonorCount(after);
        if (terminalPenalty > 5) continue;
        sortShanten = bestD.shanten + terminalPenalty;
        score = bestD.ukeire * 6 - terminalPenalty * 30 - bestD.shanten * 100;
      } else {
        score = bestD.ukeire * 7 - bestD.shanten * 100;
      }
      candidates.push({
        name: def.name, reason: def.reason,
        discardIndex: bestD.discardIndex, shanten: bestD.shanten,
        ukeire: bestD.ukeire, sortShanten, score
      });
    }

    candidates.sort((a, b) => a.sortShanten - b.sortShanten || b.ukeire - a.ukeire || b.score - a.score);

    const result = [];
    const seen = new Set();
    const unseen = Math.max(1, 136 - tileCount);   // TableMode.FOUR_PLAYER 기준
    for (const c of candidates) {
      if (c.discardIndex < 0 || seen.has(c.name)) continue;
      seen.add(c.name);
      c.improveProbability = Math.min(0.99, c.ukeire / unseen);
      result.push(c);
      if (result.length === 4) break;
    }
    return result;
  }

  /* ================= 데모 UI ================= */
  const $ = (id) => document.getElementById(id);
  const handEl = $("sl-hand");
  if (!handEl) return;
  const presetsEl = $("sl-presets");
  const msEl = $("sl-ms");
  const shantenEl = $("sl-shanten");
  const breakEl = $("sl-break");
  const paletteEl = $("sl-palette");
  const palTitleEl = $("sl-pal-title");
  const palCloseEl = $("sl-pal-close");
  const palGridEl = $("sl-pal-grid");
  const routesEl = $("sl-routes");
  const tbodyEl = $("sl-tbody");

  /* 프리셋 ①은 원본 레포 MahjongAdvisorTest의 손패 그대로 */
  const PRESETS = [
    ["1m", "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "2p", "3p", "4p", "E"],
    ["1m", "1m", "4m", "4m", "6p", "6p", "9p", "2s", "2s", "7s", "8s", "E", "E", "C"],
    ["1m", "9m", "1p", "9p", "1s", "9s", "E", "S", "W", "N", "P", "F", "3m", "6p"],
    ["2m", "4m", "5m", "7m", "3p", "5p", "8p", "8p", "2s", "3s", "6s", "8s", "S", "C"]
  ];
  const PAL_GROUPS = [["만", 0, 8], ["통", 9, 17], ["삭", 18, 26], ["자패", 27, 33]];

  let hand = [];          // 정렬된 14장 (34칸 인덱스)
  let editSlot = -1;      // 팔레트가 열린 슬롯
  let markedTile = -1;    // 강조 상자가 붙는 타패
  let activeRoute = 0;
  let lastRoutes = [];
  let lastRows = [];

  function toCounts(tiles) {
    const counts = new Array(34).fill(0);
    for (const t of tiles) counts[t]++;
    return counts;
  }
  function fmtShanten(value) {
    if (value === -1) return "화료형";
    if (value === 0) return "텐파이";
    return value + " 샹텐";
  }

  /* ---- 전체 분석: 손패가 바뀔 때마다 실제 포팅 로직으로 다시 계산 ---- */
  function analyze() {
    const t0 = performance.now();
    shMemo.clear();
    const counts = toCounts(hand);

    const reg = regularShanten(counts);
    const chi = chiitoiShanten(counts);
    const kok = kokushiShanten(counts);
    const cur = Math.min(reg, chi, kok);

    /* 버림패 후보 테이블 (최단 화료 기준: 세 형태 중 최소 샹텐) */
    const rows = [];
    for (let d = 0; d < 34; d++) {
      if (counts[d] === 0) continue;
      const after = counts.slice();
      after[d]--;
      const sh = minShanten(after);
      const uke = countUkeire(after, d, "FAST", sh);
      const tie = routeTieScore(after, "FAST", d);
      rows.push({ tile: d, shanten: sh, ukeire: uke.total, kinds: uke.accepted.length, accepted: uke.accepted, tie });
    }
    rows.sort((a, b) => a.shanten - b.shanten || b.ukeire - a.ukeire || b.tie - a.tie);

    const routes = advise(counts);
    const ms = performance.now() - t0;

    lastRows = rows;
    lastRoutes = routes;
    activeRoute = routes.length ? 0 : -1;
    markedTile = routes.length ? routes[0].discardIndex : -1;

    msEl.textContent = ms.toFixed(1);
    shantenEl.textContent = fmtShanten(cur);
    breakEl.textContent = "일반형 " + reg + " · 치또이 " + chi + " · 국사 " + kok;
    renderHand();
    renderRoutes();
    renderTable(cur);
  }

  /* ---- 손패 ---- */
  function renderHand() {
    const markSlot = markedTile >= 0 ? hand.indexOf(markedTile) : -1;
    let html = "";
    for (let slot = 0; slot < hand.length; slot++) {
      const t = hand[slot];
      const cls = ["sl-tile"];
      if (slot === markSlot) cls.push("is-mark");
      if (slot === editSlot) cls.push("is-edit");
      html += '<button type="button" class="' + cls.join(" ") + '" data-slot="' + slot + '"'
        + ' aria-label="' + display(t) + ' — 클릭해 교체">'
        + '<span class="mj t-g ' + suitClass(t) + '" aria-hidden="true">' + GLYPHS[t] + "</span>"
        + '<span class="t-lbl">' + display(t) + "</span></button>";
    }
    handEl.innerHTML = html;
  }

  /* ---- 오버레이 패널 재현: 루트 카드 ---- */
  function renderRoutes() {
    let html = "";
    for (let i = 0; i < lastRoutes.length; i++) {
      const r = lastRoutes[i];
      const pct = Math.round(r.improveProbability * 100);
      html += '<button type="button" class="sl-route' + (i === activeRoute ? " is-on" : "") + '"'
        + ' data-route="' + i + '" aria-pressed="' + (i === activeRoute) + '">'
        + '<span class="r-head"><b class="r-name">' + r.name + '</b>'
        + '<span class="r-meta">' + fmtShanten(r.shanten) + " · 유효 " + r.ukeire + "장</span></span>"
        + '<span class="r-rec"><span class="mj t-g ' + suitClass(r.discardIndex) + '" aria-hidden="true">'
        + GLYPHS[r.discardIndex] + "</span>"
        + '<span class="r-txt">' + display(r.discardIndex) + " 버림 · 츠모 전진률 " + pct + "%</span></span>"
        + '<span class="r-reason">' + r.reason + "</span>"
        + '<span class="r-bar"><i style="width:' + pct + '%"></i></span></button>';
    }
    routesEl.innerHTML = html;
  }

  /* ---- 버림패 후보 표 ---- */
  function renderTable(cur) {
    let html = "";
    for (let i = 0; i < lastRows.length; i++) {
      const row = lastRows[i];
      const cls = [];
      if (i === 0) cls.push("is-best");
      if (row.tile === markedTile) cls.push("is-sel");
      const delta = row.shanten === cur
        ? '<span class="td-delta keep">유지</span>'
        : '<span class="td-delta back">+' + (row.shanten - cur) + "</span>";
      let acc = "—";
      if (row.accepted.length) {
        acc = row.accepted.map((t) =>
          '<span class="mj td-g ' + suitClass(t) + '" title="' + display(t) + '">' + GLYPHS[t] + "</span>"
        ).join("");
      }
      html += "<tr" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ' data-tile="' + row.tile + '">'
        + '<td><span class="td-tile"><span class="mj t-g ' + suitClass(row.tile) + '" aria-hidden="true">'
        + GLYPHS[row.tile] + '</span><span class="td-name">' + display(row.tile) + "</span></span></td>"
        + "<td><b>" + fmtShanten(row.shanten) + "</b> " + delta + "</td>"
        + '<td class="td-uke">' + row.kinds + "종 <b>" + row.ukeire + "</b>장</td>"
        + '<td class="td-acc">' + acc + "</td></tr>";
    }
    tbodyEl.innerHTML = html;
  }

  /* ---- 강조 상자만 갱신 (재계산 없이) ---- */
  function syncMarks() {
    renderHand();
    const cards = routesEl.querySelectorAll(".sl-route");
    cards.forEach((card, i) => {
      card.classList.toggle("is-on", i === activeRoute);
      card.setAttribute("aria-pressed", String(i === activeRoute));
    });
    tbodyEl.querySelectorAll("tr").forEach((tr) => {
      tr.classList.toggle("is-sel", Number(tr.dataset.tile) === markedTile);
    });
  }

  /* ---- 교체 팔레트 ---- */
  function openPalette(slot) {
    editSlot = slot;
    const counts = toCounts(hand);
    counts[hand[slot]]--;               // 이 슬롯을 비웠을 때 기준으로 4장 제한 검사
    let html = "";
    for (const [label, from, to] of PAL_GROUPS) {
      html += '<div class="sl-pal-row"><span class="sl-pal-lab">' + label + "</span>";
      for (let t = from; t <= to; t++) {
        const full = counts[t] >= 4;
        html += '<button type="button" class="sl-pal-tile' + (t === hand[slot] ? " is-cur" : "") + '"'
          + ' data-tile="' + t + '"' + (full ? " disabled" : "")
          + ' aria-label="' + display(t) + (full ? " — 이미 4장" : "") + '">'
          + '<span class="mj t-g ' + suitClass(t) + '" aria-hidden="true">' + GLYPHS[t] + "</span></button>";
      }
      html += "</div>";
    }
    palGridEl.innerHTML = html;
    palTitleEl.textContent = (slot + 1) + "번째 패 " + display(hand[slot]) + " 교체 — 새 패를 고르세요";
    paletteEl.hidden = false;
    renderHand();
  }

  function closePalette() {
    if (editSlot === -1) return;
    editSlot = -1;
    paletteEl.hidden = true;
    renderHand();
  }

  function loadPreset(n) {
    hand = PRESETS[n].map(toIndex).sort((a, b) => a - b);
    editSlot = -1;
    paletteEl.hidden = true;
    presetsEl.querySelectorAll(".sl-preset").forEach((btn) => {
      btn.classList.toggle("is-on", Number(btn.dataset.preset) === n);
    });
    analyze();
  }

  /* ---- 이벤트 (전부 위임) ---- */
  presetsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preset]");
    if (btn) loadPreset(Number(btn.dataset.preset));
  });

  handEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-slot]");
    if (!btn) return;
    const slot = Number(btn.dataset.slot);
    if (slot === editSlot) closePalette();
    else openPalette(slot);
  });

  palGridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tile]");
    if (!btn || btn.disabled || editSlot === -1) return;
    hand[editSlot] = Number(btn.dataset.tile);
    hand.sort((a, b) => a - b);
    editSlot = -1;
    paletteEl.hidden = true;
    presetsEl.querySelectorAll(".sl-preset").forEach((btn2) => btn2.classList.remove("is-on"));
    analyze();
  });

  palCloseEl.addEventListener("click", closePalette);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePalette();
  });

  routesEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-route]");
    if (!card) return;
    activeRoute = Number(card.dataset.route);
    markedTile = lastRoutes[activeRoute].discardIndex;
    syncMarks();
  });

  tbodyEl.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-tile]");
    if (!tr) return;
    markedTile = Number(tr.dataset.tile);
    activeRoute = -1;
    syncMarks();
  });

  loadPreset(0);
})();
