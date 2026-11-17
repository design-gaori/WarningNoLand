/**
 * 화면 공통 부품 (렌더링 전용): 하늘 배경, 종이 질감, 흐린 점, 주황 마름모 버튼, 결과 띠.
 */
import paperWebp from '../../assets/img/paper-texture.webp?url';
import restartSvg from '../../assets/svg/figma/restart-button.svg?url';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

export function img(src: string, cls: string, parent: HTMLElement): HTMLImageElement {
  const i = el('img', cls, parent);
  i.src = src;
  i.alt = '';
  i.draggable = false;
  return i;
}

export function place(e: HTMLElement, x: number, y: number, w?: number, h?: number): void {
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
  if (w !== undefined) e.style.width = `${w}px`;
  if (h !== undefined) e.style.height = `${h}px`;
}

/** 하늘 그라디언트 (창 전체) */
export function addSky(app: HTMLElement): HTMLElement {
  return el('div', 'sky', app);
}

/** 1920 기준 디자인 면 (배율 u로 축소·확대, 위쪽 기준). 스크롤 없는 화면용 */
export function addPlane(app: HTMLElement): HTMLElement {
  return el('div', 'plane', app);
}

/** 종이 질감 (맨 위) */
export function addPaper(app: HTMLElement): HTMLElement {
  const paper = el('div', 'paper', app);
  paper.style.backgroundImage = `url(${paperWebp})`;
  return paper;
}

/**
 * 흐린 흰 점 (Figma Ellipse + 흐림). 흐림 정도는 Figma 내보내기 값(지름 34 이하 4, 46 이하 5, 그 이상 6)
 */
export function addDot(parent: HTMLElement, x: number, y: number, d: number): HTMLElement {
  const dot = el('div', 'blur-dot', parent);
  place(dot, x, y, d, d);
  dot.style.filter = `blur(${d <= 34 ? 4 : d <= 46 ? 5 : 6}px)`;
  return dot;
}

/** 주황 마름모 버튼 (RESTART·BACK, Figma 236×147) */
export function addDiamondButton(parent: HTMLElement, label: string, x: number, y: number): HTMLButtonElement {
  const b = el('button', 'diamond-button', parent);
  b.type = 'button';
  place(b, x, y, 236.121, 147.019);
  img(restartSvg, 'diamond-button-bg', b);
  el('span', 'diamond-button-label', b).textContent = label;
  return b;
}

/**
 * 화면 가운데 결과 띠 (Figma gameclear 1920×291 / error 976×148). 종이 질감 아래에 넣는다(UI checklist).
 * 띠가 떠 있는 동안 화면 전체 입력을 막는다(13-9).
 */
export function showBanner(app: HTMLElement, kind: 'clear' | 'error'): HTMLElement {
  const layer = el('div', `banner-layer banner-${kind}`, app);
  const band = el('div', 'banner', layer);
  el('span', 'banner-text', band).textContent = kind === 'clear' ? 'Game Clear!' : '오류가 발생했습니다!';
  const paper = app.querySelector(':scope > .paper');
  if (paper) app.insertBefore(layer, paper);
  return layer;
}
