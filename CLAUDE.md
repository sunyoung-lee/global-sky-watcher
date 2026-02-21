# Global Sky Watcher — Project Rules

## Design Direction: Sunny Style

- **Minimal**: 불필요한 장식 요소를 배제하고, 콘텐츠와 데이터가 주인공이 되는 UI
- **Editorial**: 타이포그래피와 여백을 활용한 세련된 레이아웃, 잡지형 정보 구성
- 밤하늘 테마 — 어두운 배경(#0a0a0f ~ #111118) 위에 노란색·청록색 액센트
- 인터랙션은 즉각적이고 부드러운 트랜지션 위주, 과도한 애니메이션 금지
- 정보 카드는 글래스모피즘 또는 반투명 다크 패널 스타일
- 강조 색상: 사이안 네온(#00e5ff) + 노란색(#ffbe0b)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Three.js, globe.gl (vanilla) |
| Backend | Node.js, Express, WebSocket |
| Data Source | OpenSky Network API |
| Build | Vite 7 |
| Deploy | Vercel (CDN + Edge Runtime) |

## Code Conventions

- 컴포넌트: PascalCase (예: `FlightCard.jsx`)
- 유틸/훅: camelCase (예: `useFlightData.js`)
- 스타일: Plain CSS (컴포넌트별 `.css` 파일)
- 상태 관리: React hooks (useState, useMemo, useRef)
- 커밋 메시지: 한글 또는 영문, 변경 의도를 명확히 기술

## CORS 체크리스트

외부 API 호출 시 반드시 확인:
1. Authorization 헤더 추가 시 → CORS preflight(OPTIONS) 발생. 대상 API가 OPTIONS를 지원하는가?
2. 클라우드 프록시 경유 시 → 대상 API가 클라우드 IP를 차단하는가?
3. 직접 호출(1차) + 프록시 폴백(2차) 이중화 구성 권장

## Browser Support

- Chrome 90+, Safari 15+, Firefox 90+, Edge 90+
- 네이버 웨일: WebGL 하드웨어 가속 필요 (설정 확인)
- WebGL 미지원 시 정적 이미지 폴백

## Key Principles

1. 실시간성 — 데이터는 항상 최신 상태를 유지한다
2. 직관성 — 설명 없이도 조작 가능한 UI
3. 성능 — 3D 렌더링 최적화, 불필요한 리렌더 방지
4. 점진적 개선 — v1 뼈대 → v2 보완 → v3 감성 순서로 진행

## Change Log

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-15 | 초기 작성: Design Direction, Tech Stack, Code Conventions, Key Principles |
| 2026-02-21 | Tech Stack 업데이트: react-globe.gl→globe.gl, Vercel Edge Runtime 추가 |
| 2026-02-21 | Code Conventions: CSS Modules→Plain CSS, 상태관리→React hooks |
| 2026-02-21 | CORS 체크리스트, Browser Support, 사이안 네온 강조색 추가 |
