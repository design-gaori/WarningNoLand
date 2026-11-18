/**
 * stage1 화면 틀(셸) — 정적 배치만. 콘·땅·드래그 없음 (STEP 6).
 * 화면 좌표(px)는 여기서만 쓴다. 칸 좌표 → 화면 좌표 변환은 logic/grid의 함수를 사용한다.
 */
import { BASE_CELL, cellToScreen } from '../logic/grid';
import type { GameState, StageDef } from '../logic/types';
import { ART_BOTTOM_INSET, ART_SCALE } from './coneArt';
import { STAGE1_LAYOUT as L } from './layout';
import { MOTION } from './motion';

import restartSvg from '../../assets/svg/figma/restart-button.svg?url';
import buttonHoverSvg from '../../assets/svg/figma/button-hover.svg?url';
import countConeSvg from '../../assets/svg/figma/count-cone.svg?url';
import paperWebp from '../../assets/img/paper-texture.webp?url';

const figmaSvgs = import.meta.glob('../../assets/svg/figma/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const figmaUrl = (name: string): string => {
  const url = figmaSvgs[`../../assets/svg/figma/${name}.svg`];
  if (!url) throw new Error(`에셋 없음: ${name}`);
  return url;
};

/** 보드 배율: Figma 격자 칸 가로 ÷ 기준 칸 가로 */
export const BOARD_SCALE = L.board.figmaCellW / BASE_CELL.width;

/**
 * 땅 그림의 칸 중심 → 그림 아래 끝 거리(디자인 px).
 * 그림 아래 끝(SVG 아래 −0.48)은 칸 마름모의 아래 꼭짓점에 맞춰진다(view/coneArt.ts).
 */
const TILE_BOTTOM_FROM_CENTER = (BASE_CELL.height / 2 + ART_BOTTOM_INSET * ART_SCALE) * BOARD_SCALE;

/**
 * 안내 띠 높이(디자인 px). Figma: 띠 48, 글자 20 → 글자 위아래 여백 14씩.
 * 작은 화면에서 글자가 최소 크기(12px, 가정 G1)로 커지면 띠도 같은 비율(48:20)로 커진다.
 */
export function tickerHeight(u: number): number {
  const font = Math.max(L.ticker.fontSize, L.ticker.minFontPx / u);
  return font * (L.ticker.h / L.ticker.fontSize);
}

/** 스크롤 세로 길이(디자인 px): 도착 땅 아래 끝 + 하단 여백(Q31) + 안내 띠 */
export function contentHeight(stage: StageDef, tickerH: number = L.ticker.h): number {
  const ends = stage.end.map((c) => cellToScreen(c, { x: 0, y: 0 }).y * BOARD_SCALE + L.board.originY);
  const endBottom = Math.max(...ends) + TILE_BOTTOM_FROM_CENTER;
  return Math.ceil(endBottom + 48 + tickerH);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

function img(src: string, cls: string, parent: HTMLElement): HTMLImageElement {
  const i = el('img', cls, parent);
  i.src = src;
  i.alt = '';
  i.draggable = false;
  return i;
}

function place(e: HTMLElement, x: number, y: number, w?: number, h?: number): void {
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
  if (w !== undefined) e.style.width = `${w}px`;
  if (h !== undefined) e.style.height = `${h}px`;
}

export interface ShellRefs {
  readonly scroller: HTMLElement;
  readonly scrollContent: HTMLElement;
  readonly stagePlane: HTMLElement;
  /** G-7: 보드 전체를 하나의 단위로 확대·축소하는 요소 (기준 칸 좌표계) */
  readonly board: HTMLElement;
  readonly restart: HTMLButtonElement;
  /** BACK (Figma 7:194) → 스테이지 선택 */
  readonly back: HTMLButtonElement;
  readonly storage: HTMLElement;
  /** 드래그 중인 콘 그림을 띄우는 층 (보관함·보드 위, 종이 질감 아래) */
  readonly dragLayer: HTMLElement;
  /** 안내 띠의 흐르는 줄 */
  readonly tickerTrack: HTMLElement;
}

export function buildShell(app: HTMLElement, stage: StageDef, state: GameState): ShellRefs {
  app.replaceChildren();
  el('div', 'sky', app);

  // ── 스크롤되는 면: 구름·보드·점 (Q30)
  const scroller = el('div', 'scroller', app);
  const scrollContent = el('div', 'scroll-content', scroller);
  const stagePlane = el('div', 'stage-plane', scrollContent);

  for (const c of L.clouds) {
    const box = el('div', 'cloud', stagePlane);
    place(box, c.x, c.y, c.w, c.h);
    box.style.transform = c.transform;
    const i = img(figmaUrl(c.file), 'bleed', box);
    i.style.inset = `${-c.insetY * 100}% ${-c.insetX * 100}%`;
  }

  const boardLayer = el('div', 'board-layer', stagePlane);
  place(boardLayer, L.board.originX, L.board.originY);
  const board = el('div', 'board', boardLayer);
  board.style.transform = `scale(${BOARD_SCALE})`;
  // 보드 내용(격자·땅·콘)은 view/board.ts가 이 요소 안에 SVG로 그린다

  for (const d of L.dots) {
    const box = el('div', 'dot', stagePlane);
    place(box, d.x, d.y, d.d, d.d);
    const i = img(figmaUrl(d.file), 'bleed', box);
    i.style.inset = `${-d.inset * 100}%`;
  }

  // ── 화면에 고정: RESTART·보관함 (위쪽 기준)
  const hudTop = el('div', 'hud-top', app);
  const restart = el('button', 'restart', hudTop);
  restart.type = 'button';
  place(restart, L.restart.x, L.restart.y, L.restart.w, L.restart.h);
  img(restartSvg, 'restart-bg', restart);
  img(buttonHoverSvg, 'restart-bg button-hover-bg', restart); // Figma hover(15:2)
  el('span', 'restart-label', restart).textContent = 'RESTART';

  const back = el('button', 'restart', hudTop);
  back.type = 'button';
  place(back, L.back.x, L.back.y, L.restart.w, L.restart.h);
  img(restartSvg, 'restart-bg', back);
  img(buttonHoverSvg, 'restart-bg button-hover-bg', back);
  el('span', 'restart-label', back).textContent = 'BACK';

  const storage = el('div', 'storage', hudTop);
  place(storage, L.storage.x, L.storage.y, L.storage.w);
  for (const supply of stage.cones) {
    // card-slot = 줄어든 크기만큼 자리를 차지, card = Figma 원래 크기(263×320)를 --card-s배로 축소
    const slot = el('div', 'card-slot', storage);
    const card = el('div', 'card', slot);
    card.dataset.coneId = supply.coneId;
    const count = el('div', 'card-count', card);
    img(countConeSvg, 'card-count-icon', count);
    el('span', 'card-count-text', count).textContent = `${state.storage[supply.coneId] ?? 0}/${supply.count}`;
  }

  // ── 화면에 고정: 안내 띠 (아래쪽 기준, 정적. 흐르는 모션은 나중 단계)
  // C5: 문구 묶음을 여러 번 이어 붙여 왼쪽으로 끊김 없이 흐르게 함(묶음 수·속도는 relayoutShell에서)
  const ticker = el('div', 'ticker', app);
  const tickerTrack = el('div', 'ticker-track', ticker);

  // ── 드래그 중인 콘
  const dragLayer = el('div', 'drag-layer', app);

  // ── 맨 위: 종이 질감
  const paper = el('div', 'paper', app);
  paper.style.backgroundImage = `url(${paperWebp})`;

  return { scroller, scrollContent, stagePlane, board, restart, back, storage, dragLayer, tickerTrack };
}

/** Figma에서 첫 문구가 시작하는 x (Frame 13, 1:645) */
const TICKER_START_X = 671;

/**
 * C5 안내 띠 흐름: 문구 묶음(문구 2개 + 간격)을 화면을 덮을 만큼 반복하고,
 * 묶음 하나 너비만큼 왼쪽으로 이동하는 애니메이션을 끝없이 반복한다(이음매 없음).
 * 시작 위치는 Figma와 같다(첫 문구 x 671).
 */
function layoutTicker(track: HTMLElement): void {
  const make = (): HTMLElement => {
    const g = document.createElement('div');
    g.className = 'ticker-group';
    for (const t of L.ticker.texts) {
      const s = document.createElement('span');
      s.className = 'ticker-text';
      s.textContent = t;
      g.appendChild(s);
    }
    return g;
  };
  track.replaceChildren(make());
  const groupW = (track.firstElementChild as HTMLElement).offsetWidth; // 디자인 px(배율 적용 전)
  if (groupW <= 0) return;
  const startX = TICKER_START_X - groupW;
  const count = Math.ceil((1920 - startX) / groupW) + 1;
  for (let i = 1; i < count; i++) track.appendChild(make());
  track.style.left = `${startX}px`;
  track.style.setProperty('--ticker-shift', String(groupW));
  track.style.animationDuration = `${(groupW / MOTION.tickerSpeed) * 1000}ms`;
}

/**
 * 보관 카드 배율 (사용자 지시, STEP 7 후속):
 * 마지막 카드 아래 끝 ~ 안내 띠 위 끝 간격 = 카드 위 여백(48). 카드 비율(263:320)은 유지.
 * - 카드 3장까지는 화면 안에 다 들어오도록 줄인다. 4장부터는 보관 영역 스크롤(Q37).
 * - 최대 크기 = 1920×1080 화면에서 3장이 딱 맞는 크기(배율 0.9583 → 252×307). 그보다 키우지 않는다(가정).
 */
export function cardScale(viewHDesign: number, tickerH: number, cardCount: number): number {
  const top = L.storage.y;
  const bottomGap = L.storage.y;
  const gap = L.storage.gap;
  const k = Math.max(1, Math.min(cardCount, 3));
  const fit = (viewH: number, tH: number): number => (viewH - top - tH - bottomGap - (k - 1) * gap) / (k * L.storage.cardH);
  return Math.max(0.1, Math.min(1, fit(1080, L.ticker.h), fit(viewHDesign, tickerH)));
}

/** 창 크기가 바뀔 때: 안내 띠 높이, 보관 카드 크기, 스크롤 길이를 다시 맞춘다 */
export function relayoutShell(app: HTMLElement, refs: ShellRefs, stage: StageDef, u: number, viewHDesign: number): void {
  const tickerH = tickerHeight(u);
  const contentH = contentHeight(stage, tickerH);
  app.style.setProperty('--ticker-h', String(tickerH));
  app.style.setProperty('--card-s', String(cardScale(viewHDesign, tickerH, stage.cones.length)));
  refs.stagePlane.style.height = `${contentH}px`;
  refs.scrollContent.style.height = `${contentH * u}px`;
  layoutTicker(refs.tickerTrack); // 글자 크기가 바뀌면 묶음 너비도 바뀜
}
