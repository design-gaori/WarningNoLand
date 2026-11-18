/**
 * 콘 조작 (STEP 8): Pointer Events로 마우스·터치를 같은 코드로 처리.
 * 화면 좌표는 여기서 칸 좌표로 바꾼 뒤 상태 저장소(store)에 넘긴다. 게임 규칙은 logic/에만 있다.
 *
 * 규칙 출처
 * - 드래그 시작: 5px 이상 움직이면 드래그, 아니면 탭 (9-2-2)
 * - 탭: 배치된 콘 → 보관함 (4-8, 4-9) / 보관함 콘 → 아무 일 없음 (Q16)
 * - 놓을 위치: 잡은 칸이 포인터 칸에 오도록 (anchorForGrab, LOGIC 질문 2)
 * - 놓기 결과: dropCone (격자 밖·보관 영역 → 보관함, 땅·찬 칸 → 원래 자리; Q17·Q24·LOGIC 질문 3)
 * - 미리보기: 놓일 격자 칸을 흰색으로 (Q23)
 * - 입력 취소(pointercancel 등) → 원래 자리 (13-4, 9-2-7)
 * - 한 번에 하나만, 멀티터치 무시 (13-9)
 * - 드래그 중 화면 위·아래 끝 근처에서 자동 스크롤 (Q32)
 */
import { cellKey } from '../logic/grid';
import { anchorForGrab, patternCells } from '../logic/placement';
import type { DropResult, DropSource } from '../logic/state';
import type { Cell, ConeDef } from '../logic/types';
import type { GameStore } from '../game/store';
import type { BoardView } from './board';
import { ART_SCALE } from './coneArt';
import { clientToArt, grabbedPatternCell } from './grab';
import { clientToApp, type Viewport } from './viewport';

const TAP_SLOP_PX = 5;
const AUTO_SCROLL_EDGE_PX = 80;
const AUTO_SCROLL_MAX_PX = 18;

export interface InteractionDeps {
  readonly app: HTMLElement;
  readonly store: GameStore;
  readonly board: BoardView;
  readonly storageEl: HTMLElement;
  readonly scroller: HTMLElement;
  readonly dragLayer: HTMLElement;
  readonly boardScale: number;
  readonly getViewport: () => { vp: Viewport; winW: number };
  /** 바뀐 상태를 다시 그리기(드래그 중 숨길 콘 지정) */
  readonly rerender: (hiddenInstance?: string) => void;
  /** 안내 띠 높이(디자인 px) — 아래쪽 자동 스크롤 경계 */
  readonly getTickerH: () => number;
  /** 놓기가 끝난 뒤(연출·소리용, 판정에는 관여하지 않음) */
  readonly onDrop?: (source: DropSource, result: DropResult) => void;
}

/**
 * 자동 스크롤 한 프레임의 이동량(px, 앱 세로 방향). 0이면 스크롤 안 함 (Q32)
 * @param y 포인터의 앱 세로 좌표(px)  @param bottomEdge 안내 띠 위 끝(px)
 */
export function autoScrollDelta(y: number, bottomEdge: number): number {
  if (y < AUTO_SCROLL_EDGE_PX) return -AUTO_SCROLL_MAX_PX * (1 - Math.max(0, y) / AUTO_SCROLL_EDGE_PX);
  const start = bottomEdge - AUTO_SCROLL_EDGE_PX;
  if (y > start) return AUTO_SCROLL_MAX_PX * Math.min(1, (y - start) / AUTO_SCROLL_EDGE_PX);
  return 0;
}

interface Session {
  readonly pointerId: number;
  readonly source: DropSource;
  readonly cone: ConeDef;
  readonly artEl: SVGSVGElement;
  readonly artW: number;
  readonly artH: number;
  readonly svgPoint: { x: number; y: number };
  readonly grabbed: Cell;
  readonly startX: number;
  readonly startY: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
  ghost?: SVGSVGElement;
  raf?: number;
}

export interface InteractionHandle {
  isBusy(): boolean;
  /** false면 새 조작을 받지 않는다 (결과 띠 표시 중, 13-9) */
  setEnabled(on: boolean): void;
  /** 화면을 떠날 때 이벤트 해제 */
  destroy(): void;
}

export function installInteraction(d: InteractionDeps): InteractionHandle {
  let s: Session | null = null;
  let enabled = true;
  const { store } = d;
  const ac = new AbortController();
  const signal = ac.signal;

  const findArt = (target: EventTarget | null): SVGSVGElement | null => {
    if (!(target instanceof Element)) return null;
    return target.closest<SVGSVGElement>('svg.art-cone, svg.art-storage');
  };

  // 콘 위에서 시작한 터치는 화면 스크롤 대신 드래그 (Q33)
  d.app.addEventListener(
    'touchstart',
    (e) => {
      if (findArt(e.target)) e.preventDefault();
    },
    { passive: false, signal },
  );

  const isOverStorage = (x: number, y: number): boolean => {
    const r = d.storageEl.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  /** 지금 포인터 위치에서 놓으면 기준 칸이 어디인지. null = 격자 밖(또는 보관 영역 위) */
  const targetAnchor = (sess: Session, x: number, y: number): Cell | null => {
    if (isOverStorage(x, y)) return null;
    const pc = d.board.clientToCell(x, y);
    const k = cellKey(pc);
    if (!store.rules.gridKeys.has(k) && !store.rules.landKeys.has(k)) return null;
    return anchorForGrab(pc, sess.grabbed);
  };

  const updatePreview = (sess: Session): void => {
    const anchor = targetAnchor(sess, sess.lastX, sess.lastY);
    if (!anchor) {
      d.board.setPreview(null);
      return;
    }
    const cells = patternCells(sess.cone, anchor).filter((c) => store.rules.gridKeys.has(cellKey(c)));
    d.board.setPreview(cells);
  };

  const moveGhost = (sess: Session): void => {
    if (!sess.ghost) return;
    const { vp, winW } = d.getViewport();
    const p = clientToApp(vp, winW, sess.lastX, sess.lastY);
    const k = ART_SCALE * d.boardScale * vp.u; // SVG 내부 1 → 화면 px
    sess.ghost.style.left = `${p.x - sess.svgPoint.x * k}px`;
    sess.ghost.style.top = `${p.y - sess.svgPoint.y * k}px`;
    sess.ghost.style.width = `${sess.artW * k}px`;
    sess.ghost.style.height = `${sess.artH * k}px`;
  };

  const autoScroll = (): void => {
    if (!s || !s.dragging) return;
    const { vp, winW } = d.getViewport();
    const p = clientToApp(vp, winW, s.lastX, s.lastY);
    const dy = autoScrollDelta(p.y, vp.appH - d.getTickerH() * vp.u);
    if (dy !== 0) {
      const before = d.scroller.scrollTop;
      d.scroller.scrollTop = before + dy;
      if (d.scroller.scrollTop !== before) updatePreview(s);
    }
    s.raf = requestAnimationFrame(autoScroll);
  };

  const beginDrag = (sess: Session): void => {
    sess.dragging = true;
    const ghost = sess.artEl.cloneNode(true) as SVGSVGElement;
    ghost.removeAttribute('x');
    ghost.removeAttribute('y');
    ghost.setAttribute('class', 'drag-ghost');
    ghost.style.visibility = 'visible';
    d.dragLayer.appendChild(ghost);
    sess.ghost = ghost;
    moveGhost(sess);
    if (sess.source.from === 'board') d.rerender(sess.source.instanceId);
    updatePreview(sess);
    sess.raf = requestAnimationFrame(autoScroll);
  };

  const finish = (): void => {
    const sess = s;
    if (!sess) return;
    s = null; // 먼저 비워서 lostpointercapture가 다시 들어와도 무시되게
    if (sess.raf !== undefined) cancelAnimationFrame(sess.raf);
    sess.ghost?.remove();
    d.board.setPreview(null);
    if (d.app.hasPointerCapture(sess.pointerId)) d.app.releasePointerCapture(sess.pointerId);
    d.rerender();
  };

  d.app.addEventListener('pointerdown', (e) => {
    if (s || !enabled) return; // 한 번에 하나만, 결과 띠 중에는 막음 (13-9)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const artEl = findArt(e.target);
    if (!artEl) return;

    let source: DropSource;
    let coneId: string;
    if (artEl.classList.contains('art-storage')) {
      coneId = artEl.dataset.coneId ?? '';
      if ((store.getState().storage[coneId] ?? 0) <= 0) return; // 남은 수 0
      source = { from: 'storage', coneId };
    } else {
      const instanceId = artEl.dataset.instanceId ?? '';
      const pc = store.getState().placed.find((p) => p.instanceId === instanceId);
      if (!pc) return;
      coneId = pc.coneId;
      source = { from: 'board', instanceId };
    }
    const cone = store.rules.cones.get(coneId);
    if (!cone) return;

    const vb = artEl.viewBox.baseVal;
    const svgPoint = clientToArt(artEl, e.clientX, e.clientY);
    s = {
      pointerId: e.pointerId,
      source,
      cone,
      artEl,
      artW: vb.width,
      artH: vb.height,
      svgPoint,
      grabbed: grabbedPatternCell(cone, vb.width, vb.height, svgPoint),
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      dragging: false,
    };
    try {
      // 포인터가 창 밖으로 나가도 이벤트를 계속 받는다
      d.app.setPointerCapture(e.pointerId);
    } catch {
      // 캡처할 수 없는 포인터(합성 이벤트 등)는 캡처 없이 진행
    }
    e.preventDefault();
  }, { signal });

  d.app.addEventListener('pointermove', (e) => {
    if (!s || e.pointerId !== s.pointerId) return;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    if (!s.dragging) {
      if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < TAP_SLOP_PX) return;
      beginDrag(s);
      return;
    }
    moveGhost(s);
    updatePreview(s);
  }, { signal });

  d.app.addEventListener('pointerup', (e) => {
    if (!s || e.pointerId !== s.pointerId) return;
    const sess = s;
    if (!sess.dragging) {
      if (sess.source.from === 'board') store.tapReturn(sess.source.instanceId); // 탭 회수
      finish();
      return;
    }
    const anchor = targetAnchor(sess, e.clientX, e.clientY);
    const result = store.drop(sess.source, anchor);
    d.onDrop?.(sess.source, result);
    finish();
  }, { signal });

  // 입력 취소 → 원래 자리 (13-4, 9-2-7)
  const cancel = (e: PointerEvent): void => {
    if (!s || e.pointerId !== s.pointerId) return;
    finish();
  };
  d.app.addEventListener('pointercancel', cancel, { signal });
  d.app.addEventListener('lostpointercapture', cancel, { signal });

  return {
    isBusy: () => s !== null,
    setEnabled(on) {
      enabled = on;
    },
    destroy() {
      finish();
      ac.abort();
    },
  };
}
