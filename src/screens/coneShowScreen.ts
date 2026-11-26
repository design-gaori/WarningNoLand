/**
 * 콘 소개 화면 — Figma coneshow(31:2). 도감(cone) 화면 1.5초 뒤 페이드인으로 들어온다.
 *
 * 인터랙션(사용자 지시, 2026-11-26):
 * - 하단 콘에 마우스를 올리면(터치는 탭) 그 콘이 화면 가운데로 온다. 큰 콘들은 좌우로 미끄러진다.
 * - 화면 오른쪽에만 다음 콘이 살짝 보인다. 사용자 수정(2026-11-26): 그라디언트 대신
 *   작게(70%) + 흐리게(35%) 놓고, 가운데로 올 때 원래 크기·선명도로 커진다.
 * - 좌측 하단 글은 콘마다 다르다 → data/cone-texts.json
 * 추가한 인터랙션: 좌우 화살표 버튼(Figma Polygon 5·6) 클릭, 키보드 ←/→, 큰 콘 영역 좌우 스와이프, 글 바뀔 때 짧은 페이드.
 *
 * 화면 맞춤: 1920×1080 구성을 화면 안에 통째로 넣는다(비율 유지·가운데).
 * 남는 위·아래·옆은 하늘(위)과 도로(아래)가 이어서 채운다.
 */
import roadSvg from '../../assets/svg/figma/coneshow-road.svg?url';
import arrowSvg from '../../assets/svg/figma/coneshow-arrow.svg?url';
import textsJson from '../../data/cone-texts.json';
import type { AppContext, Screen } from '../app/types';
import { addDiamondButton, addDot, addPaper, addPlane, addSky, el, img, place } from './common';
import type { Viewport } from '../view/viewport';
import { playEffect } from '../audio/sound';
import { MOTION } from '../view/motion';

const iconUrls = import.meta.glob('../../assets/svg/icon/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

interface ConeText {
  readonly id: string;
  readonly title: string;
  readonly lines: readonly string[];
}
const TEXTS = (textsJson as { cones: ConeText[] }).cones;

/** Figma coneshow 흐린 점 */
const DOTS = [
  [109, 438, 24], [677, 376, 26], [1093, 444, 18], [1417, 231, 24],
  [423, 250, 25], [1559, 538, 24], [1691, 280, 39], [372, 456, 24],
] as const;

/** 하단 콘 줄 Frame 27 (47, 906) 안의 자리: id → [x, y, w, h]. 모두 아래 끝 y = 106 */
const THUMBS: Record<string, readonly [number, number, number, number]> = {
  'safety-cone': [0, 21, 79, 85], tree: [92, 0, 80, 106], 'sign-board': [184, 2, 80, 104],
  cat: [276, 13, 80, 93], 'traffic-light': [368, 2, 79, 104], easel: [459, 5, 79, 101],
  lamp: [551, 6, 79, 100], umbrella: [642, 8, 80, 98], soju: [735, 5, 79, 101],
  cheese: [826, 11, 79, 95], cake: [917, 21, 80, 85], 'trash-can': [1010, 13, 79, 93],
  'fire-hydrant': [1101, 6, 80, 100], wine: [1194, 4, 79, 102], 'flower-pot': [1285, 2, 80, 104],
  person: [1377, 18, 79, 88], poop: [1467, 28, 80, 78], 'ice-cream': [1560, 16, 80, 90],
  hat: [1652, 28, 79, 78], 'french-fries': [1744, 8, 78, 98],
};
const THUMB_FRAME = { x: 47, y: 906 } as const;

/** 좌우 화살표 상자 (Figma Polygon 5·6: x 505 / 1414, y 661, 66×45) */
const ARROW = { prevX: 505, nextX: 1414, y: 661, w: 66, h: 45 } as const;
/**
 * 큰 콘: 폭 592, 다음 콘까지 간격 856 (Figma 34:30870, 34:31067).
 * 사용자 수정(2026-11-26): 콘 바닥 마름모(윗면)의 가운데가 양쪽 화살표의 한가운데에 오도록 놓는다.
 * 바닥 마름모 윗면 가운데 = 그림 가로 가운데, 그림 아래 끝에서 214.46 위 (안전콘.1 2의 34:30877: y 234.05, 높이 374.98, 그림 높이 636)
 */
const BASE_FACE_FROM_BOTTOM = 636 - (234.05 + 374.98 / 2);
const ARROW_MID = {
  x: (ARROW.prevX + ARROW.nextX + ARROW.w) / 2,
  y: ARROW.y + ARROW.h / 2,
};
const BIG = {
  w: 592,
  step: 856,
  x: ARROW_MID.x - 592 / 2,
  bottom: ARROW_MID.y + BASE_FACE_FROM_BOTTOM,
} as const;
/** 도로 Frame 28 (1, 385), 점선 SVG는 왼쪽으로 130 넘침 */
const ROAD_TOP = 385;

export function mountConeShow(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);

  // 흐린 점 (Figma에서 도로 아래 층 → 도로 위쪽 하늘에 걸친 점만 보임)
  const dots = el('div', 'cs-stage', app);
  for (const [x, y, d] of DOTS) addDot(dots, x, y, d);

  // 도로: 화면 맞춤 위치(ROAD_TOP)부터 화면 아래 끝까지, 가로 전체
  const road = el('div', 'cs-road', app);
  const dash = img(roadSvg, 'cs-road-dash', road);

  // 큰 콘 줄: 현재 콘 + 오른쪽에 작고 흐린 다음 콘(미리보기)
  const reel = el('div', 'cs-reel', app);
  const track = el('div', 'cs-track', reel);
  const cs = MOTION.coneShow;
  const slideT = `${cs.slide}ms ${cs.slideEasing}`;
  const bigs = TEXTS.map((t, i) => {
    const url = iconUrls[`../../assets/svg/icon/${t.id}.svg`];
    if (!url) throw new Error(`콘 그림 없음: ${t.id}`);
    const slot = el('div', 'cs-big', track);
    // 모든 콘은 가운데 자리에 두고, 현재 콘과의 거리(순환)만큼 --dx로 옮긴다
    place(slot, BIG.x, 0, BIG.w, BIG.bottom);
    img(url, 'cs-big-img', slot);
    return slot;
  });

  // 1920×1080 구성 면 (조작 요소: 화살표·글·하단 콘·BACK). 빈 곳은 입력을 통과시킨다
  const stage = el('div', 'cs-stage cs-controls', app);

  // 화살표 (Polygon 5·6): 66×45 상자 가운데에 옆으로 누운 삼각형
  const mkArrow = (x: number, dir: -1 | 1): HTMLButtonElement => {
    const b = el('button', `cs-arrow cs-arrow-${dir < 0 ? 'prev' : 'next'}`, stage);
    b.type = 'button';
    b.setAttribute('aria-label', dir < 0 ? '이전 콘' : '다음 콘');
    place(b, x, ARROW.y, ARROW.w, ARROW.h);
    img(arrowSvg, 'cs-arrow-img', b);
    b.addEventListener('click', () => select(index + dir, true));
    return b;
  };
  mkArrow(ARROW.prevX, -1); // 순환이라 끝에서도 꺼지지 않음
  mkArrow(ARROW.nextX, 1);

  // 좌측 하단 글
  const textBox = el('div', 'cs-text', stage);
  place(textBox, 141, 645, 480);
  const title = el('div', 'cs-title', textBox);
  const body = el('div', 'cs-body', textBox);

  // 하단 콘 줄
  const thumbs = TEXTS.map((t, i) => {
    const pos = THUMBS[t.id];
    if (!pos) throw new Error(`하단 콘 자리 없음: ${t.id}`);
    const b = el('button', 'cs-thumb', stage);
    b.type = 'button';
    b.setAttribute('aria-label', t.title);
    place(b, THUMB_FRAME.x + pos[0], THUMB_FRAME.y + pos[1], pos[2], pos[3]);
    img(iconUrls[`../../assets/svg/icon/${t.id}.svg`] as string, 'cs-thumb-img', b);
    b.style.transition = `opacity ${cs.thumbFade}ms ease`;
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') select(i, false);
    });
    b.addEventListener('click', () => select(i, true));
    return b;
  });

  // BACK (Figma 39:8): 다른 화면과 똑같이 화면 왼쪽 위 기준(1920 배율 면) — 구성 면이 가운데로 옮겨져도 BACK은 그대로
  const backPlane = addPlane(app);
  backPlane.style.height = '1080px';
  backPlane.style.pointerEvents = 'none';
  const back = addDiamondButton(backPlane, 'BACK', 70, 47);
  back.style.pointerEvents = 'auto';
  back.addEventListener('click', () => ctx.navigate({ name: 'select' }));

  addPaper(app);

  let index = -1;
  function renderText(t: ConeText): void {
    title.textContent = t.title;
    body.replaceChildren(...t.lines.filter((l) => l.trim() !== '').map((l) => {
      const p = document.createElement('p');
      p.textContent = l;
      return p;
    }));
  }
  /*
   * 사용자 수정(2026-11-26): 순환. 안전콘에서 왼쪽 → 감자튀김, 감자튀김에서 오른쪽 → 안전콘.
   * 각 콘의 자리 = 현재 콘에서 오른쪽으로 몇 번째인지(0 = 가운데, 1 = 다음 미리보기, 마지막 = 바로 왼쪽).
   */
  const N = TEXTS.length;
  function select(i: number, sound: boolean): void {
    const n = ((i % N) + N) % N;
    if (n === index) return;
    const first = index < 0;
    index = n;
    bigs.forEach((b, k) => {
      const rel = (k - n + N) % N;
      const pos = rel === N - 1 ? -1 : rel; // 바로 앞 콘은 왼쪽(-1)으로 빠짐
      b.style.setProperty('--dx', `${pos * BIG.step}px`);
      // 현재 + 바로 다음 콘만 보임(오른쪽 미리보기). 나머지는 숨김
      b.classList.toggle('is-hidden', pos !== 0 && pos !== 1);
      b.classList.toggle('is-current', pos === 0);
      b.classList.toggle('is-next', pos === 1);
    });
    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === n));
    if (sound) playEffect();
    if (first || typeof textBox.animate !== 'function') {
      renderText(TEXTS[n] as ConeText);
      return;
    }
    textBox.getAnimations().forEach((a) => a.cancel());
    renderText(TEXTS[n] as ConeText);
    textBox.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: cs.textFade,
      easing: 'ease-out',
    });
  }

  // 키보드 ←/→
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') select(index - 1, true);
    if (e.key === 'ArrowRight') select(index + 1, true);
  };
  window.addEventListener('keydown', onKey);

  // 큰 콘 영역 좌우 스와이프 (터치)
  // (앱이 90° 돌아간 화면에서는 앱의 가로 = 브라우저 세로)
  let swipeX: number | null = null;
  const appX = (e: PointerEvent): number => (ctx.viewport().vp.rotated ? e.clientY : e.clientX);
  reel.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') swipeX = appX(e);
  });
  reel.addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = (appX(e) - swipeX) / sc;
    swipeX = null;
    if (Math.abs(dx) > cs.swipeMin) select(index + (dx < 0 ? 1 : -1), true);
  });
  reel.addEventListener('pointercancel', () => (swipeX = null));

  let sc = 1;
  const fit = (vp: Viewport): void => {
    // 1920×1080을 화면 안에 통째로(비율 유지, 가운데)
    sc = Math.min(vp.appW / 1920, vp.appH / 1080);
    const ox = (vp.appW - 1920 * sc) / 2;
    const oy = (vp.appH - 1080 * sc) / 2;
    const tf = `translate(${ox}px, ${oy}px) scale(${sc})`;
    dots.style.transform = tf;
    stage.style.transform = tf;
    reel.style.transform = tf;
    // 도로: y 385부터 화면 아래 끝까지, 가로는 화면 전체
    const roadTop = oy + ROAD_TOP * sc;
    road.style.top = `${roadTop}px`;
    // 점선: Figma 대로 1920 구성 기준 위치(-129)에서, 화면이 더 넓으면 양옆으로 늘림
    dash.style.left = `${Math.min(ox - 129 * sc, 0)}px`;
    dash.style.width = `${Math.max(2179 * sc, vp.appW)}px`;
    dash.style.top = '0px';
    dash.style.height = `${695 * sc}px`; // SVG = 회색 판 + y 62의 점선
    // 스와이프 영역: 구성 왼쪽 끝 ~ 화면 오른쪽 끝
    reel.style.width = `${(vp.appW - ox) / sc}px`;
  };
  fit(ctx.viewport().vp);
  select(0, false);
  // 첫 배치는 움직임 없이, 그 뒤부터 미끄러짐
  requestAnimationFrame(() => bigs.forEach((b) => (b.style.transition = `opacity ${slideT}, transform ${slideT}`)));

  return {
    relayout: fit,
    destroy() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
