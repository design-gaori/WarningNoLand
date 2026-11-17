/**
 * 게임 상태 저장소 (상태 관리 층). 로직(logic/)만 호출하고 화면은 모른다.
 * 화면은 subscribe로 바뀐 상태를 받아 다시 그린다.
 */
import { isConnected } from '../logic/connection';
import type { Rules } from '../logic/placement';
import { createInitialState, dropCone, resetState, returnToStorage, type DropResult, type DropSource } from '../logic/state';
import type { Cell, GameState } from '../logic/types';

export type Listener = (state: GameState) => void;

export interface GameStore {
  readonly rules: Rules;
  getState(): GameState;
  /** 연결 판정 결과(5-11: 내부적으로만 계산, 화면에는 표시하지 않음) */
  isConnected(): boolean;
  subscribe(fn: Listener): () => void;
  /** 드래그해서 놓기. anchor = null이면 포인터가 격자 밖 */
  drop(source: DropSource, anchor: Cell | null): DropResult;
  /** 배치된 콘 탭 → 보관함 (4-8, 4-9) */
  tapReturn(instanceId: string): void;
  /** 리셋 버튼 (4-12) */
  reset(): void;
  /** 개발 모드 테스트 배치 등에서 상태를 통째로 바꿀 때 */
  replace(state: GameState): void;
}

export function createStore(rules: Rules, initial: GameState = createInitialState(rules)): GameStore {
  let state = initial;
  let connected = isConnected(rules, state);
  const listeners = new Set<Listener>();

  const set = (next: GameState): void => {
    if (next === state) return;
    state = next;
    connected = isConnected(rules, state); // 놓거나 회수할 때마다 다시 계산 (5-11)
    for (const fn of listeners) fn(state);
  };

  return {
    rules,
    getState: () => state,
    isConnected: () => connected,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    drop(source, anchor) {
      const r = dropCone(rules, state, source, anchor);
      set(r.state);
      return r;
    },
    tapReturn(instanceId) {
      const r = returnToStorage(state, instanceId);
      if (r.ok) set(r.state);
    },
    reset() {
      set(resetState(rules));
    },
    replace(next) {
      set(next);
    },
  };
}
