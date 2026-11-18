# 진행 상황 (2026-11-18, STEP 11 최종 점검)

## 실행 방법

```
npm install      # 처음 한 번
npm run dev      # 개발 서버 → http://localhost:5173
npm test         # 자동 테스트 (현재 93개 통과)
npm run build    # 배포용 빌드 → dist/
npm run preview  # 빌드 결과 확인 → http://localhost:4173
```

## 온라인 배포 (GitHub Pages)

- 게임 주소: https://design-gaori.github.io/WarningNoLand/
- 저장소: https://github.com/design-gaori/WarningNoLand
- `main`에 push하면 `.github/workflows/deploy.yml`이 자동으로 실행됩니다. 순서는 테스트 → 빌드 → Pages 배포입니다.
- 처음 한 번은 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 합니다.
- 빌드는 상대 경로(`vite.config.ts`의 `base: './'`)라서 하위 폴더 주소에서도, 전시 PC의 `dist/`에서도 그대로 동작합니다.

개발 모드 전용 주소:
- `?screen=select` / `?screen=cone` / `?screen=stage&stage=stage-1`: 해당 화면에서 바로 시작
- `?demo=1`: 게임 화면에 예시 해답 콘을 미리 배치
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
| STEP 9 | 메인·스테이지 선택·도감·성공(Game Clear → 메인)·오류 처리, BACK 버튼 | `FLOW_NOTES.md` |
| STEP 10 | 모션(UI checklist C1~C6, 2-9)·배경음·효과음, Game Start 그림자 | `MOTION_NOTES.md` |
| STEP 11 | 15·16번 점검, 창 크기별 확인, 스테이지 추가 대비 | `FINAL_CHECK.md`, `STAGE_GUIDE_스테이지추가md.md` |

## 남은 일

`FINAL_CHECK.md` 5장을 보세요. 핵심은 다음 두 가지입니다.

- 실제 기기 확인
- Stage 2 데이터

메인 Game Start가 넓은 창에서 잘리던 문제는 고쳤습니다(`FINAL_CHECK.md` 7장).

## 저장 상태

- Git 저장소: `code/` (브랜치 main). 첫 커밋은 STEP 9까지입니다. STEP 10·11은 아직 커밋하지 않았습니다.
- 원본 에셋 폴더(`땅없음 주의구역/`)는 읽기만 했습니다.
