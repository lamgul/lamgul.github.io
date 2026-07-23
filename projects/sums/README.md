# 통제 콘솔 — SUMS Console

산업현장·차량물류 근로자의 스마트폰을 **구역·시간·행동조건·유해앱**의 조합으로
통제하는 관제 시스템의 관리자 콘솔을, 순수 HTML/CSS/JS로 재현한 데모.

**Live:** https://lamgul.github.io/projects/sums/

## 진짜와 데모

실구현은 비공개 레포 세 개다 — React 콘솔(`sums-admin-frontend`),
NestJS·Prisma·PostgreSQL API(`sums-admin-backend`), 목업 3차(`Smombie-MockupV3`).
공개된 것은 [초기 프로토타입](https://github.com/lamgul/Erpsystemdevelopment)뿐이라,
이 데모는 실레포의 도메인 데이터를 그대로 이식해 핵심 4화면을 축소 재현한다.

- 조직·직원·구역·정책·프리셋·위반 사유 → `sums-admin-frontend/src/data/mockData.ts`
- 로그 시드 로직, 정책-조건 M:N 구조 → `sums-admin-backend/prisma/seed-simple.ts`

## 데모 구성

- **대시보드** — KPI 카드 4개 + 시간대별 위반 스택 막대차트(인라인 SVG 직접 렌더)
- **구역** — Leaflet 대신 인라인 SVG 공장 약도. 구역 클릭 시 상세,
  추가 모드에서 클릭한 자리에 원형 구역 생성
- **정책** — 구역×시간×행동조건×유해앱 프리셋을 칩으로 조합해 정책 카드 생성
- **로그** — 재생을 누르면 1초 간격으로 위반이 흘러드는 스트림 + 유형·구역 필터

도메인 규칙 하나를 살렸다: **정책에 연결되지 않은 구역에서는 위반이 나지 않는다.**
새 구역을 그렸다면 정책 탭에서 연결해야 로그가 흐른다.

네트워크 요청 0, 외부 라이브러리 0. `sums.js` 한 파일이 전부다.
