import { describe, expect, it } from 'vitest';
import { findPath, isConnected } from '../src/logic/connection';
import { areNeighbors } from '../src/logic/grid';
import { createInitialState, moveCone, returnToStorage } from '../src/logic/state';
import { c, makeRules, placeAll } from './helpers';

describe('연결 판정 (5-12, 15-2)', () => {
  // 일자 통로: 시작 (0,0) — (1,0)(2,0)(3,0) — 도착 (4,0)
  const line = makeRules({ cells: [[1, 0], [2, 0], [3, 0]], start: [[0, 0]], end: [[4, 0]] });

  it('콘을 놓기 전에는 연결 안 됨', () => {
    expect(isConnected(line, createInitialState(line))).toBe(false);
  });

  it('콘과 땅이 변을 공유하면 연결, 콘끼리도 변을 공유하면 연결', () => {
    const s = placeAll(line, [['one', 1, 0], ['bar2', 2, 0]]);
    expect(isConnected(line, s)).toBe(true);
  });

  it('한 칸이라도 비면 연결 안 됨 (간격 허용 없음, 5-4)', () => {
    const s = placeAll(line, [['one', 1, 0], ['one', 3, 0]]);
    expect(isConnected(line, s)).toBe(false);
  });

  it('꼭짓점만 닿으면 연결 안 됨 (1-11, 5-10)', () => {
    // 시작 (0,0), 도착 (2,2). 콘 (1,1)은 둘 모두와 꼭짓점만 닿는다.
    const diag = makeRules({ cells: [[1, 1], [1, 0], [2, 1]], start: [[0, 0]], end: [[2, 2]] });
    const s = placeAll(diag, [['one', 1, 1]]);
    expect(isConnected(diag, s)).toBe(false);
    // 변을 공유하는 칸으로 이어 주면 연결: (0,0)-(1,0)-(1,1)-(2,1)-(2,2)
    const s2 = placeAll(diag, [['one', 1, 0], ['one', 2, 1]], s);
    expect(isConnected(diag, s2)).toBe(true);
  });

  it('땅끼리 직접 변을 공유해도 연결 (3-8)', () => {
    const touch = makeRules({ cells: [[0, 1]], start: [[0, 0]], end: [[1, 0]] });
    expect(isConnected(touch, createInitialState(touch))).toBe(true);
  });

  describe('중간 섬', () => {
    // 시작 (0,0) — (1,0)(2,0)(3,0) — 도착 (4,0), 섬 (2,2), 섬으로 가는 칸 (2,1)
    const withIsland = makeRules({
      cells: [[1, 0], [2, 0], [3, 0], [2, 1]],
      start: [[0, 0]],
      end: [[4, 0]],
      islands: [[[2, 2]]],
    });

    it('시작·도착만 잇고 섬을 우회하면 실패', () => {
      const s = placeAll(withIsland, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0]]);
      expect(isConnected(withIsland, s)).toBe(false);
    });

    it('섬까지 이으면 성공', () => {
      const s = placeAll(withIsland, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0], ['one', 2, 1]]);
      expect(isConnected(withIsland, s)).toBe(true);
    });

    it('여러 칸짜리 섬 / 섬이 여러 개: 모든 섬에 닿아야 성공', () => {
      const two = makeRules({
        cells: [[1, 0], [2, 0], [3, 0], [1, 1], [3, 1]],
        start: [[0, 0]],
        end: [[4, 0]],
        islands: [[[1, 2], [1, 3]], [[3, 2]]],
      });
      const base = placeAll(two, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0], ['one', 1, 1]]);
      expect(isConnected(two, base)).toBe(false); // 섬 2에 안 닿음
      const all = placeAll(two, [['one', 3, 1]], base);
      expect(isConnected(two, all)).toBe(true);
    });
  });

  it('콘을 옮겨 연결이 끊어지면 판정이 갱신된다 (5-6, 13-5)', () => {
    const big = makeRules({ cells: [[1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1]], start: [[0, 0]], end: [[4, 0]] });
    let s = placeAll(big, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0]]);
    expect(isConnected(big, s)).toBe(true);
    const mid = s.placed[1]!.instanceId; // (2,0)
    const moved = moveCone(big, s, mid, c(2, 1));
    expect(moved.ok).toBe(true);
    s = moved.state;
    expect(isConnected(big, s)).toBe(false);
    // 회수해도 끊긴 상태
    expect(isConnected(big, returnToStorage(s, mid).state)).toBe(false);
  });

  it('여러 경로: 하나라도 이어지면 성공, 하나를 끊어도 다른 경로로 성공 (5-7, 13-6)', () => {
    // 위 경로 (1,0)(2,0)(3,0), 아래 경로 (1,0)→(1,1)(2,1)(3,1)→(3,0)... 도착 (4,0)
    const two = makeRules({
      cells: [[1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1]],
      start: [[0, 0]],
      end: [[4, 0], [4, 1]],
    });
    const s = placeAll(two, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0], ['one', 1, 1], ['one', 2, 1], ['one', 3, 1]]);
    expect(isConnected(two, s)).toBe(true);
    const cut = returnToStorage(s, s.placed[1]!.instanceId).state; // 위 경로 (2,0) 제거
    expect(isConnected(two, cut)).toBe(true);
  });

  it('여러 칸짜리 도착 땅은 모든 칸이 닿아야 하는데, 땅 칸끼리 이어져 있으면 함께 닿는다', () => {
    const wide = makeRules({ cells: [[1, 0]], start: [[0, 0]], end: [[2, 0], [2, 1]] });
    const s = placeAll(wide, [['one', 1, 0]]);
    expect(isConnected(wide, s)).toBe(true);
  });
});

describe('연결 경로 복원', () => {
  const big = makeRules({ cells: [[1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1]], start: [[0, 0]], end: [[4, 0]] });

  it('연결 안 되면 null', () => {
    expect(findPath(big, createInitialState(big))).toBeNull();
  });

  it('시작 땅 → 도착 땅까지, 이웃 칸만 따라가는 최단 경로', () => {
    const s = placeAll(big, [['one', 1, 0], ['one', 2, 0], ['one', 3, 0], ['one', 1, 1], ['one', 2, 1], ['one', 3, 1]]);
    const path = findPath(big, s)!;
    expect(path[0]).toEqual(c(0, 0));
    expect(path[path.length - 1]).toEqual(c(4, 0));
    expect(path).toHaveLength(5);
    for (let i = 1; i < path.length; i++) expect(areNeighbors(path[i - 1]!, path[i]!)).toBe(true);
  });

  it('중간 섬이 있으면 규칙 미정이라 예외', () => {
    const isl = makeRules({ cells: [[1, 0]], start: [[0, 0]], end: [[2, 0]], islands: [[[1, 1]]] });
    expect(() => findPath(isl, createInitialState(isl))).toThrow();
  });
});
