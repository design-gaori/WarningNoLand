/**
 * Figma stage1(1:252) 배치 값 — 디자인 px (1920 기준).
 * 렌더링 전용 상수. 게임 규칙·상태와 무관하다.
 */
export const STAGE1_LAYOUT = {
  /** Figma 수정(7:194, 1:648): BACK이 왼쪽 위, RESTART는 그 아래 */
  back: { x: 70, y: 47 },
  restart: { x: 70, y: 225.019, w: 236.121, h: 147.019 },
  /** 보관 영역: 오른쪽 끝 x = 1850 고정. 카드 원래 크기 263×320, 간격 8(Q36) */
  storage: { x: 1587, y: 48, w: 263, right: 1850, cardW: 263, cardH: 320, gap: 8 },
  /** 안내 띠: 높이 48, 글자 20 (위아래 여백 14씩). minFontPx = 화면에서의 최소 글자 크기(가정 G1) */
  ticker: { h: 48, fontSize: 20, minFontPx: 12, texts: [
    // Figma 수정본(2026-11-26, 1:645): 한글 18px(YES Gothic ExtraBold) / 영문 20px(Outfit Bold)
    { text: '안전콘과 안전콘을 연결하자!', lang: 'ko' },
    { text: 'Let’s connect the safety cones!', lang: 'en' },
    { text: '여러 콘들을 옮겨보세요 :)', lang: 'ko' },
    { text: 'Try moving the cones :)', lang: 'en' },
  ] },
  /**
   * 보드: Figma 격자 한 칸 236.121 × 147.019 → 기준 칸(198.63)의 1.18875배.
   * origin = 칸 (0,0)(시작 땅) 중심. Frame 22(70,48) + 칸 (825.82, 179.51)
   */
  board: { originX: 895.818, originY: 227.509, figmaCellW: 236.121 },
  /** 구름 (Union) — 위치·크기·뒤집기. 이미지 여백(inset)은 Figma 내보내기 값 */
  clouds: [
    { file: 'cloud-1', x: 142, y: 279, w: 381, h: 243.109, insetX: 0.063, insetY: 0.0987, transform: 'scaleY(-1)' },
    { file: 'cloud-2', x: 1920 - 178.9 - 255.1, y: 779, w: 255.1, h: 162.774, insetX: 0.0941, insetY: 0.1474, transform: 'rotate(180deg)' },
    { file: 'cloud-3', x: 1920 - 1097 - 369, y: 1844, w: 369, h: 235.452, insetX: 0.065, insetY: 0.1019, transform: 'rotate(180deg)' },
  ],
  /** 흐린 점 (Ellipse) — x, y, 지름, 이미지 여백 비율 */
  dots: [
    { file: 'dot-29', x: 425, y: 669, d: 29, inset: 0.2759 },
    { file: 'dot-21', x: 101, y: 282, d: 21, inset: 0.381 },
    { file: 'dot-21', x: 1920 - 488 - 21, y: 177, d: 21, inset: 0.381 },
    { file: 'dot-44', x: 224, y: 772, d: 44, inset: 0.2273 },
    { file: 'dot-51', x: 380, y: 1685, d: 51, inset: 0.2353 },
    { file: 'dot-51', x: 1536, y: 1524, d: 51, inset: 0.2353 },
    { file: 'dot-27', x: 1920 - 131 - 27, y: 1623, d: 27, inset: 0.2963 },
    { file: 'dot-46', x: 1920 - 552 - 46, y: 129, d: 46, inset: 0.2174 },
    // Frame 22 안의 Ellipse 12 (1:359): Frame(70,48) + (1284,1121)
    { file: 'dot-27', x: 70 + 1284, y: 48 + 1121, d: 27, inset: 0.2963 },
  ],
} as const;
