/* lookie.js — 루키 데모.
   375px 앱 프레임과 관리자 콘솔이 인메모리 스토어 하나를 공유한다.
   시드 데이터 출처(그대로 이식):
   - lamgul/lookie-app-backend   src/mock-data/content.mock.ts (유저 8명 · 게시글 24건 · 예약 펫 12마리)
   - lamgul/lookie-admin-backend src/mock-data/admin.mock.ts   (KPI · 예약 · 주문 · 서비스 · 상품)
   네트워크 요청 없음. 상태는 localStorage("lookie-demo-v1")에 저장된다. */
(() => {
  "use strict";

  // ───────────── seed: lookie-app-backend / content.mock.ts ─────────────
  const USERS = {
    editor_official: { username: "petstory_editor", displayName: "펫스토리 에디터", verified: true },
    user_haneul: { username: "haneul_with_milo", displayName: "하늘", verified: true },
    user_minho: { username: "minho_walklog", displayName: "민호" },
    user_yuri: { username: "yuri_catdaily", displayName: "유리" },
    user_doyun: { username: "doyun_petmarket", displayName: "도윤" },
    user_seohyun: { username: "seohyun_weekend", displayName: "서현" },
    vet_jisoo: { username: "dr_jisoo", displayName: "지수 수의사", verified: true },
    trainer_ian: { username: "trainer_ian", displayName: "훈련사 이안", verified: true },
  };

  // postBlueprints 24건 — content/timestamp/category/location 원문 그대로 (images는 장수만)
  const BLUEPRINTS = [
    { a: "user_haneul", text: "밀로랑 새벽 한강 5km 완주했어요. 발바닥 보호 크림 추천도 같이 남겨요 🐾", img: 2, t: "12분 전", c: "walking", loc: "한강공원 반포지구", boost: 2 },
    { a: "user_minho", text: "강동구 24시 동물병원 다녀온 후기 공유합니다. 야간 대기시간은 15분 정도였어요.", img: 0, t: "28분 전", c: "general", loc: "강동구" },
    { a: "user_yuri", text: "2개월 아기고양이 사료 급여량 계산표 만들었는데 필요하신 분?", img: 1, t: "44분 전", c: "question", boost: 1 },
    { a: "user_doyun", text: "거의 새 제품인 하네스 M 사이즈 나눔합니다. 리드줄도 같이 드려요.", img: 1, t: "1시간 전", c: "marketplace", loc: "송파구" },
    { a: "trainer_ian", text: "짖음 교정은 “멈춰!”보다 트리거 거리 조절이 먼저입니다. 3단계 루틴 공유해요.", img: 0, t: "1시간 전", c: "general", boost: 3 },
    { a: "user_seohyun", text: "토요일 성수동 반려견 소셜 워크 모집해요. 소형견 우선 6팀 받을게요!", img: 1, t: "2시간 전", c: "meetup", loc: "성수동", boost: 2 },
    { a: "vet_jisoo", text: "환절기 설사/구토 문의가 늘었어요. 탈수 체크는 잇몸 점막 먼저 보세요.", img: 0, t: "2시간 전", c: "general", boost: 3 },
    { a: "user_haneul", text: "밀로가 오늘 처음 독피구 훈련 성공! 사회화 클래스 효과가 확실하네요.", img: 1, t: "3시간 전", c: "general" },
    { a: "user_minho", text: "서울숲 아침 코스 vs 올림픽공원 저녁 코스, 어디가 더 좋은가요?", img: 1, t: "4시간 전", c: "question", loc: "서울숲" },
    { a: "user_yuri", text: "고양이 스크래처 리필형 비교 후기 올려요. 먼지 적은 제품 찾았어요.", img: 1, t: "5시간 전", c: "marketplace" },
    { a: "user_doyun", text: "강아지 유모차 중고 거래 전 체크리스트 7개 정리했습니다.", img: 1, t: "6시간 전", c: "marketplace" },
    { a: "trainer_ian", text: "산책 시 당김이 심한 아이들은 “출발 전 3초 정지”만으로도 많이 안정됩니다.", img: 1, t: "7시간 전", c: "walking", boost: 2 },
    { a: "user_seohyun", text: "주말 펫프렌들리 카페 번개 모임 사진 공유해요 ☕️", img: 2, t: "8시간 전", c: "meetup", loc: "연남동" },
    { a: "vet_jisoo", text: "중성화 수술 후 3일 식단 예시 업로드합니다. 급여 간격이 핵심이에요.", img: 1, t: "9시간 전", c: "general" },
    { a: "user_haneul", text: "오늘은 비 와서 실내 노즈워크! 간식 숨겨두니 25분 집중했어요.", img: 1, t: "11시간 전", c: "general" },
    { a: "user_minho", text: "새 리쉬줄 체험단 모집 공지 떴는데 신청해본 분 있나요?", img: 1, t: "12시간 전", c: "question" },
    { a: "user_yuri", text: "길고양이 급식소 관리 봉사 같이하실 분 구해요.", img: 1, t: "14시간 전", c: "meetup", loc: "마포구" },
    { a: "user_doyun", text: "겨울용 강아지 패딩 공동구매 열었어요. 사이즈표 첨부했습니다.", img: 1, t: "16시간 전", c: "marketplace", boost: 2 },
    { a: "trainer_ian", text: "입질 예방은 “손 물면 놀이 즉시 종료” 규칙을 가족 모두가 지켜야 해요.", img: 0, t: "18시간 전", c: "general" },
    { a: "user_seohyun", text: "일요일 아침 남산 산책 크루 5자리 남았어요. 초보 보호자 환영!", img: 1, t: "20시간 전", c: "walking", loc: "남산" },
    { a: "vet_jisoo", text: "치아 스케일링 주기 질문이 많아 FAQ로 정리해뒀어요.", img: 0, t: "22시간 전", c: "question" },
    { a: "user_haneul", text: "강아지 생일파티 소규모로 했는데 케이크 레시피 궁금하시면 공유할게요.", img: 2, t: "1일 전", c: "general" },
    { a: "user_minho", text: "양재천 야간 조명 코스 후기: 사람 적고 바닥 상태 좋아서 추천합니다.", img: 1, t: "1일 전", c: "walking", loc: "양재천" },
    { a: "user_yuri", text: "고양이 자동화장실 소음이 커서 고민인데 조용한 모델 추천 부탁드려요.", img: 0, t: "2일 전", c: "question" },
  ];

  const CATEGORY_WEIGHT = { general: 3, marketplace: 2, meetup: 3, walking: 4, question: 2 };

  // content.mock.ts의 결정적 참여도 공식을 그대로 이식 — 좋아요 수는 원본 서버가 계산했을 값과 같다
  const POSTS = BLUEPRINTS.map((post, index) => {
    const weight = CATEGORY_WEIGHT[post.c];
    const base = 36 + index * 5 + weight * 18 + (post.boost || 0) * 20;
    return {
      id: index + 1,
      author: USERS[post.a],
      content: post.text,
      imageCount: post.img,
      likes: base + 30,
      comments: Math.floor(base * 0.24),
      bookmarks: Math.floor(base * 0.11),
      views: base * 32,
      timestamp: post.t,
      liked: index % 4 === 0,
      bookmarked: index % 5 === 0,
      location: post.loc,
      category: post.c,
    };
  });

  // reservationPetSeeds 12마리 — 원문 그대로
  const PETS = [
    { name: "밀로", species: "강아지", breed: "비숑 프리제", age: 3 },
    { name: "호두", species: "강아지", breed: "말티푸", age: 2 },
    { name: "보리", species: "강아지", breed: "웰시코기", age: 4 },
    { name: "라떼", species: "고양이", breed: "코리안 숏헤어", age: 1 },
    { name: "몽이", species: "강아지", breed: "시바견", age: 5 },
    { name: "구름", species: "강아지", breed: "사모예드", age: 2 },
    { name: "단추", species: "고양이", breed: "러시안 블루", age: 3 },
    { name: "초코", species: "강아지", breed: "푸들", age: 7 },
    { name: "나비", species: "고양이", breed: "브리티시 숏헤어", age: 4 },
    { name: "복실", species: "강아지", breed: "포메라니안", age: 1 },
    { name: "쫑이", species: "강아지", breed: "닥스훈트", age: 6 },
    { name: "봉봉", species: "고양이", breed: "페르시안", age: 5 },
  ];

  // ───────────── seed: lookie-admin-backend / admin.mock.ts ─────────────
  const SERVICES = [
    { id: 1, name: "전신 미용", category: "미용", duration: 120, price: 50000, description: "샴푸, 드라이, 전신 컷팅 포함" },
    { id: 2, name: "건강 검진", category: "진료", duration: 30, price: 80000, description: "기본 건강 검진 및 상담" },
  ];
  const PRODUCTS = [
    { id: 1, name: "프리미엄 강아지 사료 5kg", category: "사료", price: 45000, stock: 50, tag: "베스트셀러", salesCount: 342 },
    { id: 2, name: "고양이 모래 7L", category: "위생용품", price: 28000, stock: 30, tag: "", salesCount: 198 },
  ];
  const SEED_RESERVATIONS = [
    { id: 1, date: "2026-01-20", time: "10:00", customer: "김철수", pet: "뭉치", petType: "말티즈", service: "전신 미용", price: 50000, status: "확정" },
    { id: 2, date: "2026-01-20", time: "11:30", customer: "이영희", pet: "초코", petType: "푸들", service: "건강 검진", price: 80000, status: "대기" },
  ];
  const SEED_ORDERS = [
    { id: 1001, customer: "김철수", product: "강아지 사료 5kg", amount: 45000, status: "배송중" },
    { id: 1002, customer: "이영희", product: "고양이 모래", amount: 28000, status: "배송완료" },
  ];
  // mockDashboardStats — 오늘 예약 24(+12%) · 대기 중 주문 8(-3%) · 금일 매출 ₩1,240,000(+8%) · 신규 고객 12(+5%)
  const KPI_BASE = { todayRes: 24, pendingOrders: 8, revenue: 1240000, newCustomers: 12 };
  const KPI_CHANGE = ["+12%", "-3%", "+8%", "+5%"];

  const RES_FLOW = ["대기", "확정", "완료", "취소"];
  const ORD_FLOW = ["대기", "배송중", "배송완료"];
  const TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // ───────────── state (localStorage) ─────────────
  const KEY = "lookie-demo-v1";
  let state = load();

  function fresh() {
    return {
      v: 1,
      likes: {}, // postId -> 현재 좋아요 여부(초기값과 다를 때만 의미)
      marks: {},
      reservations: SEED_RESERVATIONS.map((r) => Object.assign({}, r)),
      orders: SEED_ORDERS.map((o) => Object.assign({}, o)),
      nextRes: 3,
      nextOrd: 1003,
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1 && Array.isArray(s.reservations) && Array.isArray(s.orders)) return s;
      }
    } catch (_) {}
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  // ───────────── helpers ─────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const won = (n) => "₩" + n.toLocaleString("ko-KR");
  const fmtK = (n) => (n >= 10000 ? (n / 10000).toFixed(1) + "만" : n >= 1000 ? (n / 1000).toFixed(1) + "천" : String(n));
  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  const I = {
    heart: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3-.4-4.3-1.1L3 20l1.1-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 21l-7-4.4L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    img: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-4.5-4.5L7 21"/></svg>',
    check: '<svg class="lk-check" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.8 12.4l2.7 2.7 5.7-5.8" fill="none" stroke="var(--bg-elev)" stroke-width="2.2" stroke-linecap="round"/></svg>',
    paw: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><ellipse cx="7" cy="8.5" rx="1.9" ry="2.5"/><ellipse cx="12" cy="6.8" rx="1.9" ry="2.5"/><ellipse cx="17" cy="8.5" rx="1.9" ry="2.5"/><path d="M12 11c3 0 5.8 2.6 5.8 5.2 0 1.7-1.3 2.8-3 2.8-1 0-1.9-.4-2.8-.4s-1.8.4-2.8.4c-1.7 0-3-1.1-3-2.8C6.2 13.6 9 11 12 11z"/></svg>',
  };

  let lastResId = 0;
  let lastOrdId = 0;
  let currentCat = "all";
  let selPet = null;
  let selSvc = null;
  let selTime = null;

  // ───────────── app: feed ─────────────
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const effLiked = (p) => (has(state.likes, p.id) ? state.likes[p.id] : p.liked);
  const effMarked = (p) => (has(state.marks, p.id) ? state.marks[p.id] : p.bookmarked);
  const likeCount = (p) => p.likes + (effLiked(p) === p.liked ? 0 : effLiked(p) ? 1 : -1);
  const markCount = (p) => p.bookmarks + (effMarked(p) === p.bookmarked ? 0 : effMarked(p) ? 1 : -1);

  function postCard(p) {
    const liked = effLiked(p);
    const marked = effMarked(p);
    const tiles = Array.from({ length: Math.min(p.imageCount, 2) })
      .map(() => '<div class="lk-img">' + I.img + "</div>")
      .join("");
    return (
      '<article class="lk-post">' +
      '<span class="lk-ava" aria-hidden="true">' + esc(p.author.displayName[0]) + "</span>" +
      '<div class="lk-post-main">' +
      '<p class="lk-who"><b>' + esc(p.author.displayName) + "</b>" + (p.author.verified ? I.check : "") +
      '<span class="lk-hn">@' + esc(p.author.username) + " · " + esc(p.timestamp) + "</span></p>" +
      '<p class="lk-text">' + esc(p.content) + "</p>" +
      (p.location ? '<p class="lk-loc">' + I.pin + esc(p.location) + "</p>" : "") +
      (p.imageCount ? '<div class="lk-imgs">' + tiles + "</div>" : "") +
      '<div class="lk-actions">' +
      '<button class="lk-act like' + (liked ? " on" : "") + '" type="button" data-like="' + p.id + '" aria-pressed="' + liked + '" aria-label="좋아요">' + I.heart + "<span>" + likeCount(p) + "</span></button>" +
      '<span class="lk-act">' + I.comment + "<span>" + p.comments + "</span></span>" +
      '<button class="lk-act bm' + (marked ? " on" : "") + '" type="button" data-mark="' + p.id + '" aria-pressed="' + marked + '" aria-label="북마크">' + I.bookmark + "<span>" + markCount(p) + "</span></button>" +
      '<span class="lk-views">조회 ' + fmtK(p.views) + "</span>" +
      "</div></div></article>"
    );
  }

  function renderFeed() {
    const list = currentCat === "all" ? POSTS : POSTS.filter((p) => p.category === currentCat);
    $("lk-feed").innerHTML = list.map(postCard).join("") || '<p class="lk-empty">이 카테고리에는 아직 글이 없습니다.</p>';
  }

  $("lk-feed").addEventListener("click", (e) => {
    const likeBtn = e.target.closest("[data-like]");
    const markBtn = e.target.closest("[data-mark]");
    if (likeBtn) {
      const id = Number(likeBtn.dataset.like);
      state.likes[id] = !effLiked(POSTS[id - 1]);
      save();
      renderFeed();
      logApi("PATCH /content/posts/" + id, 200);
    } else if (markBtn) {
      const id = Number(markBtn.dataset.mark);
      state.marks[id] = !effMarked(POSTS[id - 1]);
      save();
      renderFeed();
      logApi("PATCH /content/posts/" + id, 200);
    }
  });

  $("lk-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".lk-chip");
    if (!chip) return;
    currentCat = chip.dataset.cat;
    document.querySelectorAll("#lk-chips .lk-chip").forEach((c) => c.classList.toggle("on", c === chip));
    renderFeed();
    logApi("GET /content/posts" + (currentCat === "all" ? "" : "?category=" + currentCat), 200);
  });

  // ───────────── app: tabs ─────────────
  const SCREENS = { home: "lk-screen-home", res: "lk-screen-res", shop: "lk-screen-shop" };
  const SUBTITLE = { home: "홈 피드", res: "예약", shop: "쇼핑" };
  document.querySelectorAll(".lk-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lk-tab").forEach((b) => b.classList.toggle("on", b === btn));
      Object.keys(SCREENS).forEach((k) => { $(SCREENS[k]).hidden = k !== btn.dataset.tab; });
      $("lk-appbar-sub").textContent = SUBTITLE[btn.dataset.tab];
    });
  });

  // ───────────── app: reservation ─────────────
  function renderMyRes() {
    const mine = state.reservations.filter((r) => r.demo);
    $("lk-myres").innerHTML = mine.length
      ? mine.map((r) =>
          '<div class="lk-myres-card">' +
          '<span class="lk-pi" aria-hidden="true">' + I.paw + "</span>" +
          '<span class="lk-mr-main"><span><b>' + esc(r.pet) + "</b> · " + esc(r.service) + "</span>" +
          '<span class="lk-mr-sub">' + esc(r.date) + " " + esc(r.time) + " · " + won(r.price) + "</span></span>" +
          '<span class="lk-badge" data-s="' + esc(r.status) + '">' + esc(r.status) + "</span>" +
          "</div>"
        ).join("")
      : '<p class="lk-empty">아직 예약이 없습니다. 아래에서 첫 예약을 만들어 보세요.</p>';
  }

  function renderPets() {
    $("lk-pets").innerHTML = PETS.map((p, i) =>
      '<button class="lk-pet' + (selPet === i ? " on" : "") + '" type="button" data-pet="' + i + '">' +
      '<span class="lk-pi" aria-hidden="true">' + I.paw + "</span>" +
      "<b>" + esc(p.name) + "</b>" +
      '<span class="pb">' + esc(p.breed) + "<br>" + esc(p.species) + " · " + p.age + "살</span>" +
      "</button>"
    ).join("");
  }

  function renderSvcs() {
    $("lk-svcs").innerHTML = SERVICES.map((s, i) =>
      '<button class="lk-svc' + (selSvc === i ? " on" : "") + '" type="button" data-svc="' + i + '">' +
      '<span class="sn"><b>' + esc(s.name) + '</b><span class="sd">' + esc(s.description) + " · " + s.duration + "분</span></span>" +
      '<span class="sp">' + won(s.price) + "</span>" +
      "</button>"
    ).join("");
  }

  function renderTimes() {
    $("lk-times").innerHTML = TIMES.map((t) =>
      '<button class="lk-time' + (selTime === t ? " on" : "") + '" type="button" data-time="' + t + '">' + t + "</button>"
    ).join("");
  }

  function syncCta() {
    const ok = selPet !== null && selSvc !== null && selTime !== null;
    const btn = $("lk-book");
    btn.disabled = !ok;
    btn.textContent = ok
      ? PETS[selPet].name + " · " + SERVICES[selSvc].name + " · " + selTime + " 예약하기"
      : "반려동물 · 서비스 · 시간을 선택하세요";
  }

  $("lk-screen-res").addEventListener("click", (e) => {
    const pet = e.target.closest("[data-pet]");
    const svc = e.target.closest("[data-svc]");
    const time = e.target.closest("[data-time]");
    if (pet) { selPet = Number(pet.dataset.pet); renderPets(); syncCta(); }
    else if (svc) { selSvc = Number(svc.dataset.svc); renderSvcs(); syncCta(); }
    else if (time) { selTime = time.dataset.time; renderTimes(); syncCta(); }
  });

  $("lk-book").addEventListener("click", () => {
    if (selPet === null || selSvc === null || selTime === null) return;
    const pet = PETS[selPet];
    const svc = SERVICES[selSvc];
    const r = {
      id: state.nextRes++,
      date: todayStr(),
      time: selTime,
      customer: "하늘",
      pet: pet.name,
      petType: pet.breed,
      service: svc.name,
      price: svc.price,
      status: "대기",
      demo: true,
    };
    state.reservations.push(r);
    save();
    lastResId = r.id;
    renderMyRes();
    renderAdmin();
    toastApp("예약이 접수되었습니다 — 관리자 콘솔에 반영");
    logApi("POST /admin/reservations", 201);
    pingAdmin();
    selTime = null;
    renderTimes();
    syncCta();
  });

  // ───────────── app: shopping ─────────────
  function renderShop() {
    $("lk-prods").innerHTML = PRODUCTS.map((p, i) =>
      '<div class="lk-prod">' +
      '<div class="ph" aria-hidden="true">' + I.img + "</div>" +
      '<div class="pd">' +
      (p.tag ? '<span class="pt">' + esc(p.tag) + "</span>" : "") +
      "<b>" + esc(p.name) + "</b>" +
      '<span class="pc">' + esc(p.category) + " · 재고 " + p.stock + " · 누적 판매 " + p.salesCount + "</span>" +
      '<span class="pp">' + won(p.price) + "</span>" +
      "</div>" +
      '<button class="lk-buy" type="button" data-buy="' + i + '">주문하기</button>' +
      "</div>"
    ).join("");
  }

  $("lk-prods").addEventListener("click", (e) => {
    const buy = e.target.closest("[data-buy]");
    if (!buy) return;
    const p = PRODUCTS[Number(buy.dataset.buy)];
    const o = { id: state.nextOrd++, customer: "하늘", product: p.name, amount: p.price, status: "대기", demo: true };
    state.orders.push(o);
    save();
    lastOrdId = o.id;
    renderAdmin();
    toastApp("주문이 접수되었습니다 — 대기 중 주문 +1");
    logApi("POST /admin/orders", 201);
    pingAdmin();
  });

  // ───────────── admin ─────────────
  function kpis() {
    const demoRes = state.reservations.filter((r) => r.demo);
    const pendingDemo = state.orders.filter((o) => o.demo && o.status === "대기").length;
    const revenue =
      KPI_BASE.revenue +
      state.orders.filter((o) => o.demo).reduce((s, o) => s + o.amount, 0) +
      demoRes.filter((r) => r.status === "완료").reduce((s, r) => s + r.price, 0);
    return [
      { title: "오늘 예약", value: String(KPI_BASE.todayRes + demoRes.length) },
      { title: "대기 중 주문", value: String(KPI_BASE.pendingOrders + pendingDemo) },
      { title: "금일 매출", value: won(revenue) },
      { title: "신규 고객", value: String(KPI_BASE.newCustomers) },
    ];
  }

  function renderKpis() {
    $("lk-kpis").innerHTML = kpis().map((k, i) =>
      '<div class="lk-kpi">' +
      '<span class="t">' + k.title + "</span>" +
      '<span class="v">' + k.value + "</span>" +
      '<span class="c' + (KPI_CHANGE[i].charAt(0) === "-" ? " down" : "") + '">' + KPI_CHANGE[i] + " 전일 대비</span>" +
      "</div>"
    ).join("");
  }

  const badgeBtn = (kind, id, status) =>
    '<button class="lk-badge" type="button" data-cycle="' + kind + ":" + id + '" data-s="' + esc(status) + '" title="눌러서 상태 전환">' + esc(status) + "</button>";

  function renderDash() {
    $("lk-recent-res").innerHTML = state.reservations.slice(-4).reverse().map((r) =>
      "<tr" + (r.id === lastResId ? ' class="lk-flash"' : "") + ">" +
      "<td>" + esc(r.customer) + "</td><td>" + esc(r.pet) + "</td><td>" + esc(r.service) + "</td>" +
      '<td class="mono-cell">' + esc(r.time) + "</td>" +
      '<td><span class="lk-badge" data-s="' + esc(r.status) + '">' + esc(r.status) + "</span></td></tr>"
    ).join("");
    $("lk-recent-ord").innerHTML = state.orders.slice(-4).reverse().map((o) =>
      "<tr" + (o.id === lastOrdId ? ' class="lk-flash"' : "") + ">" +
      '<td class="mono-cell">#' + o.id + "</td><td>" + esc(o.customer) + "</td><td>" + esc(o.product) + "</td>" +
      '<td class="mono-cell">' + won(o.amount) + "</td>" +
      "<td>" + badgeBtn("ord", o.id, o.status) + "</td></tr>"
    ).join("");
  }

  function renderResTable() {
    $("lk-res-count").textContent = "총 " + state.reservations.length + "건 · GET /admin/reservations";
    $("lk-res-table").innerHTML = state.reservations.slice().reverse().map((r) =>
      "<tr" + (r.id === lastResId ? ' class="lk-flash"' : "") + ">" +
      '<td class="mono-cell">' + esc(r.date) + "<br>" + esc(r.time) + "</td>" +
      "<td>" + esc(r.customer) + (r.demo ? ' <span class="lk-new">앱</span>' : "") + "</td>" +
      "<td>" + esc(r.pet) + " (" + esc(r.petType) + ")</td>" +
      "<td>" + esc(r.service) + "</td>" +
      '<td class="mono-cell">' + won(r.price) + "</td>" +
      "<td>" + badgeBtn("res", r.id, r.status) + "</td>" +
      '<td><button class="lk-del" type="button" data-del="' + r.id + '" aria-label="예약 삭제">×</button></td></tr>'
    ).join("");
  }

  function renderAdmin() {
    renderKpis();
    renderDash();
    renderResTable();
    lastResId = 0;
    lastOrdId = 0;
  }

  document.querySelector(".lk-admin-body").addEventListener("click", (e) => {
    const cyc = e.target.closest("[data-cycle]");
    const del = e.target.closest("[data-del]");
    if (cyc) {
      const parts = cyc.dataset.cycle.split(":");
      const id = Number(parts[1]);
      if (parts[0] === "res") {
        const r = state.reservations.find((x) => x.id === id);
        if (!r) return;
        r.status = RES_FLOW[(RES_FLOW.indexOf(r.status) + 1) % RES_FLOW.length];
        save();
        renderAdmin();
        renderMyRes();
        logApi("PATCH /admin/reservations/" + id, 200);
        if (r.demo) toastApp("내 예약 상태가 '" + r.status + "'(으)로 바뀌었습니다");
      } else {
        const o = state.orders.find((x) => x.id === id);
        if (!o) return;
        o.status = ORD_FLOW[(ORD_FLOW.indexOf(o.status) + 1) % ORD_FLOW.length];
        save();
        renderAdmin();
        logApi("PATCH /admin/orders/" + id, 200);
      }
    } else if (del) {
      const id = Number(del.dataset.del);
      state.reservations = state.reservations.filter((r) => r.id !== id);
      save();
      renderAdmin();
      renderMyRes();
      logApi("DELETE /admin/reservations/" + id, 200);
      toastAdmin("예약이 삭제되었습니다");
    }
  });

  $("lk-adm-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-aview]");
    if (!btn) return;
    document.querySelectorAll("#lk-adm-nav button").forEach((b) => b.classList.toggle("on", b === btn));
    $("lk-adm-dash").hidden = btn.dataset.aview !== "dash";
    $("lk-adm-res").hidden = btn.dataset.aview !== "res";
    logApi(btn.dataset.aview === "dash" ? "GET /admin/dashboard" : "GET /admin/reservations", 200);
  });

  // ───────────── toasts · api log · view switch ─────────────
  let toastTimerA = 0;
  let toastTimerB = 0;
  function toastApp(msg) {
    const el = $("lk-toast-app");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimerA);
    toastTimerA = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function toastAdmin(msg) {
    const el = $("lk-toast-admin");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimerB);
    toastTimerB = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function logApi(call, code) {
    $("lk-apilog").innerHTML = esc(call) + " <b>" + code + "</b>";
  }

  const stage = $("lk-stage");
  const narrow = window.matchMedia("(max-width: 980px)");
  function setView(v) {
    stage.dataset.view = v;
    $("lk-sw-app").classList.toggle("on", v === "app");
    $("lk-sw-admin").classList.toggle("on", v === "admin");
    if (v === "admin") $("lk-ping").classList.remove("on");
  }
  $("lk-sw-app").addEventListener("click", () => setView("app"));
  $("lk-sw-admin").addEventListener("click", () => setView("admin"));
  function pingAdmin() {
    if (narrow.matches && stage.dataset.view !== "admin") $("lk-ping").classList.add("on");
  }

  // ───────────── reset · boot ─────────────
  $("lk-reset").addEventListener("click", () => {
    try { localStorage.removeItem(KEY); } catch (_) {}
    state = fresh();
    currentCat = "all";
    selPet = null;
    selSvc = null;
    selTime = null;
    document.querySelectorAll("#lk-chips .lk-chip").forEach((c) => c.classList.toggle("on", c.dataset.cat === "all"));
    $("lk-ping").classList.remove("on");
    renderAll();
    toastAdmin("시드 데이터로 초기화했습니다");
    logApi("GET /admin/dashboard", 200);
  });

  function renderAll() {
    renderFeed();
    renderMyRes();
    renderPets();
    renderSvcs();
    renderTimes();
    syncCta();
    renderShop();
    renderAdmin();
  }
  renderAll();
})();
