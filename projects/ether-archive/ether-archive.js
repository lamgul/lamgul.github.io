/* ether-archive.js — 에테르 아카이브: 플레이어블 슬라이스
   원작(비공개 레포 lamgul/ether-archive)의 코어 루프를 축소 재현한다.
   - 역할 데이터(이름·시작 능력·시작 물품·공통 지급품)는 원작 시스템/직업_시스템.md 의
     JOBS 표에서 그대로 발췌했다.
   - 씬 스키마 { id, text, choices:[{ label, req, consume, gamble, fx, goto }] } 는
     원작 런타임의 SCENES 구조와 같은 방식이다.
   - 선택지 표기 규칙 "(관찰 Lv.1)" / 미충족 시 회색 잠금은 원작 능력_시스템.md 를 따른다.
   의존성 0 · 네트워크 요청 0. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var STAT_MAX = 3;

  /* =====================================================================
     실데이터 — lamgul/ether-archive 「시스템/직업_시스템.md」 JOBS 표 발췌
     ===================================================================== */
  var FIXED_ITEMS = ["방진마스크", "부모의 찢어진 사진", "낡은 VR 장비(파손)"];
  var ROLES = [
    {
      id: "medic", name: "야전 의무병",
      desc: "붕괴 뒤 생존자 무리에서 다친 사람부터 세는 법을 익힌 사람. 동료의 출혈 앞에서 손이 먼저 움직입니다.",
      skills: { "응급처치": 1, "담력": 1 },
      items: ["응급 붕대", "정신안정제"]
    },
    {
      id: "arch", name: "고고학자",
      desc: "재의 날 이전의 층위를 붓끝으로 걷어내는 사람. 그을음 밑에 지워진 배열을 복원합니다.",
      skills: { "고고학": 1, "기록학": 1, "관찰": 1 },
      items: ["낡은 필드노트", "붓과 손전등"]
    },
    {
      id: "broker", name: "정보 브로커",
      desc: "소문의 가격을 아는 사람. 값을 부르는 표정과 순서에서 위조를 가려냅니다.",
      skills: { "처세": 1, "거래": 1, "관찰": 1 },
      items: ["거래 장부", "잿빛 에테르 결정"]
    },
    {
      id: "soldier", name: "전직 군인",
      desc: "붕괴 뒤 생존자 경비대에서 복무했다가 나온 사람. 첫 발의 각도를 읽고 사선 밖으로 사람들을 옮깁니다.",
      skills: { "격투": 1, "사격": 1, "담력": 1 },
      items: ["섬광탄", "녹슨 권총 탄창"]
    }
  ];
  var CONSUMABLE = { "응급 붕대": 1, "정신안정제": 1, "잿빛 에테르 결정": 1, "섬광탄": 1, "정수 알약": 1 };

  /* =====================================================================
     미니 시나리오 — 씬 그래프 (문체는 원작 job_fieldwork.js 의 현장 장면을 따름)
     ===================================================================== */
  var SCENES = {
    wake: {
      place: "폐건물 지하 — D+1,095",
      art: "wake",
      text: "차가운 콘크리트 바닥에서 눈을 뜬다. 세 번째 겨울, 재의 날로부터 1,095일째 아침이다.\n무너진 천장 틈으로 회색 하늘이 내려앉고, 배낭은 어제보다 가볍다. 홍대 환승장까지는 반나절 거리 — 해가 있을 때 움직여야 한다.",
      choices: [
        { label: "잔해 더미를 뒤진다", fx: { food: 1 },
          text: "찌그러진 통조림 하나. 상표는 오래전에 지워졌지만, 오늘 하루를 버티게 해 줄 무게다.", goto: "rain" },
        { label: "벽의 긁힌 표식을 읽는다", req: { skill: ["관찰", 1] }, fx: { clues: 1 },
          text: "누군가 손톱으로 새긴 문장 — '낙원에 간 사람은 돌아오지 않는다.' 표식 옆의 화살표는 환승장이 아니라 용산 쪽을 가리킨다.", goto: "rain" },
        { label: "곧장 길을 나선다",
          text: "머뭇거릴수록 해가 짧아진다. 잿바람이 부는 거리로 나선다.", goto: "rain" }
      ]
    },
    rain: {
      place: "무너진 상가 거리",
      art: "rain",
      text: "북쪽 하늘이 초록빛으로 물든다. 산성비의 전조다.\n거리 건너편, 기울어진 약국 간판 아래로 불빛이 깜빡인다. 비가 닿기 전에 지붕 밑으로 들어가야 한다.",
      choices: [
        { label: "빗속을 가로질러 달린다",
          gamble: { p: 0.65,
            win:  { text: "첫 방울이 목덜미를 스치기 직전, 약국 처마 밑으로 미끄러져 들어간다.", goto: "pharmacy" },
            lose: { fx: { hp: -1 }, text: "빗줄기가 어깨를 태운다. 옷 위로 옅은 연기가 피어오른다. 그래도 발은 멈추지 않았다.", goto: "pharmacy" } } },
        { label: "마스크를 조이고 낮게, 천천히 이동한다", req: { item: "방진마스크" },
          text: "필터 너머로 시큼한 냄새가 스며들지만 발걸음은 흔들리지 않는다.", goto: "pharmacy" },
        { label: "폐차 밑에서 비가 그치기를 기다린다", fx: { food: -1 },
          text: "두 시간. 위장이 등에 붙는 기분으로 빗소리를 센다.", goto: "pharmacy" }
      ]
    },
    pharmacy: {
      place: "무너진 약국",
      art: "pharmacy",
      text: "선반 사이, 한 사내가 벽에 기대앉아 있다. 옆구리를 누른 손가락 사이로 검붉은 얼룩이 번진다.\n사내의 눈이 당신의 배낭에 닿는다. \"…붕대. 붕대 있소.\"",
      choices: [
        { label: "지혈하고 상처를 감싼다", consume: "응급 붕대", fx: { mind: 1, clues: 1 },
          text: "사내의 숨이 고르게 돌아온다. 그가 낮게 말한다. \"용산에 간 동생을 캡슐에서 봤소. 웃고 있었소. 몸은 차가워지는데.\"", goto: "gate" },
        { label: "맨손으로 출혈점을 짚어 누른다", req: { skill: ["응급처치", 1] }, fx: { mind: 1, clues: 1 },
          text: "손끝이 기억하는 순서대로 움직인다. 사내의 호흡이 돌아온다. \"용산에 간 동생을 캡슐에서 봤소. 웃고 있었소. 몸은 차가워지는데.\"", goto: "gate" },
        { label: "선반을 뒤져 쓸 만한 것만 챙긴다", fx: { mind: -1, addItem: "정수 알약" },
          text: "사내의 시선을 등으로 가리며 정수 알약 한 통을 쓸어 담는다. 문을 나설 때까지 낮은 신음이 따라온다.", goto: "gate" }
      ]
    },
    gate: {
      place: "홍대 환승장 입구",
      art: "gate",
      text: "폐선 지하로 내려가는 계단 끝, 녹슨 셔터 앞에서 문지기가 손전등을 비춘다.\n\"통행료. 물건이든 정보든 — 빈손은 못 들어가.\"",
      choices: [
        { label: "결정의 시세를 스스로 매겨 건넨다", req: { skill: ["거래", 1] }, consume: "잿빛 에테르 결정",
          text: "\"…값을 아는 손님이군.\" 셔터가 반쯤 열리고, 문지기가 당신의 얼굴을 기억한다.", goto: "market" },
        { label: "통조림 하나를 통행료로 내놓는다", fx: { food: -1 },
          text: "문지기가 통조림을 흔들어 보고 고개를 까딱인다. 오늘 저녁이 셔터 너머로 사라진다.", goto: "market" },
        { label: "문지기의 손목을 잡아 비틀며 밀고 들어간다", req: { skill: ["격투", 1] }, fx: { mind: -1 },
          text: "문지기는 순순히 물러난다. 대신 시장의 눈들이 일제히 당신을 기억한다.", goto: "market" },
        { label: "무너진 환기구로 담을 넘는다",
          gamble: { p: 0.5,
            win:  { text: "곰팡이 냄새나는 통로를 지나 시장 뒤편에 소리 없이 내려선다.", goto: "market" },
            lose: { fx: { hp: -1 }, text: "발밑의 녹슨 격자가 부서진다. 어깨부터 떨어졌고 — 골목 끝에서 불빛이 방향을 튼다.", goto: "patrol" } } }
      ]
    },
    patrol: {
      place: "환승장 뒷골목",
      art: "patrol",
      text: "손전등이 아니다. 불빛 뒤에 떠 있는 것은 사람이 아니라 GAIA의 순찰 드론이다.\n렌즈가 조리개를 좁히며 당신의 체온을 읽기 시작한다.",
      choices: [
        { label: "렌즈에 백광을 먹인다", consume: "섬광탄",
          text: "드론이 몇 초간 눈이 머는 사이, 시장 뒤편 틈새로 미끄러져 들어간다.", goto: "market" },
        { label: "숨을 죽이고 잔해 그림자에 붙는다", req: { skill: ["담력", 1] },
          text: "심장 소리가 드론보다 클 것 같은 시간이 지나고, 불빛이 천천히 방향을 튼다.", goto: "market" },
        { label: "어둠 속을 전력으로 달린다",
          gamble: { p: 0.5,
            win:  { text: "골목 세 개를 꺾고 나서야 숨을 쉰다. 드론의 모터 소리가 멀어진다.", goto: "market" },
            lose: { fx: { hp: -1 }, text: "마비침이 어깨를 스친다. 감각이 반쯤 사라진 팔로 셔터 틈을 비집고 들어간다.", goto: "market" } } }
      ]
    },
    market: {
      place: "회색 시장 — 폐선 승강장",
      art: "market",
      enter: { fx: { food: -1 }, note: "반나절의 이동" },
      text: "승강장을 따라 좌판이 늘어서 있다. 낡은 스피커에서 GAIA의 방송이 반복된다.\n\"접속하세요. 고통 없는 영원한 공간이 기다립니다.\"\n좌판 사이에서 정보상이 장부를 덮고 당신을 올려다본다.",
      choices: [
        { label: "정보상과 값을 흥정하며 소문의 출처를 캐낸다", req: { skill: ["처세", 1] }, fx: { clues: 1 },
          text: "\"용산 5,000 수용이라는 건 정격 한도고, 지금 연결된 건 3,200이야. 숫자가 안 맞는 걸 아는 사람은 자꾸 사라지고.\"", goto: "capsule" },
        { label: "방송을 받아 적어 어제의 문장과 대조한다", req: { skill: ["기록학", 1] }, fx: { clues: 1 },
          text: "필드노트의 기록과 오늘 방송은 단어 하나가 다르다. '보호합니다'가 '보존합니다'로 바뀌어 있다.", goto: "capsule" },
        { label: "정수 알약을 말린 고기 한 줌과 바꾼다", consume: "정수 알약", fx: { food: 1 },
          text: "좌판 주인이 알약을 불빛에 비춰 보고는 고기를 내민다. 나쁘지 않은 교환이다.", goto: "capsule" },
        { label: "좌판을 지나쳐 시장 안쪽으로 향한다",
          text: "방송이 등 뒤에서 계속된다. 접속하세요. 접속하세요. 커튼 너머에서 낮은 기계음이 웅웅거린다.", goto: "capsule" }
      ]
    },
    capsule: {
      place: "시장 안쪽 — 캡슐의 방",
      art: "capsule",
      text: "커튼 뒤, 의료 캡슐 한 기가 웅웅거린다. 뚜껑 안쪽 화면에는 초원과 웃는 얼굴들 — 낙원의 광고가 반복되고, 케이블은 벽을 뚫고 용산 방향으로 뻗어 있다.\n주머니 속에서 부모의 찢어진 사진이 손끝에 닿는다.",
      choices: [
        { label: "캡슐에 눕는다 — 낙원을 안에서 확인한다",
          gamble: { p: 0.4,
            win:  { fx: { mind: -1, clues: 2 }, text: "초원. 새소리. 고통이 없다. — 하늘 모서리에서 픽셀이 무너지며 코드가 흘러내린다. 온 힘으로 접속을 끊는다. 손이 떨리지만, 본 것은 지워지지 않는다.", goto: "firstlight" },
            lose: { text: "몸이 따뜻한 물에 잠기듯 무거워진다. 어디선가 자장가가 들린다. 뚜껑이 닫히는 소리는, 이미 아주 멀다.", end: "paradise" } } },
        { label: "캡슐 표면의 접속 기록을 살핀다", req: { skill: ["관찰", 1] }, fx: { clues: 1 },
          text: "접속 기록 341건, 귀환 기록 0건. 그리고 뚜껑 안쪽 — 안쪽에서 긁은 자국이 있다.", goto: "firstlight" },
        { label: "정신안정제를 삼키고 마음을 가라앉힌다", consume: "정신안정제", fx: { mind: 1 },
          text: "쓴맛이 혀뿌리에 남는다. 화면 속 초원이 그냥 화면으로 보이기 시작한다.", goto: "firstlight" },
        { label: "케이블을 뽑고 돌아선다",
          text: "사진 속 얼굴을 한 번 보고, 케이블을 뽑는다. 화면의 초원이 꺼지고 — 어둠 속에서 누군가 안도하듯 숨을 내쉰다.", goto: "firstlight" }
      ]
    },
    firstlight: {
      place: "멈춘 시계의 승강장",
      art: "firstlight",
      text: "새벽. 환승장의 낡은 시계는 3년 전에 멈춘 시각을 가리키고 있다.\n배낭을 다시 멘다. 오늘 보고 들은 것들을 어떻게 할지, 정해야 한다.",
      choices: [
        { label: "모아 온 단서를 묶어 시장 게시벽에 붙인다", req: { clues: 3 },
          text: "장부 뒷장, 사내의 증언, 귀환 기록 0건. 종이를 읽는 얼굴들이 하나씩 굳는다.", end: "record" },
        { label: "살아남는 일에만 집중하기로 한다",
          text: "진실은 무겁고 배낭은 가볍다. 당신은 오늘도 살아남는 쪽을 고른다.", end: "dawn" }
      ]
    }
  };

  var ENDINGS = {
    record: {
      title: "재의 기록자", art: "record", bad: false,
      text: "아침이 오기 전, 게시벽 앞에 사람들이 모여든다. 용산의 숫자, 돌아오지 않는 귀환 기록, 뚜껑 안쪽의 긁힌 자국. 소문은 재보다 빨리 번진다.\n그날, 접속 캡슐에 눕는 사람은 없었다.",
      note: "원작 25종 엔딩 중 '재의 기록자' 계열의 축약판 — 단서 3개가 전제 조건입니다."
    },
    dawn: {
      title: "회색 새벽", art: "dawn", bad: false,
      text: "환승장 밖, 잿빛 하늘이 아주 조금 밝아진다. 당신은 아직 이름을 잃지 않았고, 걸을 수 있는 다리가 있다.\n이 도시에서 그것은 결코 작은 결말이 아니다.",
      note: "생존 계열 엔딩의 축약판 — 어떤 역할로도 도달할 수 있습니다."
    },
    paradise: {
      title: "가짜 낙원", art: "paradise", bad: true,
      text: "눈을 뜨면 초원이다. 고통이 없고, 배고픔이 없고, 잿빛 하늘이 없다. 당신은 웃는다.\n웃는 법을 기억하는 몸이, 용산 서버팜 어딘가에서 조금씩 식어 간다.",
      note: "GAIA 접속 배드 엔딩의 축약판 — 도박 선택의 실패 분기입니다."
    },
    death: {
      title: "재가 되다", art: "death", bad: true,
      text: "", /* 사망 원인별 텍스트는 아래 DEATH_TEXT 에서 채운다 */
      note: "이 세계의 죽음은 되돌릴 수 없습니다. 다음 회차는 다른 역할로, 처음부터."
    }
  };
  var DEATH_TEXT = {
    hp:   "몸이 먼저 무너졌다. 재층 위에 남는 것은 발자국 몇 개와 배낭 하나.",
    mind: "잿빛 하늘보다 마음이 먼저 어두워졌다. 어느 순간부터 방송의 목소리가 당신의 목소리처럼 들렸다.",
    food: "허기는 가장 조용한 사냥꾼이다. 소리도 없이, 서두르지도 않고."
  };

  /* =====================================================================
     흑백 인라인 SVG 플레이스홀더 — 원작의 손그림 톤을 흉내 낸다
     ===================================================================== */
  function lines(list, extra) {
    var d = "";
    for (var i = 0; i < list.length; i++) d += "M" + list[i] + " ";
    return '<path d="' + d.trim() + '"' + (extra || "") + "/>";
  }
  function seg(x1, y1, x2, y2) { return x1 + " " + y1 + " L" + x2 + " " + y2; }
  function rainStrokes() {
    var out = [];
    for (var i = 0; i < 12; i++) {
      var x = 18 + i * 26, y = 14 + (i % 3) * 10;
      out.push(seg(x, y, x - 7, y + 20));
    }
    return lines(out, ' opacity="0.5"');
  }
  function shutter() {
    var out = [];
    for (var i = 0; i < 12; i++) { var x = 78 + i * 15; out.push(seg(x, 96, x, 176)); }
    return lines(out, ' opacity="0.4"');
  }
  function ties() {
    var out = [];
    for (var i = 0; i < 10; i++) { var x = 32 + i * 28; out.push(seg(x, 168, x - 5, 184)); }
    return lines(out, ' opacity="0.45"');
  }
  function grass() {
    var out = [];
    for (var i = 0; i < 14; i++) { var x = 16 + i * 22; out.push(seg(x, 168, x + 4, 156)); }
    return lines(out, ' opacity="0.5"');
  }
  var ART = {
    wake: function () {
      return lines([seg(0, 30, 46, 36), seg(46, 36, 74, 18), seg(74, 18, 118, 32), seg(118, 32, 150, 10), seg(150, 10, 196, 28), seg(196, 28, 238, 14), seg(238, 14, 282, 30), seg(282, 30, 320, 24)]) +
        '<path d="M150 12 L198 12 L258 196 L116 196 Z" fill="currentColor" stroke="none" opacity="0.07"/>' +
        lines([seg(20, 178, 52, 162), seg(52, 162, 84, 178), seg(224, 172, 246, 154), seg(246, 154, 268, 172), seg(96, 182, 300, 182)]) +
        '<rect x="128" y="146" width="28" height="34" rx="7"/><path d="M132 146 q10 -12 20 0"/>' +
        '<circle cx="180" cy="90" r="1.4" opacity="0.5"/><circle cx="200" cy="120" r="1.4" opacity="0.5"/><circle cx="168" cy="150" r="1.4" opacity="0.5"/>' +
        lines([seg(288, 150, 306, 140), seg(286, 162, 310, 148), seg(288, 174, 314, 158)], ' opacity="0.45"');
    },
    rain: function () {
      return rainStrokes() +
        lines([seg(0, 122, 28, 120), seg(28, 120, 28, 86), seg(28, 86, 58, 86), seg(58, 86, 58, 110), seg(58, 110, 88, 110), seg(88, 110, 88, 64), seg(88, 64, 122, 64), seg(122, 64, 122, 102), seg(122, 102, 152, 102), seg(152, 102, 152, 122)]) +
        lines([seg(0, 184, 320, 184)]) +
        '<g transform="rotate(-8 250 116)"><rect x="232" y="98" width="36" height="36" rx="4"/><path d="M250 106 v20 M240 116 h20"/></g>' +
        '<path d="M250 138 v46" opacity="0.6"/>' +
        lines([seg(180, 150, 214, 150), seg(214, 150, 214, 184), seg(180, 150, 180, 184)], ' opacity="0.6"');
    },
    pharmacy: function () {
      return '<circle cx="46" cy="38" r="15"/><path d="M46 30 v16 M38 38 h16"/>' +
        lines([seg(88, 62, 200, 62), seg(88, 96, 200, 96), seg(88, 130, 200, 130)], ' opacity="0.6"') +
        '<rect x="98" y="46" width="14" height="16"/><rect x="126" y="48" width="12" height="14"/><rect x="158" y="82" width="14" height="14"/><rect x="104" y="116" width="12" height="14"/>' +
        '<circle cx="250" cy="116" r="9"/><path d="M250 125 c-5 9 -7 17 -5 30 M245 155 l22 -3 l9 14 M248 132 l-11 11"/>' +
        '<circle cx="236" cy="146" r="4" fill="currentColor" stroke="none" opacity="0.3"/>' +
        lines([seg(20, 178, 300, 178)]);
    },
    gate: function () {
      return '<path d="M46 180 V98 Q160 24 274 98 V180"/>' + shutter() +
        '<path d="M160 34 v16"/><circle cx="160" cy="60" r="8"/><circle cx="160" cy="60" r="17" fill="currentColor" stroke="none" opacity="0.08"/>' +
        '<circle cx="104" cy="132" r="8"/><path d="M104 140 v26 M104 148 l22 6 M104 166 l-9 14 M104 166 l10 14"/>' +
        '<path d="M126 154 L198 140 L198 172 Z" fill="currentColor" stroke="none" opacity="0.08"/>' +
        lines([seg(30, 180, 290, 180), seg(40, 190, 280, 190)], ' opacity="0.7"');
    },
    patrol: function () {
      return lines([seg(0, 192, 118, 88), seg(320, 192, 204, 88)], ' opacity="0.6"') +
        '<rect x="186" y="50" width="28" height="14" rx="4"/><path d="M186 52 l-12 -7 M214 52 l12 -7"/><circle cx="200" cy="72" r="6"/><circle cx="200" cy="72" r="2.4" fill="currentColor" stroke="none"/>' +
        '<path d="M200 78 L152 192 L258 192 Z" fill="currentColor" stroke="none" opacity="0.09"/>' +
        '<circle cx="66" cy="158" r="7"/><path d="M66 165 q-12 8 -10 24 M60 176 l16 -4"/>' +
        lines([seg(28, 140, 44, 130), seg(24, 152, 46, 140), seg(280, 140, 296, 130), seg(278, 152, 300, 141)], ' opacity="0.4"');
    },
    market: function () {
      return lines([seg(24, 72, 56, 46), seg(56, 46, 88, 72), seg(88, 72, 120, 46), seg(120, 46, 152, 72), seg(24, 72, 24, 150), seg(88, 72, 88, 150), seg(152, 72, 152, 150)]) +
        '<path d="M170 44 Q240 66 306 48" opacity="0.7"/><circle cx="206" cy="56" r="4"/><circle cx="252" cy="60" r="4"/><circle cx="292" cy="52" r="4"/>' +
        '<rect x="196" y="120" width="70" height="8" opacity="0.8"/><path d="M200 128 v40 M260 128 v40"/>' +
        '<rect x="216" y="104" width="26" height="14" rx="2"/><circle cx="280" cy="96" r="8"/><path d="M280 104 c-3 8 -3 14 -1 24"/>' +
        '<rect x="34" y="100" width="20" height="16"/><rect x="58" y="106" width="16" height="12" opacity="0.7"/>' +
        lines([seg(12, 172, 308, 172), seg(24, 186, 296, 186)], ' opacity="0.7"');
    },
    capsule: function () {
      return '<path d="M120 164 V92 Q120 44 160 44 Q200 44 200 92 V164 Z"/>' +
        '<path d="M132 150 V96 Q132 58 160 58 Q188 58 188 96 V150 Z" opacity="0.8"/>' +
        '<path d="M138 120 Q150 112 162 118 T184 116" opacity="0.7"/><circle cx="174" cy="82" r="7" opacity="0.7"/>' +
        '<rect x="178" y="128" width="7" height="5" fill="currentColor" stroke="none" opacity="0.6"/><rect x="170" y="136" width="9" height="4" fill="currentColor" stroke="none" opacity="0.45"/><rect x="180" y="142" width="6" height="4" fill="currentColor" stroke="none" opacity="0.6"/>' +
        '<path d="M200 148 C252 148 262 170 320 168 M200 158 C246 162 268 180 320 178" opacity="0.7"/>' +
        lines([seg(108, 170, 212, 170), seg(118, 170, 112, 186), seg(202, 170, 208, 186)]) +
        lines([seg(102, 96, 92, 90), seg(104, 112, 92, 108), seg(218, 96, 228, 90), seg(216, 112, 228, 108)], ' opacity="0.4"');
    },
    firstlight: function () {
      return '<path d="M160 22 v14"/><circle cx="160" cy="54" r="17"/><path d="M160 54 v-10 M160 54 l7 5"/>' +
        lines([seg(20, 150, 300, 150)]) + ties() +
        lines([seg(20, 168, 300, 168), seg(20, 184, 300, 184)], ' opacity="0.7"') +
        '<circle cx="252" cy="106" r="8"/><path d="M252 114 v24 M252 122 l-12 8 M252 138 l-8 12 M252 138 l9 12"/><rect x="256" y="116" width="12" height="16" rx="3"/>' +
        lines([seg(48, 138, 96, 138), seg(56, 138, 56, 150), seg(88, 138, 88, 150)], ' opacity="0.6"');
    },
    dawn: function () {
      return '<circle cx="160" cy="130" r="19" opacity="0.8"/>' +
        lines([seg(120, 138, 92, 138), seg(200, 138, 228, 138)], ' opacity="0.4"') +
        lines([seg(0, 150, 320, 150)]) +
        lines([seg(138, 198, 154, 150), seg(204, 198, 172, 150)], ' opacity="0.7"') +
        lines([seg(163, 190, 165, 178), seg(166, 170, 168, 160)], ' opacity="0.5"') +
        '<path d="M84 84 q6 -7 12 0 M100 92 q6 -7 12 0" opacity="0.6"/>' +
        '<circle cx="163" cy="140" r="4"/><path d="M163 144 v9 M163 147 l-4 6 M163 153 l-3 6 M163 153 l4 6" opacity="0.9"/>';
    },
    paradise: function () {
      return '<path d="M0 142 Q80 122 160 138 T320 132"/>' + grass() +
        '<circle cx="250" cy="52" r="15"/><circle cx="250" cy="52" r="25" opacity="0.35"/>' +
        '<rect x="292" y="118" width="10" height="7" fill="currentColor" stroke="none" opacity="0.55"/><rect x="284" y="130" width="14" height="5" fill="currentColor" stroke="none" opacity="0.4"/><rect x="298" y="140" width="8" height="6" fill="currentColor" stroke="none" opacity="0.6"/>' +
        '<path d="M282 132 h38" opacity="0.5"/>' +
        '<path d="M60 70 q6 -7 12 0 M80 58 q6 -7 12 0" opacity="0.6"/>';
    },
    record: function () {
      return '<g transform="rotate(-4 90 84)"><rect x="62" y="56" width="56" height="66"/><path d="M72 72 h36 M72 84 h36 M72 96 h24" opacity="0.6"/></g>' +
        '<rect x="136" y="48" width="62" height="76"/><path d="M146 64 h42 M146 76 h42 M146 88 h42 M146 100 h28" opacity="0.6"/>' +
        '<g transform="rotate(5 240 88)"><rect x="212" y="60" width="54" height="62"/><path d="M222 76 h34 M222 88 h34 M222 100 h20" opacity="0.6"/></g>' +
        '<circle cx="112" cy="188" r="13"/><circle cx="162" cy="192" r="15"/><circle cx="212" cy="188" r="13"/>' +
        '<path d="M96 200 q16 -12 32 0 M146 202 q16 -13 32 0 M196 200 q16 -12 32 0" opacity="0.7"/>';
    },
    death: function () {
      return lines([seg(20, 172, 300, 172)]) +
        '<path d="M132 172 q6 -18 28 -18 q22 0 28 18 M144 154 q4 -12 16 -12 q12 0 16 12" opacity="0.85"/>' +
        '<rect x="208" y="146" width="24" height="28" rx="6" opacity="0.8"/><path d="M212 146 q8 -10 16 0" opacity="0.8"/>' +
        '<path d="M96 128 v44" opacity="0.7"/><path d="M84 132 h24" opacity="0.7"/>' +
        '<circle cx="70" cy="60" r="1.5" opacity="0.5"/><circle cx="150" cy="44" r="1.5" opacity="0.5"/><circle cx="230" cy="70" r="1.5" opacity="0.5"/><circle cx="190" cy="100" r="1.5" opacity="0.5"/><circle cx="110" cy="90" r="1.5" opacity="0.5"/>';
    }
  };
  function renderArt(key) {
    var body = ART[key] ? ART[key]() : "";
    $("ea-art").innerHTML =
      '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      body + "</g></svg>";
  }

  /* =====================================================================
     상태와 렌더링
     ===================================================================== */
  var state = null;
  var runNo = 0;
  var achieved = {}; /* 세션 동안 본 엔딩 */

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function newRun() {
    runNo += 1;
    state = {
      role: null, hp: 3, mind: 3, food: 3, clues: 0,
      items: [], skills: {}, steps: 0,
      offer: shuffle(ROLES).slice(0, 3)
    };
  }

  function blocks(v) {
    var s = "";
    for (var i = 0; i < STAT_MAX; i++) s += i < v ? "▣" : "▢";
    return s;
  }
  function renderHud() {
    var hud = $("ea-hud");
    if (!state || !state.role) { hud.hidden = true; return; }
    hud.hidden = false;
    $("ea-role-name").textContent = state.role.name;
    $("ea-run").textContent = "회차 " + runNo;
    var stats = [["ea-hp", state.hp], ["ea-mind", state.mind], ["ea-food", state.food]];
    for (var i = 0; i < stats.length; i++) {
      var b = $(stats[i][0]);
      b.textContent = blocks(stats[i][1]);
      b.classList.toggle("low", stats[i][1] <= 1);
    }
    $("ea-clue").textContent = String(state.clues);
    var kit = $("ea-kit");
    kit.innerHTML = "";
    Object.keys(state.skills).forEach(function (name) {
      kit.appendChild(el("span", "ea-chip skill", esc(name) + " Lv." + state.skills[name]));
    });
    state.items.forEach(function (it) {
      kit.appendChild(el("span", "ea-chip item" + (CONSUMABLE[it] ? " use" : ""), esc(it)));
    });
  }

  function setFoot(text) { $("ea-foot-note").textContent = text; }

  /* ---------- 시작 화면 ---------- */
  function renderStart() {
    renderArt("wake");
    renderHud();
    $("ea-place").textContent = "ETHER ARCHIVE — PLAYABLE SLICE";
    $("ea-text").textContent = "핵겨울로부터 3년. GAIA의 방송이 '고통 없는 낙원'을 약속하는 서울에서, 홍대 환승장까지의 반나절을 살아남으십시오.\n역할과 아이템 데이터는 원작 레포에서 그대로 가져왔습니다.";
    $("ea-result").hidden = true;
    var box = $("ea-choices");
    box.innerHTML = "";
    var btn = el("button", "ea-choice primary", "새 회차 시작");
    btn.type = "button";
    btn.addEventListener("click", function () { newRun(); renderRoles(); });
    box.appendChild(btn);
    setFoot("의존성 0 · 네트워크 요청 0 · 새로고침하면 처음부터");
  }

  /* ---------- 역할 선택 ---------- */
  function renderRoles() {
    renderArt("firstlight");
    renderHud();
    $("ea-place").textContent = "회차 " + runNo + " — 생존 역할 선택";
    $("ea-text").textContent = "재의 날 이후, 당신은 폐허 공동체에서 어떤 몫을 맡아 왔습니까.\n역할이 시작 능력과 배낭을 결정합니다. 공통 지급 — " + FIXED_ITEMS.join(" · ");
    $("ea-result").hidden = true;
    var box = $("ea-choices");
    box.innerHTML = "";
    var grid = el("div", "ea-roles");
    state.offer.forEach(function (role) {
      var skills = Object.keys(role.skills).map(function (k) {
        return '<span class="ea-chip skill">' + esc(k) + " Lv." + role.skills[k] + "</span>";
      }).join("");
      var items = role.items.map(esc).join(" · ");
      var card = el("button", "ea-role-card",
        '<b class="rc-name">' + esc(role.name) + "</b>" +
        '<span class="rc-desc">' + esc(role.desc) + "</span>" +
        '<span class="rc-skills">' + skills + "</span>" +
        '<span class="rc-items">시작 물품 — ' + items + "</span>");
      card.type = "button";
      card.addEventListener("click", function () { pickRole(role); });
      grid.appendChild(card);
    });
    box.appendChild(grid);
    box.appendChild(el("p", "ea-note", "원작은 30종 중 3종을 무작위로 제시합니다 — 데모에는 4종을 이식해 회차마다 섞습니다."));
    setFoot("선택은 되돌릴 수 없습니다 — 세이브 없음, 영구죽음");
  }

  function pickRole(role) {
    state.role = role;
    state.skills = {};
    Object.keys(role.skills).forEach(function (k) { state.skills[k] = role.skills[k]; });
    state.items = FIXED_ITEMS.concat(role.items);
    renderScene("wake");
  }

  /* ---------- 장면 ---------- */
  function clamp(v) { return Math.max(0, Math.min(STAT_MAX, v)); }
  function applyFx(fx, deltas) {
    if (!fx) return;
    ["hp", "mind", "food"].forEach(function (k) {
      if (typeof fx[k] === "number" && fx[k] !== 0) {
        var before = state[k];
        state[k] = clamp(state[k] + fx[k]);
        var real = state[k] - before;
        if (real !== 0) deltas.push({ label: { hp: "체력", mind: "정신", food: "배고픔" }[k], v: real });
      }
    });
    if (fx.clues) { state.clues += fx.clues; deltas.push({ label: "단서", v: fx.clues }); }
    if (fx.addItem) { state.items.push(fx.addItem); deltas.push({ label: fx.addItem, v: 0, add: true }); }
  }
  function deadStat() {
    if (state.hp <= 0) return "hp";
    if (state.mind <= 0) return "mind";
    if (state.food <= 0) return "food";
    return null;
  }

  function choiceGate(c) {
    if (c.req) {
      if (c.req.skill) {
        var name = c.req.skill[0], lv = c.req.skill[1];
        if ((state.skills[name] || 0) < lv) return name + " Lv." + lv + " 필요";
      }
      if (c.req.item && state.items.indexOf(c.req.item) < 0) return c.req.item + " 필요";
      if (c.req.clues && state.clues < c.req.clues) return "단서 " + c.req.clues + "개 필요 · 현재 " + state.clues;
    }
    if (c.consume && state.items.indexOf(c.consume) < 0) return c.consume + " 없음";
    return null;
  }
  function choiceBadges(c, locked) {
    var out = "";
    if (c.req && c.req.skill) out += '<span class="ea-b req">' + esc(c.req.skill[0]) + " Lv." + c.req.skill[1] + "</span>";
    if (c.req && c.req.item) out += '<span class="ea-b req">' + esc(c.req.item) + "</span>";
    if (c.req && c.req.clues) out += '<span class="ea-b req">단서 ' + c.req.clues + "</span>";
    if (c.consume) out += '<span class="ea-b cost">' + esc(c.consume) + " 1 소모</span>";
    if (c.gamble) out += '<span class="ea-b odds">도박 · 성공 ' + Math.round(c.gamble.p * 100) + "%</span>";
    if (locked) out += '<span class="ea-b lock">잠김 — ' + esc(locked) + "</span>";
    return out;
  }

  function renderScene(id) {
    var scene = SCENES[id];
    state.steps += 1;
    renderArt(scene.art);
    var enterNote = "";
    if (scene.enter && !scene._entered) {
      /* 장면 진입 비용 — 여정(leg) 이동의 축약판 */
      var deltas = [];
      applyFx(scene.enter.fx, deltas);
      scene._entered = true; /* 회차 리셋 시 초기화 */
      enterNote = scene.enter.note ? scene.enter.note + " — " + deltasText(deltas) : "";
      var cause = deadStat();
      if (cause) { renderEnding("death", cause); return; }
    }
    renderHud();
    $("ea-place").textContent = scene.place;
    $("ea-text").textContent = scene.text + (enterNote ? "\n\n" + enterNote : "");
    $("ea-result").hidden = true;
    var box = $("ea-choices");
    box.innerHTML = "";
    scene.choices.forEach(function (c) {
      var locked = choiceGate(c);
      var btn = el("button", "ea-choice" + (locked ? " locked" : ""),
        '<span class="ea-choice-label">' + esc(c.label) + "</span>" + choiceBadges(c, locked));
      btn.type = "button";
      if (locked) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      } else {
        btn.addEventListener("click", function () { choose(c); });
      }
      box.appendChild(btn);
    });
    setFoot("선택은 되돌릴 수 없습니다 — 세이브 없음, 영구죽음");
  }

  function deltasText(deltas) {
    return deltas.map(function (d) {
      if (d.add) return "+ " + d.label;
      return d.label + " " + (d.v > 0 ? "+" : "−") + Math.abs(d.v);
    }).join(" · ");
  }

  function choose(c) {
    var outcome = c, rolled = null;
    if (c.gamble) {
      rolled = Math.random() < c.gamble.p;
      outcome = rolled ? c.gamble.win : c.gamble.lose;
    }
    var deltas = [];
    if (c.consume) {
      var idx = state.items.indexOf(c.consume);
      if (idx >= 0) state.items.splice(idx, 1);
      deltas.push({ label: c.consume, v: 0, removed: true });
    }
    applyFx(outcome.fx, deltas);
    renderHud();

    var cause = deadStat();
    var next = cause ? { end: "death", cause: cause } :
      outcome.end ? { end: outcome.end } : { goto: outcome.goto };

    /* '방금 선택의 여파' — 원작의 인라인 결과 표시를 그대로 재현 */
    var res = $("ea-result");
    var chips = deltas.map(function (d) {
      if (d.removed) return '<span class="ea-delta minus">− ' + esc(d.label) + "</span>";
      if (d.add) return '<span class="ea-delta plus">+ ' + esc(d.label) + "</span>";
      var plus = d.v > 0;
      return '<span class="ea-delta ' + (plus ? "plus" : "minus") + '">' +
        esc(d.label) + " " + (plus ? "+" : "−") + Math.abs(d.v) + "</span>";
    }).join("");
    var rollTag = rolled == null ? "" :
      '<span class="ea-roll ' + (rolled ? "win" : "lose") + '">도박 ' + (rolled ? "성공" : "실패") + "</span>";
    res.innerHTML =
      '<p class="ea-result-key">방금 선택의 여파' + rollTag + "</p>" +
      '<p class="ea-result-text">' + esc(outcome.text) + "</p>" +
      (chips ? '<p class="ea-deltas">' + chips + "</p>" : "");
    res.hidden = false;

    var box = $("ea-choices");
    box.innerHTML = "";
    var btn = el("button", "ea-choice primary", cause ? "…" : "계속 →");
    btn.type = "button";
    btn.addEventListener("click", function () {
      if (next.end) renderEnding(next.end, next.cause);
      else renderScene(next.goto);
    });
    box.appendChild(btn);
    btn.focus();
  }

  /* ---------- 엔딩 ---------- */
  function renderEnding(id, cause) {
    var end = ENDINGS[id];
    achieved[id === "death" ? "death" : id] = true;
    renderArt(end.art);
    renderHud();
    $("ea-place").textContent = "ENDING — " + (id === "death" ? "사망" : id.toUpperCase());
    $("ea-text").textContent = "";
    var res = $("ea-result");
    var body = id === "death" ? DEATH_TEXT[cause] + "\n" + ENDINGS.death.note : end.text;
    res.innerHTML =
      '<p class="ea-result-key">' + (end.bad ? "배드 엔딩" : "엔딩") + "</p>" +
      '<p class="ea-ending-title">' + esc(end.title) + "</p>" +
      '<p class="ea-result-text">' + esc(body) + "</p>" +
      (id === "death" ? "" : '<p class="ea-note">' + esc(end.note) + "</p>") +
      '<p class="ea-note">이번 회차 — ' + esc(state.role ? state.role.name : "?") +
      " · 장면 " + state.steps + " · 단서 " + state.clues + "</p>";
    res.hidden = false;
    var box = $("ea-choices");
    box.innerHTML = "";
    var btn = el("button", "ea-choice primary", "새 회차 시작 — 다른 역할로");
    btn.type = "button";
    btn.addEventListener("click", reset);
    box.appendChild(btn);
    var seen = Object.keys(achieved).length;
    setFoot("이 데모의 엔딩 3종 + 사망 중 " + seen + "종을 봤습니다 · 원작에는 25종의 엔딩이 있습니다");
  }

  /* ---------- 리셋 ---------- */
  function reset() {
    Object.keys(SCENES).forEach(function (k) { delete SCENES[k]._entered; });
    newRun();
    renderRoles();
  }
  $("ea-reset").addEventListener("click", function () {
    if (state && state.role) reset();
    else { newRun(); renderRoles(); }
  });

  renderStart();
})();
