/**
 * 스테이지 선택 화면 — Figma stageselect(1:200), 2026-11-28 수정본.
 *
 * 표지판 5개(도감·Stage 1~4)가 화면 오른쪽 밖까지 이어진다. 옆으로 넘기는 방법(사용자 답변 6·6-1):
 * - 하단 이동 바(흰 선)를 좌우로 끌기. 바는 화면 왼쪽 69 ~ 오른쪽 69 사이를 움직이고, 트랙은 따로 그리지 않는다
 * - ◀ ▶ 화살표: 한 번 누르면 끝까지 부드럽게 이동
 *
 * 스테이지 표지판은 스테이지 데이터 목록(data/stages)에서 만든다(G-10):
 * N번째 스테이지가 N번째 표지판 자리·모양을 쓴다(1 = 삼각형, 2 = 원, 3 = 사각형, 4 = 별).
 * 데이터가 없는 자리도 Figma대로 보이지만 눌러도 반응하지 않는다(사용자 답변).
 */
import triOuter from '../../assets/svg/figma/select-triangle-outer.svg?url';
import triInner from '../../assets/svg/figma/select-triangle-inner.svg?url';
import circleOuter from '../../assets/svg/figma/select-circle-outer.svg?url';
import circleInner from '../../assets/svg/figma/select-circle-inner.svg?url';
import starOuter from '../../assets/svg/figma/select-star-outer.svg?url';
import starInner from '../../assets/svg/figma/select-star-inner.svg?url';
// Polygon 5·6은 coneshow 화살표와 같은 그림(위쪽 삼각형)을 ∓90° 돌린 것
import arrowSvg from '../../assets/svg/figma/coneshow-arrow.svg?url';
import thumbSvg from '../../assets/svg/figma/select-scroll-thumb.svg?url';
import type { AppContext, Screen } from '../app/types';
import { STAGES } from '../game/stages';
import { addDiamondButton, addDot, addPaper, addPlane, addSky, el, img, place } from './common';
import { MOTION } from '../view/motion';
import { clientToApp, type Viewport } from '../view/viewport';

/** Figma stageselect의 흐린 점 (프레임 좌표). 화면 밖(x > 1920)의 점은 넘기면 보인다 */
const DOTS = [
  [513, 303, 44], [2376, 139, 38], [2796, 708, 19], [3176, 288, 19], [1616, 496, 25], [1699, 230, 34],
  [803, 419, 34], [72, 237, 20], [1338, 54, 25], [1952, 729, 25], [1601, 144, 28],
] as const;

/**
 * 넘기는 면의 오른쪽 끝 (디자인 px). Figma에는 끝이 정해져 있지 않아,
 * Stage 4 표지판 오른쪽 여백 = 도감 표지판 왼쪽 여백(107)이 되는 곳까지로 둔다(가정).
 * → 2076 + 537.94 + 107 = 2720.94, 최대 이동 = 800.94
 */
const TRACK_W = 2076 + 537.94 + 107;
const MAX_SCROLL = TRACK_W - 1920;

/** 이동 바 (Figma Vector 1, 7:185): 길이 630, 두께 12, 화면 y 1056. 움직이는 범위 = 왼쪽 69 ~ 오른쪽 69 */
const THUMB = { w: 630, h: 12, y: 1056, minX: 69, maxX: 1920 - 69 - 630 };
/** 이동 바를 잡는 높이: 하단 띠(Rectangle 19, y 1032, 높이 48) 전체 */
const THUMB_HIT = { y: 1032, h: 48 };

interface Inset { t: number; r: number; b: number; l: number }
type Shape =
  | { kind: 'img'; src: string; x: number; y: number; w: number; h: number; inset: Inset }
  /** 회전한 그림(별): 상자 가운데에 imgW×imgW 그림을 놓고 rotate */
  | { kind: 'rotated'; src: string; x: number; y: number; box: number; imgW: number; deg: number }
  /** CSS 사각형(사각 표지판): 바깥 주황 판 + 안쪽 흰 테두리 */
  | { kind: 'square'; x: number; y: number; w: number; h: number; inner: { x: number; y: number; w: number; h: number } };

interface SignSlot {
  readonly frame: { x: number; y: number; w: number; h: number };
  readonly pole: { x: number; y: number; w: number; h: number };
  readonly shapes: readonly Shape[];
  readonly label: { cx: number; top: number; w: number; h: number };
}

/** Figma 표지판 자리 (프레임 안 좌표) */
export const SLOTS: readonly SignSlot[] = [
  {
    // Stage 1: Frame 33 (546, 104) 575 × 899, 삼각형
    frame: { x: 546, y: 104, w: 575, h: 899 },
    pole: { x: 262, y: 282, w: 50, h: 617 },
    shapes: [
      { kind: 'img', src: triOuter, x: 0, y: 0, w: 575, h: 574, inset: { t: 3.21, r: 8.98, b: 24.74, l: 8.98 } },
      { kind: 'img', src: triInner, x: 63, y: 63, w: 450, h: 448, inset: { t: -0.45, r: 6.02, b: 23.66, l: 6.02 } },
    ],
    label: { cx: 281.5, top: 297, w: 280, h: 81 },
  },
  {
    // Stage 2: Group 33 (1151, 220) 416 × 783, 원
    frame: { x: 1151, y: 220, w: 416, h: 783 },
    pole: { x: 184, y: 280, w: 50, h: 503 },
    shapes: [
      { kind: 'img', src: circleOuter, x: 0, y: 0, w: 416, h: 416, inset: { t: -0.36, r: -0.36, b: -0.36, l: -0.36 } },
      { kind: 'img', src: circleInner, x: 24, y: 25, w: 367, h: 366, inset: { t: -1.64, r: -1.63, b: -1.64, l: -1.63 } },
    ],
    label: { cx: 207.5, top: 163, w: 280, h: 91 },
  },
  {
    // Stage 3: Frame 31 (1664, 112) 366 × 891, 사각형
    frame: { x: 1664, y: 112, w: 366, h: 891 },
    pole: { x: 158, y: 231, w: 50, h: 660 },
    shapes: [{ kind: 'square', x: 0, y: 0, w: 366, h: 366, inner: { x: 15, y: 15, w: 336, h: 336 } }],
    label: { cx: 183, top: 146, w: 280, h: 91 },
  },
  {
    // Stage 4: Frame 30 (2076, 135) 537.94 × 868, 별 (−15° 회전)
    frame: { x: 2076, y: 135, w: 537.94, h: 868 },
    pole: { x: 241, y: 348, w: 50, h: 520 },
    shapes: [
      { kind: 'rotated', src: starOuter, x: 0, y: 0, box: 537.942, imgW: 439.228, deg: -15 },
      { kind: 'rotated', src: starInner, x: 29.04, y: 29.04, box: 479.854, imgW: 391.8, deg: -15 },
    ],
    label: { cx: 268.9, top: 226.65, w: 280, h: 91 },
  },
];

function addShape(sign: HTMLElement, s: Shape): void {
  if (s.kind === 'img') {
    const box = el('div', 'sign-shape', sign);
    place(box, s.x, s.y, s.w, s.h);
    const im = img(s.src, 'bleed', box);
    im.style.inset = `${s.inset.t}% ${s.inset.r}% ${s.inset.b}% ${s.inset.l}%`;
  } else if (s.kind === 'rotated') {
    const box = el('div', 'sign-shape sign-shape-rotated', sign);
    place(box, s.x, s.y, s.box, s.box);
    const im = img(s.src, 'sign-rotated-img', box);
    const off = (s.box - s.imgW) / 2;
    place(im, off, off, s.imgW, s.imgW);
    im.style.transform = `rotate(${s.deg}deg)`;
  } else {
    const board = el('div', 'sign-square-board', sign);
    place(board, s.x, s.y, s.w, s.h);
    const inner = el('div', 'sign-square-inner', sign);
    place(inner, s.inner.x, s.inner.y, s.inner.w, s.inner.h);
  }
}

export function mountSelect(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);

  // 땅 (Figma Group 30, 7:183): #424242, 높이 351. 한 가지 색이라 넘기지 않고 화면 아래에 고정
  el('div', 'select-road', app);
  // 하단 띠 (Rectangle 19, 57:8324): #474647, 높이 48. 이동 바가 이 위에 있음
  el('div', 'select-band', app);

  const plane = addPlane(app);
  plane.style.height = '1080px';

  // 넘기는 면: 흐린 점 + 표지판
  const track = el('div', 'select-track', plane);
  place(track, 0, 0, TRACK_W, 1080);
  for (const [x, y, d] of DOTS) addDot(track, x, y, d);

  // 표지판 층: 화면이 1920×1080보다 세로로 길면 늘어난 만큼 아래로 내려 기둥이 땅까지 닿게 한다
  // (사용자 수정, 2026-11-26). 흐린 점·BACK은 그대로 위쪽
  const signLayer = el('div', 'sign-layer', track);
  place(signLayer, 0, 0, TRACK_W, 1080);

  // 도감: Frame 34 (107, 522) 427 × 481
  const dex = el('button', 'sign sign-dex', signLayer);
  dex.type = 'button';
  place(dex, 107, 522, 427, 481);
  place(el('div', 'sign-pole', dex), 189, 0, 50, 481);
  place(el('div', 'sign-dex-board', dex), 0, 77, 427, 268); // 57:8271
  place(el('div', 'sign-dex-inner', dex), 21, 98, 386, 227); // 57:8272
  const dexLabel = el('span', 'sign-label sign-label-multi', dex);
  place(dexLabel, 214 - 192, 131, 384); // 57:8273
  dexLabel.append('Cone', document.createElement('br'), 'Collection');
  dex.addEventListener('click', () => ctx.navigate({ name: 'cone' }));

  // 스테이지 표지판: 데이터 목록으로 채움
  SLOTS.forEach((slot, i) => {
    const stage = STAGES[i];
    const sign = el('button', 'sign sign-stage', signLayer);
    sign.type = 'button';
    place(sign, slot.frame.x, slot.frame.y, slot.frame.w, slot.frame.h);
    place(el('div', 'sign-pole', sign), slot.pole.x, slot.pole.y, slot.pole.w, slot.pole.h);
    for (const s of slot.shapes) addShape(sign, s);
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
  const signs = [...signLayer.querySelectorAll<HTMLElement>('.sign')].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
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

  // 아래쪽 조작 층 (화살표·이동 바): 땅과 함께 화면 아래에 붙는다
  const bottom = el('div', 'select-bottom', plane);
  place(bottom, 0, 0, 1920, 1080);

  const arrow = (x: number, deg: number, label: string): HTMLButtonElement => {
    const b = el('button', 'select-arrow', bottom);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    place(b, x, 974, 66, 45); // Polygon 5·6 (57:8251, 57:8252)
    // 그림 영역(inset 7.86% 9.81% 25% 9.81%)의 가운데 = (33, 18.6)에 36.17×44.31 그림을 돌려 놓는다
    const im = img(arrowSvg, 'select-arrow-img', b);
    place(im, 33 - 36.1669 / 2, 18.625 - 44.3098 / 2, 36.1669, 44.3098);
    im.style.transform = `rotate(${deg}deg)`;
    return b;
  };
  const left = arrow(159, -90, '왼쪽으로 넘기기');
  const right = arrow(1762, 90, '오른쪽으로 넘기기');

  const thumbHit = el('div', 'select-thumb', bottom);
  thumbHit.setAttribute('role', 'scrollbar');
  thumbHit.setAttribute('aria-label', '표지판 넘기기');
  thumbHit.setAttribute('aria-orientation', 'horizontal');
  const thumbImg = img(thumbSvg, 'select-thumb-line', thumbHit);
  place(thumbImg, 0, THUMB.y - THUMB_HIT.y - THUMB.h / 2, THUMB.w, THUMB.h);

  // ── 넘기기 상태 (디자인 px, 0 ~ MAX_SCROLL)
  let scrollX = 0;
  let anim = 0;
  const apply = (): void => {
    track.style.transform = `translateX(${-scrollX}px)`;
    const t = MAX_SCROLL > 0 ? scrollX / MAX_SCROLL : 0;
    place(thumbHit, THUMB.minX + t * (THUMB.maxX - THUMB.minX), THUMB_HIT.y, THUMB.w, THUMB_HIT.h);
    thumbHit.setAttribute('aria-valuenow', String(Math.round(t * 100)));
  };
  const setScroll = (x: number): void => {
    scrollX = Math.min(MAX_SCROLL, Math.max(0, x));
    apply();
  };
  const glideTo = (target: number): void => {
    cancelAnimationFrame(anim);
    const from = scrollX;
    const to = Math.min(MAX_SCROLL, Math.max(0, target));
    const { duration } = MOTION.selectGlide;
    const t0 = performance.now();
    const step = (now: number): void => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3); // ease-out
      setScroll(from + (to - from) * e);
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  left.addEventListener('click', () => glideTo(0));
  right.addEventListener('click', () => glideTo(MAX_SCROLL));

  // 이동 바 끌기: 바가 움직인 만큼 표지판 면이 비례해서 움직인다
  let drag: { id: number; startX: number; startScroll: number } | null = null;
  const designX = (e: PointerEvent): number => {
    const { vp, winW } = ctx.viewport();
    return clientToApp(vp, winW, e.clientX, e.clientY).x / vp.u;
  };
  thumbHit.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(anim);
    drag = { id: e.pointerId, startX: designX(e), startScroll: scrollX };
    try {
      thumbHit.setPointerCapture(e.pointerId);
    } catch {
      // 포인터가 이미 사라진 경우: 잡기만 못 할 뿐 끌기는 계속 동작
    }
    thumbHit.dataset.dragging = 'true';
    e.preventDefault();
  });
  thumbHit.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = designX(e) - drag.startX;
    setScroll(drag.startScroll + (dx / (THUMB.maxX - THUMB.minX)) * MAX_SCROLL);
  });
  const endDrag = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    delete thumbHit.dataset.dragging;
  };
  thumbHit.addEventListener('pointerup', endDrag);
  thumbHit.addEventListener('pointercancel', endDrag);
  apply();

  // BACK (Figma 7:201) → 메인. 넘기지 않음
  const back = addDiamondButton(plane, 'BACK', 70, 47);
  back.addEventListener('click', () => ctx.navigate({ name: 'main' }));

  addPaper(app);

  const fit = (vp: Viewport): void => {
    const extra = Math.max(0, vp.viewHDesign - 1080); // 디자인 px
    const shift = extra > 0 ? `translateY(${extra}px)` : '';
    signLayer.style.transform = shift;
    bottom.style.transform = shift;
  };
  fit(ctx.viewport().vp);
  return {
    relayout: fit,
    destroy() {
      cancelAnimationFrame(anim);
    },
  };
}
