import { cellKey } from './grid';
import type { Cell, ConeDef, GameState, PlacementFailure, StageDef } from './types';

/** 규칙 계산에 필요한 고정 정보 (스테이지 + 콘 정의) */
export interface Rules {
  readonly stage: StageDef;
  readonly cones: ReadonlyMap<string, ConeDef>;
  readonly gridKeys: ReadonlySet<string>;
  readonly landKeys: ReadonlySet<string>;
}

export function createRules(stage: StageDef, cones: readonly ConeDef[]): Rules {
  const landCells = [...stage.start, ...stage.end, ...stage.islands.flat()];
  return {
    stage,
    cones: new Map(cones.map((c) => [c.id, c])),
    gridKeys: new Set(stage.cells.map(cellKey)),
    landKeys: new Set(landCells.map(cellKey)),
  };
}

/** 기준 칸을 anchor에 두었을 때 콘이 차지하는 칸들 */
export function patternCells(cone: ConeDef, anchor: Cell): Cell[] {
  return cone.pattern.map((p) => ({ col: anchor.col + p.col, row: anchor.row + p.row }));
}

/**
 * 잡은 칸 기준 배치 (4-6 보충, LOGIC_NOTES 질문 2 답변):
 * 콘의 패턴 칸 grabbed(기준 칸 대비 상대 좌표)를 잡고 끌었다면,
 * 그 칸이 포인터 칸에 오도록 기준 칸 위치를 정한다.
 */
export function anchorForGrab(pointerCell: Cell, grabbed: Cell): Cell {
  return { col: pointerCell.col - grabbed.col + 0, row: pointerCell.row - grabbed.row + 0 };
}

/** 칸 key → 그 칸을 차지한 콘 instanceId */
export function occupancy(rules: Rules, state: GameState): Map<string, string> {
  const map = new Map<string, string>();
  for (const pc of state.placed) {
    const cone = rules.cones.get(pc.coneId);
    if (!cone) continue;
    for (const c of patternCells(cone, pc.anchor)) map.set(cellKey(c), pc.instanceId);
  }
  return map;
}

export type PlacementCheck =
  | { readonly ok: true; readonly cells: Cell[] }
  | { readonly ok: false; readonly reason: PlacementFailure; readonly cells: Cell[] };

/**
 * 배치 검증 (4-1, 4-4, 4-5, 4-7).
 * 패턴의 모든 칸이 격자 안의 빈 칸이어야 한다.
 * 실패 이유 우선순위: 땅 칸(land) → 격자 밖(out-of-grid) → 다른 콘이 있는 칸(occupied).
 * ignoreInstanceId: 옮기는 중인 콘 자신은 빈 칸으로 본다.
 */
export function checkPlacement(
  rules: Rules,
  state: GameState,
  coneId: string,
  anchor: Cell,
  ignoreInstanceId?: string,
): PlacementCheck {
  const cone = rules.cones.get(coneId);
  if (!cone) throw new Error(`알 수 없는 콘: ${coneId}`);
  const cells = patternCells(cone, anchor);
  const keys = cells.map(cellKey);
  if (keys.some((k) => rules.landKeys.has(k))) return { ok: false, reason: 'land', cells };
  if (keys.some((k) => !rules.gridKeys.has(k))) return { ok: false, reason: 'out-of-grid', cells };
  const occ = occupancy(rules, state);
  if (keys.some((k) => occ.has(k) && occ.get(k) !== ignoreInstanceId)) return { ok: false, reason: 'occupied', cells };
  return { ok: true, cells };
}
