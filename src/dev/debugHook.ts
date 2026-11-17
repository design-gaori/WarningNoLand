/**
 * 개발 모드 전용 확인 도구 (배포 빌드에 포함되지 않음).
 * 브라우저 콘솔·자동 확인 스크립트에서 window.__ttang 으로 상태를 읽고, 칸의 화면 위치를 얻는다.
 */
import type { GameStore } from '../game/store';
import { cellToScreen } from '../logic/grid';
import type { Cell } from '../logic/types';
import type { BoardView } from '../view/board';

export function installDebugHook(d: { store: GameStore; board: BoardView; scroller: HTMLElement }): void {
  const api = {
    store: d.store,
    connected: () => d.store.isConnected(),
    /** 칸 중심의 브라우저 좌표 (보드 SVG 행렬 사용) */
    cellToClient(cell: Cell): { x: number; y: number } {
      const p = cellToScreen(cell, { x: 0, y: 0 });
      const m = d.board.svg.getScreenCTM();
      if (!m) return { x: NaN, y: NaN };
      const q = new DOMPoint(p.x, p.y).matrixTransform(m);
      return { x: q.x, y: q.y };
    },
    clientToCell: (x: number, y: number) => d.board.clientToCell(x, y),
    scroller: d.scroller,
  };
  (window as unknown as { __ttang: typeof api }).__ttang = api;
}
