# 활자 실험실 — Type Playground

가변 폰트(Recursive)의 다섯 축을 실시간으로 조작하는 타이포그래피 도구.
순수 바닐라 JavaScript, 의존성 없음.

**Live:** https://lamgul.github.io/projects/type-playground/

## 무엇을 다루나

- `font-variation-settings`로 `wght · slnt · CASL · MONO · CRSV` 다섯 축 제어
- 무게 × 기울기를 한 번에 잡는 2D 드래그 패드 (포인터 + 키보드 지원)
- 프리셋 간 560ms 트윈 애니메이션 (ease-out cubic)
- 결과를 복사 가능한 CSS로 출력

## 파일

```
index.html   페이지 + 회고 글
play.js      상태 · 패드 · 트윈 · 렌더 (라이브러리 없음)
play.css     데모 UI
recursive-var.woff2   Recursive 가변 폰트 (OFL)
```

## 배운 점

`font-variation-settings`는 명시하지 않은 축을 기본값으로 되돌린다. 그래서 매 렌더마다
다섯 축을 전부 직렬화한다. 자세한 내용은
[회고 글](https://lamgul.github.io/writing/variable-fonts-in-ui.html).

폰트: [Recursive](https://github.com/arrowtype/recursive) by Arrow Type, OFL 1.1.
