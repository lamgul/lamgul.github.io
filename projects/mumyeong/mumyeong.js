/* mumyeong.js — 무명 시리즈 데모.
   (1) 두 게임 비교 카드, (2) 무명록 프롤로그 요약판(원작 장면 데이터 발췌),
   (3) 소재 라이브러리를 이식한 세계관 생성기.
   장면 텍스트·선택지·효과 문구는 비공개 원작 레포(게임/소스/게임.js)와
   공용 세계관 저장소(세계관_구조/소재_라이브러리.md)에서 그대로 가져왔다. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const josa = (word, withJong, noJong) => {
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return withJong;
    const jong = (code - 0xac00) % 28;
    if (!jong) return noJong;
    /* '(으)로'는 ㄹ 받침에도 '로'를 쓴다 (지하철로) */
    if (jong === 8 && noJong === "로") return noJong;
    return withJong;
  };

  /* ================= 데이터: 두 게임 (원작 수치 그대로) ================= */
  const MUMYEONGROK_ENDINGS = [
    "E1. 백지의 아침", "E2. 금줄 안의 사람들", "E3. 마지막 방송", "E4. 등록된 평화",
    "E5. 이름 없는 구출", "E6. 불탄 장부", "E7. 세 번째 호명", "E7. 흰 선 아래",
    "E8. 검은 명부의 문지기", "E9. 비 오는 시장으로", "E10. 아무도 부르지 않는 이름"
  ];
  const MUMYEONGBI_ENDINGS = [
    "맑은 이름", "영만이 아닌 이름", "나루터의 새벽", "여우가 남긴 꼬리",
    "출석부", "흰우산 아래", "삭제된 마을", "춘몽", "소문상인", "검은 장마",
    "다시 부르는 사람", "010000", "젖은 몸", "번진 빈칸"
  ];
  const BAD_ENDINGS = ["E7. 세 번째 호명", "E7. 흰 선 아래", "E10. 아무도 부르지 않는 이름", "검은 장마", "010000", "젖은 몸", "번진 빈칸"];

  /* ================= 데이터: 무명록 요약판 ================= */
  const MAX_STAT = 4;
  const START_ITEMS = ["마른 천", "통조림", "낡은 손전등", "붉은 실", "소금"];
  const CALL_SYLLABLES = ["무", "연", "라", "서", "이", "윤", "페"];
  const CLUE_META = {
    C01: "빈 식별표", C02: "정정된 재난문자", C04: "문지방 규칙",
    C05: "흰 가루 묻은 물", C06: "아이들의 경계 시야", C11: "집행조 내부 규정"
  };
  const TAG_LABELS = { blank: "비어 있음", wet: "젖음", blurred: "번짐", covered: "가림", locked: "잠김" };

  /* 장면 5개: 원작 SCENES의 prologue_train → prologue_tag → station_gate
     → 이동 인카운터(underpass_white_rain) → mapo_shelter 발췌. */
  const SCENES = {
    train: {
      chapter: "프롤로그", place: "이름 없는 막차", kicker: "흰비 뒤 첫 장면",
      title: "스피커가 이름 직전에서 멈춘다",
      text: (S) => [
        "당신은 멈춘 전철 바닥에서 깨어난다. 창밖은 역도 터널도 아닌 희끄무레한 어둠이다.",
        "스피커가 " + S.syllable + "... " + S.syllable + "... 하고 끊긴다. 이름이 되기 직전의 소리다. 그래서 더 위험하다.",
        "손목에는 아무것도 적히지 않은 식별표가 걸려 있다. 빈칸은 이상하게도 젖지 않았다."
      ],
      choices: [
        { text: "대답하지 않는다.", note: "첫 호명에 침묵한다.", to: "tag",
          eff: { flag: "silent_at_first_call", habit: "침묵", log: "첫 호명에 대답하지 않았다.", fx: "달무가 보이지 않는 곳에서 '아직은요'라고 말한 듯합니다." } },
        { text: "소리를 따라 짧게 대답한다.", note: "호명 위험이 오른다.", to: "tag",
          eff: { stat: { call: 1, mind: -1 }, tag: "wet", habit: "공감", log: "첫 호명에 반응했다.", fx: "식별표의 빈칸 가장자리가 젖었습니다." } },
        { text: "손목의 빈 식별표를 먼저 확인한다.", note: "빈 식별표를 단서로 삼는다.", to: "tag",
          eff: { clue: "C01", habit: "관찰", log: "빈 식별표를 확인했다." } }
      ]
    },
    tag: {
      chapter: "프롤로그", place: "멈춘 승강장", kicker: "문이 열리기 전",
      title: "문틈으로 흰 가루가 밀려든다",
      text: () => [
        "전철 문이 반쯤 열린다. 문틈에는 흰 가루가 얇게 쌓여 있고, 바닥 물웅덩이는 광고판의 빛을 뒤집어 비춘다.",
        "당신의 얼굴은 물에 비치지 않는다. 대신 식별표의 빈칸만 또렷하다.",
        "승강장 너머에서 손전등이 두 번 깜빡인다. 이름 대신 쓰는 신호일지도 모른다."
      ],
      choices: [
        { text: "손전등 두 번으로 답한다.", note: "낡은 손전등 필요. 이케스의 신호와 이어진다.", to: "gate",
          req: { item: "낡은 손전등" }, locked: "낡은 손전등이 없다.",
          eff: { useItem: "낡은 손전등", habit: "관찰", log: "손전등 두 번 신호를 보냈다.", fx: "어둠 속에서 같은 신호가 돌아옵니다." } },
        { text: "문틈의 흰 가루를 밟지 않고 넘는다.", note: "문지방 규칙을 짐작한다.", to: "gate",
          eff: { clue: "C04", habit: "관찰", log: "문지방의 흰 가루를 피했다." } },
        { text: "바로 승강장으로 나간다.", note: "빠르지만 몸이 먼저 반응한다.", to: "gate",
          eff: { stat: { hunger: -1 }, tagIfBlank: "wet", log: "승강장으로 뛰어내렸다." } }
      ]
    },
    gate: {
      chapter: "1장", place: "이름 없는 역", kicker: "첫 신뢰",
      title: "세 갈래 목소리가 같은 출구를 가리킨다",
      text: () => [
        "고장 난 방송실에서 유기프의 무전이 흘러나온다. 그는 당신을 이름이 아니라 위치와 호흡으로 부른다.",
        "계단 아래에서는 크롬이 흰 방호복을 밀어붙이고 있다. 너무 친절한 안내 목소리가 격리를 말한다.",
        "지워진 노선도 아래에서 지구가 웃는다. '출구는 공짜가 아니야. 대신, 이름값보다는 싸게 해 줄게.'"
      ],
      choices: [
        { text: "유기프에게 빈 식별표와 방송을 공유한다.", note: "분석가와 신뢰를 쌓고 정정된 재난문자를 확인한다.", to: "road",
          eff: { clue: "C02", habit: "무전", log: "유기프에게 첫 단서를 공유했다." } },
        { text: "크롬이 뚫은 계단으로 따라간다.", note: "위험하지만 집행조를 가까이 본다.", to: "road",
          eff: { stat: { body: -1 }, clue: "C11", log: "크롬과 함께 방호복 행렬을 지나쳤다." } },
        { text: "지구와 거래해 출구 정보를 산다.", note: "시장 빚이 생길 수 있다.", to: "road",
          eff: { flag: "market_debt", addItem: "지도 조각", log: "지구에게 첫 빚을 졌다.", fx: "지도 조각을 얻었습니다. 대가는 아직 적히지 않았습니다." } },
        { text: "플랫폼 끝의 사람에게 이름을 묻지 않는다.", note: "달무는 질문을 듣지 않은 척 답한다.", to: "road",
          eff: { clue: "C04", habit: "침묵", stat: { mind: 1 }, log: "달무에게 이름을 묻지 않았다." } }
      ]
    },
    road: {
      chapter: "이동", place: "마포로 가는 지하도", kicker: "랜덤 인카운터",
      title: "흰비가 지하도 천장에서 거꾸로 맺힌다",
      text: () => [
        "천장 균열에 맺힌 물방울이 아래가 아니라 위로 떨어진다. 물웅덩이에는 사람의 얼굴 대신 이름표만 비친다.",
        "흰 가루가 묻은 안내문은 문지방이라는 단어를 반복한다."
      ],
      choices: [
        { text: "안내문을 접어 챙긴다.", note: "문지방 규칙을 확인하지만 정신이 깎인다.", to: "shelter",
          eff: { clue: "C04", stat: { mind: -1 }, log: "흰 가루 묻은 안내문을 챙겼다." } },
        { text: "젖은 곳을 피해 돌아간다.", note: "공복 감소, 호명 안정.", to: "shelter",
          eff: { stat: { hunger: -1, call: -1 }, log: "젖은 곳을 피해 돌아갔다." } }
      ]
    },
    shelter: {
      chapter: "2장", place: "마포 방역선", kicker: "따뜻한 장소",
      title: "이름을 묻지 않는 죽",
      text: () => [
        "마포 방역선은 생각보다 따뜻하다. 찢어진 현수막 아래로 진료소 불빛이 새고, 윤이는 당신에게 이름 대신 그릇을 건넨다.",
        "최파푸는 사람들에게 싸우는 법보다 도망치는 법을 가르친다. '살아서 돌아오면 그게 이긴 거야.'",
        "빈과 도리링은 당신 뒤에 흰 실이 매달려 있다고 말한다. 아이들의 눈은 어른들이 놓친 경계선을 본다."
      ],
      choices: [
        { text: "윤이의 죽을 받아 천천히 먹는다.", note: "공복 회복, 윤이 신뢰 증가.", to: "end",
          eff: { stat: { hunger: 1 }, habit: "공감", log: "윤이의 죽을 먹었다." } },
        { text: "아이들이 본 흰 실을 기록한다.", note: "아이들의 경계 시야를 확인하고 아이들을 우선 보호한다.", to: "end",
          eff: { clue: "C06", flag: "protect_children", habit: "관찰", log: "아이들의 경계 시야를 믿었다." } },
        { text: "최파푸의 대피 신호를 배운다.", note: "나중에 사람을 돌려보낼 수 있다.", to: "end",
          eff: { flag: "escape_signal", habit: "침묵", log: "이름 대신 쓰는 대피 신호를 배웠다." } }
      ]
    },
    crisis: {
      chapter: "위기", place: "세 번째 호명", kicker: "돌아보지 말 것",
      title: "세 번째에는 몸이 먼저 대답한다",
      text: () => [
        "이름이 완성되지 않았는데도 당신의 목덜미가 먼저 돌아가려 한다. 식별표의 빈칸이 흰 실처럼 부푼다.",
        "첫 번째는 기억, 두 번째는 그리움, 세 번째는 병이다. 지금은 세 번째다.",
        "되돌릴 수는 없지만 늦출 수는 있다."
      ],
      choices: [
        { text: "붉은 실로 식별표를 묶는다.", note: "붉은 실 필요. 호명을 크게 낮춘다.", to: "__pending",
          req: { item: "붉은 실" }, locked: "붉은 실이 없다.",
          eff: { useItem: "붉은 실", tag: "covered", setCall: 1, log: "붉은 실로 세 번째 호명을 늦췄다." } },
        { text: "달무의 질문을 기억하고 대답하지 않는다.", note: "첫 침묵 필요.", to: "__pending",
          req: { flag: "silent_at_first_call" }, locked: "침묵을 붙잡을 기억이 부족하다.",
          eff: { setCall: 2, stat: { mind: -1 }, log: "달무의 질문을 붙잡고 돌아보지 않았다." } },
        { text: "돌아본다.", note: "세 번째 호명에 응답한다.", to: "e7",
          eff: { log: "세 번째 호명에 돌아보았다." } }
      ]
    },
    e7: {
      ending: true, chapter: "엔딩", tone: "배드 엔딩", place: "검은 명부", kicker: "회차 종료",
      title: "E7. 세 번째 호명",
      text: () => [
        "당신은 돌아본다. 이름은 완성되지 않았지만 몸은 이미 대답했다.",
        "식별표의 빈칸은 누군가의 오래된 기록으로 채워진다. 그것은 당신을 살리는 이름이 아니라, 당신을 대신하는 이름이다.",
        "다음 회차에는 첫 번째 소리부터 조심해야 한다."
      ],
      choices: []
    },
    end: {
      ending: true, chapter: "2장", tone: "요약판 종료", place: "마포 방역선", kicker: "여기까지가 요약판",
      title: "마포의 밤은 원작에서 계속됩니다",
      text: () => [
        "요약판은 여기서 멈춥니다. 원작 메인 비트 8개 중 비 오는 시장 → 금줄리 → 방호복의 사람들 → 서해 송출탑 → 검은 명부로 이어지는 다섯이 남아 있고, 단서 15종과 인물 14명의 신뢰가 11가지 엔딩 중 하나를 고릅니다."
      ],
      choices: []
    }
  };

  /* ================= 데이터: 세계관 생성기 (소재_라이브러리.md 이식) ================= */
  const POOLS = {
    place: {
      label: "한국 장소",
      items: [
        { name: "지하철", desc: "막차가 오지 않는데 안내 방송만 계속 바뀐다" },
        { name: "학교", desc: "출석부에 없는 학생은 교문을 나갈 수 없다" },
        { name: "병원", desc: "접수 번호가 사람의 남은 기억 순서를 뜻한다" },
        { name: "시장", desc: "가게마다 이름, 기억, 소문을 무게로 달아 판다" },
        { name: "아파트", desc: "사라진 동호수의 초인종이 밤마다 울린다" },
        { name: "한강", desc: "물 위에 죽은 사람의 별명이 떠오른다" },
        { name: "항구", desc: "지도에 없는 배가 젖은 물건을 싣고 들어온다" },
        { name: "산", desc: "오래된 민속 이름을 부르면 길이 바뀐다" },
        { name: "관공서", desc: "서류가 접수되면 현실도 그 서류대로 바뀐다" },
        { name: "편의점", desc: "유통기한이 사람의 기억 만료일처럼 찍힌다" }
      ]
    },
    anomaly: {
      label: "이상 현상",
      items: [
        { name: "이름 삭제", desc: "본명을 들키면 기억이나 신체 일부가 사라진다" },
        { name: "검은 비", desc: "비를 맞으면 잊힌 기억이 몸 밖으로 샌다" },
        { name: "장부 현실화", desc: "기록된 사람만 사회적으로 존재한다" },
        { name: "출석부 감금", desc: "출석 처리되지 않으면 같은 하루를 반복한다" },
        { name: "전파 혼선", desc: "라디오/방송이 미래의 구조 요청을 들려준다" },
        { name: "꿈 침식", desc: "잠든 사람의 꿈이 실제 지형을 바꾼다" },
        { name: "역명 변동", desc: "역 이름이 바뀌면 도착지도 바뀐다" },
        { name: "민속 패턴", desc: "오래된 이야기가 도시 규칙처럼 작동한다" },
        { name: "행정 저주", desc: "신고, 접수, 말소 같은 행정어가 현실을 확정한다" }
      ]
    },
    prop: {
      label: "생활 소품",
      items: [
        { name: "투명 우산", desc: "비현실 현상을 잠시 막는다" },
        { name: "이름표", desc: "신분이 아니라 생존 장비" },
        { name: "출석부", desc: "사람의 존재 여부를 관리" },
        { name: "교통카드", desc: "이동 기록이 곧 기억 기록" },
        { name: "방역 팔찌", desc: "통제 세력이 사람을 분류" },
        { name: "라디오", desc: "보이지 않는 인물과 연결" },
        { name: "도장", desc: "현실을 확정하는 승인 도구" },
        { name: "장부", desc: "거래와 기억의 저장소" },
        { name: "부적", desc: "민속 규칙을 우회하는 임시 장치" },
        { name: "영수증", desc: "누가 무엇을 잃었는지 증명" }
      ]
    },
    faction: {
      label: "통제 세력",
      items: [
        { name: "방역청", desc: "재난을 관리한다는 명분으로 사람을 분류" },
        { name: "기록기관", desc: "존재를 문서로 통제" },
        { name: "시장 조합", desc: "금기를 상품화" },
        { name: "학교 잔존회", desc: "아이들과 출석부를 지킴" },
        { name: "병원 집단", desc: "치료와 실험 사이에서 흔들림" },
        { name: "항구 연합", desc: "외부 루트와 밀수 담당" },
        { name: "플랫폼 기업", desc: "재난을 앱/등급/구독 서비스로 관리" },
        { name: "무속 집단", desc: "비현실 현상을 오래된 이름으로 해석" },
        { name: "익명 공동체", desc: "이름 없이 살아남는 방식을 선택" }
      ]
    },
    taboo: {
      label: "금기",
      items: [
        { name: "본명 부르기", desc: "어기면 기억 폭주 또는 신체 변이" },
        { name: "젖은 종이 태우기", desc: "어기면 기록된 사람이 사라짐" },
        { name: "역명을 세 번 말하기", desc: "어기면 다른 장소로 이동" },
        { name: "출석부 찢기", desc: "어기면 하루가 반복되거나 학생들이 흩어짐" },
        { name: "우산 안에서 거짓말하기", desc: "어기면 비가 실내로 들어옴" },
        { name: "방송에 대답하기", desc: "어기면 보이지 않는 쪽에 위치가 노출" },
        { name: "도장을 훔치기", desc: "어기면 행정상 존재가 말소" },
        { name: "장부를 빈칸으로 두기", desc: "어기면 누군가의 이름이 그 칸에 빨려 들어감" }
      ]
    }
  };
  const GEN_ORDER = ["place", "anomaly", "prop", "faction", "taboo"];

  /* ============================ 탭 ============================ */
  const tabs = [
    { btn: $("mm-tab-games"), panel: $("mm-panel-games") },
    { btn: $("mm-tab-play"), panel: $("mm-panel-play") },
    { btn: $("mm-tab-gen"), panel: $("mm-panel-gen") }
  ];
  let activePanel = "mm-panel-games";

  tabs.forEach(({ btn, panel }) => {
    btn.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t.btn === btn;
        t.btn.classList.toggle("is-on", on);
        t.btn.setAttribute("aria-selected", String(on));
        t.panel.hidden = !on;
      });
      activePanel = panel.id;
      /* 숨겨진 채 그려진 캔버스는 크기가 없어, 열릴 때 다시 잰다 */
      if (activePanel === "mm-panel-play") setupRain();
      syncRain();
    });
  });
  window.addEventListener("resize", () => {
    if (activePanel === "mm-panel-play") { setupRain(); syncRain(); }
  });

  /* ============================ (1) 두 게임 카드 ============================ */
  function meterHtml(label, value, danger) {
    const cells = Array.from({ length: MAX_STAT }, (_, i) =>
      '<span class="mm-m-cell' + (i < value ? " on" : "") + '"></span>').join("");
    return '<div class="mm-meter' + (danger ? " danger" : "") + '">' +
      '<span class="mm-m-label">' + esc(label) + "</span>" +
      '<div class="mm-m-track">' + cells + "</div>" +
      '<span class="mm-m-val">' + value + "/" + MAX_STAT + "</span></div>";
  }

  function endingListHtml(list) {
    return list.map((name) =>
      "<li" + (BAD_ENDINGS.includes(name) ? ' class="bad"' : "") + ">" + esc(name) + "</li>"
    ).join("");
  }

  function renderGames() {
    $("mm-panel-games").innerHTML =
      '<div class="mm-cards">' +

      '<article class="mm-card">' +
      '<span class="mm-card-kicker">Game 01 · 텍스트 어드벤처</span>' +
      "<h3>무명록<small>MUMYEONGROK</small></h3>" +
      '<p class="mm-card-tag">흰비 이후, 이름을 부르면 병드는 한국. 이름 없는 \'당신\'이 막차에서 깨어나 검은 명부까지 갑니다.</p>' +
      '<div class="mm-card-block"><h4>스탯 — 0~4 미터</h4>' +
      meterHtml("몸", 3, false) + meterHtml("정신", 3, false) +
      meterHtml("공복", 3, false) + meterHtml("호명", 0, true) + "</div>" +
      '<div class="mm-card-block"><h4>구조</h4><ul class="mm-facts">' +
      "<li>메인 비트 <b>8개</b> — 막차에서 검은 명부까지</li>" +
      "<li>단서 <b>15종</b>(C01~C15) · 인물 <b>14명</b> 신뢰</li>" +
      "<li>능력 5종(관찰·침묵·민속·무전·공감) · 최대 Lv.3</li>" +
      "<li>코어 엔진 + <b>확장팩 7파일</b>이 장면을 주입</li>" +
      "</ul></div>" +
      '<button class="mm-endings-btn" type="button" data-endings="rok" aria-expanded="false">엔딩 11종 모두 보기</button>' +
      '<ul class="mm-endings" id="mm-endings-rok" hidden>' + endingListHtml(MUMYEONGROK_ENDINGS) + "</ul>" +
      "</article>" +

      '<article class="mm-card">' +
      '<span class="mm-card-kicker">Game 02 · 인터랙티브 픽션</span>' +
      "<h3>무명비: 영만의 밤<small>MUMYEONGBI</small></h3>" +
      '<p class="mm-card-tag">검은 비가 내릴 때마다 이름과 기억이 지워지는 서울. 압축 회차와 10부 60장을 재구성한 장편 모드를 고를 수 있습니다.</p>' +
      '<div class="mm-card-block"><h4>스탯 — 박스 게이지 + 보조 변수</h4>' +
      meterHtml("몸", 3, false) + meterHtml("정신", 3, false) + meterHtml("호명", 0, true) +
      '<div class="mm-aux"><span class="mm-chip cool">기억도</span><span class="mm-chip cool">인간성</span><span class="mm-chip hot">이름 부채</span></div></div>' +
      '<div class="mm-card-block"><h4>구조</h4><ul class="mm-facts">' +
      "<li>압축 회차 + 장편 모드 <b>960장면</b></li>" +
      "<li>선택지 객체 <b>{t, req, note, eff, to}</b> · 습관/아이템 해금</li>" +
      "<li>지역별 랜덤 인카운터 · 엔딩 수집(endingsSeen)</li>" +
      "<li>Node <b>자동 플레이테스트 3종</b> · Python 원고 도구</li>" +
      "</ul></div>" +
      '<button class="mm-endings-btn" type="button" data-endings="bi" aria-expanded="false">엔딩 14종 모두 보기</button>' +
      '<ul class="mm-endings" id="mm-endings-bi" hidden>' + endingListHtml(MUMYEONGBI_ENDINGS) + "</ul>" +
      "</article>" +

      "</div>" +
      '<div class="mm-compare"><span class="mm-compare-key">공유하는 문법</span>' +
      '<span class="mm-chip">상태 객체 S</span><span class="mm-chip">SCENES 장면 테이블</span>' +
      '<span class="mm-chip">조건부 잠금 선택지</span><span class="mm-chip hot">호명 3 = 위기</span>' +
      '<span class="mm-chip cool">멀티 엔딩 11 vs 14</span></div>';
  }

  $("mm-panel-games").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-endings]");
    if (!btn) return;
    const list = $("mm-endings-" + btn.dataset.endings);
    const open = list.hidden;
    list.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    const n = btn.dataset.endings === "rok" ? 11 : 14;
    btn.textContent = open ? "엔딩 목록 접기" : "엔딩 " + n + "종 모두 보기";
  });

  /* ============================ (2) 무명록 요약판 ============================ */
  let S = null;
  let runNo = 0;
  let effects = [];

  function newRun() {
    runNo += 1;
    const items = {};
    const shuffled = START_ITEMS.slice().sort(() => Math.random() - 0.5);
    items[shuffled[0]] = 1;
    items[shuffled[1]] = 1;
    S = {
      scene: "train", pending: null,
      body: 3, mind: 3, hunger: 3, call: 0,
      tagState: "blank",
      syllable: CALL_SYLLABLES[Math.floor(Math.random() * CALL_SYLLABLES.length)],
      items, clues: {}, habits: {}, flags: {}, log: []
    };
    effects = ["시작 물자: " + Object.keys(items).join(", "),
      "첫 호명 음절은 '" + S.syllable + "'에 가깝게 들립니다."];
    renderScene();
  }

  const clamp = (v) => Math.max(0, Math.min(MAX_STAT, v));
  const hasItem = (name) => (S.items[name] || 0) > 0;
  const reqOk = (req) => !req || (req.item ? hasItem(req.item) : req.flag ? !!S.flags[req.flag] : true);

  function applyEffects(eff) {
    if (!eff) return;
    const before = S.call;
    if (eff.stat) Object.keys(eff.stat).forEach((k) => { S[k] = clamp(S[k] + eff.stat[k]); });
    if (typeof eff.setCall === "number") S.call = eff.setCall;
    if (eff.tag) S.tagState = eff.tag;
    if (eff.tagIfBlank && S.tagState === "blank") S.tagState = eff.tagIfBlank;
    if (eff.clue && !S.clues[eff.clue]) {
      S.clues[eff.clue] = true;
      effects.push("단서 확보 — " + eff.clue + " " + CLUE_META[eff.clue]);
    }
    if (eff.habit) {
      S.habits[eff.habit] = (S.habits[eff.habit] || 0) + 1;
      effects.push("습관 — " + eff.habit + " Lv." + S.habits[eff.habit]);
    }
    if (eff.flag) S.flags[eff.flag] = true;
    if (eff.addItem) S.items[eff.addItem] = (S.items[eff.addItem] || 0) + 1;
    if (eff.useItem && S.items[eff.useItem]) S.items[eff.useItem] -= 1;
    if (eff.log) S.log.push(eff.log);
    if (eff.fx) effects.push(eff.fx);
    if (S.call > before) warnCall();
  }

  let warnFlash = false;
  function warnCall() {
    warnFlash = true; /* renderScene이 새 DOM에 플래시 클래스를 붙인다 */
    if (S.call === 1) effects.push("경고 · 호명 1 — 첫 번째는 기억이다.");
    else if (S.call === 2) effects.push("경고 · 호명 2 — 두 번째는 그리움이다. 세 번째에는 돌아보지 말 것.");
    else if (S.call >= 3) effects.push("경고 · 호명 3 — 세 번째는 병이다.");
  }

  function choose(idx) {
    const scene = SCENES[S.scene];
    const choice = scene.choices[idx];
    if (!choice || !reqOk(choice.req)) return;
    applyEffects(choice.eff);

    let next = choice.to;
    if (next === "__pending") {
      next = S.pending || "shelter";
      S.pending = null;
    }

    /* 원작 checkCrisis: 호명 3 이상이면 위기가 끼어든다 */
    if (S.call >= 3 && next !== "crisis" && !SCENES[next].ending) {
      S.pending = next;
      next = "crisis";
    }
    S.scene = next;
    renderScene();
  }

  function hudHtml() {
    const clues = Object.keys(S.clues).sort();
    const items = Object.entries(S.items).filter(([, n]) => n > 0);
    const habits = Object.entries(S.habits).sort((a, b) => b[1] - a[1]);
    const inEnd = SCENES[S.scene].ending || S.scene === "crisis";
    return '<div class="mm-hud-top"><span class="mm-run">' + runNo + "회차 · 요약판</span>" +
      '<span class="mm-tag-state">식별표 · ' + esc(TAG_LABELS[S.tagState]) + "</span></div>" +
      '<div class="mm-hud-block"><h4>상태</h4><div id="mm-meters">' +
      meterHtml("몸", S.body, false) + meterHtml("정신", S.mind, false) +
      meterHtml("공복", S.hunger, false) + meterHtml("호명", S.call, true) + "</div></div>" +
      '<div class="mm-hud-block"><h4>단서</h4>' +
      (clues.length
        ? clues.map((c) => '<span class="mm-chip cool">' + c + " " + esc(CLUE_META[c]) + "</span>").join("")
        : '<span class="mm-chip">아직 확정 단서 없음</span>') + "</div>" +
      '<div class="mm-hud-block"><h4>물자</h4>' +
      (items.length
        ? items.map(([n, c]) => '<span class="mm-chip">' + esc(n) + " x" + c + "</span>").join("")
        : '<span class="mm-chip">남은 물자 없음</span>') + "</div>" +
      '<div class="mm-hud-block"><h4>습관</h4>' +
      (habits.length
        ? habits.map(([n, l]) => '<span class="mm-chip">' + esc(n) + " Lv." + l + "</span>").join("")
        : '<span class="mm-chip">아직 열린 능력 없음</span>') + "</div>" +
      '<div class="mm-hud-block"><h4>최근 흔적</h4><ul class="mm-hud-log">' +
      (S.log.length
        ? S.log.slice(-3).reverse().map((l) => "<li>" + esc(l) + "</li>").join("")
        : "<li>아직 흔적 없음</li>") + "</ul></div>" +
      '<div class="mm-hud-tools">' +
      '<button class="mm-tool-btn" id="mm-callup" type="button"' + (inEnd ? " disabled" : "") + ">시연 · 호명 +1</button>" +
      '<button class="mm-tool-btn" id="mm-restart" type="button">새 회차</button></div>';
  }

  function sceneHtml() {
    const scene = SCENES[S.scene];
    const lines = scene.text(S);
    const isEnd = !!scene.ending;
    let html = '<canvas id="mm-rain" aria-hidden="true"></canvas>' +
      '<div class="mm-scene-head' + (isEnd ? " mm-ending" : "") + '">' +
      '<span class="mm-kicker">' + esc(scene.kicker) + "</span>" +
      "<h3>" + esc(scene.title) + "</h3>" +
      '<span class="mm-place">' + esc(scene.chapter) + " · " + esc(scene.place) +
      (scene.tone ? " · " + esc(scene.tone) : "") + "</span></div>" +
      '<div class="mm-scene-text">' + lines.map((l) => "<p>" + esc(l) + "</p>").join("") + "</div>" +
      '<div class="mm-effects">' + effects.map((l) =>
        '<p class="' + (l.indexOf("경고") === 0 ? "warn" : "") + '">' + esc(l) + "</p>").join("") + "</div>";

    if (isEnd) {
      html += '<div class="mm-recap"><div class="mm-effects">' +
        "<p>회차 요약: 단서 " + Object.keys(S.clues).length + "개 · 호명 " + S.call +
        " · 습관 " + (Object.keys(S.habits).join(", ") || "없음") + "</p></div>" +
        '<div class="mm-choices"><button class="mm-choice" id="mm-again" type="button">' +
        '<span class="mm-c-text">새 회차를 시작한다.</span>' +
        '<span class="mm-c-note">시작 물자와 호명 음절이 다시 정해진다.</span></button></div></div>';
    } else {
      html += '<div class="mm-choices">' + scene.choices.map((c, i) => {
        const ok = reqOk(c.req);
        return '<button class="mm-choice" type="button" data-idx="' + i + '"' + (ok ? "" : " disabled") + ">" +
          '<span class="mm-c-text">' + esc(c.text) + "</span>" +
          '<span class="mm-c-note">' + esc(ok ? c.note : "잠김 — " + c.locked) + "</span></button>";
      }).join("") + "</div>";
    }
    return html;
  }

  function renderScene() {
    $("mm-panel-play").innerHTML =
      '<div class="mm-play"><aside class="mm-hud">' + hudHtml() + "</aside>" +
      '<div class="mm-scene' + (warnFlash ? " mm-warn" : "") + '">' + sceneHtml() + "</div></div>";
    effects = [];
    warnFlash = false;

    $("mm-restart").addEventListener("click", newRun);
    $("mm-callup").addEventListener("click", () => {
      if (SCENES[S.scene].ending || S.scene === "crisis") return;
      S.call = clamp(S.call + 1);
      warnCall();
      if (S.call >= 3) {
        S.pending = S.scene;
        S.scene = "crisis";
      }
      renderScene();
    });
    const again = $("mm-again");
    if (again) again.addEventListener("click", newRun);
    $("mm-panel-play").querySelectorAll(".mm-choice[data-idx]").forEach((btn) => {
      btn.addEventListener("click", () => choose(Number(btn.dataset.idx)));
    });
    setupRain();
    syncRain();
  }

  /* ---- 빗줄기: 원작의 Canvas 연출 축소판 ---- */
  let rain = null;
  function setupRain() {
    if (rain) cancelAnimationFrame(rain.raf);
    const canvas = $("mm-rain");
    if (!canvas) { rain = null; return; }
    const host = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = host.clientWidth || 600;
    const h = host.clientHeight || 400;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);
    const drops = Array.from({ length: 46 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      len: 7 + Math.random() * 14, spd: 2.2 + Math.random() * 3.4
    }));
    rain = { ctx, w, h, drops, raf: 0 };
    if (reduced) { drawRain(); return; }
  }
  function drawRain() {
    if (!rain) return;
    const { ctx, w, h, drops } = rain;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(236, 231, 218, 0.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    drops.forEach((d) => {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.5, d.y + d.len);
    });
    ctx.stroke();
  }
  function stepRain() {
    if (!rain) return;
    rain.drops.forEach((d) => {
      d.y += d.spd;
      if (d.y > rain.h) { d.y = -d.len; d.x = Math.random() * rain.w; }
    });
    drawRain();
    rain.raf = requestAnimationFrame(stepRain);
  }
  let stageVisible = true;
  function syncRain() {
    if (!rain) return;
    cancelAnimationFrame(rain.raf);
    const active = activePanel === "mm-panel-play" && stageVisible &&
      !document.hidden && !reduced;
    if (active) rain.raf = requestAnimationFrame(stepRain);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      stageVisible = entries[0].isIntersecting;
      syncRain();
    }, { threshold: 0.05 }).observe($("mm-stage"));
  }
  document.addEventListener("visibilitychange", syncRain);

  /* ============================ (3) 세계관 생성기 ============================ */
  const genState = {};

  function rollAll() {
    GEN_ORDER.forEach((cat) => {
      genState[cat] = Math.floor(Math.random() * POOLS[cat].items.length);
    });
  }

  function pitchHtml() {
    const p = POOLS.place.items[genState.place];
    const a = POOLS.anomaly.items[genState.anomaly];
    const i = POOLS.prop.items[genState.prop];
    const f = POOLS.faction.items[genState.faction];
    const t = POOLS.taboo.items[genState.taboo];
    return "무대는 <b>" + esc(p.name) + "</b> — " + esc(p.desc) + ". 여기에 <b>" + esc(a.name) +
      "</b>의 규칙이 겹친다. 사람들은 <b>" + esc(i.name) + "</b>" + josa(i.name, "으로", "로") +
      " 버티고, <b>" + esc(f.name) + "</b>" + josa(f.name, "이", "가") + " 질서를 쥔다. 금기는 <b>" +
      esc(t.name) + "</b> — " + esc(t.desc) + ".";
  }

  function renderGen(rolledCat) {
    $("mm-panel-gen").innerHTML =
      '<div class="mm-gen-head">' +
      '<p class="mm-formula">새 게임 변주 공식 — <b>장소 1 + 이상 현상 1 + 생활 소품 1 + 세력 1 + 금기 1</b></p>' +
      '<button id="mm-gen-all" type="button">새 컨셉 생성</button></div>' +
      '<div class="mm-gen-card">' +
      GEN_ORDER.map((cat) => {
        const pool = POOLS[cat];
        const item = pool.items[genState[cat]];
        /* reduced-motion에서는 하이라이트를 아예 붙이지 않는다
           (아래 타임아웃이 돌지 않아 배경이 영구히 남는 것 방지) */
        const rolling = !reduced && (rolledCat === true || rolledCat === cat);
        return '<div class="mm-gen-row' + (rolling ? " is-rolling" : "") + '" data-row="' + cat + '">' +
          '<span class="mm-gen-cat">' + esc(pool.label) + "</span>" +
          '<div class="mm-gen-val"><strong>' + esc(item.name) + "</strong><span>" + esc(item.desc) + "</span></div>" +
          '<button class="mm-reroll" type="button" data-reroll="' + cat + '" aria-label="' +
          esc(pool.label) + " 다시 뽑기" + '">⟲ 재추첨</button></div>';
      }).join("") + "</div>" +
      '<p class="mm-pitch">' + pitchHtml() + "</p>";

    $("mm-gen-all").addEventListener("click", () => { rollAll(); renderGen(true); });
    $("mm-panel-gen").querySelectorAll("[data-reroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.reroll;
        const size = POOLS[cat].items.length;
        let next = Math.floor(Math.random() * size);
        if (next === genState[cat]) next = (next + 1) % size; /* 항상 새 값 */
        genState[cat] = next;
        renderGen(cat);
      });
    });
    if (rolledCat && !reduced) {
      setTimeout(() => {
        $("mm-panel-gen").querySelectorAll(".mm-gen-row.is-rolling")
          .forEach((row) => row.classList.remove("is-rolling"));
      }, 320);
    }
  }

  /* ============================ 부트 ============================ */
  renderGames();
  newRun();
  rollAll();
  renderGen(false);
})();
