import { cellKey, neighbors } from './grid';
import { occupancy, type Rules } from './placement';
import type { Cell, GameState } from './types';

/** 채워진 칸 = 땅(시작·도착·섬) 칸 + 콘이 차지한 칸 (5-3) */
export function filledKeys(rules: Rules, state: GameState): Set<string> {
  const set = new Set(rules.landKeys);
  for (const k of occupancy(rules, state).keys()) set.add(k);
  return set;
}

const parseKey = (k: string): Cell => {
  const [c, r] = k.split(',').map(Number);
  return { col: c as number, row: r as number };
};

/** 시작 땅의 모든 칸에서 출발해, 채워진 칸만 따라 이웃(G-4)으로 퍼지는 BFS. 닿은 칸 key와 직전 칸을 돌려준다. */
function bfsFromStart(rules: Rules, filled: ReadonlySet<string>): Map<string, string | null> {
  const prev = new Map<string, string | null>();
  const queue: string[] = [];
  for (const c of rules.stage.start) {
    const k = cellKey(c);
    prev.set(k, null);
    queue.push(k);
  }
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as string;
    for (const n of neighbors(parseKey(cur))) {
      const nk = cellKey(n);
      if (filled.has(nk) && !prev.has(nk)) {
        prev.set(nk, cur);
        queue.push(nk);
      }
    }
  }
  return prev;
}

/**
 * 연결 판정 (1-4, 5-12).
 * 시작 땅에서 BFS로 닿은 칸에 도착 땅과 모든 중간 섬의 칸이 전부 들어 있으면 연결.
 */
export function isConnected(rules: Rules, state: GameState): boolean {
  const reached = bfsFromStart(rules, filledKeys(rules, state));
  const targets = [...rules.stage.end, ...rules.stage.islands.flat()];
  return targets.every((c) => reached.has(cellKey(c)));
}

/**
 * 연결 경로 복원: 시작 땅 → 도착 땅까지 채워진 칸을 따라가는 최단 경로(칸 순서).
 * 연결되지 않았으면 null.
 * 중간 섬이 있는 스테이지의 경로 규칙은 아직 정해지지 않아(질문 중) 지원하지 않는다 → 예외.
 */
export function findPath(rules: Rules, state: GameState): Cell[] | null {
  if (rules.stage.islands.length > 0) {
    throw new Error('중간 섬이 있는 스테이지의 경로 규칙은 아직 정해지지 않았습니다');
  }
  const prev = bfsFromStart(rules, filledKeys(rules, state));
  let best: string | null = null;
  // BFS 순서상 먼저 닿은(=가장 가까운) 도착 칸
  for (const k of prev.keys()) {
    if (rules.stage.end.some((c) => cellKey(c) === k)) {
      best = k;
      break;
    }
  }
  if (best === null) return null;
  const path: Cell[] = [];
  for (let k: string | null = best; k !== null; k = prev.get(k) ?? null) path.unshift(parseKey(k));
  return path;
}
