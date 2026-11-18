/**
 * 스테이지 선택 화면 — Figma stageselect(1:200). 정적 화면 + 버튼 연결(모션은 아직 없음).
 *
 * 스테이지 표지판은 스테이지 데이터 목록(data/stages)에서 만든다(G-10):
 * N번째 스테이지가 Figma의 N번째 표지판 자리·모양을 쓴다(1 = 삼각형, 2 = 원).
 * 표지판 자리는 지금 2개(Figma). 데이터가 없는 자리도 Figma대로 보이지만 눌러도 반응하지 않는다(사용자 답변).
 * 3번째 스테이지부터는 새 디자인을 받아 자리를 추가한다.
 */
import circleInner from '../../assets/svg/figma/sign-circle-inner.svg?url';
import circleOuter from '../../assets/svg/figma/sign-circle-outer.svg?url';
import triInner from '../../assets/svg/figma/sign-triangle-inner.svg?url';
import triOuter from '../../assets/svg/figma/sign-triangle-outer.svg?url';
import roadDashSvg from '../../assets/svg/figma/road-dash.svg?url';
import type { AppContext, Screen } from '../app/types';
import { STAGES } from '../game/stages';
import { addDiamondButton, addDot, addPaper, addPlane, addSky, el, img, place } from './common';
import { MOTION } from '../view/motion';

const DOTS = [
  [513, 129, 44], [1616, 496, 25], [1699, 230, 34], [803, 419, 34], [72, 237, 20], [1338, 54, 25],
] as const;

interface Inset { t: number; r: number; b: number; l: number }
interface SignSlot {
  readonly frame: { x: number; y: number; w: number; h: number };
  readonly pole: { x: number; y: number; w: number; h: number };
  readonly shapes: { src: string; x: number; y: number; w: number; h: number; inset: Inset }[];
  readonly label: { cx: number; top: number; w: number; h: number };
}

/** Figma 표지판 자리 (프레임 안 좌표) */
export const SLOTS: readonly SignSlot[] = [
  {
    // Stage 1: Frame 18 (614, 79) 653 × 1692, 삼각형
    frame: { x: 614, y: 79, w: 653, h: 1692 },
    pole: { x: 301, y: 374, w: 50, h: 1318 },
    shapes: [
      { src: triOuter, x: 0, y: 0, w: 653, h: 652, inset: { t: 2.83, r: 8.71, b: 24.77, l: 8.71 } },
      { src: triInner, x: 72, y: 72, w: 510, h: 508, inset: { t: -0.4, r: 6.1, b: 23.82, l: 6.1 } },
    ],
    label: { cx: 320, top: 334, w: 270, h: 90 },
  },
  {
    // Stage 2: Frame 19 (1260, 107) 540 × 1191, 원
    frame: { x: 1260, y: 107, w: 540, h: 1191 },
    pole: { x: 246, y: 342, w: 50, h: 1121 }, // Figma 수정: 기둥 716 → 1121
    shapes: [
      { src: circleOuter, x: 0, y: 0, w: 540, h: 540, inset: { t: -0.28, r: -0.28, b: -0.28, l: -0.28 } },
      { src: circleInner, x: 31, y: 32, w: 476, h: 476, inset: { t: -1.26, r: -1.26, b: -1.26, l: -1.26 } },
    ],
    label: { cx: 269.5, top: 240, w: 280, h: 91 },
  },
];

export function mountSelect(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);

  // 도로 (Figma Group 30, 7:183): #424242 띠 157, 아래에서 50 위에 흰 점선. 표지판 뒤.
  // 화면 아래 끝에 붙인다(창 비율이 달라도 도로가 화면 아래에 오도록 — 가정)
  const road = el('div', 'road', app);
  place(img(roadDashSvg, 'road-dash', road), -129 + 133, 157 - 50 - 10, 2179, 20);

  const plane = addPlane(app);
  plane.style.height = '1080px';
  for (const [x, y, d] of DOTS) addDot(plane, x, y, d);

  // 도감: Frame 21 (120, 347) 501 × 894 — Figma 수정본(기둥 y 102, 길이 989 / 문구 "Cone Collection" 두 줄)
  const dex = el('button', 'sign sign-dex', plane);
  dex.type = 'button';
  place(dex, 120, 347, 501, 894);
  place(el('div', 'sign-pole', dex), 226, 102, 50, 989);
  const board = el('div', 'sign-dex-board', dex);
  place(board, 37, 152, 427, 358);
  const inner = el('div', 'sign-dex-inner', dex);
  place(inner, 57, 173, 386, 227);
  const dexLabel = el('span', 'sign-label sign-label-multi', dex);
  place(dexLabel, 251 - 192, 206, 384);
  dexLabel.append('Cone', document.createElement('br'), 'Collection');
  dex.addEventListener('click', () => ctx.navigate({ name: 'cone' }));

  // 스테이지 표지판: 데이터 목록으로 채움
  SLOTS.forEach((slot, i) => {
    const stage = STAGES[i];
    const sign = el('button', 'sign sign-stage', plane);
    sign.type = 'button';
    place(sign, slot.frame.x, slot.frame.y, slot.frame.w, slot.frame.h);
    place(el('div', 'sign-pole', sign), slot.pole.x, slot.pole.y, slot.pole.w, slot.pole.h);
    for (const s of slot.shapes) {
      const box = el('div', 'sign-shape', sign);
      place(box, s.x, s.y, s.w, s.h);
      const im = img(s.src, 'bleed', box);
      im.style.inset = `${s.inset.t}% ${s.inset.r}% ${s.inset.b}% ${s.inset.l}%`;
    }
    const label = el('span', 'sign-label', sign);
    place(label, slot.label.cx - slot.label.w / 2, slot.label.top, slot.label.w, slot.label.h);
    label.textContent = stage?.name ?? `Stage ${i + 1}`;
    if (stage) {
      sign.addEventListener('click', () => ctx.navigate({ name: 'stage', stageId: stage.id }));
    } else {
      sign.dataset.disabled = 'true'; // 데이터 없음 → 눌러도 아무 일 없음
      sign.setAttribute('aria-disabled', 'true');
    }
  });

  // C2: 왼쪽 표지판(도감)부터 차례로 아래에서 위로 "뿅". 입력은 막지 않음
  const signs = [...plane.querySelectorAll<HTMLElement>('.sign')].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
  const pop = MOTION.signPop;
  signs.forEach((s, i) => {
    if (typeof s.animate !== 'function') return;
    s.animate([{ transform: `translateY(${pop.fromY}px)` }, { transform: 'translateY(0)' }], {
      duration: pop.duration,
      delay: i * pop.stagger,
      easing: pop.easing,
      fill: 'backwards',
    });
  });

  // BACK (Figma 7:201) → 메인
  const back = addDiamondButton(plane, 'BACK', 70, 47);
  back.addEventListener('click', () => ctx.navigate({ name: 'main' }));

  addPaper(app);
  return { relayout() {}, destroy() {} };
}
