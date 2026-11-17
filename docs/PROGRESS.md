# 진행 상황 (임시 저장: 2026-11-17)

## 실행 방법

```
npm install      # 처음 한 번
npm run dev      # 개발 서버 → http://localhost:5173
npm test         # 자동 테스트 (현재 82개 통과)
npm run build    # 배포용 빌드 → dist/
```

개발 모드 전용 주소:
- `?screen=select` / `?screen=cone` / `?screen=stage`: 해당 화면에서 바로 시작
- `?demo=1`: 게임 화면에 예시 해답 콘 미리 배치
- `?grid=0`: 격자선 끄기

## 끝난 단계

| 단계 | 내용 | 기록 |
|---|---|---|
| 준비 | 기획 점검·질문, 가로형 UI 점검 | `prepquestions.md`, `ui-review-landscape.md` |
| STEP 3 | SVG 정리·검수·최적화, Figma 에셋 내려받기 | `ASSET_REPORT.md`, `assets/manifest.json` |
| STEP 5 | 게임 로직·데이터(좌표·배치·연결 판정)·테스트 | `LOGIC_NOTES.md` |
| STEP 6 | 가로형 셸(배율·모바일 회전·폰트·토큰) | `SHELL_NOTES.md` |
| STEP 7 | 보드 SVG 렌더링·깊이 정렬·격자선 설정 | `BOARD_NOTES.md` |
| STEP 8 | 보관함·드래그·탭 회수·리셋·자동 스크롤 | `INTERACTION_NOTES.md` |
| STEP 9 | 메인·스테이지 선택·도감·성공(Game Clear → 메인)·오류 처리, BACK 버튼, 스테이지 선택 새 디자인 | `FLOW_NOTES.md` |

## 아직 안 한 것 · 다음 후보

- **모션 전부(UI checklist):** 메인 콘 모양 바뀜·Game Start 둥둥, 표지판 솟아오름, 보관 카드 펼침(−200 → 8), 도감 hover/터치 튀어오름, 안내 띠 왼쪽으로 흐름
- 메인 그림이 한 장 SVG라서, 모션을 넣거나 타이틀 글자(제작 중)를 바꿀 때는 나눠야 함
- 효과음·놓을 때 이펙트(C4: 나중에)
- Stage 2 데이터(사용자가 추가 예정), 3번째 스테이지부터는 선택 화면 새 디자인
- 섬 그래픽·섬 스테이지 경로 규칙(필요할 때)
- 확인 못 한 것: 실제 터치 기기, Safari, 드래그 중 자동 스크롤(미리보기 브라우저에서 애니메이션이 돌지 않음) → `INTERACTION_NOTES.md` 4장 체크리스트

## 저장 상태

- 모든 파일은 이 폴더(`code/`)에 저장되어 있습니다. **Git 저장소는 아직 없습니다.**
- 원본 에셋 폴더(`땅없음 주의구역/`)는 읽기만 했습니다(STEP 3의 SVG 수정본 3개는 사용자가 직접 교체).
