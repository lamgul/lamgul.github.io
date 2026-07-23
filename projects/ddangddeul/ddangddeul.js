/* ddangddeul.js — 땅뜰 데모 전체 로직.
   필지·매물·실거래·단계·서류 데이터는 lamgul/FBM(비공개)의
   backend/db.py, backend/sample_data.py, backend/doc_catalog.py 시드를 그대로 이식.
   안전도 로직은 frontend/js/sheet.js의 riskAssess 포팅. 네트워크 요청 0. */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KEY = "ddangddeul-demo-v1";

  /* ================= 데이터 (원본: backend/db.py _PARCELS · 좌표/수치 원본 그대로) ================= */
  var PARCELS = [
    { id: "P1", jibun: "청록군 들말면 산137-1", jimok: "임야", zone: "계획관리지역", area: 1820, price: 98000, road: true, lda: false, farm: false, owner: "개인",
      ll: [[37.29950, 127.63560], [37.29958, 127.63700], [37.29880, 127.63710], [37.29872, 127.63570]] },
    { id: "P2", jibun: "청록군 들말면 220-4", jimok: "전", zone: "농림지역", area: 4650, price: 52000, road: true, lda: false, farm: true, owner: "개인",
      ll: [[37.29956, 127.63715], [37.29962, 127.63880], [37.29878, 127.63890], [37.29876, 127.63722]] },
    { id: "P3", jibun: "청록군 들말면 221-1", jimok: "답", zone: "생산관리지역", area: 2380, price: 61000, road: false, lda: false, farm: true, owner: "법인",
      ll: [[37.29960, 127.63893], [37.29964, 127.64010], [37.29882, 127.64018], [37.29880, 127.63902]] },
    { id: "P4", jibun: "청록군 들말면 305-2", jimok: "대", zone: "제2종일반주거지역", area: 412, price: 410000, road: true, lda: false, farm: false, owner: "개인",
      ll: [[37.29840, 127.63565], [37.29844, 127.63660], [37.29786, 127.63665], [37.29782, 127.63572]] },
    { id: "P5", jibun: "청록군 들말면 306", jimok: "대", zone: "제2종일반주거지역", area: 288, price: 435000, road: true, lda: true, farm: false, owner: "개인",
      ll: [[37.29842, 127.63668], [37.29846, 127.63745], [37.29788, 127.63750], [37.29785, 127.63674]] },
    { id: "P6", jibun: "청록군 들말면 310-7", jimok: "전", zone: "계획관리지역", area: 960, price: 145000, road: true, lda: false, farm: true, owner: "개인",
      ll: [[37.29844, 127.63752], [37.29850, 127.63900], [37.29790, 127.63908], [37.29786, 127.63758]] },
    { id: "P7", jibun: "청록군 들말면 402", jimok: "임야", zone: "자연녹지지역", area: 3210, price: 38000, road: false, lda: false, farm: false, owner: "국공유",
      ll: [[37.29775, 127.63560], [37.29780, 127.63740], [37.29680, 127.63750], [37.29674, 127.63575]] },
    { id: "P8", jibun: "청록군 들말면 405-3", jimok: "잡종지", zone: "계획관리지역", area: 530, price: 120000, road: true, lda: false, farm: false, owner: "법인",
      ll: [[37.29778, 127.63755], [37.29784, 127.63905], [37.29688, 127.63915], [37.29682, 127.63765]] }
  ];

  /* 주변 필지망 — db.py _seed_area_parcels의 지목·용도지역·단가 밴드를 따름 (rect: [latMin,latMax,lngMin,lngMax]) */
  var EXTRA = [
    { id: "G01", bun: "501",   jimok: "전",    zone: "계획관리지역",       area: 990,  price: 62000,  road: true,  farm: true,  owner: "개인",   rect: [37.29880, 37.29962, 127.63300, 127.63413] },
    { id: "G02", bun: "502-3", jimok: "임야",  zone: "자연녹지지역",       area: 1980, price: 28000,  road: false, farm: false, owner: "개인",   rect: [37.29880, 37.29962, 127.63420, 127.63543] },
    { id: "G03", bun: "503",   jimok: "답",    zone: "생산관리지역",       area: 660,  price: 48000,  road: true,  farm: true,  owner: "개인",   rect: [37.29792, 37.29872, 127.63300, 127.63413] },
    { id: "G04", bun: "505-1", jimok: "전",    zone: "농림지역",           area: 1320, price: 41000,  road: true,  farm: true,  owner: "법인",   rect: [37.29792, 37.29872, 127.63420, 127.63543] },
    { id: "G05", bun: "507",   jimok: "잡종지", zone: "계획관리지역",       area: 495,  price: 112000, road: true,  farm: false, owner: "개인",   rect: [37.29704, 37.29784, 127.63300, 127.63413] },
    { id: "G06", bun: "508-2", jimok: "대",    zone: "제2종일반주거지역",  area: 330,  price: 392000, road: true,  farm: false, owner: "개인",   rect: [37.29704, 37.29784, 127.63420, 127.63543] },
    { id: "G07", bun: "509",   jimok: "임야",  zone: "자연녹지지역",       area: 2640, price: 19000,  road: false, farm: false, owner: "국공유", rect: [37.29612, 37.29696, 127.63300, 127.63413] },
    { id: "G08", bun: "511-4", jimok: "전",    zone: "계획관리지역",       area: 825,  price: 71000,  road: true,  farm: true,  owner: "개인",   rect: [37.29612, 37.29662, 127.63560, 127.63688] },
    { id: "G09", bun: "512",   jimok: "답",    zone: "생산관리지역",       area: 990,  price: 39000,  road: false, farm: true,  owner: "개인",   rect: [37.29612, 37.29662, 127.63695, 127.63828] },
    { id: "G10", bun: "514-2", jimok: "잡종지", zone: "계획관리지역",       area: 264,  price: 131000, road: true,  farm: false, owner: "법인",   rect: [37.29612, 37.29662, 127.63835, 127.63938] },
    { id: "G11", bun: "515",   jimok: "전",    zone: "농림지역",           area: 1980, price: 33000,  road: true,  farm: true,  owner: "개인",   rect: [37.29612, 37.29662, 127.63945, 127.64100] },
    { id: "G12", bun: "517-1", jimok: "임야",  zone: "자연녹지지역",       area: 3300, price: 21000,  road: false, farm: false, owner: "국공유", rect: [37.29820, 37.29962, 127.64032, 127.64102] },
    { id: "G13", bun: "518",   jimok: "전",    zone: "계획관리지역",       area: 660,  price: 58000,  road: true,  farm: true,  owner: "개인",   rect: [37.29676, 37.29812, 127.64032, 127.64102] }
  ];

  /* 매물 (원본: db.py _LISTINGS 원본 그대로) */
  var LISTINGS = [
    { id: "L1", src: "P6", jibun: "들말면 310-12 (310-7에서 분필)", jimok: "전", zone: "계획관리지역", area: 120, total: 4350, road: true, farm: true,
      desc: "도로 접함 · 분필 등기 완료 · 계획관리지역이라 개발 유연성 높음", by: "owner", broker: null },
    { id: "L2", src: "P4", jibun: "들말면 305-8 (305-2에서 분필)", jimok: "대", zone: "제2종일반주거지역", area: 66, total: 8200, road: true, farm: false,
      desc: "주거지역 최소면적(60㎡) 상회 · 단독 건축 가능 검토됨", by: "broker", broker: "들말공인중개사사무소" },
    { id: "L3", src: "P1", jibun: "들말면 산137-9 (산137-1에서 분필)", jimok: "임야", zone: "계획관리지역", area: 210, total: 1980, road: true, farm: false,
      desc: "완경사 임야 · 진입로 확보 · 산지일시사용신고 안내 포함", by: "owner", broker: null }
  ];

  /* 주변 실거래 30건 — 원본 sample_data.py _gen_trades(seed=42) 실행 결과 그대로 */
  var TRADES = [
    { date: "2026-07-20", jimok: "잡종지", dong: "청록읍", area: 495, ppm: 111643, share: false },
    { date: "2026-07-14", jimok: "잡종지", dong: "들말면", area: 330, ppm: 151953, share: false },
    { date: "2026-07-03", jimok: "잡종지", dong: "샛강면", area: 150, ppm: 100322, share: false },
    { date: "2026-07-01", jimok: "대", dong: "들말면", area: 495, ppm: 418704, share: true },
    { date: "2026-06-27", jimok: "전", dong: "들말면", area: 495, ppm: 64911, share: false },
    { date: "2026-06-06", jimok: "임야", dong: "샛강면", area: 150, ppm: 59796, share: false },
    { date: "2026-05-09", jimok: "잡종지", dong: "들말면", area: 330, ppm: 144987, share: false },
    { date: "2026-05-07", jimok: "잡종지", dong: "들말면", area: 495, ppm: 103947, share: false },
    { date: "2026-04-21", jimok: "잡종지", dong: "청록읍", area: 330, ppm: 131245, share: false },
    { date: "2026-04-12", jimok: "잡종지", dong: "들말면", area: 990, ppm: 124438, share: false },
    { date: "2026-04-07", jimok: "답", dong: "청록읍", area: 990, ppm: 45899, share: false },
    { date: "2026-02-19", jimok: "답", dong: "샛강면", area: 150, ppm: 61461, share: false },
    { date: "2026-02-15", jimok: "임야", dong: "들말면", area: 495, ppm: 22310, share: false },
    { date: "2026-01-28", jimok: "잡종지", dong: "들말면", area: 99, ppm: 110635, share: false },
    { date: "2026-01-13", jimok: "전", dong: "들말면", area: 1650, ppm: 87823, share: true },
    { date: "2026-01-04", jimok: "잡종지", dong: "들말면", area: 660, ppm: 90074, share: false },
    { date: "2025-11-14", jimok: "전", dong: "샛강면", area: 210, ppm: 47185, share: false },
    { date: "2025-10-08", jimok: "전", dong: "들말면", area: 2480, ppm: 78555, share: false },
    { date: "2025-09-20", jimok: "전", dong: "들말면", area: 330, ppm: 46140, share: true },
    { date: "2025-09-15", jimok: "전", dong: "들말면", area: 330, ppm: 56295, share: false },
    { date: "2025-08-17", jimok: "답", dong: "청록읍", area: 990, ppm: 55428, share: false },
    { date: "2025-07-23", jimok: "대", dong: "샛강면", area: 1650, ppm: 349521, share: false },
    { date: "2025-04-05", jimok: "전", dong: "들말면", area: 495, ppm: 41639, share: true },
    { date: "2024-12-11", jimok: "전", dong: "들말면", area: 2480, ppm: 77957, share: false },
    { date: "2024-11-21", jimok: "대", dong: "들말면", area: 1650, ppm: 387767, share: false },
    { date: "2024-09-08", jimok: "전", dong: "들말면", area: 660, ppm: 42058, share: false },
    { date: "2024-04-27", jimok: "잡종지", dong: "들말면", area: 660, ppm: 118785, share: false },
    { date: "2024-02-13", jimok: "답", dong: "들말면", area: 660, ppm: 49110, share: false },
    { date: "2024-01-22", jimok: "임야", dong: "들말면", area: 330, ppm: 52837, share: false },
    { date: "2024-01-21", jimok: "전", dong: "샛강면", area: 2480, ppm: 69041, share: false }
  ];

  /* 거래 단계 (원본: doc_catalog.py deal_stages) */
  function dealStages(farm, lda) {
    var s = [
      { key: "inquiry", name: "매물 확인·문의", desc: "공부서류(등기부·토지대장·토지이용계획) 플랫폼 자동 열람 제공" },
      { key: "pre", name: "가계약", desc: "가계약금 입금 · 매매 주요조건 합의 (문자·서면 기록 자동 보관)" },
      { key: "contract", name: "본계약", desc: "전자 매매계약서 + 중개대상물 확인·설명서 교부 · 계약금 지급" }
    ];
    if (farm) s.push({ key: "farm", name: "농지취득자격증명", desc: "매수인이 정부24에서 발급 후 업로드 (미발급 시 등기 불가)" });
    if (lda) s.push({ key: "permit", name: "토지거래허가", desc: "허가구역 — 관할청 허가 후 계약 효력 발생" });
    s.push(
      { key: "balance", name: "잔금·소유권이전등기", desc: "잔금 지급 → 취득세 납부 → 법무사 등기 신청 (진행상황 트래킹)" },
      { key: "done", name: "거래 완료", desc: "실거래가 신고(계약 후 30일 이내) · 등기필정보 확인" }
    );
    return s;
  }
  var STAGE_SHORT = { inquiry: "확인·문의", pre: "가계약", contract: "본계약", farm: "농취증", permit: "허가", balance: "잔금·등기", done: "완료" };

  /* 단계별 필요서류 (원본: doc_catalog.py DEAL_DOCS — auto: true=플랫폼/법무사 자동, "pay"=입금확인 시 자동 첨부) */
  var DEAL_DOCS = [
    { key: "buyer_id", name: "매수인 신분증", by: "매수인", from: "본인 소지", stage: "contract", auto: false },
    { key: "resident_copy", name: "주민등록등본(매수인)", by: "매수인", from: "정부24", stage: "contract", auto: false },
    { key: "seller_deed", name: "등기권리증(등기필증)", by: "매도인", from: "본인 소지", stage: "contract", auto: false },
    { key: "seller_seal", name: "인감증명서(매도용)", by: "매도인", from: "주민센터", stage: "contract", auto: false },
    { key: "seller_addr", name: "주민등록초본(주소이력)", by: "매도인", from: "정부24", stage: "contract", auto: false },
    { key: "contract_doc", name: "매매계약서(전자서명)", by: "중개사/플랫폼", from: "플랫폼 자동생성", stage: "contract", auto: true },
    { key: "confirm_doc", name: "중개대상물 확인·설명서", by: "중개사", from: "플랫폼 자동생성", stage: "contract", auto: true },
    { key: "down_receipt", name: "계약금 입금확인증", by: "매수인", from: "은행/에스크로", stage: "contract", auto: "pay" },
    { key: "farm_cert", name: "농지취득자격증명", by: "매수인", from: "정부24(농지소재지 발급)", stage: "farm", auto: false },
    { key: "farm_plan", name: "농업경영계획서", by: "매수인", from: "정부24 작성", stage: "farm", auto: false },
    { key: "permit_app", name: "토지거래계약 허가신청서", by: "매수인(중개사 대행)", from: "관할 시·군·구", stage: "permit", auto: false },
    { key: "fund_plan", name: "자금조달·이용계획서", by: "매수인", from: "본인 작성", stage: "permit", auto: false },
    { key: "balance_receipt", name: "잔금 이체확인증", by: "매수인", from: "은행/에스크로", stage: "balance", auto: "pay" },
    { key: "acq_tax", name: "취득세 납부확인서", by: "매수인", from: "위택스", stage: "balance", auto: false },
    { key: "bond", name: "국민주택채권 매입확인", by: "매수인", from: "은행", stage: "balance", auto: false },
    { key: "reg_delegate", name: "등기 위임장", by: "매도인+매수인", from: "법무사 서식", stage: "balance", auto: true },
    { key: "reg_apply", name: "소유권이전등기 신청 접수증", by: "법무사", from: "등기소", stage: "balance", auto: true },
    { key: "rtms_report", name: "부동산거래 신고필증", by: "중개사", from: "부동산거래관리시스템", stage: "done", auto: true },
    { key: "reg_done", name: "등기필정보(등기완료 확인)", by: "법무사", from: "등기소", stage: "done", auto: true }
  ];

  /* 에스크로 가상계좌 (원본: main.py _escrow_account(did=1)) */
  var ESCROW = { bank: "㈜땅뜰안전결제(신탁)", account: "1002-1001-573920" };

  /* ================= 유틸 ================= */
  function fmt(n) { return n.toLocaleString("ko-KR"); }
  function pyeong(m2) { return Math.round(m2 * 0.3025); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function zoneShort(z) {
    return z.replace("제2종일반주거지역", "2종주거").replace("지역", "");
  }
  function jimokClass(j) { return { "전": "jm-jeon", "답": "jm-dap", "임야": "jm-imya", "대": "jm-dae", "잡종지": "jm-jap" }[j] || "jm-jeon"; }
  function zoneClass(z) {
    if (z.indexOf("계획관리") >= 0) return "zn-plan";
    if (z.indexOf("생산관리") >= 0) return "zn-prod";
    if (z.indexOf("농림") >= 0) return "zn-agri";
    if (z.indexOf("자연녹지") >= 0) return "zn-green";
    if (z.indexOf("주거") >= 0) return "zn-resi";
    return "zn-plan";
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var timers = [];
  function after(ms, fn) { var id = setTimeout(fn, RM ? Math.min(ms, 80) : ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers.length = 0; }

  /* ================= 지도 ================= */
  var B = { minLat: 37.29600, maxLat: 37.29975, minLng: 127.63290, maxLng: 127.64110 };
  var VW = 1000, VH = 575;
  function X(lng) { return (lng - B.minLng) / (B.maxLng - B.minLng) * VW; }
  function Y(lat) { return (B.maxLat - lat) / (B.maxLat - B.minLat) * VH; }

  var ALL = [];                 // 렌더 대상 전체 필지
  PARCELS.forEach(function (p) { ALL.push(p); });
  (function () {                // 주변 필지망: 사각 경계 + 결정적 지터 (원본의 random jitter 재현)
    var rand = mulberry32(7);
    EXTRA.forEach(function (g) {
      var j = function () { return (rand() - 0.5) * 0.00009; };
      var la1 = g.rect[0], la2 = g.rect[1], ln1 = g.rect[2], ln2 = g.rect[3];
      ALL.push({
        id: g.id, jibun: "청록군 들말면 " + g.bun, jimok: g.jimok, zone: g.zone,
        area: g.area, price: g.price, road: g.road, lda: false, farm: g.farm, owner: g.owner,
        ll: [[la2 + j(), ln1 + j()], [la2 + j(), ln2 + j()], [la1 + j(), ln2 + j()], [la1 + j(), ln1 + j()]]
      });
    });
  })();

  function centroid(ll) {
    var sx = 0, sy = 0;
    ll.forEach(function (pt) { sx += X(pt[1]); sy += Y(pt[0]); });
    return [sx / ll.length, sy / ll.length];
  }

  function buildMap() {
    var s = '<rect class="dd-mapbg" x="-400" y="-400" width="1800" height="1400"/>';
    // 도로 (개략)
    var rx1 = X(127.635515), rx2 = X(127.64025), ry = Y(37.29669);
    [[rx1, 9], [rx2, 8]].forEach(function (r) {
      s += '<path class="dd-road" stroke-width="' + r[1] + '" d="M' + r[0] + ',-20 V' + (VH + 20) + '"/>';
    });
    s += '<path class="dd-road" stroke-width="10" d="M-20,' + ry + ' H' + (VW + 20) + '"/>';
    s += '<path class="dd-roadline" stroke-width="1.4" d="M-20,' + ry + ' H' + (VW + 20) + '"/>';
    s += '<path class="dd-roadline" stroke-width="1.4" d="M' + rx1 + ',-20 V' + (VH + 20) + '"/>';
    // 필지
    ALL.forEach(function (p) {
      var pts = p.ll.map(function (pt) { return X(pt[1]).toFixed(1) + "," + Y(pt[0]).toFixed(1); }).join(" ");
      var c = centroid(p.ll);
      var bun = p.jibun.replace(/^청록군 들말면 /, "");
      s += '<g class="dd-pg" data-gid="' + p.id + '">' +
        '<polygon class="dd-parcel ' + jimokClass(p.jimok) + ' ' + zoneClass(p.zone) + '" data-pid="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(p.jibun + " " + p.jimok) + '" points="' + pts + '"/>' +
        '<text class="dd-lbl" x="' + c[0].toFixed(1) + '" y="' + (c[1] - 3).toFixed(1) + '">' + esc(bun) +
        '<tspan class="dd-lbl-sub" x="' + c[0].toFixed(1) + '" dy="13">' + esc(p.jimok) + '</tspan></text></g>';
    });
    // 매물 마커 (가격표)
    LISTINGS.forEach(function (l) {
      var p = ALL.find(function (x) { return x.id === l.src; });
      if (!p) return;
      var c = centroid(p.ll);
      var label = fmt(l.total) + "만";
      var w = label.length * 7.6 + 18;
      s += '<g class="dd-tag" data-pid="' + p.id + '">' +
        '<circle class="dd-ping" cx="' + c[0] + '" cy="' + (c[1] + 16) + '" r="6"/>' +
        '<circle class="dd-pin" cx="' + c[0] + '" cy="' + (c[1] + 16) + '" r="4"/>' +
        '<rect x="' + (c[0] - w / 2) + '" y="' + (c[1] + 24) + '" width="' + w + '" height="19" rx="9.5"/>' +
        '<text x="' + c[0] + '" y="' + (c[1] + 37.5) + '">' + esc(label) + '</text></g>';
    });
    $("#dd-map").innerHTML = s;
  }

  /* --- 지도 팬(드래그) --- */
  var pan = { x: 0, y: 0 };
  var drag = null, suppressClick = false;
  function applyPan() {
    var el = $("#dd-map");
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var scale = Math.max(r.width / VW, r.height / VH);
    var mx = Math.max(0, (VW - r.width / scale) / 2);
    var my = Math.max(0, (VH - r.height / scale) / 2);
    pan.x = Math.max(-mx, Math.min(mx, pan.x));
    pan.y = Math.max(-my, Math.min(my, pan.y));
    el.setAttribute("viewBox", pan.x + " " + pan.y + " " + VW + " " + VH);
  }
  function wirePan() {
    var el = $("#dd-map");
    el.addEventListener("pointerdown", function (e) {
      drag = { px: e.clientX, py: e.clientY, x: pan.x, y: pan.y, moved: 0 };
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* no-op */ }
    });
    el.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var r = el.getBoundingClientRect();
      var scale = Math.max(r.width / VW, r.height / VH);
      var dx = e.clientX - drag.px, dy = e.clientY - drag.py;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      if (drag.moved > 6) el.classList.add("dragging");
      pan.x = drag.x - dx / scale;
      pan.y = drag.y - dy / scale;
      applyPan();
    });
    var end = function () {
      if (drag && drag.moved > 6) { suppressClick = true; setTimeout(function () { suppressClick = false; }, 0); }
      drag = null;
      el.classList.remove("dragging");
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    window.addEventListener("resize", applyPan);
  }

  /* ================= 안전도 (원본: frontend/js/sheet.js riskAssess 포팅) ================= */
  function riskAssess(p) {
    var risk = 0, bad = [], good = [];
    if (p.road === false) { risk += 30; bad.push("맹지 — 도로 미접으로 건축·개발 제한"); }
    else if (p.road === true) good.push("도로에 접함");
    var z = p.zone || "";
    if (z.indexOf("농림") >= 0 || z.indexOf("보전") >= 0 || z.indexOf("자연환경") >= 0) { risk += 22; bad.push(z + " — 개발 제약이 큼"); }
    else if (z.indexOf("계획관리") >= 0 || z.indexOf("주거") >= 0 || z.indexOf("상업") >= 0 || z.indexOf("공업") >= 0) good.push(z + " — 개발 유연성 있음");
    if (p.farm) { risk += 8; bad.push("농지 — 취득 시 농취증 필요"); }
    if (p.lda) { risk += 6; bad.push("토지거래허가구역 — 실수요 심사"); }
    var same = TRADES.filter(function (t) { return t.jimok === p.jimok && !t.share; });
    var avg = same.length ? Math.round(same.reduce(function (a, b) { return a + b.ppm; }, 0) / same.length) : null;
    if (avg && p.price != null) {
      var dev = Math.round((p.price - avg) / avg * 100);
      if (dev > 40) { risk += 24; bad.push("가격이 주변 실거래 평균보다 " + dev + "% 높음 — 부풀리기 주의"); }
      else if (dev < -20) good.push("주변 시세 대비 저평가");
      else good.push("시세 범위 내 가격");
    }
    var shareR = TRADES.filter(function (t) { return t.share; }).length / TRADES.length;
    if (shareR > 0.25) { risk += 12; bad.push("주변 지분거래 비중 높음 — 기획부동산 주의 지역"); }
    risk = Math.min(100, risk);
    var grade = risk >= 55 ? "위험" : risk >= 30 ? "주의" : "양호";
    return { risk: risk, grade: grade, bad: bad, good: good };
  }

  /* ================= 상세 시트 ================= */
  var selId = null;

  function selectParcel(id) {
    var prev = document.querySelector(".dd-parcel.sel");
    if (prev) prev.classList.remove("sel");
    selId = id;
    if (!id) { closeSheet(); return; }
    var poly = document.querySelector('.dd-parcel[data-pid="' + id + '"]');
    if (poly) poly.classList.add("sel");
    renderSheet(ALL.find(function (p) { return p.id === id; }));
  }
  function closeSheet() {
    var sh = $("#dd-sheet");
    sh.classList.remove("open");
    sh.setAttribute("aria-hidden", "true");
    var prev = document.querySelector(".dd-parcel.sel");
    if (prev) prev.classList.remove("sel");
    selId = null;
  }

  function badgesOf(p, listed) {
    var b = '<span class="dd-badge b-teal">' + esc(p.jimok) + '</span>' +
      '<span class="dd-badge b-mute">' + esc(zoneShort(p.zone)) + '</span>' +
      (p.road === true ? '<span class="dd-badge b-mute">도로접함</span>' : '<span class="dd-badge b-accent">맹지</span>') +
      (p.lda ? '<span class="dd-badge b-accent">허가구역</span>' : "") +
      (p.farm ? '<span class="dd-badge b-teal">농지</span>' : "");
    if (listed) b += '<span class="dd-badge b-ink">판매중</span>';
    return b;
  }

  function listingCTA(l) {
    if (deal && deal.lid === l.id)
      return '<button class="dd-btn primary" type="button" data-act="godeal">거래 진행중 — 내 거래 보기</button>';
    if (deal)
      return '<button class="dd-btn primary" type="button" disabled title="데모는 거래 1건씩 진행합니다">다른 거래 진행중</button>';
    return '<button class="dd-btn primary" type="button" data-act="buy" data-lid="' + l.id + '">구매 시작</button>';
  }

  function renderSheet(p) {
    if (!p) return;
    var l = LISTINGS.find(function (x) { return x.src === p.id; });
    var R = riskAssess(p);
    var gcls = R.grade === "위험" ? "g-bad" : R.grade === "주의" ? "g-warn" : "g-good";
    var sameAll = TRADES.filter(function (t) { return t.jimok === p.jimok && !t.share; });
    var same = sameAll.slice(0, 4);
    var avg = sameAll.length ? Math.round(sameAll.reduce(function (a, b) { return a + b.ppm; }, 0) / sameAll.length) : null;

    var h = '<div class="dd-sh-head"><div><h3>' + esc(p.jibun) + '</h3>' +
      '<div class="dd-badges">' + badgesOf(p, !!l) + '</div></div>' +
      '<button class="dd-x" type="button" data-act="close" aria-label="닫기">×</button></div>';

    h += '<div class="dd-stats">' +
      '<div class="dd-stat"><span>면적</span><b>' + fmt(p.area) + '㎡</b><i>약 ' + fmt(pyeong(p.area)) + '평</i></div>' +
      '<div class="dd-stat"><span>공시지가</span><b>' + fmt(p.price) + '원</b><i>㎡당 · 2026.01</i></div>' +
      '<div class="dd-stat"><span>추정 공시가액</span><b>' + fmt(Math.round(p.area * p.price / 10000)) + '만원</b><i>소유 ' + esc(p.owner) + '</i></div></div>';

    h += '<div class="dd-risk"><div class="dd-risk-head"><b>안전도 진단 <span class="dd-badge b-mute">참고</span></b>' +
      '<span class="dd-risk-grade ' + gcls + '">' + R.grade + ' · 위험 ' + R.risk + '</span></div>' +
      '<div class="dd-riskbar ' + gcls + '"><i style="width:' + R.risk + '%"></i></div><ul>' +
      R.bad.slice(0, 3).map(function (t) { return '<li class="bad">' + esc(t) + '</li>'; }).join("") +
      R.good.slice(0, 2).map(function (t) { return '<li class="good">' + esc(t) + '</li>'; }).join("") +
      '</ul><p class="dd-note">기획부동산·투자 위험을 데이터로 추정한 참고 지표입니다. 실제 판단은 서류·현장 확인이 필요합니다.</p></div>';

    h += '<div class="dd-trades"><h4>주변 실거래 — ' + esc(p.jimok) + '</h4>' +
      same.map(function (t) {
        return '<div class="dd-trades-row"><span>' + t.date + ' · ' + esc(t.dong) + ' · ' + fmt(t.area) + '㎡</span><b>㎡당 ' + fmt(t.ppm) + '원</b></div>';
      }).join("");
    if (avg) {
      var dev = Math.round((p.price - avg) / avg * 100);
      h += '<p class="dd-trades-avg">평균 ㎡당 <b>' + fmt(avg) + '원</b> · 공시지가는 평균 대비 ' + (dev >= 0 ? "+" : "") + dev + '%</p>';
    }
    h += '</div>';

    if (l) {
      h += '<div class="dd-sh-listing"><h4>' + esc(l.jibun) +
        (l.broker ? ' <span class="dd-badge b-teal">중개사 인증</span>' : "") + '</h4>' +
        '<div class="dd-price">' + fmt(l.total) + '만원 <small>' + fmt(l.area) + '㎡ · ㎡당 ' + fmt(Math.round(l.total * 10000 / l.area)) + '원</small></div>' +
        '<p>' + esc(l.desc) + '</p>' + listingCTA(l) + '</div>';
    } else {
      h += '<p class="dd-nolisting">매물로 등록되지 않은 필지입니다 — 정보 조회만 제공됩니다. 판매중인 필지는 지도에 가격표가 붙어 있습니다.</p>';
    }

    var sh = $("#dd-sheet");
    sh.innerHTML = h;
    sh.classList.add("open");
    sh.setAttribute("aria-hidden", "false");
    sh.scrollTop = 0;
  }

  /* ================= 매물 드로어 ================= */
  function renderDrawer() {
    $("#dd-drawer").innerHTML = LISTINGS.map(function (l) {
      var p = ALL.find(function (x) { return x.id === l.src; });
      return '<div class="dd-card">' +
        '<h4>' + esc(l.jibun) + '</h4>' +
        '<div class="dd-badges">' +
        '<span class="dd-badge b-teal">' + esc(l.jimok) + '</span>' +
        '<span class="dd-badge b-mute">' + esc(zoneShort(l.zone)) + '</span>' +
        (l.road ? '<span class="dd-badge b-mute">도로접함</span>' : '<span class="dd-badge b-accent">맹지</span>') +
        (l.farm ? '<span class="dd-badge b-accent">농취증 필요</span>' : "") +
        (l.broker ? '<span class="dd-badge b-teal">중개사</span>' : '<span class="dd-badge b-mute">소유자 직접</span>') +
        '</div>' +
        '<div class="dd-price">' + fmt(l.total) + '만원 <small>' + fmt(l.area) + '㎡ · 약 ' + fmt(pyeong(l.area)) + '평</small></div>' +
        '<p>' + esc(l.desc) + '</p>' +
        '<div style="display:flex;gap:6px">' +
        '<button class="dd-btn ghost" type="button" data-act="locate" data-pid="' + (p ? p.id : "") + '">위치</button>' +
        listingCTA(l) + '</div></div>';
    }).join("");
  }
  function toggleDrawer(open) {
    var d = $("#dd-drawer"), btn = $("#dd-drawer-toggle");
    var show = open != null ? open : d.hidden;
    d.hidden = !show;
    btn.setAttribute("aria-expanded", String(show));
    btn.textContent = show ? "매물 접기" : "매물 3건 · 1,980만원부터";
  }

  /* ================= 거래 파이프라인 ================= */
  var deal = null; // { lid, idx, docs:{key:상태}, pays:{stageKey:상태} }

  function save() {
    try {
      if (deal) localStorage.setItem(KEY, JSON.stringify(deal));
      else localStorage.removeItem(KEY);
    } catch (e) { /* private mode 등 */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      var l = d && LISTINGS.find(function (x) { return x.id === d.lid; });
      if (!l) return null;
      d.docs = d.docs || {}; d.pays = d.pays || {};
      var src = PARCELS.find(function (p) { return p.id === l.src; });
      var max = dealStages(!!l.farm, !!(src && src.lda)).length - 1;
      d.idx = Math.min(Math.max(0, parseInt(d.idx, 10) || 0), max);
      return d;
    } catch (e) { return null; }
  }

  function dealListing() { return LISTINGS.find(function (l) { return l.id === deal.lid; }); }
  function dealStagesOf() {
    var l = dealListing();
    var src = PARCELS.find(function (p) { return p.id === l.src; });
    return dealStages(!!l.farm, !!(src && src.lda));
  }
  function payPlan() {
    var total = dealListing().total;
    var pre = 100;
    var down = Math.max(50, Math.round(total * 0.1) - pre);
    return {
      pre: { kind: "가계약금", amount: pre },
      contract: { kind: "계약금", amount: down },
      balance: { kind: "잔금", amount: total - pre - down }
    };
  }
  function reqDocs(stageKey) {
    var l = dealListing();
    var src = PARCELS.find(function (p) { return p.id === l.src; });
    return DEAL_DOCS.filter(function (d) {
      if (d.stage !== stageKey) return false;
      if (d.stage === "farm" && !l.farm) return false;
      if (d.stage === "permit" && !(src && src.lda)) return false;
      return true;
    });
  }

  function docStatus(key) { return (deal && deal.docs[key]) || "미제출"; }
  function setDoc(key, st) { if (deal) { deal.docs[key] = st; save(); } }

  /* 수령 → 검토중 → 승인 목 전환 */
  function processDoc(key) {
    if (!deal || docStatus(key) === "승인") return;
    setDoc(key, "수령"); renderDeal();
    after(550, function () {
      if (!deal) return;
      setDoc(key, "검토중"); renderDeal();
      after(1000, function () {
        if (!deal) return;
        setDoc(key, "승인"); renderDeal();
      });
    });
  }

  function enterStage() {
    var st = dealStagesOf()[deal.idx];
    if (st.key === "done") {
      Object.keys(deal.pays).forEach(function (k) { deal.pays[k] = "지급완료"; });
      save();
    }
    // 플랫폼/법무사/중개사 자동생성 서류는 단계 진입 시 자동 처리
    reqDocs(st.key).filter(function (d) { return d.auto === true && docStatus(d.key) === "미제출"; })
      .forEach(function (d, i) { after(400 + i * 520, function () { processDoc(d.key); }); });
  }

  function startDeal(lid) {
    if (deal) return;
    deal = { lid: lid, idx: 0, docs: {}, pays: {} };
    save();
    enterStage();
    closeSheet();
    toggleDrawer(false);
    showView("deal");
    renderAll();
  }

  function tryAdvance() {
    var stages = dealStagesOf();
    var st = stages[deal.idx];
    if (st.key === "done") return;
    var missing = reqDocs(st.key).filter(function (d) { return docStatus(d.key) !== "승인"; })
      .map(function (d) { return d.name; });
    if (missing.length) { showErr("현재 단계 필요서류 미제출: " + missing.join(", ")); return; }
    var plan = payPlan()[st.key];
    if (plan && deal.pays[st.key] !== "입금확인") { showErr(plan.kind + " 입금 확인이 필요합니다."); return; }
    deal.idx = Math.min(deal.idx + 1, stages.length - 1);
    save();
    enterStage();
    renderDeal();
  }

  function showErr(msg) {
    var el = document.getElementById("dd-err");
    if (el) { el.textContent = msg; el.hidden = false; }
  }

  function resetDemo() {
    clearTimers();
    deal = null;
    save();
    renderAll();
  }

  /* --- 거래 뷰 렌더 --- */
  function statusChip(st) {
    var cls = { "미제출": "st-none", "수령": "st-recv", "검토중": "st-review", "승인": "st-ok" }[st] || "st-none";
    return '<span class="dd-st ' + cls + '">' + st + '</span>';
  }
  function payChip(ps) {
    if (!ps) return '<span class="dd-st st-none">미납</span>';
    var cls = ps === "입금확인대기" ? "st-review" : "st-ok";
    return '<span class="dd-st ' + cls + '">' + esc(ps) + '</span>';
  }

  var lastPct = 0;
  function renderDeal() {
    var root = $("#dd-deal-root");
    $("#dd-deal-dot").hidden = !deal;
    if (!deal) {
      lastPct = 0;
      root.innerHTML = '<div class="dd-empty">' +
        '<p><b>진행 중인 거래가 없습니다.</b></p>' +
        '<p>지도에서 가격표가 붙은 필지를 누르거나, 매물 드로어에서 골라 [구매 시작]을 눌러보세요.</p>' +
        '<button class="dd-btn primary" type="button" data-act="gomap">지도에서 매물 보기</button></div>';
      return;
    }
    var L = dealListing();
    var stages = dealStagesOf();
    var st = stages[deal.idx];
    var plan = payPlan();
    var pct = Math.round(deal.idx / (stages.length - 1) * 100);
    var paidSum = Object.keys(deal.pays).reduce(function (a, k) {
      return a + ((deal.pays[k] === "입금확인" || deal.pays[k] === "지급완료") ? plan[k].amount : 0);
    }, 0);

    var h = '<div class="dd-deal">';
    h += '<div class="dd-deal-head"><h3>' + esc(L.jibun) + '</h3><span class="sum">' + fmt(L.total) + '만원 · ' + fmt(L.area) + '㎡</span></div>';

    h += '<div class="dd-steps">' + stages.map(function (s, i) {
      var cls = i < deal.idx ? "done" : i === deal.idx ? "cur" : "";
      return '<span class="' + cls + '">' + (i < deal.idx ? "✓ " : "") + STAGE_SHORT[s.key] + '</span>';
    }).join("") + '</div>';
    h += '<div class="dd-progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="거래 진행률"><i style="width:' + pct + '%"></i></div>';

    h += '<div class="dd-stagecard">';
    if (st.key === "done") {
      h += '<div class="dd-donebox"><div class="dd-done-mark">✓</div><h4>거래 완료</h4>' +
        '<p>소유권이전등기가 완료되었습니다. 등기필정보(새 등기권리증)가 교부되고,<br>에스크로 보관액 <b>' + fmt(paidSum) + '만원</b>이 매도인 정산계좌로 지급되었습니다.</p></div>';
      h += '<ul class="dd-docs">' + reqDocs("done").map(function (d) {
        return '<li><div class="dd-doc-i"><b>' + esc(d.name) + '</b><span>' + esc(d.by) + ' · ' + esc(d.from) + '</span></div>' + statusChip(docStatus(d.key)) + '</li>';
      }).join("") + '</ul>';
      h += '<div class="dd-deal-actions"><button class="dd-btn ghost" type="button" data-act="reset">처음부터 다시 해보기</button></div>';
      h += '<p class="dd-escrow">에스크로 <b>지급완료</b> · ' + esc(ESCROW.bank) + ' ' + ESCROW.account + '</p>';
    } else {
      h += '<h4><span class="no">' + (deal.idx + 1) + ' / ' + stages.length + '</span>' + esc(st.name) + '</h4>' +
        '<p class="dd-sdesc">' + esc(st.desc) + '</p>';

      var docs = reqDocs(st.key);
      if (st.key === "inquiry") {
        h += '<ul class="dd-docs"><li><div class="dd-doc-i"><b>등기부등본 · 토지대장 · 토지이용계획</b><span>플랫폼 · 공부 자동 열람</span></div><span class="dd-st st-ok">자동 열람</span></li></ul>';
      } else if (docs.length) {
        h += '<ul class="dd-docs">' + docs.map(function (d) {
          var stt = docStatus(d.key);
          var act = "";
          if (stt === "미제출") {
            if (d.auto === true) act = '<span class="dd-st st-none">자동 생성 대기</span>';
            else if (d.auto === "pay") act = '<span class="dd-st st-none">입금 시 자동 첨부</span>';
            else act = '<button class="dd-btn ghost" type="button" data-act="doc" data-key="' + d.key + '">' + (d.by.indexOf("매수인") === 0 ? "업로드" : "수령 처리") + '</button>';
          } else {
            act = statusChip(stt);
          }
          return '<li><div class="dd-doc-i"><b>' + esc(d.name) + '</b><span>' + esc(d.by) + ' · ' + esc(d.from) + '</span></div>' + act + '</li>';
        }).join("") + '</ul>';
      }

      var pp = plan[st.key];
      if (pp) {
        var ps = deal.pays[st.key];
        h += '<div class="dd-pay"><div class="dd-pay-row"><b>' + pp.kind + ' ' + fmt(pp.amount) + '만원</b>' + payChip(ps) + '</div>' +
          '<div class="dd-pay-acct">에스크로 가상계좌 · ' + esc(ESCROW.bank) + ' ' + ESCROW.account + '</div>';
        if (!ps) h += '<button class="dd-btn primary" type="button" data-act="pay" data-stage="' + st.key + '">에스크로 입금하기</button>';
        else if (ps === "입금확인대기") h += '<button class="dd-btn primary" type="button" data-act="paycfm" data-stage="' + st.key + '">입금 확인</button><p class="dd-pay-note">실서비스는 PG 입금통지(webhook)로 자동 확인됩니다 — 데모에서는 클릭으로 대신합니다.</p>';
        else h += '<p class="dd-pay-note">입금이 확인되어 에스크로에 보관 중입니다. 등기 완료 후 매도인에게 지급됩니다.</p>';
        h += '</div>';
      }

      h += '<p class="dd-err" id="dd-err" hidden></p>';
      var next = stages[deal.idx + 1];
      h += '<div class="dd-deal-actions">' +
        '<button class="dd-btn primary" type="button" data-act="advance">다음 단계 — ' + esc(next.name) + '</button>' +
        '<button class="dd-btn ghost" type="button" data-act="reset">거래 초기화</button></div>';
      if (paidSum > 0) h += '<p class="dd-escrow">에스크로 보관중 <b>' + fmt(paidSum) + '만원</b> · ' + esc(ESCROW.bank) + '</p>';
    }
    h += '</div></div>';
    root.innerHTML = h;
    // 진행바가 이전 값에서 차오르도록
    var bar = root.querySelector(".dd-progress i");
    if (bar && !RM && lastPct !== pct) {
      bar.style.width = lastPct + "%";
      void bar.offsetWidth;
      bar.style.width = pct + "%";
    }
    lastPct = pct;
  }

  /* ================= 범례 · 필터 ================= */
  var LEGEND = {
    jimok: [["jm-jeon", "전"], ["jm-dap", "답"], ["jm-imya", "임야"], ["jm-dae", "대"], ["jm-jap", "잡종지"]],
    zone: [["zn-plan", "계획관리"], ["zn-prod", "생산관리"], ["zn-agri", "농림"], ["zn-green", "자연녹지"], ["zn-resi", "2종주거"]]
  };
  var filter = null;

  function renderLegend() {
    var mode = $("#dd-mapwrap").dataset.colormode;
    $("#dd-legend-list").innerHTML = LEGEND[mode].map(function (it) {
      return '<li><button type="button" data-filter="' + it[0] + '" class="' + (filter === it[0] ? "on" : "") + '"><i class="dd-sw ' + it[0] + '"></i>' + it[1] + '</button></li>';
    }).join("");
  }
  function applyFilter() {
    document.querySelectorAll(".dd-parcel").forEach(function (el) {
      var dim = filter && !el.classList.contains(filter);
      el.classList.toggle("dim", !!dim);
      el.closest(".dd-pg").classList.toggle("dim-lbl", !!dim);
    });
  }
  function setMode(mode) {
    $("#dd-mapwrap").dataset.colormode = mode;
    $("#dd-mode-jimok").classList.toggle("on", mode === "jimok");
    $("#dd-mode-zone").classList.toggle("on", mode === "zone");
    $("#dd-mode-jimok").setAttribute("aria-pressed", String(mode === "jimok"));
    $("#dd-mode-zone").setAttribute("aria-pressed", String(mode === "zone"));
    filter = null;
    renderLegend();
    applyFilter();
  }

  /* ================= 뷰 전환 ================= */
  function showView(which) {
    var isMap = which === "map";
    $("#dd-view-map").hidden = !isMap;
    $("#dd-view-deal").hidden = isMap;
    $("#dd-tab-map").classList.toggle("on", isMap);
    $("#dd-tab-deal").classList.toggle("on", !isMap);
    $("#dd-tab-map").setAttribute("aria-pressed", String(isMap));
    $("#dd-tab-deal").setAttribute("aria-pressed", String(!isMap));
    if (isMap) applyPan();
  }

  function renderAll() {
    renderDrawer();
    renderDeal();
    if (selId) {
      var p = ALL.find(function (x) { return x.id === selId; });
      if (p) renderSheet(p);
    }
  }

  /* ================= 이벤트 ================= */
  function wire() {
    $("#dd-tab-map").addEventListener("click", function () { showView("map"); });
    $("#dd-tab-deal").addEventListener("click", function () { showView("deal"); });
    $("#dd-reset").addEventListener("click", resetDemo);
    $("#dd-mode-jimok").addEventListener("click", function () { setMode("jimok"); });
    $("#dd-mode-zone").addEventListener("click", function () { setMode("zone"); });
    $("#dd-drawer-toggle").addEventListener("click", function () { toggleDrawer(); });

    $("#dd-legend").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = (filter === btn.dataset.filter) ? null : btn.dataset.filter;
      renderLegend();
      applyFilter();
    });

    var map = $("#dd-map");
    map.addEventListener("click", function (e) {
      if (suppressClick) return;
      var t = e.target.closest("[data-pid]");
      if (t) selectParcel(t.dataset.pid);
    });
    map.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var t = e.target.closest("[data-pid]");
      if (t) { e.preventDefault(); selectParcel(t.dataset.pid); }
    });

    function onAction(e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === "close") closeSheet();
      else if (act === "buy") startDeal(btn.dataset.lid);
      else if (act === "godeal") { closeSheet(); showView("deal"); }
      else if (act === "gomap") { showView("map"); toggleDrawer(true); }
      else if (act === "locate") { toggleDrawer(false); selectParcel(btn.dataset.pid); }
      else if (act === "advance") tryAdvance();
      else if (act === "doc") processDoc(btn.dataset.key);
      else if (act === "pay") { deal.pays[btn.dataset.stage] = "입금확인대기"; save(); renderDeal(); }
      else if (act === "paycfm") {
        deal.pays[btn.dataset.stage] = "입금확인"; save();
        // 원본 동작: 에스크로 입금확인증(down_receipt/balance_receipt)이 자동 첨부된다
        reqDocs(btn.dataset.stage).filter(function (d) { return d.auto === "pay"; })
          .forEach(function (d) { after(350, function () { processDoc(d.key); }); });
        renderDeal();
      }
      else if (act === "reset") resetDemo();
    }
    $("#dd-sheet").addEventListener("click", onAction);
    $("#dd-drawer").addEventListener("click", onAction);
    $("#dd-deal-root").addEventListener("click", onAction);
  }

  /* 새로고침 복원: 검토중/수령 상태 서류는 이어서 승인 처리 */
  function resume() {
    if (!deal) return;
    Object.keys(deal.docs).forEach(function (k) {
      var st = deal.docs[k];
      if (st === "수령" || st === "검토중") after(700, function () { if (deal) { setDoc(k, "승인"); renderDeal(); } });
    });
    enterStage();
  }

  /* ================= 부트 ================= */
  buildMap();
  wirePan();
  renderLegend();
  wire();
  deal = load();
  renderAll();
  resume();
  applyPan();
})();
