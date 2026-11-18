/**
 * 메인(타이틀) 화면 — Figma main(1:2).
 * Figma Frame 10(1:3)을 레이어별로 나눠 쓴다(STEP 10 묶음 4):
 *  - main-board.svg : 격자 판 + 타이틀 글자 (글자는 제작 중이라 나중에 교체 예정, Q19)
 *  - 콘 3개          : Figma "기본안전콘" 그룹 자리(1:32, 1:49, 1:64)에 SVG.1 아이콘을 놓고 모양을 순환(C1)
 *  - main-start.svg : Game Start 마름모(그림자 포함) + 글자 → 둥둥 떠 있음(C1)
 * 모든 레이어는 같은 좌표(main 프레임 기준 (0, 87.822)부터 1920 × 993)를 쓴다.
 */
import manifest from '../../assets/manifest.json';
import mainBoardSvg from '../../assets/svg/figma/main-board.svg?url';
import mainStartSvg from '../../assets/svg/figma/main-start.svg?url';
import mainStartShadowSvg from '../../assets/svg/figma/main-start-shadow.svg?url';
import type { AppContext, Screen } from '../app/types';
import { MOTION } from '../view/motion';
import type { Viewport } from '../view/viewport';
import { addDot, addPaper, addPlane, addSky, el, img, place } from './common';

const iconUrls = import.meta.glob('../../assets/svg/icon/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

/** Figma main 프레임의 흐린 점 (1:90 ~ 1:97) */
const DOTS = [
  [1627, 306, 34], [1726, 187, 21], [263, 156, 25], [1297, 225, 25],
  [639, 184, 41], [161, 461, 34], [483, 340, 18], [1764, 477, 18],
] as const;

/** Game Start 마름모(1:88): 중심 (959.8, 872.7), 437.8 × 273.3 — 누르는 영역 */
const START_BTN = { cx: 959.8, cy: 872.7, w: 437.777, h: 273.329 };

/** 내보낸 그림 레이어의 위치 (main 프레임 기준) */
const LAYER = { x: 0, y: 87.822, w: 1920, h: 993 };
/**
 * 격자 판: Figma에서 프레임 밖까지 넓힌 Frame 10(사용자 수정, 2026-11-18).
 * 프레임 밖 칸은 내보내기에서 빠지므로 get_metadata 위치로 같은 모양 칸을 채워 넣었다(51칸).
 * SVG 좌표는 LAYER와 같고(y 0 = main 87.822), 왼쪽으로 573만큼 더 넓다.
 */
const BOARD = { x: -573, y: 87.822, w: 3283, h: 1911 };
/** 메인 화면 위아래 여백 (디자인 px). 사용자 요청: 여백을 두고 그래픽을 조금 줄여 전체가 보이게 */
const MAIN_MARGIN = 48;

/**
 * 기본안전콘 3개 자리: 아래쪽 가운데 (main 프레임 기준), 가로 433.56.
 * Frame 10 위치(−352, 89) + 그룹 위치 + (너비/2, 높이) — 1:32, 1:49, 1:64
 * 아이콘(SVG.1, 가로 217.62)을 가로 433.56으로 키워(×1.9923) 아래쪽 가운데를 맞춘다(C1: 하단·중심 기준).
 */
const CONE_SLOTS = [
  { bx: -352 + 660.579 + 216.778, by: 89 + 344.736 + 467.512 },
  { bx: -352 + 1096 + 216.778, by: 89 + 343 + 467.512 },
  { bx: -352 + 1531 + 216.778, by: 89 + 344.736 + 467.512 },
] as const;
const CONE_W = 433.555;
const ICON_W = 217.62;

/** C1 모양 20종(안전콘.1에서 시작). 이후 순서는 무작위(pickNext) */
const CYCLE = [
  'safety-cone', 'trash-can', 'fire-hydrant', 'person', 'poop', 'hat', 'ice-cream', 'french-fries', 'wine', 'flower-pot',
  'cake', 'cheese', 'lamp', 'easel', 'umbrella', 'tree', 'sign-board', 'traffic-light', 'soju', 'cat',
] as const;

/** 아이콘 viewBox 높이 (manifest) */
function iconHeight(id: string): number {
  const a = (manifest.assets as { id: string; viewBox?: string }[]).find((x) => x.id === `icon-${id}`);
  const vb = a?.viewBox?.split(/\s+/).map(Number);
  return vb?.[3] ?? 234.65;
}

export function mountMain(ctx: AppContext): Screen {
  const { app } = ctx;
  app.replaceChildren();
  addSky(app);
  const plane = addPlane(app);
  plane.style.height = '1080px';

  // 격자 판 + 글자
  place(img(mainBoardSvg, 'main-board', plane), BOARD.x, BOARD.y, BOARD.w, BOARD.h);

  // C1: 콘 3개
  const scale = CONE_W / ICON_W;
  const urls = CYCLE.map((id) => {
    const u = iconUrls[`../../assets/svg/icon/${id}.svg`];
    if (!u) throw new Error(`메인 콘 아이콘 없음: ${id}`);
    return u;
  });
  urls.forEach((u) => {
    const pre = new Image(); // 미리 받아 두어 바뀔 때 깜빡이지 않게
    pre.src = u;
  });
  const cones = CONE_SLOTS.map((slot) => {
    const i = img(urls[0] as string, 'main-cone', plane);
    i.dataset.bx = String(slot.bx);
    i.dataset.by = String(slot.by);
    return i;
  });
  const setShape = (cone: HTMLImageElement, index: number, pop: boolean): void => {
    const id = CYCLE[index % CYCLE.length] as string;
    const h = iconHeight(id) * scale;
    const bx = Number(cone.dataset.bx);
    const by = Number(cone.dataset.by);
    cone.src = urls[index % urls.length] as string;
    place(cone, bx - CONE_W / 2, by - h, CONE_W, h);
    cone.dataset.coneId = id;
    if (pop && typeof cone.animate === 'function') {
      const m = MOTION.mainCones;
      cone.animate([{ transform: 'scale(1)' }, { transform: `scale(${m.popScale})`, offset: 0.4 }, { transform: 'scale(1)' }], {
        duration: m.popDuration,
        easing: 'ease-out',
      });
    }
  };
  cones.forEach((c) => setShape(c, 0, false));

  const timers: number[] = [];
  /**
   * 사용자 수정: 다음 모양은 무작위(처럼 보이게).
   * 같은 모양이 연달아 나오지 않고, 세 콘이 같은 모양을 동시에 보이지 않도록
   * "지금 세 콘에 보이는 모양"을 빼고 나머지 중에서 고른다.
   */
  const shown = cones.map(() => 0); // 각 콘의 현재 모양 번호(처음엔 모두 안전콘)
  const pickNext = (): number => {
    const options = CYCLE.map((_, i) => i).filter((i) => !shown.includes(i));
    return options[Math.floor(Math.random() * options.length)] ?? 0;
  };
  cones.forEach((cone, k) => {
    // 0.3초씩 엇갈려 시작, 그 뒤 0.5초마다 다른 모양
    timers.push(
      window.setTimeout(() => {
        timers.push(
          window.setInterval(() => {
            const next = pickNext();
            shown[k] = next;
            setShape(cone, next, true);
          }, MOTION.mainCones.interval),
        );
      }, k * MOTION.mainCones.stagger),
    );
  });

  for (const [x, y, d] of DOTS) addDot(plane, x, y, d);

  // C1: Game Start 마름모 + 글자 + 누르는 영역이 함께 둥둥
  const startGroup = el('div', 'main-start-group', plane);
  place(startGroup, 0, 0, 1920, 1080);
  startGroup.style.setProperty('--float-amp', `${MOTION.startFloat.amplitude}px`);
  startGroup.style.animationDuration = `${MOTION.startFloat.period}ms`;
  place(img(mainStartSvg, 'main-start-art', startGroup), LAYER.x, LAYER.y, LAYER.w, LAYER.h);
  const start = el('button', 'main-start', startGroup);
  start.type = 'button';
  start.setAttribute('aria-label', 'Game Start');
  place(start, START_BTN.cx - START_BTN.w / 2, START_BTN.cy - START_BTN.h / 2, START_BTN.w, START_BTN.h);
  start.addEventListener('click', () => ctx.navigate({ name: 'select' }));

  /*
   * Game Start 그림자(Figma 1:88 Drop shadow, 곱하기)는 따로 둔다.
   * 그림(img) 안이나 판(plane) 안에서는 곱하기가 하늘과 섞이지 않아 Figma보다 흐리게 보였음 →
   * 그림자만 떼어 판 밖 별도 층에 두고, 층 전체를 mix-blend-mode: multiply로 하늘·판과 곱한다.
   * 마름모 모양은 그림자에서 이미 빠져 있어(Figma 필터 그대로) 마름모 위에 겹쳐도 가리지 않음.
   * 그림자는 마름모와 같은 키프레임·시간으로 함께 둥둥.
   * 높이 1040: 그림자가 아래로 퍼지는 끝(≈ 1012.7)이 993에서 잘리던 것도 함께 고침.
   */
  const shadowLayer = el('div', 'plane main-start-shadow-layer', app);
  shadowLayer.style.height = '1080px';
  const shadow = img(mainStartShadowSvg, 'main-start-shadow', shadowLayer);
  place(shadow, LAYER.x, LAYER.y, LAYER.w, 1040);
  shadow.style.setProperty('--float-amp', `${MOTION.startFloat.amplitude}px`);
  shadow.style.animationDuration = `${MOTION.startFloat.period}ms`;

  addPaper(app);

  /**
   * 메인 맞춤 (사용자 수정, 2026-11-18)
   *  - 16:9 이상으로 넓은 창: Figma 프레임(1920×1080) 전체가 위아래 여백 MAIN_MARGIN을 두고 들어오게 줄이고
   *    (배율 = min(가로 ÷ 1920, 세로 ÷ (1080 + 여백×2))), 가운데 정렬. 이전 "꽉 채우기"는 Game Start 아래가 잘렸다.
   *    프레임 밖으로 드러나는 곳은 넓힌 격자 판(BOARD)과 하늘(창 전체 배경)이 채운다.
   *  - 16:9보다 세로로 긴 창: 예전처럼 꽉 채우기(배율 = 세로 ÷ 1080, 위 기준, 가로 가운데). 좌우만 조금 잘린다.
   *    (여백 방식은 이런 창에서 그래픽이 너무 작아지고 판 아래가 많이 드러났음)
   */
  const fit = (vp: Viewport): void => {
    const tall = vp.appW / vp.appH < 1920 / 1080;
    const s = tall ? vp.appH / 1080 : Math.min(vp.appW / 1920, vp.appH / (1080 + MAIN_MARGIN * 2));
    const offsetX = (vp.appW - 1920 * s) / 2;
    const offsetY = tall ? 0 : (vp.appH - 1080 * s) / 2;
    plane.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${s})`;
    shadowLayer.style.transform = plane.style.transform;
  };
  fit(ctx.viewport().vp);

  return {
    relayout(vp) {
      fit(vp);
    },
    destroy() {
      timers.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
    },
  };
}
