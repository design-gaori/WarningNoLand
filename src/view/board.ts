/**
 * 보드 SVG 렌더러.
 * 칸 좌표 → 보드 좌표 변환은 logic/grid의 cellToScreen만 사용한다.
 * 보드 좌표계: 원점 = 칸 (0,0) 중심, 단위 = 기준 칸(0.기본틀, 198.63 × 124.04).
 * 이 SVG를 담은 .board 요소 하나의 배율로 보드 전체가 확대·축소된다(G-7).
 */
import { BASE_CELL, cellToScreen, screenToCell, type Point } from '../logic/grid';
import { patternCells, type Rules } from '../logic/placement';
import type { Cell, GameState } from '../logic/types';
import { artRect } from './coneArt';
import type { ViewConfig } from './config';
import { sortForDrawing } from './depth';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 콘·땅 SVG 원문을 필요할 때만 불러온다(쓰지 않는 콘은 받지 않음) */
const pieceLoaders = import.meta.glob('../../assets/svg/piece/*.svg', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const iconLoaders = import.meta.glob('../../assets/svg/icon/*.svg', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

/** 시작·도착 땅 그림 = icon/safety-cone.svg (A1) */
const LAND_ART = 'safety-cone';

export interface ArtSource {
  readonly el: SVGSVGElement;
  readonly w: number;
  readonly h: number;
}

const artCache = new Map<string, Promise<ArtSource>>();

/** SVG 그림 불러오기(한 번 불러온 것은 재사용) */
export function loadArt(kind: 'piece' | 'icon', name: string): Promise<ArtSource> {
  const key = `${kind}/${name}`;
  const hit = artCache.get(key);
  if (hit) return hit;
  const p = (async () => {
    const loaders = kind === 'piece' ? pieceLoaders : iconLoaders;
    const load = loaders[`../../assets/svg/${kind}/${name}.svg`];
    if (!load) throw new Error(`그림 없음: ${key}`);
    const text = await load();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const el = doc.documentElement as unknown as SVGSVGElement;
    const vb = (el.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n))) throw new Error(`viewBox 없음: ${key}`);
    return { el, w: vb[2] as number, h: vb[3] as number };
  })();
  artCache.set(key, p);
  return p;
}

/** 불러온 그림을 문서에 넣을 수 있는 새 <svg>로 복제 */
export function cloneArt(art: ArtSource, x: number, y: number, w: number, h: number): SVGSVGElement {
  const node = document.importNode(art.el, true) as SVGSVGElement;
  node.removeAttribute('id');
  node.setAttribute('x', String(x));
  node.setAttribute('y', String(y));
  node.setAttribute('width', String(w));
  node.setAttribute('height', String(h));
  return node;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

function diamondPoints(c: Cell): string {
  const p = cellToScreen(c, { x: 0, y: 0 });
  const hw = BASE_CELL.width / 2;
  const hh = BASE_CELL.height / 2;
  return `${p.x},${p.y - hh} ${p.x + hw},${p.y} ${p.x},${p.y + hh} ${p.x - hw},${p.y}`;
}

export interface BoardView {
  readonly svg: SVGSVGElement;
  /** 상태가 바뀌면 콘·땅 층을 다시 그린다. hiddenInstance = 드래그 중이라 숨길 콘 */
  render(state: GameState, hiddenInstance?: string): Promise<void>;
  /** 드래그 중 미리보기: 콘이 놓일 격자 칸을 흰색으로 채운다(Q23). null이면 지움 */
  setPreview(cells: readonly Cell[] | null): void;
  /** 브라우저 좌표 → 보드 좌표 (배율·스크롤·회전을 모두 반영, SVG 행렬 사용) */
  clientToBoard(clientX: number, clientY: number): Point;
  /** 브라우저 좌표 → 칸 */
  clientToCell(clientX: number, clientY: number): Cell;
}

/**
 * @param boardScale 보드 → 디자인 px 배율. 격자선 굵기(Figma 3px)를 보드 단위로 바꾸는 데만 쓴다.
 */
export function createBoardView(host: HTMLElement, rules: Rules, config: ViewConfig, boardScale: number): BoardView {
  const stage = rules.stage;
  const lands = [...stage.start, ...stage.end, ...stage.islands.flat()];
  if (stage.islands.length > 0) {
    // 섬 그래픽은 아직 정해지지 않았다(BOARD_NOTES 질문 1). 섬 칸은 격자선만 그린다.
    console.warn('[board] 중간 섬 그래픽이 정해지지 않아 섬은 격자선만 그립니다.');
  }

  const pts = [...stage.cells, ...lands].map((c) => cellToScreen(c, { x: 0, y: 0 }));
  const pad = BASE_CELL.width * 1.5;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad * 2;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;

  const root = svg('svg', {
    class: 'board-svg',
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    width: maxX - minX,
    height: maxY - minY,
  });
  root.style.left = `${minX}px`;
  root.style.top = `${minY}px`;
  host.appendChild(root);

  // 격자선 (G-6): Figma — 흰색 3px 테두리, 채우기 없음. 빈 칸과 땅 칸 모두
  const grid = svg('g', { class: 'grid', fill: 'none', stroke: '#ffffff', 'stroke-width': 3 / boardScale, 'stroke-miterlimit': 10 }, root);
  if (!config.showGridLines) grid.setAttribute('display', 'none');
  for (const c of [...stage.cells, ...lands]) svg('polygon', { points: diamondPoints(c) }, grid);

  // 미리보기(Q23): 격자 칸을 흰색으로 채움. 격자선 아래·콘 아래
  const preview = svg('g', { class: 'preview', fill: '#ffffff' }, root);
  root.insertBefore(preview, grid);

  const objects = svg('g', { class: 'objects' }, root);

  return {
    svg: root,
    async render(state, hiddenInstance) {
      const items: { cells: Cell[]; art: Promise<ArtSource>; kind: 'land' | 'cone'; id: string }[] = [];
      for (const c of [...stage.start, ...stage.end]) {
        items.push({ cells: [c], art: loadArt('icon', LAND_ART), kind: 'land', id: `land-${c.col}-${c.row}` });
      }
      for (const pc of state.placed) {
        const cone = rules.cones.get(pc.coneId);
        if (!cone) continue;
        items.push({ cells: patternCells(cone, pc.anchor), art: loadArt('piece', cone.id), kind: 'cone', id: pc.instanceId });
      }
      const sorted = sortForDrawing(items);
      const arts = await Promise.all(sorted.map((i) => i.art));
      objects.replaceChildren();
      sorted.forEach((item, i) => {
        const art = arts[i] as ArtSource;
        const r = artRect(item.cells, art.w, art.h);
        const node = cloneArt(art, r.x, r.y, r.w, r.h);
        node.setAttribute('class', `art art-${item.kind}`);
        node.dataset.objectId = item.id;
        if (item.kind === 'cone') node.dataset.instanceId = item.id;
        if (item.id === hiddenInstance) node.style.visibility = 'hidden';
        objects.appendChild(node);
      });
    },
    setPreview(cells) {
      preview.replaceChildren();
      if (!cells) return;
      for (const c of cells) svg('polygon', { points: diamondPoints(c) }, preview);
    },
    clientToBoard(clientX, clientY) {
      const m = root.getScreenCTM();
      if (!m) return { x: NaN, y: NaN };
      const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    },
    clientToCell(clientX, clientY) {
      const p = this.clientToBoard(clientX, clientY);
      return screenToCell(p, { x: 0, y: 0 });
    },
  };
}
