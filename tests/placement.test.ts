import { describe, expect, it } from 'vitest';
import { checkPlacement } from '../src/logic/placement';
import { createInitialState, moveCone, placeFromStorage, resetState, returnToStorage } from '../src/logic/state';
import { c, makeRules, placeAll } from './helpers';

// 격자: (1,0)~(4,0), (1,1)~(4,1). 시작 땅 (0,0), 도착 땅 (5,0)
const rules = makeRules({
  cells: [[1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [3, 1], [4, 1]],
  start: [[0, 0]],
  end: [[5, 0]],
  cones: [
    { coneId: 'one', count: 2 },
    { coneId: 'bar2', count: 1 },
    { coneId: 'ell3', count: 1 },
  ],
});

describe('배치 검증 (4-1, 4-7, 15-1)', () => {
  const s0 = createInitialState(rules);

  it('패턴 전체가 격자 안 빈 칸이면 가능', () => {
    expect(checkPlacement(rules, s0, 'bar2', c(1, 0)).ok).toBe(true);
    expect(checkPlacement(rules, s0, 'ell3', c(2, 0)).ok).toBe(true); // (2,0)(3,0)(3,1)
  });

  it('패턴 일부가 격자 밖이면 불가', () => {
    const r = checkPlacement(rules, s0, 'ell3', c(3, 1)); // (3,1)(4,1)(4,2) ← (4,2) 밖
    expect(r).toMatchObject({ ok: false, reason: 'out-of-grid' });
  });

  it('완전히 격자 밖이면 불가', () => {
    expect(checkPlacement(rules, s0, 'one', c(9, 9))).toMatchObject({ ok: false, reason: 'out-of-grid' });
  });

  it('땅 칸에 걸치면 불가 (4-5, 13-2)', () => {
    expect(checkPlacement(rules, s0, 'bar2', c(4, 0))).toMatchObject({ ok: false, reason: 'land' }); // (5,0) 도착 땅
    expect(checkPlacement(rules, s0, 'one', c(0, 0))).toMatchObject({ ok: false, reason: 'land' }); // 시작 땅
  });

  it('이미 찬 칸이면 불가 (4-4, 13-1)', () => {
    const s = placeAll(rules, [['one', 2, 0]]);
    expect(checkPlacement(rules, s, 'bar2', c(1, 0))).toMatchObject({ ok: false, reason: 'occupied' });
  });
});

describe('수량 관리 (6-4, 6-5, 15-1)', () => {
  it('처음에는 남은 수 = 처음 수량', () => {
    expect(createInitialState(rules).storage).toEqual({ one: 2, bar2: 1, ell3: 1 });
  });

  it('보관함에서 놓으면 −1, 회수하면 +1', () => {
    const r1 = placeFromStorage(rules, createInitialState(rules), 'one', c(1, 0));
    expect(r1.ok).toBe(true);
    expect(r1.state.storage.one).toBe(1);
    const id = r1.ok ? (r1.instanceId as string) : '';
    const r2 = returnToStorage(r1.state, id);
    expect(r2.ok).toBe(true);
    expect(r2.state.storage.one).toBe(2);
    expect(r2.state.placed).toHaveLength(0);
  });

  it('남은 수가 0이면 더 놓을 수 없다', () => {
    const s = placeAll(rules, [['bar2', 1, 0]]);
    expect(s.storage.bar2).toBe(0);
    expect(placeFromStorage(rules, s, 'bar2', c(1, 1))).toMatchObject({ ok: false, reason: 'no-stock' });
  });

  it('배치 실패 시 상태·수량은 그대로 (보관함으로 돌아감, 4-7)', () => {
    const s0 = createInitialState(rules);
    const r = placeFromStorage(rules, s0, 'one', c(0, 0));
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s0);
  });

  it('옮기기는 수량을 바꾸지 않는다', () => {
    const s = placeAll(rules, [['one', 1, 0]]);
    const id = s.placed[0]!.instanceId;
    const r = moveCone(rules, s, id, c(3, 1));
    expect(r.ok).toBe(true);
    expect(r.state.storage.one).toBe(1);
    expect(r.state.placed[0]!.anchor).toEqual(c(3, 1));
  });

  it('옮길 곳이 불가하면 이전 칸에 그대로 (4-7)', () => {
    const s = placeAll(rules, [['one', 1, 0], ['one', 2, 0]]);
    const id = s.placed[0]!.instanceId;
    const r = moveCone(rules, s, id, c(2, 0)); // 다른 콘이 있음
    expect(r).toMatchObject({ ok: false, reason: 'occupied' });
    expect(r.state.placed[0]!.anchor).toEqual(c(1, 0));
  });

  it('자기 자신과 겹치게 옮기는 것은 가능 (bar2를 한 칸 오른쪽으로)', () => {
    const s = placeAll(rules, [['bar2', 1, 0]]);
    const r = moveCone(rules, s, s.placed[0]!.instanceId, c(2, 0));
    expect(r.ok).toBe(true);
  });

  it('리셋하면 모든 콘이 보관함으로, 수량 원래대로 (4-12)', () => {
    const s = placeAll(rules, [['one', 1, 0], ['bar2', 1, 1], ['ell3', 2, 0]]);
    const r = resetState(rules);
    expect(r.placed).toHaveLength(0);
    expect(r.storage).toEqual({ one: 2, bar2: 1, ell3: 1 });
    expect(s.placed).toHaveLength(3); // 이전 상태는 바뀌지 않음(불변)
  });
});
