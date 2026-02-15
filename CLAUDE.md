# Global Sky Watcher — Project Rules

## Design Direction: Sunny Style

- **Minimal**: 불필요한 장식 요소를 배제하고, 콘텐츠와 데이터가 주인공이 되는 UI
- **Editorial**: 타이포그래피와 여백을 활용한 세련된 레이아웃, 잡지형 정보 구성
- 밤하늘 테마 — 어두운 배경(#0a0a0f ~ #111118) 위에 노란색·청록색 액센트
- 인터랙션은 즉각적이고 부드러운 트랜지션 위주, 과도한 애니메이션 금지
- 정보 카드는 글래스모피즘 또는 반투명 다크 패널 스타일

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Three.js, react-globe.gl |
| Backend | Node.js, Express, WebSocket |
| Data Source | OpenSky Network API |
| Build | Vite |

## Code Conventions

- 컴포넌트: PascalCase (예: `FlightCard.jsx`)
- 유틸/훅: camelCase (예: `useFlightData.js`)
- 스타일: CSS Modules 또는 styled-components
- 상태 관리: React Context (필요 시 zustand)
- 커밋 메시지: 한글 또는 영문, 변경 의도를 명확히 기술

## Key Principles

1. 실시간성 — 데이터는 항상 최신 상태를 유지한다
2. 직관성 — 설명 없이도 조작 가능한 UI
3. 성능 — 3D 렌더링 최적화, 불필요한 리렌더 방지
4. 점진적 개선 — v1 뼈대 → v2 보완 → v3 감성 순서로 진행
