/* safein.js — 세이프인 데모.
   관제 콘솔과 375px 근로자 앱이 인메모리 스토어 하나를 공유한다.
   구조 참고(형태만): Code-Edge99/safein-prisma schema.prisma,
   safein-app-backend 컨트롤러(POST /tbms/:id/confirm 등), safein-admin-frontend 페이지 목록.
   화면의 현장·인명·수치·문안은 전부 이 데모를 위해 새로 지어낸 가공 데이터다.
   번역문은 사전 준비된 목데이터 — 실제 제품은 온프레미스 vLLM이 15개 언어를 생성한다.
   네트워크 요청 없음. 상태는 localStorage("safein:demo:v1")에 저장된다. */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ───────────── languages (실제 제품은 15개 — 데모는 6개 사전 번역) ─────────────
  const LANGS = [
    { k: "ko", label: "한국어" },
    { k: "en", label: "English" },
    { k: "zh", label: "中文" },
    { k: "vi", label: "Tiếng Việt" },
    { k: "km", label: "ភាសាខ្មែរ" },
    { k: "ru", label: "Русский" },
  ];

  // ───────────── app UI 문자열 (언어 전환 시 크롬까지 바뀐다) ─────────────
  const UI = {
    todayTbm: { ko: "오늘의 TBM", en: "TODAY'S TBM", zh: "今日 TBM", vi: "TBM HÔM NAY", km: "TBM ថ្ងៃនេះ", ru: "TBM СЕГОДНЯ" },
    notices: { ko: "안전공지", en: "SAFETY NOTICES", zh: "安全公告", vi: "THÔNG BÁO AN TOÀN", km: "សេចក្តីជូនដំណឹងសុវត្ថិភាព", ru: "ОБЪЯВЛЕНИЯ" },
    hazards: { ko: "위험요인", en: "HAZARDS", zh: "危险因素", vi: "YẾU TỐ NGUY HIỂM", km: "គ្រោះថ្នាក់", ru: "ОПАСНОСТИ" },
    rules: { ko: "안전수칙", en: "SAFETY RULES", zh: "安全守则", vi: "QUY TẮC AN TOÀN", km: "វិធានសុវត្ថិភាព", ru: "ПРАВИЛА" },
    confirm: { ko: "확인했습니다", en: "I have read this", zh: "我已确认", vi: "Tôi đã xác nhận", km: "ខ្ញុំបានបញ្ជាក់", ru: "Подтверждаю" },
    confirmed: { ko: "확인 완료 ✓", en: "Confirmed ✓", zh: "已确认 ✓", vi: "Đã xác nhận ✓", km: "បានបញ្ជាក់ ✓", ru: "Подтверждено ✓" },
    yesterday: { ko: "어제", en: "yesterday", zh: "昨天", vi: "hôm qua", km: "ម្សិលមិញ", ru: "вчера" },
    daysAgo2: { ko: "2일 전", en: "2 days ago", zh: "2天前", vi: "2 ngày trước", km: "2 ថ្ងៃមុន", ru: "2 дня назад" },
    tabHome: { ko: "홈", en: "Home", zh: "首页", vi: "Trang chủ", km: "ដើម", ru: "Главная" },
    tabInspect: { ko: "점검", en: "Inspect", zh: "检查", vi: "Kiểm tra", km: "ពិនិត្យ", ru: "Проверки" },
    tabProfile: { ko: "내정보", en: "Profile", zh: "我的", vi: "Hồ sơ", km: "ប្រវត្តិរូប", ru: "Профиль" },
    homeOnly: {
      ko: "데모는 홈 화면만 재현합니다",
      en: "This demo reproduces the home screen only",
      zh: "本演示仅还原主页",
      vi: "Bản demo chỉ tái hiện màn hình chính",
      km: "ការបង្ហាញនេះមានតែទំព័រដើមប៉ុណ្ណោះ",
      ru: "Демо воспроизводит только главный экран",
    },
    confirmedToast: {
      ko: "확인이 기록되었습니다",
      en: "Your confirmation was recorded",
      zh: "已记录您的确认",
      vi: "Đã ghi nhận xác nhận của bạn",
      km: "ការបញ្ជាក់ត្រូវបានកត់ត្រា",
      ru: "Подтверждение записано",
    },
    aiTag: { ko: "AI 번역 · 15개 언어", en: "AI · 15 languages", zh: "AI · 15种语言", vi: "AI · 15 ngôn ngữ", km: "AI · 15 ភាសា", ru: "AI · 15 языков" },
  };

  // ───────────── 작업·위험요인 라이브러리 (관제 TBM 작성용, 전부 가공) ─────────────
  const WORKS = [
    {
      id: "w1", zone: "A동 3층",
      title: { ko: "3층 슬라브 철근 배근", en: "Rebar placement — 3F slab", zh: "3层楼板钢筋绑扎", vi: "Buộc cốt thép sàn tầng 3", km: "ចងដែកសន្លាក់ជាន់ទី 3", ru: "Вязка арматуры — плита 3 этажа" },
      hazards: [
        {
          name: { ko: "개구부 추락", en: "Fall through floor opening", zh: "洞口坠落", vi: "Ngã qua lỗ sàn", km: "ធ្លាក់ចូលរន្ធជាន់", ru: "Падение в проём" },
          rule: { ko: "작업 전 개구부 덮개·안전난간 고정 상태 확인", en: "Check opening covers and guardrails before starting", zh: "作业前确认洞口盖板与护栏已固定", vi: "Kiểm tra nắp lỗ sàn và lan can trước khi làm việc", km: "ពិនិត្យគម្របរន្ធ និងរបារការពារ មុនចាប់ផ្តើម", ru: "Перед работой проверить крышки проёмов и ограждения" },
        },
        {
          name: { ko: "철근 인양 중 낙하", en: "Falling rebar during lifting", zh: "钢筋吊装坠落", vi: "Thép rơi khi cẩu", km: "ដែកធ្លាក់ពេលលើក", ru: "Падение арматуры при подъёме" },
          rule: { ko: "2점 결속·하부 통제·신호수 배치 후 인양", en: "Two-point rigging, barricade below, assign a signaler", zh: "两点绑扎，管制下方并安排信号工", vi: "Buộc 2 điểm, chặn phía dưới, bố trí người ra hiệu", km: "ចងពីរចំណុច ហាមខាងក្រោម ចាត់អ្នកសញ្ញា", ru: "Строповка в двух точках, зона внизу закрыта, сигнальщик" },
        },
        {
          name: { ko: "돌출 철근 찔림", en: "Impalement on exposed rebar", zh: "外露钢筋刺伤", vi: "Bị thép nhô đâm", km: "មុតដោយដែកលយ", ru: "Травма от выступающей арматуры" },
          rule: { ko: "돌출 철근 단부 전체에 보호캡 설치", en: "Cap every exposed rebar end", zh: "外露钢筋端部全部加装保护帽", vi: "Lắp nắp bảo vệ mọi đầu thép nhô", km: "ដាក់គម្របការពារគ្រប់ចុងដែកលយ", ru: "Защитные колпачки на все концы арматуры" },
        },
      ],
    },
    {
      id: "w2", zone: "지하 1층",
      title: { ko: "지하 1층 전기 배관 인입", en: "Electrical conduit run — B1", zh: "地下1层电气配管敷设", vi: "Kéo ống điện tầng hầm B1", km: "តម្លើងបំពង់ភ្លើងជាន់ B1", ru: "Прокладка электротрубы — этаж B1" },
      hazards: [
        {
          name: { ko: "충전부 감전", en: "Electric shock", zh: "触电", vi: "Điện giật", km: "ឆក់ភ្លើង", ru: "Поражение током" },
          rule: { ko: "정전 확인·검전기 사용·잠금 표지(LOTO) 부착", en: "Verify de-energized, test with a detector, lock out and tag", zh: "确认停电，使用验电器，上锁挂牌", vi: "Xác nhận cắt điện, dùng bút thử điện, khóa và treo biển", km: "ផ្ទៀងផ្ទាត់ផ្តាច់ភ្លើង ប្រើឧបករណ៍ពិនិត្យ ចាក់សោដាក់ស្លាក", ru: "Проверить отключение, индикатор напряжения, блокировка и бирка" },
        },
        {
          name: { ko: "밀폐구간 산소 결핍", en: "Oxygen deficiency in confined space", zh: "密闭空间缺氧", vi: "Thiếu oxy trong không gian kín", km: "ខ្វះអុកស៊ីសែនក្នុងកន្លែងបិទជិត", ru: "Недостаток кислорода в замкнутом пространстве" },
          rule: { ko: "작업 전 산소농도 측정·환기팬 상시 가동", en: "Measure O2 before entry, keep ventilation running", zh: "进入前测氧，持续机械通风", vi: "Đo oxy trước khi vào, chạy quạt thông gió liên tục", km: "វាស់អុកស៊ីសែនមុនចូល បើកកង្ហារជានិច្ច", ru: "Замер кислорода перед входом, постоянная вентиляция" },
        },
        {
          name: { ko: "조도 부족 전도", en: "Poor lighting — trip hazard", zh: "照度不足易绊倒", vi: "Thiếu sáng dễ vấp ngã", km: "ពន្លឺមិនគ្រប់គ្រាន់ ងាយដួល", ru: "Плохое освещение — риск падения" },
          rule: { ko: "이동 동선에 임시 조명 추가 설치", en: "Add temporary lighting along walkways", zh: "通道加设临时照明", vi: "Bổ sung đèn tạm dọc lối đi", km: "បន្ថែមភ្លើងបណ្តោះអាសន្នតាមផ្លូវ", ru: "Дополнительное освещение вдоль проходов" },
        },
      ],
    },
    {
      id: "w3", zone: "외벽 동측",
      title: { ko: "외벽 비계 해체", en: "Scaffold dismantling — east wall", zh: "东侧外墙脚手架拆除", vi: "Tháo dỡ giàn giáo tường đông", km: "រុះរើរន្ទាខាងកើត", ru: "Демонтаж лесов — восточный фасад" },
      hazards: [
        {
          name: { ko: "해체 자재 낙하", en: "Falling materials", zh: "材料坠落", vi: "Vật liệu rơi", km: "សម្ភារៈធ្លាក់", ru: "Падение материалов" },
          rule: { ko: "던지기 금지·달줄 사용·하부 출입 통제", en: "No throwing — lower by rope, barricade below", zh: "禁止抛掷，吊绳下放，管制下方", vi: "Cấm ném, hạ bằng dây, chặn lối dưới", km: "ហាមបោះ បញ្ចុះដោយខ្សែ ហាមចេញចូលក្រោម", ru: "Не сбрасывать — спуск на верёвке, зона внизу закрыта" },
        },
        {
          name: { ko: "고소 작업 추락", en: "Fall from height", zh: "高处坠落", vi: "Ngã từ trên cao", km: "ធ្លាក់ពីទីខ្ពស់", ru: "Падение с высоты" },
          rule: { ko: "안전대 2개 걸이·구명줄 선행 설치", en: "Use a double lanyard, install the lifeline first", zh: "使用双钩安全带，先行设置生命线", vi: "Dùng dây an toàn 2 móc, lắp dây cứu sinh trước", km: "ប្រើខ្សែសុវត្ថិភាពពីរទំពក់ តម្លើងខ្សែសង្គ្រោះមុន", ru: "Двойной строп, страховочный трос заранее" },
        },
        {
          name: { ko: "강풍 시 구조 전도", en: "Collapse in strong wind", zh: "大风时倒塌", vi: "Sập đổ khi gió mạnh", km: "រលំពេលខ្យល់ខ្លាំង", ru: "Обрушение при сильном ветре" },
          rule: { ko: "순간풍속 10m/s 초과 시 작업 중지", en: "Stop work when gusts exceed 10 m/s", zh: "阵风超过10m/s时停止作业", vi: "Dừng việc khi gió giật trên 10 m/s", km: "បញ្ឈប់ការងារពេលខ្យល់លើស 10 m/s", ru: "Остановить работы при порывах свыше 10 м/с" },
        },
      ],
    },
  ];

  // ───────────── 시드: 아침에 이미 발행된 TBM (가공) ─────────────
  const SEED_TBM = {
    id: "tbm-seed", time: "07:30", participants: 26, confirmedBase: 23,
    title: { ko: "아침 안전조회 — 전체 공정", en: "Morning safety briefing — all trades", zh: "晨间安全早会 — 全体工种", vi: "Họp an toàn buổi sáng — toàn công trường", km: "ប្រជុំសុវត្ថិភាពពេលព្រឹក — គ្រប់ផ្នែក", ru: "Утренний инструктаж — все бригады" },
    hazards: [
      { ko: "폭염", en: "Heat wave", zh: "高温酷暑", vi: "Nắng nóng", km: "កម្តៅខ្លាំង", ru: "Жара" },
      { ko: "양중 작업 구간 중첩", en: "Overlapping lifting zones", zh: "吊装区域重叠", vi: "Khu vực cẩu chồng lấn", km: "តំបន់លើកដាក់ត្រួតគ្នា", ru: "Пересечение зон подъёма" },
    ],
    rules: [
      { ko: "10~15분마다 물 섭취, 14시 이후 옥외작업 조정", en: "Drink water every 10–15 min; adjust outdoor work after 2 PM", zh: "每10–15分钟补水，14点后调整户外作业", vi: "Uống nước mỗi 10–15 phút; điều chỉnh việc ngoài trời sau 14h", km: "ផឹកទឹករៀងរាល់ 10–15 នាទី កែសម្រួលការងារក្រៅក្រោយម៉ោង 14", ru: "Пить воду каждые 10–15 мин; после 14:00 скорректировать работы" },
      { ko: "타워크레인 회전 반경 하부 통행 금지", en: "No entry under the tower-crane radius", zh: "塔吊回转半径下方禁止通行", vi: "Cấm đi lại dưới bán kính quay cẩu tháp", km: "ហាមឆ្លងកាត់ក្រោមកាំបង្វិលក្រែន", ru: "Не проходить под радиусом поворота крана" },
    ],
  };

  // ───────────── 공지 프리셋·시드 (가공) ─────────────
  const NOTICE_PRESETS = [
    {
      id: "n1", tag: "폭염 경보",
      title: { ko: "폭염 경보 — 옥외작업 조정", en: "Heat wave alert — outdoor work adjusted", zh: "高温预警 — 调整户外作业", vi: "Cảnh báo nắng nóng — điều chỉnh việc ngoài trời", km: "ព្រមានកម្តៅខ្លាំង — កែសម្រួលការងារក្រៅ", ru: "Жара — изменение графика наружных работ" },
      body: {
        ko: "오늘 14:00~17:00 옥외작업을 중지합니다. 그늘막에서 휴식하고 물을 자주 마시세요.",
        en: "Outdoor work is suspended today from 14:00 to 17:00. Rest in the shade and drink water often.",
        zh: "今日14:00–17:00暂停户外作业。请在遮阳棚休息并多喝水。",
        vi: "Hôm nay tạm dừng làm việc ngoài trời từ 14:00 đến 17:00. Nghỉ dưới mái che và uống nước thường xuyên.",
        km: "ថ្ងៃនេះផ្អាកការងារក្រៅពីម៉ោង 14:00 ដល់ 17:00។ សម្រាកក្រោមម្លប់ ហើយផឹកទឹកញឹកញាប់។",
        ru: "Сегодня с 14:00 до 17:00 наружные работы приостановлены. Отдыхайте в тени и чаще пейте воду.",
      },
    },
    {
      id: "n2", tag: "정전 예고",
      title: { ko: "B동 임시 분전반 점검 — 정전 안내", en: "Power outage — panel inspection, Bldg B", zh: "B栋临时配电箱检修 — 停电通知", vi: "Cắt điện — kiểm tra tủ điện tòa B", km: "ផ្តាច់ភ្លើង — ពិនិត្យទូភ្លើងអគារ B", ru: "Отключение электричества — щит, корпус B" },
      body: {
        ko: "내일 10:00부터 약 1시간 동안 B동 전원이 차단됩니다. 전동공구 충전과 작업 일정을 미리 조정하세요.",
        en: "Power in Building B will be cut for about an hour from 10:00 tomorrow. Charge tools and adjust schedules in advance.",
        zh: "明天10:00起B栋停电约1小时。请提前为电动工具充电并调整作业安排。",
        vi: "Từ 10:00 ngày mai, tòa B sẽ mất điện khoảng 1 giờ. Hãy sạc dụng cụ và điều chỉnh lịch làm việc trước.",
        km: "ស្អែកពីម៉ោង 10:00 អគារ B ផ្តាច់ភ្លើងប្រហែល 1 ម៉ោង។ សូមសាកឧបករណ៍ និងកែសម្រួលកាលវិភាគជាមុន។",
        ru: "Завтра с 10:00 корпус B будет обесточен около часа. Заранее зарядите инструмент и скорректируйте план.",
      },
    },
    {
      id: "n3", tag: "개구부 통제",
      title: { ko: "3층 개구부 접근 금지", en: "Keep out — 3F floor opening", zh: "3层洞口禁止靠近", vi: "Cấm lại gần lỗ sàn tầng 3", km: "ហាមចូលជិតរន្ធជាន់ទី 3", ru: "Не приближаться — проём на 3 этаже" },
      body: {
        ko: "3층 엘리베이터 개구부에 안전난간을 설치 중입니다. 완료 공지 전까지 해당 구역 접근을 금지합니다.",
        en: "Guardrails are being installed at the 3F elevator opening. The area is off-limits until completion is announced.",
        zh: "3层电梯洞口正在安装护栏。完工通知前禁止进入该区域。",
        vi: "Đang lắp lan can tại lỗ thang máy tầng 3. Cấm vào khu vực này cho đến khi có thông báo hoàn thành.",
        km: "កំពុងតម្លើងរបារការពារនៅរន្ធជណ្តើរយន្តជាន់ទី 3។ ហាមចូលតំបន់នេះរហូតដល់ប្រកាសបញ្ចប់។",
        ru: "У проёма лифта на 3 этаже устанавливают ограждения. Вход в зону запрещён до объявления о завершении.",
      },
    },
  ];

  const SEED_NOTICES = [
    {
      id: "s1", timeKey: "yesterday",
      title: { ko: "타워크레인 회전 반경 — 신규 위험구역 지정", en: "New restricted zone — tower-crane radius", zh: "新增危险区域 — 塔吊回转半径", vi: "Khu vực nguy hiểm mới — bán kính quay cẩu", km: "តំបន់គ្រោះថ្នាក់ថ្មី — កាំបង្វិលក្រែន", ru: "Новая опасная зона — радиус поворота крана" },
      body: {
        ko: "A동 타워크레인 회전 반경이 위험구역으로 지정되었습니다. 앱 지도에서 구역을 확인하세요.",
        en: "The tower-crane radius at Building A is now a restricted zone. Check the zone on the app map.",
        zh: "A栋塔吊回转半径已划为危险区域。请在App地图中确认。",
        vi: "Bán kính quay cẩu tháp tòa A đã là khu vực nguy hiểm. Xem khu vực trên bản đồ trong ứng dụng.",
        km: "កាំបង្វិលក្រែនអគារ A ជាតំបន់គ្រោះថ្នាក់ហើយ។ សូមមើលលើផែនទីក្នុងកម្មវិធី។",
        ru: "Радиус поворота крана у корпуса A объявлен опасной зоной. Проверьте зону на карте в приложении.",
      },
    },
    {
      id: "s2", timeKey: "daysAgo2",
      title: { ko: "7월 정기 안전교육 일정", en: "July safety training schedule", zh: "7月定期安全教育安排", vi: "Lịch huấn luyện an toàn tháng 7", km: "កាលវិភាគបណ្តុះបណ្តាលសុវត្ថិភាពខែកក្កដា", ru: "График инструктажей на июль" },
      body: {
        ko: "이번 주 금요일 07:00 식당동에서 월례 안전교육을 진행합니다. 전 근로자 참석 대상입니다.",
        en: "Monthly safety training this Friday at 07:00 in the cafeteria building. All workers must attend.",
        zh: "本周五07:00在食堂栋进行月度安全教育。全体工人须参加。",
        vi: "Huấn luyện an toàn định kỳ 07:00 thứ Sáu tuần này tại nhà ăn. Tất cả công nhân tham dự.",
        km: "បណ្តុះបណ្តាលសុវត្ថិភាពប្រចាំខែ ថ្ងៃសុក្រនេះ ម៉ោង 07:00 នៅអគារអាហារ។ កម្មករទាំងអស់ត្រូវចូលរួម។",
        ru: "Ежемесячный инструктаж — в эту пятницу в 07:00 в столовой. Явка всех работников обязательна.",
      },
    },
  ];

  // ───────────── 안전점검 체크리스트·지적사항 시드 (관제 전용, 가공) ─────────────
  const CHECK_ITEMS = [
    { id: "c1", zone: "A동 3층", q: "개구부 덮개·경고표지 고정 상태", bad: "A동 3층 개구부 덮개 1개소 고정 불량" },
    { id: "c2", zone: "외벽 동측", q: "비계 작업발판·안전난간 결속", bad: "비계 5단 안전난간 클램프 풀림" },
    { id: "c3", zone: "타워크레인", q: "양중 로프·후크 해지장치 상태", bad: "후크 해지장치 스프링 마모" },
    { id: "c4", zone: "현장 공통", q: "안전모·안전대 착용 상태", bad: "안전대 미착용 근로자 2명 적발" },
    { id: "c5", zone: "지하 1층", q: "가설전선 피복·접지 상태", bad: "가설 분전반 접지선 단선" },
  ];

  // 오래된 것부터 — 렌더 시 reverse()로 최신이 위에 온다
  const SEED_FINDINGS = [
    { id: "f3", zone: "지하 1층", text: "임시 조명 파손 — 교체 완료", status: "조치완료", time: "어제" },
    { id: "f1", zone: "B동 2층", text: "자재 인양구 주변 안전난간 미설치", status: "미조치", time: "08:10" },
    { id: "f2", zone: "B동 1층", text: "피난 통로에 자재 적치 — 통로 폭 미달", status: "미조치", time: "08:25" },
  ];

  const NEW_TBM_PARTICIPANTS = 8; // 발행 시 대상 인원(가공)
  const PRODUCT_LANGS = 15; // 실제 제품의 번역 언어 수 — 데모 앱은 6개 사전 번역

  // ───────────── state (localStorage) ─────────────
  const KEY = "safein:demo:v1";
  let state = load();

  function fresh() {
    return {
      v: 1,
      lang: "ko",
      seedTbmConfirmed: false,
      tbms: [], // {id, workId, hz:[idx], time, participants, confirmed}
      notices: [], // {id, presetId, time}
      published: {}, // presetId -> true
      judgments: {}, // itemId -> "good" | "bad"
      findings: SEED_FINDINGS.map((f) => Object.assign({}, f)),
      nextTbm: 1,
      nextNotice: 1,
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1 && Array.isArray(s.tbms) && Array.isArray(s.findings)) return s;
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
  const L = () => state.lang;
  const tr = (obj) => obj[L()] || obj.ko;
  const nowHM = () => {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  const workById = (id) => WORKS.find((w) => w.id === id);
  const presetById = (id) => NOTICE_PRESETS.find((n) => n.id === id);

  let selWork = null;
  let selHz = [];
  let selPreset = 0;
  let flashTbmId = "";
  let flashNoticeId = "";
  let flashFindingId = "";

  // ───────────── KPI 계산 ─────────────
  function tbmCounts() {
    let assigned = SEED_TBM.participants;
    let confirmed = SEED_TBM.confirmedBase + (state.seedTbmConfirmed ? 1 : 0);
    state.tbms.forEach((t) => {
      assigned += t.participants;
      confirmed += t.confirmed ? 1 : 0;
    });
    return { assigned, confirmed, rate: Math.round((confirmed / assigned) * 100) };
  }
  const openFindings = () => state.findings.filter((f) => f.status === "미조치").length;
  function safetyScore(rate, open) {
    const s = Math.min(100, Math.max(0, 86 + rate * 0.1 - open * 2));
    return s.toFixed(1);
  }

  // ───────────── console: dashboard ─────────────
  function renderKpis() {
    const { assigned, confirmed, rate } = tbmCounts();
    const open = openFindings();
    $("si-kpis").innerHTML =
      '<div class="si-kpi ok"><span class="t">현장 안전점수</span><span class="v">' + safetyScore(rate, open) + "<em>점</em></span>" +
      '<span class="c">지적 조치 · TBM 확인 반영</span></div>' +
      '<div class="si-kpi"><span class="t">금일 TBM 실시율</span><span class="v">' + rate + "%</span>" +
      '<span class="c">' + confirmed + "/" + assigned + " 확인</span></div>" +
      '<div class="si-kpi' + (open > 0 ? " warn" : "") + '"><span class="t">미조치 지적사항</span><span class="v">' + open + "<em>건</em></span>" +
      '<span class="c">안전점검 탭에서 조치</span></div>' +
      '<div class="si-kpi"><span class="t">금일 출역</span><span class="v">42<em>명</em></span><span class="c">협력사 6개사</span></div>';
  }

  function renderRecentFindings() {
    $("si-recent-find").innerHTML = state.findings.slice(-4).reverse().map((f) =>
      "<tr" + (f.id === flashFindingId ? ' class="si-flash"' : "") + ">" +
      '<td><span class="si-zone">' + esc(f.zone) + "</span></td>" +
      "<td>" + esc(f.text) + "</td>" +
      '<td class="mono-cell">' + esc(f.time) + "</td>" +
      '<td><span class="si-badge" data-s="' + esc(f.status) + '">' + esc(f.status) + "</span></td></tr>"
    ).join("");
  }

  // ───────────── console: TBM ─────────────
  function renderTbmList() {
    const seedConfirmed = SEED_TBM.confirmedBase + (state.seedTbmConfirmed ? 1 : 0);
    const cards = [];
    state.tbms.slice().reverse().forEach((t) => {
      const w = workById(t.workId);
      cards.push(
        '<div class="si-tbm-card' + (t.id === flashTbmId ? " si-flash" : "") + '">' +
        '<div class="tm"><b>' + esc(w.title.ko) + "</b>" +
        '<span class="ts">' + esc(t.time) + " 발행 · " + esc(w.zone) + " · 대상 " + t.participants + "명</span></div>" +
        '<span class="cnt">확인 ' + (t.confirmed ? 1 : 0) + "/" + t.participants + "</span>" +
        '<span class="si-badge" data-s="진행중">진행중</span></div>'
      );
    });
    cards.push(
      '<div class="si-tbm-card">' +
      '<div class="tm"><b>' + esc(SEED_TBM.title.ko) + "</b>" +
      '<span class="ts">' + SEED_TBM.time + " 발행 · 전 구역 · 대상 " + SEED_TBM.participants + "명</span></div>" +
      '<span class="cnt">확인 ' + seedConfirmed + "/" + SEED_TBM.participants + "</span>" +
      '<span class="si-badge" data-s="진행중">진행중</span></div>'
    );
    $("si-tbm-list").innerHTML = cards.join("");
  }

  function renderWorks() {
    $("si-works").innerHTML = WORKS.map((w, i) =>
      '<button class="si-work' + (selWork === i ? " on" : "") + '" type="button" data-work="' + i + '">' +
      '<span class="wz">' + esc(w.zone) + "</span><b>" + esc(w.title.ko) + "</b></button>"
    ).join("");
  }

  function renderHazards() {
    if (selWork === null) {
      $("si-hzs").innerHTML = '<p class="si-rules-empty">작업을 먼저 선택하세요.</p>';
      return;
    }
    $("si-hzs").innerHTML = WORKS[selWork].hazards.map((h, i) =>
      '<button class="si-hz' + (selHz.includes(i) ? " on" : "") + '" type="button" data-hz="' + i + '" aria-pressed="' + selHz.includes(i) + '">' +
      '<span class="box" aria-hidden="true">✓</span>' + esc(h.name.ko) + "</button>"
    ).join("");
  }

  function renderRules() {
    if (selWork === null || selHz.length === 0) {
      $("si-rules").innerHTML = '<p class="si-rules-empty">위험요인을 체크하면 대책이 자동으로 제안됩니다 — 위험요인 라이브러리 매칭.</p>';
      return;
    }
    $("si-rules").innerHTML = selHz.slice().sort().map((i) =>
      '<div class="si-rule"><span class="arrow">→</span>' + esc(WORKS[selWork].hazards[i].rule.ko) + "</div>"
    ).join("");
  }

  function syncTbmCta() {
    const ok = selWork !== null && selHz.length > 0;
    const btn = $("si-publish-tbm");
    btn.disabled = !ok;
    btn.textContent = ok
      ? "TBM 발행 — 근로자 " + NEW_TBM_PARTICIPANTS + "명에게 " + PRODUCT_LANGS + "개 언어로"
      : "작업과 위험요인을 선택하세요";
  }

  $("si-tbm-form").addEventListener("click", (e) => {
    const work = e.target.closest("[data-work]");
    const hz = e.target.closest("[data-hz]");
    if (work) {
      selWork = Number(work.dataset.work);
      selHz = [];
      renderWorks(); renderHazards(); renderRules(); syncTbmCta();
    } else if (hz) {
      const i = Number(hz.dataset.hz);
      selHz = selHz.includes(i) ? selHz.filter((x) => x !== i) : selHz.concat(i);
      renderHazards(); renderRules(); syncTbmCta();
    }
  });

  $("si-publish-tbm").addEventListener("click", () => {
    if (selWork === null || selHz.length === 0) return;
    const t = {
      id: "tbm-" + state.nextTbm++,
      workId: WORKS[selWork].id,
      hz: selHz.slice().sort(),
      time: nowHM(),
      participants: NEW_TBM_PARTICIPANTS,
      confirmed: false,
    };
    state.tbms.push(t);
    save();
    flashTbmId = t.id;
    selWork = null; selHz = [];
    renderWorks(); renderHazards(); renderRules(); syncTbmCta();
    renderTbmList(); renderKpis();
    renderAppFeed();
    toastConsole("TBM 발행 — 번역 " + PRODUCT_LANGS + "개 언어 · 푸시 " + NEW_TBM_PARTICIPANTS + "건");
    logApi("POST /admin/tbms · TranslationJob(15)", 201);
    pingApp();
  });

  // ───────────── console: 안전점검 ─────────────
  function renderChecklist() {
    $("si-checks").innerHTML = CHECK_ITEMS.map((c) => {
      const j = state.judgments[c.id] || "";
      return (
        '<div class="si-check">' +
        '<div class="cq"><span class="si-zone">' + esc(c.zone) + "</span><span>" + esc(c.q) + "</span></div>" +
        '<span class="si-judge" role="group" aria-label="판정">' +
        '<button class="good' + (j === "good" ? " on" : "") + '" type="button" data-judge="good:' + c.id + '">양호</button>' +
        '<button class="bad' + (j === "bad" ? " on" : "") + '" type="button" data-judge="bad:' + c.id + '">지적</button>' +
        "</span></div>"
      );
    }).join("");
  }

  function renderFindings() {
    $("si-findings").innerHTML = state.findings.slice().reverse().map((f) =>
      '<div class="si-find' + (f.id === flashFindingId ? " si-flash" : "") + '" data-open="' + (f.status === "미조치") + '">' +
      '<div class="fm"><span class="ft">' + esc(f.text) + "</span>" +
      '<span class="fs">' + esc(f.zone) + " · " + esc(f.time) + "</span></div>" +
      (f.status === "미조치"
        ? '<button class="si-resolve" type="button" data-resolve="' + f.id + '">조치완료</button>'
        : '<span class="si-badge" data-s="조치완료">조치완료</span>') +
      "</div>"
    ).join("");
  }

  $("si-view-check").addEventListener("click", (e) => {
    const judge = e.target.closest("[data-judge]");
    const resolve = e.target.closest("[data-resolve]");
    if (judge) {
      const parts = judge.dataset.judge.split(":");
      const verdict = parts[0];
      const item = CHECK_ITEMS.find((c) => c.id === parts[1]);
      const prev = state.judgments[item.id];
      if (prev === verdict) return;
      state.judgments[item.id] = verdict;
      const fid = "cf-" + item.id;
      if (verdict === "bad") {
        if (!state.findings.some((f) => f.id === fid)) {
          state.findings.push({ id: fid, zone: item.zone, text: item.bad, status: "미조치", time: nowHM() });
          flashFindingId = fid;
          toastConsole("지적사항 등록 — 미조치 +1");
        }
        logApi("POST /admin/safety-inspections/answers { answer: false }", 201);
      } else {
        // 지적→양호 되돌림: 아직 미조치인 자동 생성 지적만 걷어낸다 (조치 이력은 남긴다)
        state.findings = state.findings.filter((f) => !(f.id === fid && f.status === "미조치"));
        logApi("POST /admin/safety-inspections/answers { answer: true }", 201);
      }
      save();
      renderChecklist(); renderFindings(); renderRecentFindings(); renderKpis();
      flashFindingId = "";
    } else if (resolve) {
      const f = state.findings.find((x) => x.id === resolve.dataset.resolve);
      if (!f) return;
      f.status = "조치완료";
      save();
      flashFindingId = f.id;
      renderFindings(); renderRecentFindings(); renderKpis();
      flashFindingId = "";
      toastConsole("조치완료 — 미조치 " + openFindings() + "건");
      logApi("PATCH /admin/safety-inspections/findings/" + f.id + "/resolve", 200);
    }
  });

  // ───────────── console: 공지 ─────────────
  function renderPresets() {
    $("si-presets").innerHTML = NOTICE_PRESETS.map((n, i) =>
      '<button class="si-preset' + (selPreset === i ? " on" : "") + '" type="button" data-preset="' + i + '"' +
      (state.published[n.id] ? " disabled" : "") + ">" + esc(n.tag) + "</button>"
    ).join("");
    const n = NOTICE_PRESETS[selPreset];
    const done = !!state.published[n.id];
    $("si-notice-preview").innerHTML =
      '<span class="lab">KO · 원문' + (done ? " · 발행됨" : "") + "</span>" +
      "<b>" + esc(n.title.ko) + "</b><p>" + esc(n.body.ko) + "</p>";
    const btn = $("si-publish-notice");
    btn.disabled = done;
    btn.textContent = done ? "이미 발행된 공지입니다" : "AI 번역 후 발행 — " + PRODUCT_LANGS + "개 언어";
    $("si-tl-status").innerHTML = "";
  }

  $("si-presets").addEventListener("click", (e) => {
    const p = e.target.closest("[data-preset]");
    if (!p || p.disabled) return;
    selPreset = Number(p.dataset.preset);
    renderPresets();
  });

  $("si-publish-notice").addEventListener("click", () => {
    const n = NOTICE_PRESETS[selPreset];
    if (state.published[n.id]) return;
    const btn = $("si-publish-notice");
    btn.disabled = true;
    $("si-tl-status").innerHTML = '<div class="si-shimmer" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<p class="si-tl-note">온프레미스 vLLM 추론 중… TranslationJob PENDING</p>';
    logApi("POST /admin/notices", 201);
    setTimeout(() => {
      const item = { id: "nt-" + state.nextNotice++, presetId: n.id, time: nowHM() };
      state.notices.push(item);
      state.published[n.id] = true;
      save();
      flashNoticeId = item.id;
      renderPresets(); // 프리셋 뱃지 갱신 (si-tl-status를 비운다)
      $("si-tl-status").innerHTML = '<p class="si-tl-note">TranslationJob <b>COMPLETED</b> — 15개 언어 · 근로자 앱 도착</p>';
      renderAppFeed();
      toastConsole("공지 발행 — 근로자 앱에 도착");
      logApi("GET /admin/notices/" + item.id + "/translations · 15/15", 200);
      pingApp();
    }, reduced ? 80 : 900);
  });

  // ───────────── console: nav ─────────────
  const VIEWS = { dash: "si-view-dash", tbm: "si-view-tbm", check: "si-view-check", notice: "si-view-notice" };
  const VIEW_API = {
    dash: "GET /admin/dashboard",
    tbm: "GET /admin/tbms?date=today",
    check: "GET /admin/safety-checklists/deployments/today",
    notice: "GET /admin/notices",
  };
  $("si-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    document.querySelectorAll("#si-nav button").forEach((b) => b.classList.toggle("on", b === btn));
    Object.keys(VIEWS).forEach((k) => { $(VIEWS[k]).hidden = k !== btn.dataset.view; });
    logApi(VIEW_API[btn.dataset.view], 200);
  });

  // ───────────── app: 언어 선택 ─────────────
  function renderLangbar() {
    $("si-langbar").innerHTML = LANGS.map((l) =>
      '<button class="si-lang' + (L() === l.k ? " on" : "") + '" type="button" data-lang="' + l.k + '" aria-pressed="' + (L() === l.k) + '">' + l.label + "</button>"
    ).join("");
  }
  $("si-langbar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn) return;
    state.lang = btn.dataset.lang;
    save();
    renderLangbar(); renderAppFeed(); renderTabbar();
    logApi("GET /app/notices?lang=" + state.lang, 200);
  });

  // ───────────── app: 피드 ─────────────
  function tbmCardHtml(id, title, time, hazardNames, ruleTexts, confirmed, isNew) {
    return (
      '<article class="si-card' + (isNew ? " si-flash" : "") + '">' +
      '<div class="head">' + (isNew ? '<span class="si-new">NEW</span>' : "") +
      "<b>" + esc(title) + '</b><span class="tm">' + esc(time) + "</span></div>" +
      '<span class="si-klab">' + esc(tr(UI.hazards)) + "</span>" +
      '<div class="si-hchips">' + hazardNames.map((h) => '<span class="si-hchip">' + esc(h) + "</span>").join("") + "</div>" +
      '<span class="si-klab">' + esc(tr(UI.rules)) + "</span>" +
      '<ul class="si-rlist">' + ruleTexts.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" +
      (confirmed
        ? '<span class="si-confirm done">' + esc(tr(UI.confirmed)) + "</span>"
        : '<button class="si-confirm" type="button" data-confirm="' + id + '">' + esc(tr(UI.confirm)) + "</button>") +
      "</article>"
    );
  }

  function renderAppFeed() {
    const parts = ['<h3 class="si-sec">' + esc(tr(UI.todayTbm)) + "</h3>"];
    state.tbms.slice().reverse().forEach((t) => {
      const w = workById(t.workId);
      parts.push(tbmCardHtml(
        t.id, tr(w.title), t.time,
        t.hz.map((i) => tr(w.hazards[i].name)),
        t.hz.map((i) => tr(w.hazards[i].rule)),
        t.confirmed, t.id === flashTbmId
      ));
    });
    parts.push(tbmCardHtml(
      SEED_TBM.id, tr(SEED_TBM.title), SEED_TBM.time,
      SEED_TBM.hazards.map(tr), SEED_TBM.rules.map(tr),
      state.seedTbmConfirmed, false
    ));
    parts.push('<h3 class="si-sec">' + esc(tr(UI.notices)) + "</h3>");
    state.notices.slice().reverse().forEach((n) => {
      const p = presetById(n.presetId);
      parts.push(
        '<article class="si-notice' + (n.id === flashNoticeId ? " si-flash" : "") + '">' +
        '<div class="head">' + (n.id === flashNoticeId ? '<span class="si-new">NEW</span>' : "") +
        "<b>" + esc(tr(p.title)) + '</b><span class="tm">' + esc(n.time) + "</span></div>" +
        "<p>" + esc(tr(p.body)) + "</p>" +
        '<span class="ai">' + esc(tr(UI.aiTag)) + "</span></article>"
      );
    });
    SEED_NOTICES.forEach((n) => {
      parts.push(
        '<article class="si-notice">' +
        "<div class=\"head\"><b>" + esc(tr(n.title)) + '</b><span class="tm">' + esc(tr(UI[n.timeKey])) + "</span></div>" +
        "<p>" + esc(tr(n.body)) + "</p>" +
        '<span class="ai">' + esc(tr(UI.aiTag)) + "</span></article>"
      );
    });
    $("si-feed").innerHTML = parts.join("");
    flashTbmId = "";
    flashNoticeId = "";
  }

  $("si-feed").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-confirm]");
    if (!btn) return;
    const id = btn.dataset.confirm;
    if (id === SEED_TBM.id) state.seedTbmConfirmed = true;
    else {
      const t = state.tbms.find((x) => x.id === id);
      if (!t) return;
      t.confirmed = true;
    }
    save();
    renderAppFeed(); renderTbmList(); renderKpis();
    toastApp(tr(UI.confirmedToast));
    toastConsole("근로자 확인 — TBM 실시율 " + tbmCounts().rate + "%");
    logApi("POST /app/tbms/" + id + "/confirm", 200);
    pingConsole();
  });

  // ───────────── app: tabbar (홈만 재현) ─────────────
  function renderTabbar() {
    const icons = {
      home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
      inspect: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
      profile: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
    };
    $("si-tabbar").innerHTML =
      '<button class="si-tab on" type="button" data-tab="home">' + icons.home + esc(tr(UI.tabHome)) + "</button>" +
      '<button class="si-tab" type="button" data-tab="inspect">' + icons.inspect + esc(tr(UI.tabInspect)) + "</button>" +
      '<button class="si-tab" type="button" data-tab="profile">' + icons.profile + esc(tr(UI.tabProfile)) + "</button>";
  }
  $("si-tabbar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn || btn.dataset.tab === "home") return;
    toastApp(tr(UI.homeOnly));
  });

  // ───────────── toasts · api log · view switch ─────────────
  let toastTimerA = 0;
  let toastTimerB = 0;
  function toastApp(msg) {
    const el = $("si-toast-app");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimerA);
    toastTimerA = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function toastConsole(msg) {
    const el = $("si-toast-console");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimerB);
    toastTimerB = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function logApi(call, code) {
    $("si-apilog").innerHTML = esc(call) + " <b>" + code + "</b>";
  }

  const stage = $("si-stage");
  const narrow = window.matchMedia("(max-width: 980px)");
  function setView(v) {
    stage.dataset.view = v;
    $("si-sw-console").classList.toggle("on", v === "console");
    $("si-sw-app").classList.toggle("on", v === "app");
    if (v === "app") $("si-ping-app").classList.remove("on");
    if (v === "console") $("si-ping-console").classList.remove("on");
  }
  $("si-sw-console").addEventListener("click", () => setView("console"));
  $("si-sw-app").addEventListener("click", () => setView("app"));
  function pingApp() {
    if (narrow.matches && stage.dataset.view !== "app") $("si-ping-app").classList.add("on");
  }
  function pingConsole() {
    if (narrow.matches && stage.dataset.view !== "console") $("si-ping-console").classList.add("on");
  }

  // ───────────── reset · boot ─────────────
  $("si-reset").addEventListener("click", () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.indexOf("safein:") === 0)
        .forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
    state = fresh();
    selWork = null; selHz = []; selPreset = 0;
    $("si-ping-app").classList.remove("on");
    $("si-ping-console").classList.remove("on");
    renderAll();
    toastConsole("시드 데이터로 초기화했습니다");
    logApi("GET /admin/dashboard", 200);
  });

  function renderAll() {
    renderKpis();
    renderRecentFindings();
    renderTbmList();
    renderWorks();
    renderHazards();
    renderRules();
    syncTbmCta();
    renderChecklist();
    renderFindings();
    renderPresets();
    renderLangbar();
    renderAppFeed();
    renderTabbar();
  }
  renderAll();
})();
