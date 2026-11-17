/**
 * 메인(타이틀) 화면 — Figma main(1:2). 정적 화면 + Game Start 버튼 연결(모션은 아직 없음).
 * 격자 판·글자·안전콘 3개·Game Start는 Figma Frame 10(1:3)을 한 장의 SVG로 내보낸 그림을 쓴다.
 * (타이틀 글자는 제작 중이라 나중에 교체 예정, Q19)
 */
import mainBoardSvg from '../../assets/svg/figma/main-board.svg?url';
import type { AppContext, Screen } from '../app/types';
import { addDot, addPaper, addPlane, addSky, el, img, place } from './common';

/** Figma main 프레임의 흐린 점 (1:90 ~ 1:97) */
const DOTS = [
  [1627, 306, 34], [1726, 187, 21], [263, 156, 25], [1297, 225, 25],
  [639, 184, 41], [161, 461, 34], [483, 340, 18], [1764, 477, 18],
] as const;

/** Game Start 마름모(1:88): 중심 (959.8, 872.7), 437.8 × 273.3 */
const START_BTN = { cx: 959.8, cy: 872.7, w: 437.777, h: 273.329 };

export function mountMain(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);
  const plane = addPlane(app);
  plane.style.height = '1080px';

  // Frame 10 내보내기: main 프레임 기준 (0, 87.82)부터 1920 × 993
  const board = img(mainBoardSvg, 'main-board', plane);
  place(board, 0, 87.822, 1920, 993);

  for (const [x, y, d] of DOTS) addDot(plane, x, y, d);

  const start = el('button', 'main-start', plane);
  start.type = 'button';
  start.setAttribute('aria-label', 'Game Start');
  place(start, START_BTN.cx - START_BTN.w / 2, START_BTN.cy - START_BTN.h / 2, START_BTN.w, START_BTN.h);
  start.addEventListener('click', () => ctx.navigate({ name: 'select' }));

  addPaper(app);

  return {
    relayout() {
      /* 배율은 CSS 변수(--u)로 자동 반영 */
    },
    destroy() {
      /* 이 화면은 app 바깥에 등록한 것이 없음 */
    },
  };
}
