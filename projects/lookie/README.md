# 루키 — Lookie

반려동물 슈퍼앱 프로토타입(앱 · 관리자 콘솔 · NestJS 백엔드 2종)을
한 화면의 정적 데모로 재현했다. 앱에서 예약을 만들면 관리자 대시보드가 같이 움직인다.

**Live:** https://lamgul.github.io/projects/lookie/

## 재미있었던 지점

- **시드 이식.** lookie-app-backend의 `content.mock.ts`(유저 8명·게시글 24건·예약 펫 12마리)와
  lookie-admin-backend의 `admin.mock.ts`(KPI·예약·주문·서비스·상품)를 그대로 옮겼다.
  피드의 좋아요 수는 원본의 결정적 공식
  `base = 36 + index*5 + weight*18 + boost*20` 으로 계산된다.
- **양방향 동기화.** 인메모리 스토어 하나를 앱 프레임과 관리자 콘솔이 같이 구독한다.
  예약 생성 → 테이블·KPI 갱신, 상태 뱃지 클릭 → 앱 예약 카드 갱신.
- **localStorage가 SQLite 대신.** 새로고침해도 데모 데이터가 남는다. '초기화'로 시드로 되돌린다.
- **네트워크 요청 0.** 원본 시드의 Unsplash 이미지는 자리표시 타일로 바꿨다.

`lookie.js` 한 파일이 앱·관리자·스토어 전부다.
