/**
 * 콘 그림을 잡은 위치 계산 (렌더링·포인터 변환 전용).
 * - 그림 안의 잡은 점(SVG 내부 좌표) → 드래그 중 그 점이 포인터 아래에 오도록 그림을 옮김
 * - 잡은 패턴 칸(기준 칸 대비) → 놓을 때 그 칸이 포인터 칸에 오도록 기준 칸 계산(anchorForGrab, LOGIC 질문 2)
 */
import { screenToFractional } from '../logic/grid';
import { patternCells } from '../logic/placement';
import type { Cell, ConeDef } from '../logic/types';
import { ART_SCALE, artRect } from './coneArt';

/** 그림(중첩 <svg>) 안의 SVG 내부 좌표 */
export function clientToArt(art: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const m = art.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/**
 * SVG 내부 좌표의 점이 콘 패턴의 어느 칸 위인지(기준 칸 대비 상대 좌표).
 * 콘 본체처럼 칸 위로 솟은 곳을 잡으면 가장 가까운 패턴 칸으로 정한다.
 */
export function grabbedPatternCell(cone: ConeDef, artW: number, artH: number, svgPoint: { x: number; y: number }): Cell {
  const cells = patternCells(cone, { col: 0, row: 0 });
  const r = artRect(cells, artW, artH);
  const board = { x: r.x + svgPoint.x * ART_SCALE, y: r.y + svgPoint.y * ART_SCALE };
  const f = screenToFractional(board, { x: 0, y: 0 });
  let best = cells[0] as Cell;
  let bestD = Infinity;
  for (const c of cells) {
    const d = Math.hypot(f.col - c.col, f.row - c.row);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}
