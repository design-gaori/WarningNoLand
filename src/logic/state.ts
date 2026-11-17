import { checkPlacement, type Rules } from './placement';
import type { ActionFailure, Cell, GameState } from './types';

export type ActionResult =
  | { readonly ok: true; readonly state: GameState; readonly instanceId?: string }
  | { readonly ok: false; readonly state: GameState; readonly reason: ActionFailure };

/** 스테이지 시작 상태: 보드는 비고, 보관함은 처음 수량 (13-8, 리셋도 이 상태) */
export function createInitialState(rules: Rules): GameState {
  const storage: Record<string, number> = {};
  for (const s of rules.stage.cones) storage[s.coneId] = (storage[s.coneId] ?? 0) + s.count;
  return { placed: [], storage, nextInstance: 1 };
}

/** 리셋 버튼 (4-12) — 모든 콘을 보관함으로 */
export const resetState = createInitialState;

/** 보관함에서 꺼내 놓기. 성공하면 보관 수량 −1 (6-4). 실패하면 상태 그대로(보관함으로 돌아감, 4-7). */
export function placeFromStorage(rules: Rules, state: GameState, coneId: string, anchor: Cell): ActionResult {
  if (!rules.cones.has(coneId) || !(coneId in state.storage)) return { ok: false, state, reason: 'unknown-cone' };
  if ((state.storage[coneId] ?? 0) <= 0) return { ok: false, state, reason: 'no-stock' };
  const check = checkPlacement(rules, state, coneId, anchor);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const instanceId = `c${state.nextInstance}`;
  return {
    ok: true,
    instanceId,
    state: {
      placed: [...state.placed, { instanceId, coneId, anchor }],
      storage: { ...state.storage, [coneId]: (state.storage[coneId] ?? 0) - 1 },
      nextInstance: state.nextInstance + 1,
    },
  };
}

/** 놓인 콘을 다른 칸으로 옮기기 (9-3-1). 실패하면 이전 칸에 그대로(4-7). 수량 변화 없음. */
export function moveCone(rules: Rules, state: GameState, instanceId: string, anchor: Cell): ActionResult {
  const pc = state.placed.find((p) => p.instanceId === instanceId);
  if (!pc) return { ok: false, state, reason: 'unknown-instance' };
  const check = checkPlacement(rules, state, pc.coneId, anchor, instanceId);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  return {
    ok: true,
    instanceId,
    state: { ...state, placed: state.placed.map((p) => (p.instanceId === instanceId ? { ...p, anchor } : p)) },
  };
}

export type DropSource =
  | { readonly from: 'storage'; readonly coneId: string }
  | { readonly from: 'board'; readonly instanceId: string };

export type DropOutcome = 'placed' | 'moved' | 'to-storage' | 'back-to-origin';

export interface DropResult {
  readonly state: GameState;
  readonly outcome: DropOutcome;
  /** 놓기에 실패한 이유 (placed·moved가 아닐 때) */
  readonly reason?: ActionFailure;
}

/**
 * 드래그한 콘을 놓았을 때의 규칙 (4-7, Q16·Q17·Q24, LOGIC_NOTES 질문 3 답변).
 * - anchor = null: 포인터가 격자 밖 → 보관함으로
 * - 놓을 수 있음 → 그 자리에 배치/이동
 * - 패턴 일부가 격자 밖(out-of-grid) → 보관함으로
 * - 땅 칸·찬 칸(land, occupied) → 원래 자리로 (보관함에서 꺼냈으면 보관함, 옮기던 콘이면 이전 칸)
 */
export function dropCone(rules: Rules, state: GameState, source: DropSource, anchor: Cell | null): DropResult {
  if (source.from === 'storage') {
    if (anchor === null) return { state, outcome: 'to-storage' };
    const r = placeFromStorage(rules, state, source.coneId, anchor);
    if (r.ok) return { state: r.state, outcome: 'placed' };
    return { state, outcome: r.reason === 'out-of-grid' ? 'to-storage' : 'back-to-origin', reason: r.reason };
  }
  if (anchor === null) {
    const back = returnToStorage(state, source.instanceId);
    return back.ok ? { state: back.state, outcome: 'to-storage' } : { state, outcome: 'back-to-origin', reason: back.reason };
  }
  const r = moveCone(rules, state, source.instanceId, anchor);
  if (r.ok) return { state: r.state, outcome: 'moved' };
  if (r.reason === 'out-of-grid') {
    return { state: returnToStorage(state, source.instanceId).state, outcome: 'to-storage', reason: r.reason };
  }
  return { state, outcome: 'back-to-origin', reason: r.reason };
}

/** 놓인 콘을 보관함으로 (탭 회수 4-9 / 격자 밖에 놓기 Q24). 보관 수량 +1 (6-5). */
export function returnToStorage(state: GameState, instanceId: string): ActionResult {
  const pc = state.placed.find((p) => p.instanceId === instanceId);
  if (!pc) return { ok: false, state, reason: 'unknown-instance' };
  return {
    ok: true,
    state: {
      ...state,
      placed: state.placed.filter((p) => p.instanceId !== instanceId),
      storage: { ...state.storage, [pc.coneId]: (state.storage[pc.coneId] ?? 0) + 1 },
    },
  };
}
