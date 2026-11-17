/**
 * 도감 화면 — Figma cone(1:1063). 정적 화면 + BACK 버튼(→ 스테이지 선택). hover 튀어오르기 모션은 아직 없음.
 * 아이콘은 로컬 SVG.1(icon/) 그림을 Figma 위치·크기에 놓는다.
 */
import coneRingSvg from '../../assets/svg/figma/cone-ring.svg?url';
import type { AppContext, Screen } from '../app/types';
import { addDiamondButton, addDot, addPaper, addPlane, addSky, img, place } from './common';

const iconUrls = import.meta.glob('../../assets/svg/icon/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const DOTS = [
  [109, 878, 24], [435, 946, 26], [1093, 444, 18], [1477, 161, 24],
  [367, 157, 44], [159, 300, 24], [1691, 280, 39], [1702, 838, 24],
] as const;

/** Frame 26 (230, 31) 안의 아이콘 자리: [아이콘 id, x, y, w, h] */
const ICONS = [
  ['safety-cone', 654, 0, 152, 163], ['tree', 0, 368, 152, 203], ['sign-board', 131, 291, 152, 198],
  ['umbrella', 131, 464, 152, 188], ['hat', 1308, 425, 151, 148], ['french-fries', 1047, 547, 150, 188],
  ['person', 1047, 238, 150, 168], ['flower-pot', 785, 698, 151, 198], ['trash-can', 785, 67, 151, 177],
  ['poop', 1176, 338, 152, 150], ['ice-cream', 1176, 481, 152, 172], ['fire-hydrant', 915, 134, 152, 192],
  ['wine', 915, 619, 152, 196], ['traffic-light', 262, 206, 151, 200], ['easel', 262, 540, 151, 195],
  ['soju', 393, 132, 151, 194], ['lamp', 393, 624, 151, 191], ['cat', 523, 66, 151, 178],
  ['cheese', 523, 714, 151, 182], ['cake', 654, 815, 152, 162],
] as const;

export function mountCone(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);
  const plane = addPlane(app);
  plane.style.height = '1080px';

  // 마름모 띠 판 (Subtract 1:1065)
  place(img(coneRingSvg, 'cone-ring', plane), 174.162, 60.233, 1571.676, 978.533);

  for (const [id, x, y, w, h] of ICONS) {
    const url = iconUrls[`../../assets/svg/icon/${id}.svg`];
    if (!url) throw new Error(`도감 아이콘 없음: ${id}`);
    const i = img(url, 'cone-icon', plane);
    place(i, 230 + x, 31 + y, w, h);
    i.dataset.coneId = id;
  }

  for (const [x, y, d] of DOTS) addDot(plane, x, y, d);

  const back = addDiamondButton(plane, 'BACK', 70, 47); // Figma 6:8
  back.addEventListener('click', () => ctx.navigate({ name: 'select' }));

  addPaper(app);
  return { relayout() {}, destroy() {} };
}
