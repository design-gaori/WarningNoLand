import type { Cell } from '../logic/types';

/**
 * 깊이 정렬 (G-8): 화면 아래쪽(앞쪽) 칸의 오브젝트를 나중에 그린다.
 * 기준값 (열 + 행), 같으면 열이 큰 쪽을 나중에.
 * 여러 칸을 차지하는 오브젝트는 **가장 앞쪽 칸**(기준값이 가장 큰 칸)으로 비교한다(해석, STEP 7).
 */
export function frontCell(cells: readonly Cell[]): Cell {
  if (cells.length === 0) throw new Error('칸이 없는 오브젝트');
  let best = cells[0] as Cell;
  for (const c of cells) {
    const s = c.col + c.row;
    const b = best.col + best.row;
    if (s > b || (s === b && c.col > best.col)) best = c;
  }
  return best;
}

export function compareDepth(a: readonly Cell[], b: readonly Cell[]): number {
  const fa = frontCell(a);
  const fb = frontCell(b);
  return fa.col + fa.row - (fb.col + fb.row) || fa.col - fb.col;
}

/** 그리는 순서로 정렬한 새 배열 (뒤 → 앞) */
export function sortForDrawing<T extends { readonly cells: readonly Cell[] }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareDepth(a.cells, b.cells));
}
