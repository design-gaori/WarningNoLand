import { parseCones, parseStage } from '../src/logic/data';
import { createRules, type Rules } from '../src/logic/placement';
import { createInitialState, placeFromStorage } from '../src/logic/state';
import type { Cell, GameState } from '../src/logic/types';

/** 테스트용 콘: 1칸, 일자 2칸, ㄱ자 3칸 */
export const TEST_CONES = parseCones({
  cones: [
    { id: 'one', pattern: [[0, 0]], asset: { piece: 'p', icon: 'i' } },
    { id: 'bar2', pattern: [[0, 0], [1, 0]], asset: { piece: 'p', icon: 'i' } },
    { id: 'ell3', pattern: [[0, 0], [1, 0], [1, 1]], asset: { piece: 'p', icon: 'i' } },
  ],
});

/** 작은 테스트 스테이지를 만든다. 좌표는 [열, 행]. */
export function makeRules(def: {
  cells: [number, number][];
  start: [number, number][];
  end: [number, number][];
  islands?: [number, number][][];
  cones?: { coneId: string; count: number }[];
}): Rules {
  const stage = parseStage(
    {
      id: 'test',
      name: 'test',
      cells: def.cells,
      start: def.start,
      end: def.end,
      islands: def.islands ?? [],
      cones: def.cones ?? [
        { coneId: 'one', count: 10 },
        { coneId: 'bar2', count: 3 },
        { coneId: 'ell3', count: 2 },
      ],
    },
    TEST_CONES,
  );
  return createRules(stage, TEST_CONES);
}

export const c = (col: number, row: number): Cell => ({ col, row });

/** 여러 콘을 차례로 놓는다. 하나라도 실패하면 예외. */
export function placeAll(rules: Rules, list: [string, number, number][], state?: GameState): GameState {
  let s = state ?? createInitialState(rules);
  for (const [id, col, row] of list) {
    const r = placeFromStorage(rules, s, id, c(col, row));
    if (!r.ok) throw new Error(`배치 실패 ${id} (${col},${row}): ${r.reason}`);
    s = r.state;
  }
  return s;
}
