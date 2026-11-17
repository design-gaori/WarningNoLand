import { BASE_CELL, cellToScreen } from '../logic/grid';
import type { Cell } from '../logic/types';

/**
 * 콘·땅 SVG를 보드에 놓는 규칙 (G-11, B2, Q15). 렌더링 전용.
 *
 * 에셋 공통 규칙(docs/ASSET_REPORT.md 2-1, 3-1에서 측정):
 * - SVG 안의 칸 간격(격자 한 칸) = 226.45 × 141.40 → 보드 기준 칸(198.63)에 맞게 **격자 간격 기준 축소**(B2)
 * - 가장 왼쪽 칸의 중심 x = SVG 왼쪽에서 108.81
 * - 가장 아래 칸의 칸 그림(옆면 포함) 아래 끝 = SVG 아래 끝에서 0.48 위
 * 배치: 가장 왼쪽 칸 중심 ↔ 그 칸의 보드 중심, 가장 아래 칸의 그림 아래 끝 ↔ 그 칸 마름모의 아래 꼭짓점
 * ("칸 하단과 콘 하단이 자석처럼 맞닿음", Q15). 파일별 보정은 하지 않는다(STEP 7 지시 6).
 */
export const ART_LATTICE_W = 226.45;
export const ART_LEFT_CENTER_X = 108.81;
export const ART_BOTTOM_INSET = 0.48;
export const ART_SCALE = BASE_CELL.width / ART_LATTICE_W;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** cells: 오브젝트가 차지한 보드 칸들. 반환: 보드 좌표(원점 = 칸 (0,0) 중심, 기준 칸 단위)의 그림 사각형 */
export function artRect(cells: readonly Cell[], svgW: number, svgH: number): Rect {
  if (cells.length === 0) throw new Error('칸이 없는 오브젝트');
  let left = cells[0] as Cell;
  let bottom = cells[0] as Cell;
  for (const c of cells) {
    if (c.col - c.row < left.col - left.row) left = c;
    if (c.col + c.row > bottom.col + bottom.row) bottom = c;
  }
  const o = { x: 0, y: 0 };
  const lx = cellToScreen(left, o).x;
  const bottomVertexY = cellToScreen(bottom, o).y + BASE_CELL.height / 2;
  return {
    x: lx - ART_LEFT_CENTER_X * ART_SCALE,
    y: bottomVertexY - (svgH - ART_BOTTOM_INSET) * ART_SCALE,
    w: svgW * ART_SCALE,
    h: svgH * ART_SCALE,
  };
}
