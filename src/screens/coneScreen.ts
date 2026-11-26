/**
 * 도감 화면 — Figma cone(1:1063). 정적 화면 + BACK 버튼(→ 스테이지 선택). hover 튀어오르기 모션은 아직 없음.
 * 아이콘은 로컬 SVG.1(icon/) 그림을 Figma 위치·크기에 놓는다.
 */
import coneRingSvg from '../../assets/svg/figma/cone-ring.svg?url';
import type { AppContext, Screen } from '../app/types';
import { addDiamondButton, addDot, addPaper, addPlane, addSky, el, img, place } from './common';
import type { Viewport } from '../view/viewport';
import { playEffect } from '../audio/sound';
import { MOTION } from '../view/motion';

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

/** 도감 판 묶음(Figma Group 29)의 위치·크기 (디자인 px) */
const GROUP = { x: 174.162, y: 31, w: 1571.676, h: 1007.767 } as const;
/** 도감 판 둘레 여백 (디자인 px, 1920 기준 — 화면 배율에 맞춰 같이 줄어듦). 사용자 요청 "상하좌우 일정 여백" */
const BOARD_MARGIN = 48;

/** C4: 위로 통 올라왔다 내려오기. 진행 중이면 처음부터 다시 */
function bounce(el: HTMLElement): void {
  if (typeof el.animate !== 'function') return;
  el.getAnimations().forEach((a) => a.cancel());
  const m = MOTION.coneBounce;
  // 올라갈 때는 부드럽게 감속, 내려올 때는 부드럽게 가속·감속 (구간마다 이징)
  el.animate(
    [
      { transform: 'translateY(0)', easing: m.hoverEasing },
      { transform: `translateY(${-m.height}px)`, offset: 0.45, easing: m.easing },
      { transform: 'translateY(0)' },
    ],
    { duration: m.duration },
  );
}

export function mountCone(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);

  /*
   * 도감 판(마름모 띠 + 아이콘 20개, Figma Group 29: 174.16, 31, 1571.68 × 1007.77)은
   * 사용자 요청대로 화면 상하좌우에 같은 여백(BOARD_MARGIN)을 두고 최대한 크게 맞춘다(비율 유지, 가운데).
   * 흐린 점·BACK은 지금처럼 화면 기준(1920 배율) 그대로.
   */
  // 확대 전환용 층: 도감 판만 담는다(하늘·점·BACK·종이 질감은 제외)
  const zoom = el('div', 'cone-zoom', app);
  const board = el('div', 'cone-board', zoom);
  board.style.width = `${GROUP.w}px`;
  board.style.height = `${GROUP.h}px`;

  // C4 값(motion.ts) → CSS 변수
  board.style.setProperty('--cone-lift', `${-MOTION.coneBounce.height}px`);
  board.style.setProperty('--cone-lift-ms', `${MOTION.coneBounce.hoverDuration}ms`);
  board.style.setProperty('--cone-lift-ease', MOTION.coneBounce.hoverEasing);

  const plane = addPlane(app);
  plane.style.height = '1080px';

  // 마름모 띠 판 (Subtract 1:1065) — 판 기준 좌표
  place(img(coneRingSvg, 'cone-ring', board), 174.162 - GROUP.x, 60.233 - GROUP.y, 1571.676, 978.533);

  for (const [id, x, y, w, h] of ICONS) {
    const url = iconUrls[`../../assets/svg/icon/${id}.svg`];
    if (!url) throw new Error(`도감 아이콘 없음: ${id}`);
    const i = img(url, 'cone-icon', board);
    place(i, 230 + x - GROUP.x, 31 + y - GROUP.y, w, h);
    i.dataset.coneId = id;
    // C4 (사용자 수정): 마우스를 올리면 올라간 채 유지, 내리면 내려옴
    i.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') i.classList.add('is-up');
    });
    i.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') i.classList.remove('is-up');
    });
    // C6: 누르면 효과음. 터치(마우스 올림이 없는 기기)는 탭할 때 올라갔다 내려오기
    // (사용자 수정, 2026-11-19: 소리가 늦게 들림 → 손을 뗄 때(click)가 아니라 누르는 순간 재생)
    i.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!i.classList.contains('is-up')) bounce(i);
      playEffect();
    });
  }

  for (const [x, y, d] of DOTS) addDot(plane, x, y, d);

  const back = addDiamondButton(plane, 'BACK', 70, 47); // Figma 6:8
  back.addEventListener('click', () => ctx.navigate({ name: 'select' }));
  // 점·BACK 층(plane)은 도감 판 위에 있어 아이콘을 덮는다 → 층은 입력을 통과시키고 BACK만 받는다
  // (사용자 보고: 모바일 터치 시 콘이 올라오지 않음. 데스크톱 hover도 같은 원인으로 대부분 막혀 있었음)
  plane.style.pointerEvents = 'none';
  back.style.pointerEvents = 'auto';

  addPaper(app);

  const fit = (vp: Viewport): void => {
    const m = BOARD_MARGIN * vp.u; // 화면 px
    // 위아래 여백을 같게. 맨 위 아이콘이 올라가는 높이(24)는 여백(48) 안에 들어가므로 잘리지 않음
    const s = Math.min((vp.appW - 2 * m) / GROUP.w, (vp.appH - 2 * m) / GROUP.h);
    const x = (vp.appW - GROUP.w * s) / 2;
    const y = (vp.appH - GROUP.h * s) / 2;
    board.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  };
  fit(ctx.viewport().vp);

  // 사용자 지시(2026-11-26): 들어오자마자 도감 판이 크게 확대되며(끝에서 사라짐) 콘 소개(coneshow)로 넘어감
  // 움츠렸다가(예비 동작) 확 튀어 나가는 확대. 크기와 투명도는 따로 움직인다
  const z = MOTION.coneShow;
  let zoomAnim: Animation | null = null;
  let autoTimer: number | undefined;
  const goNext = (): void => ctx.navigate({ name: 'coneshow' }, { fade: true });
  if (typeof zoom.animate === 'function') {
    zoomAnim = zoom.animate(
      [
        { transform: 'scale(1)', easing: z.zoomAnticipateEasing },
        { transform: `scale(${z.zoomAnticipate})`, offset: z.zoomAnticipateAt, easing: z.zoomEasing },
        { transform: `scale(${z.zoomScale})` },
      ],
      { duration: z.zoomDuration, delay: z.zoomDelay, fill: 'forwards' },
    );
    zoom.animate(
      [{ opacity: 1 }, { opacity: 1, offset: z.zoomFadeFrom }, { opacity: 0 }],
      { duration: z.zoomDuration, delay: z.zoomDelay, fill: 'forwards' },
    );
    zoomAnim.onfinish = goNext;
  } else {
    autoTimer = window.setTimeout(goNext, z.zoomDelay + z.zoomDuration);
  }
  return {
    relayout: fit,
    destroy() {
      if (zoomAnim) zoomAnim.onfinish = null;
      window.clearTimeout(autoTimer);
    },
  };
}
