/* sums.js — SUMS 관제 콘솔 데모.
   데이터 출처(실레포에서 발췌):
   - lamgul/sums-admin-frontend  src/data/mockData.ts   (조직·직원·구역·시간/행동/앱 정책·위반 사유·통계)
   - lamgul/sums-admin-backend   prisma/seed-simple.ts  (정책-조건 M:N 매핑, 로그 시드 로직)
   네트워크 요청 0 — 전부 이 파일 안의 목데이터로 동작합니다. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ---------- 결정적 난수 — 매 방문 같은 그림 ---------- */
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260213);

  /* ---------- 실데이터: mockData.ts ---------- */
  const EMPLOYEES = [
    { name: "김철수", role: "크레인 오퍼레이터", org: "판교 현장 / A동 건설팀" },
    { name: "이영희", role: "현장 안전 감독", org: "서울 본사 / 안전관리부" },
    { name: "박민수", role: "화물차 운전", org: "인천 물류센터 / 배송1팀" },
    { name: "최지은", role: "총무팀장", org: "서울 본사 / 경영지원부" },
    { name: "정현우", role: "철근 작업", org: "판교 현장 / B동 건설팀" },
    { name: "직원 6", role: "크레인 오퍼레이터", org: "판교 현장 / A동 건설팀" },
    { name: "직원 7", role: "화물차 운전", org: "인천 물류센터 / 배송2팀" },
    { name: "직원 8", role: "포크리프트 운전", org: "인천 물류센터 / 창고관리팀" },
    { name: "직원 9", role: "철근 작업", org: "판교 현장 / B동 건설팀" },
    { name: "직원 10", role: "크레인 오퍼레이터", org: "판교 현장 / A동 건설팀" },
  ];

  const TIMES = [
    { id: "time-1", name: "주간 작업 시간", detail: "09:00–18:00 · 월–금 · 점심시간 제외" },
    { id: "time-2", name: "야간 작업 시간", detail: "21:00–06:00 · 매일 · 야식시간 제외" },
    { id: "time-3", name: "주말 작업", detail: "08:00–17:00 · 토·일" },
  ];
  const BEHAVIORS = [
    { id: "behavior-1", name: "보행 감지", detail: "5걸음 이상 이동 중 스마트폰 사용 시 경고" },
    { id: "behavior-2", name: "차량속도 감지", detail: "시속 30km 이상 주행 중 스마트폰 사용 차단" },
    { id: "behavior-3", name: "이동거리 감지", detail: "10m 이상 이동 중 스마트폰 사용 경고" },
    { id: "behavior-4", name: "복합(보행+속도)", detail: "보행 중 일정 속도 이상 이동 시 경고" },
  ];
  const PRESETS = [
    { id: "preset-1", name: "게임 차단", detail: "com.game.pubg 외 6종" },
    { id: "preset-2", name: "소셜 미디어 차단", detail: "com.facebook.katana 외 6종" },
    { id: "preset-3", name: "동영상 스트리밍 차단", detail: "com.netflix.mediaclient 외 5종" },
    { id: "preset-4", name: "도박 앱 차단", detail: "com.betting.sports 외 3종" },
    { id: "preset-5", name: "업무 방해 종합", detail: "게임·SNS·쇼핑 7종" },
  ];
  const REASONS_WORK = [
    "위험 구역 내 스마트폰 사용 감지",
    "보행 중 스마트폰 사용 감지",
    "작업 시간 중 게임 앱 실행",
    "작업 구역 내 SNS 사용 감지",
  ];
  const REASONS_ROAD = [
    "차량 운행 중 스마트폰 사용 감지",
    "고속 이동 중 스마트폰 사용",
  ];

  /* 구역 좌표는 원본 위경도(예: 37.4012, 127.1081)를 약도 좌표로 재배치한 것.
     이름·유형·반경(m)·설명은 mockData.ts 그대로. */
  const state = {
    zones: [
      { id: "zone-1", name: "크레인 작업 구역", type: "danger", shape: "circle", cx: 252, cy: 240, r: 70, radiusM: 50, desc: "크레인 작업 시 위험 구역. 스마트폰 사용 절대 금지" },
      { id: "zone-2", name: "고압선 구역", type: "danger", shape: "polygon", points: "344,18 512,18 512,44 344,44", corners: 4, desc: "고압선 근처 위험 구역" },
      { id: "zone-3", name: "포크리프트 구역", type: "danger", shape: "circle", cx: 632, cy: 222, r: 54, radiusM: 30, desc: "포크리프트 작업 중 스마트폰 사용 금지" },
      { id: "zone-4", name: "인천–서울 고속도로", type: "normal", shape: "polygon", points: "0,398 760,398 760,450 0,450", corners: 4, desc: "차량 운행 중 스마트폰 사용 제한" },
      { id: "zone-5", name: "휴게 구역", type: "normal", shape: "circle", cx: 477, cy: 326, r: 36, radiusM: 20, desc: "휴게 시간 사용 가능 구역" },
    ],
    policies: [
      { id: "policy-1", name: "판교 현장 위험 구역 통제 정책", desc: "판교 현장 내 모든 위험 구역에서 스마트폰 사용 차단", zones: ["zone-1", "zone-2"], times: ["time-1", "time-2"], behaviors: ["behavior-1", "behavior-3"], presets: ["preset-1"], priority: 1, active: true },
      { id: "policy-2", name: "차량 물류 운행 중 통제 정책", desc: "배송 차량 운행 중 스마트폰 사용 절대 차단", zones: ["zone-4"], times: ["time-1", "time-2", "time-3"], behaviors: ["behavior-2"], presets: ["preset-3"], priority: 1, active: true },
      { id: "policy-3", name: "인천 물류센터 창고 작업 통제", desc: "포크리프트 작업 구역 내 스마트폰 사용 제한", zones: ["zone-3"], times: ["time-1"], behaviors: ["behavior-1"], presets: ["preset-1", "preset-2"], priority: 2, active: true },
    ],
    hourly: [],
    logs: [],
    totalAll: 1847, /* mockStatsOverview.totalViolations */
    selZone: "zone-1",
    adding: false,
    newZoneN: 0,
    newPolicyN: 0,
    logType: "all",
    logZone: "all",
    playing: false,
    timer: 0,
  };

  /* 시간대별 위반 분포 — 일 평균 62건(mockStatsOverview.avgDaily)에 맞춘 근무시간 가중 분포 */
  const SHAPE = [0, 0, 0, 0, 0, 1, 2, 4, 6, 7, 6, 5, 2, 4, 6, 7, 6, 4, 3, 2, 1, 1, 0, 0];
  state.hourly = SHAPE.map((v) => {
    const total = Math.round(v * (0.7 + rng() * 0.6));
    const b = Math.round(total * (0.3 + rng() * 0.2));
    return { w: total - b, b };
  });

  /* ---------- helpers ---------- */
  const zoneById = (id) => state.zones.find((z) => z.id === id);
  const nameOf = (list, id) => {
    const it = list.find((x) => x.id === id);
    return it ? it.name : id;
  };
  const policiesFor = (z) => state.policies.filter((p) => p.active && p.zones.includes(z.id));
  const fmt = (n) => n.toLocaleString("ko-KR");
  const pad2 = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 탭 ---------- */
  const TABS = ["dash", "zones", "policies", "logs"];
  function activate(tab) {
    TABS.forEach((t) => {
      const on = t === tab;
      $("tab-" + t).classList.toggle("is-active", on);
      $("tab-" + t).setAttribute("aria-selected", String(on));
      $("panel-" + t).hidden = !on;
    });
    if (tab === "dash") renderDashboard();
    if (tab === "zones") { renderZoneLayer(); renderZoneInfo(); }
    if (tab === "policies") { renderBuilder(); renderPolicies(); }
    if (tab === "logs") { renderZoneSelect(); renderLogs(false); }
  }
  TABS.forEach((t) => $("tab-" + t).addEventListener("click", () => activate(t)));

  /* ---------- 대시보드 ---------- */
  function todaySums() {
    let w = 0, b = 0;
    state.hourly.forEach((d) => { w += d.w; b += d.b; });
    return { w, b };
  }
  function renderDashboard() { renderKpis(); renderChart(); }

  function kpiCard(k, v, s) {
    return '<div class="sums-kpi"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="s">' + s + "</div></div>";
  }
  function renderKpis() {
    const t = todaySums();
    const active = state.policies.filter((p) => p.active).length;
    const covered = new Set(state.policies.filter((p) => p.active).flatMap((p) => p.zones)).size;
    $("sums-kpis").innerHTML =
      kpiCard("관리 인원", "856명", "스마트건설 · 현장 3곳") +
      kpiCard("활성 정책", active + "개", "구역 " + covered + "곳에 적용") +
      kpiCard("최근 24시간 위반", fmt(t.w + t.b) + "건", '<span class="dn">▾ 12.5%</span> 지난주 대비') +
      kpiCard("누적 위반", fmt(state.totalAll) + "건", "최다 발생 · 크레인 작업 구역");
  }

  function roundTop(cls, x, y, w, h) {
    const r = Math.min(3, h);
    return '<path class="' + cls + '" d="M' + x + "," + (y + h) + " V" + (y + r) +
      " Q" + x + "," + y + " " + (x + r) + "," + y +
      " H" + (x + w - r) +
      " Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) +
      " V" + (y + h) + ' Z"/>';
  }

  function renderChart() {
    const H = state.hourly;
    const max = Math.max(1, ...H.map((d) => d.w + d.b));
    const top = Math.max(8, Math.ceil(max / 4) * 4);
    const W = 720, HT = 232, padL = 30, padR = 6, padT = 12, padB = 24;
    const iw = W - padL - padR, ih = HT - padT - padB;
    const slot = iw / 24, bw = Math.min(20, slot - 7);
    const y0 = padT + ih;
    const px = (v) => (v / top) * ih;
    let s = "";
    [0, 0.5, 1].forEach((f) => {
      const y = y0 - ih * f;
      s += '<line class="cg" x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '"/>';
      if (f > 0) s += '<text class="cl" x="' + (padL - 6) + '" y="' + (y + 3.5) + '" text-anchor="end">' + Math.round(top * f) + "</text>";
    });
    H.forEach((d, i) => {
      const x = padL + i * slot + (slot - bw) / 2;
      const hb = px(d.b), hw = px(d.w);
      const gap = d.b > 0 && d.w > 0 ? 2 : 0;
      if (d.b > 0) {
        if (d.w > 0) s += '<rect class="cb" x="' + x + '" y="' + (y0 - hb) + '" width="' + bw + '" height="' + hb + '"/>';
        else s += roundTop("cb", x, y0 - hb, bw, hb);
      }
      if (d.w > 0) s += roundTop("cw", x, y0 - hb - gap - hw, bw, hw);
    });
    [0, 6, 12, 18, 23].forEach((h) => {
      s += '<text class="cl" x="' + (padL + h * slot + slot / 2) + '" y="' + (HT - 8) + '" text-anchor="middle">' + h + "시</text>";
    });
    H.forEach((d, i) => {
      s += '<rect class="ch" data-h="' + i + '" x="' + (padL + i * slot) + '" y="' + padT + '" width="' + slot + '" height="' + ih + '"/>';
    });
    $("sums-chart").innerHTML = '<svg viewBox="0 0 ' + W + " " + HT + '" aria-hidden="true">' + s + "</svg>";
    const t = todaySums();
    const peak = H.reduce((m, d, i) => (d.w + d.b > H[m].w + H[m].b ? i : m), 0);
    $("sums-chart-summary").textContent =
      "최근 24시간 위반 " + (t.w + t.b) + "건 — 경고 " + t.w + "건, 차단 " + t.b + "건. 최다 시간대 " + peak + "시.";
  }

  const chartScroll = $("sums-chart-scroll");
  const tip = $("sums-tip");
  chartScroll.addEventListener("mouseover", (e) => {
    const hit = e.target.closest ? e.target.closest(".ch") : null;
    if (!hit) return;
    const i = Number(hit.dataset.h);
    const d = state.hourly[i];
    tip.textContent = i + "시 — 경고 " + d.w + " · 차단 " + d.b;
    const wr = chartScroll.getBoundingClientRect();
    const hr = hit.getBoundingClientRect();
    /* 가장자리 막대에서 툴팁이 스크롤 컨테이너 밖으로 삐져나가 가로 스크롤을
       만들지 않게, 툴팁 절반 폭만큼 안쪽으로 조인다 */
    const x = hr.left - wr.left + hr.width / 2 + chartScroll.scrollLeft;
    const half = (tip.offsetWidth || 0) / 2;
    tip.style.left = Math.round(Math.min(Math.max(x, half + 4), chartScroll.scrollWidth - half - 4)) + "px";
    tip.classList.add("show");
  });
  chartScroll.addEventListener("mouseleave", () => tip.classList.remove("show"));

  /* ---------- 구역 ---------- */
  function renderZoneLayer() {
    const zs = [...state.zones].sort((a, b) => (a.id === state.selZone ? 1 : 0) - (b.id === state.selZone ? 1 : 0));
    $("sums-zone-layer").innerHTML = zs.map((z) => {
      const cls = "zone zone-" + z.type + (z.id === state.selZone ? " is-sel" : "");
      return z.shape === "circle"
        ? '<circle class="' + cls + '" data-zone="' + z.id + '" cx="' + z.cx + '" cy="' + z.cy + '" r="' + z.r + '"/>'
        : '<polygon class="' + cls + '" data-zone="' + z.id + '" points="' + z.points + '"/>';
    }).join("");
  }

  function renderZoneInfo() {
    const rows = state.zones.map((x) =>
      '<button type="button" class="szi-row' + (x.id === state.selZone ? " is-sel" : "") + '" data-zone="' + x.id + '">' +
      '<i class="dot dot-' + x.type + '"></i><span class="n">' + esc(x.name) + "</span>" +
      '<span class="zb zb-' + x.type + '">' + (x.type === "danger" ? "위험" : "일반") + "</span></button>"
    ).join("");
    const z = zoneById(state.selZone);
    let detail = "";
    if (z) {
      const pols = policiesFor(z);
      detail =
        '<div class="szi-detail"><h4>' + esc(z.name) + '</h4><p class="d">' + esc(z.desc) + "</p><dl>" +
        "<div><dt>형태</dt><dd>" + (z.shape === "circle" ? "원형 · 반경 " + z.radiusM + "m" : "다각형 · 꼭짓점 " + z.corners + "개") + "</dd></div>" +
        "<div><dt>연결 정책</dt><dd>" +
        (pols.length ? pols.map((p) => esc(p.name)).join("<br>") : "없음 — 정책에 연결되기 전까지 위반이 발생하지 않습니다") +
        "</dd></div></dl></div>";
    }
    $("sums-zoneinfo").innerHTML = '<div class="szi-list">' + rows + "</div>" + detail;
  }

  const mapEl = $("sums-map");
  function setAdding(on) {
    state.adding = on;
    mapEl.classList.toggle("is-adding", on);
    const btn = $("sums-zone-add");
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-on", on);
    btn.textContent = on ? "추가 취소" : "+ 원형 구역 추가";
    $("sums-zone-hint").textContent = on
      ? "약도를 클릭하면 그 자리에 원형 구역이 생깁니다"
      : "구역을 클릭하면 상세 정보를 보여줍니다";
  }
  $("sums-zone-add").addEventListener("click", () => setAdding(!state.adding));

  mapEl.addEventListener("click", (e) => {
    if (state.adding) {
      const r = mapEl.getBoundingClientRect();
      const x = Math.round(((e.clientX - r.left) / r.width) * 760);
      const y = Math.round(((e.clientY - r.top) / r.height) * 480);
      state.newZoneN += 1;
      const z = {
        id: "zone-new-" + state.newZoneN,
        name: "신규 구역 " + state.newZoneN,
        type: $("sums-zt-normal").checked ? "normal" : "danger",
        shape: "circle",
        /* 반지름 46이 760×480 viewBox 밖으로 잘리지 않게 중심을 조인다 */
        cx: Math.max(48, Math.min(712, x)),
        cy: Math.max(48, Math.min(432, y)),
        r: 46,
        radiusM: 40,
        desc: "데모에서 추가한 구역입니다. 정책 탭에서 이 구역을 정책에 연결해 보세요.",
      };
      state.zones.push(z);
      state.selZone = z.id;
      setAdding(false);
      renderZoneLayer();
      renderZoneInfo();
      return;
    }
    const hit = e.target.closest ? e.target.closest("[data-zone]") : null;
    if (hit) {
      state.selZone = hit.dataset.zone;
      renderZoneLayer();
      renderZoneInfo();
    }
  });

  $("sums-zoneinfo").addEventListener("click", (e) => {
    const row = e.target.closest("[data-zone]");
    if (!row) return;
    state.selZone = row.dataset.zone;
    renderZoneLayer();
    renderZoneInfo();
  });

  /* ---------- 정책 빌더 ---------- */
  const sel = { zones: new Set(), times: new Set(), behaviors: new Set(), presets: new Set() };

  function chipGroup(key, title, items) {
    const chips = items.map((it) =>
      '<button type="button" class="sums-chip" data-group="' + key + '" data-id="' + it.id + '" aria-pressed="' +
      sel[key].has(it.id) + '" title="' + esc(it.detail || it.desc || "") + '">' + esc(it.name) + "</button>"
    ).join("");
    return '<div class="sums-bgroup"><h4>' + title + '</h4><div class="chips">' + chips + "</div></div>";
  }
  function renderBuilder() {
    $("sums-bgroups").innerHTML =
      chipGroup("zones", "구역", state.zones) +
      chipGroup("times", "시간 정책", TIMES) +
      chipGroup("behaviors", "행동 조건", BEHAVIORS) +
      chipGroup("presets", "유해앱 프리셋", PRESETS);
    renderSummary();
  }
  $("sums-bgroups").addEventListener("click", (e) => {
    const chip = e.target.closest(".sums-chip");
    if (!chip) return;
    const set = sel[chip.dataset.group];
    const id = chip.dataset.id;
    if (set.has(id)) set.delete(id); else set.add(id);
    chip.setAttribute("aria-pressed", String(set.has(id)));
    renderSummary();
  });

  const builderValid = () => sel.zones.size > 0 && sel.times.size > 0;
  function renderSummary() {
    const s = "구역 " + sel.zones.size + " · 시간 " + sel.times.size + " · 행동 " + sel.behaviors.size + " · 앱 " + sel.presets.size;
    const hint = builderValid() ? "" : ' <span class="warn">— 구역과 시간 정책을 각각 1개 이상 선택합니다</span>';
    $("sums-bsummary").innerHTML = s + hint;
    $("sums-pcreate").disabled = !builderValid();
  }

  $("sums-pcreate").addEventListener("click", () => {
    if (!builderValid()) return;
    state.newPolicyN += 1;
    const name = $("sums-pname").value.trim() || "신규 통제 정책 " + state.newPolicyN;
    state.policies.unshift({
      id: "policy-new-" + state.newPolicyN,
      name,
      desc: "데모에서 생성한 정책입니다",
      zones: [...sel.zones],
      times: [...sel.times],
      behaviors: [...sel.behaviors],
      presets: [...sel.presets],
      priority: state.policies.length + 1,
      active: true,
      isNew: true,
    });
    sel.zones.clear(); sel.times.clear(); sel.behaviors.clear(); sel.presets.clear();
    $("sums-pname").value = "";
    renderBuilder();
    renderPolicies();
  });

  function renderPolicies() {
    const row = (k, ids, list, isZone) => {
      if (!ids.length) return "";
      const chips = ids.map((id) => {
        const nm = isZone ? (zoneById(id) ? zoneById(id).name : id) : nameOf(list, id);
        return '<span class="pchip">' + esc(nm) + "</span>";
      }).join("");
      return '<div class="pc-row"><span class="pk">' + k + '</span><span class="pv">' + chips + "</span></div>";
    };
    $("sums-plist").innerHTML = state.policies.map((p) =>
      '<article class="sums-pcard' + (p.isNew ? " is-new" : "") + '">' +
      '<div class="pc-head"><h4>' + esc(p.name) + "</h4>" +
      '<span class="pc-badges"><span class="zb zb-on">활성</span><span class="zb">우선순위 ' + p.priority + "</span></span></div>" +
      '<p class="pc-desc">' + esc(p.desc) + "</p>" +
      row("구역", p.zones, null, true) +
      row("시간", p.times, TIMES, false) +
      row("행동", p.behaviors, BEHAVIORS, false) +
      row("앱", p.presets, PRESETS, false) +
      "</article>"
    ).join("");
    state.policies.forEach((p) => { p.isNew = false; });
  }

  /* ---------- 위반 로그 ---------- */
  function spawnLog(ts) {
    const pool = [];
    state.zones.forEach((z) => {
      const pols = policiesFor(z);
      if (!pols.length) return;
      for (let i = 0, n = z.type === "danger" ? 3 : 1; i < n; i++) pool.push({ z, pols });
    });
    if (!pool.length) return null;
    const pick = pool[Math.floor(rng() * pool.length)];
    const road = pick.z.id === "zone-4";
    const reasons = road ? REASONS_ROAD : REASONS_WORK;
    const block = rng() < 0.42;
    const extra = road
      ? Math.round(34 + rng() * 46) + "km/h"
      : (rng() < 0.5 ? Math.round(5 + rng() * 18) + "걸음" : Math.round(10 + rng() * 40) + "m 이동");
    return {
      time: pad2(ts.getHours()) + ":" + pad2(ts.getMinutes()) + ":" + pad2(ts.getSeconds()),
      hour: ts.getHours(),
      emp: EMPLOYEES[Math.floor(rng() * EMPLOYEES.length)],
      zone: pick.z,
      /* seed-simple.ts처럼 로그에는 '당시 이름'을 복사해 저장한다 */
      policy: pick.pols[Math.floor(rng() * pick.pols.length)].name,
      type: block ? "차단" : "경고",
      reason: reasons[Math.floor(rng() * reasons.length)],
      extra,
    };
  }

  (function seedLogs() {
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const l = spawnLog(new Date(now - i * 15 * 60 * 1000));
      if (l) state.logs.unshift(l);
    }
  })();

  function renderZoneSelect() {
    $("sums-lzone").innerHTML =
      '<option value="all">전체 구역</option>' +
      state.zones.map((z) =>
        '<option value="' + z.id + '"' + (z.id === state.logZone ? " selected" : "") + ">" + esc(z.name) + "</option>"
      ).join("");
  }

  function renderLogs(flash) {
    const rows = state.logs.filter((l) =>
      (state.logType === "all" || l.type === state.logType) &&
      (state.logZone === "all" || l.zone.id === state.logZone));
    $("sums-logbody").innerHTML = rows.slice(0, 40).map((l, i) =>
      "<tr" + (flash && i === 0 ? ' class="is-new"' : "") + ">" +
      '<td class="lt">' + l.time + "</td>" +
      '<td class="le">' + esc(l.emp.name) + '<span class="sub">' + esc(l.emp.role) + "</span></td>" +
      "<td>" + esc(l.zone.name) + "</td>" +
      '<td class="lp">' + esc(l.policy) + "</td>" +
      '<td><span class="lg ' + (l.type === "차단" ? "lg-block" : "lg-warn") + '">' + l.type + "</span></td>" +
      '<td class="lr">' + esc(l.reason) + '<span class="sub"> · ' + l.extra + "</span></td>" +
      "</tr>"
    ).join("");
    $("sums-lcount").textContent = Math.min(rows.length, 40) + " / " + state.logs.length + "건";
  }

  $("sums-ltype").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-type]");
    if (!chip) return;
    state.logType = chip.dataset.type;
    $("sums-ltype").querySelectorAll("[data-type]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    renderLogs(false);
  });
  $("sums-lzone").addEventListener("change", (e) => {
    state.logZone = e.target.value;
    renderLogs(false);
  });

  function tick() {
    if (document.hidden) return;
    const l = spawnLog(new Date());
    if (!l) return;
    state.logs.unshift(l);
    if (state.logs.length > 120) state.logs.pop();
    const h = state.hourly[l.hour];
    if (l.type === "차단") h.b += 1; else h.w += 1;
    state.totalAll += 1;
    if (!$("panel-logs").hidden) renderLogs(true);
    if (!$("panel-dash").hidden) renderDashboard();
  }
  function setPlaying(on) {
    state.playing = on;
    const btn = $("sums-play");
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-on", on);
    btn.textContent = on ? "⏸ 정지" : "▶ 재생";
    clearInterval(state.timer);
    if (on) { tick(); state.timer = setInterval(tick, 1000); }
  }
  $("sums-play").addEventListener("click", () => setPlaying(!state.playing));

  /* 화면 밖으로 스크롤되면 스트림을 멈춘다 — 안 보이는 표에 타이머를 태울 이유가 없다 */
  const frame = document.querySelector(".demo-frame");
  if (frame && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting && state.playing) setPlaying(false);
      });
    }, { threshold: 0 }).observe(frame);
  }

  /* ---------- init ---------- */
  activate("dash");
})();
