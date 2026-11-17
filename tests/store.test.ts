import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../src/game/store';
import { c, makeRules } from './helpers';

// 시작 (0,0) — (1,0)(2,0) — 도착 (3,0)
const rules = makeRules({ cells: [[1, 0], [2, 0], [1, 1]], start: [[0, 0]], end: [[3, 0]], cones: [{ coneId: 'one', count: 2 }, { coneId: 'bar2', count: 1 }] });

describe('상태 저장소 (6-4, 6-5, 4-8, 4-12, 5-11)', () => {
  it('놓으면 수량 −1, 탭하면 회수 +1, 구독자에게 알림', () => {
    const store = createStore(rules);
    const fn = vi.fn();
    store.subscribe(fn);
    const r = store.drop({ from: 'storage', coneId: 'one' }, c(1, 0));
    expect(r.outcome).toBe('placed');
    expect(store.getState().storage.one).toBe(1);
    store.tapReturn(store.getState().placed[0]!.instanceId);
    expect(store.getState().storage.one).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('놓을 때마다 연결 판정을 내부에서 다시 계산', () => {
    const store = createStore(rules);
    expect(store.isConnected()).toBe(false);
    store.drop({ from: 'storage', coneId: 'bar2' }, c(1, 0));
    expect(store.isConnected()).toBe(true);
    const id = store.getState().placed[0]!.instanceId;
    store.drop({ from: 'board', instanceId: id }, null); // 격자 밖 → 보관함
    expect(store.isConnected()).toBe(false);
  });

  it('실패한 놓기는 상태를 바꾸지 않고 알리지도 않음', () => {
    const store = createStore(rules);
    const fn = vi.fn();
    store.subscribe(fn);
    store.drop({ from: 'storage', coneId: 'one' }, c(0, 0)); // 땅
    expect(fn).not.toHaveBeenCalled();
  });

  it('리셋: 모든 콘을 보관함으로', () => {
    const store = createStore(rules);
    store.drop({ from: 'storage', coneId: 'one' }, c(1, 0));
    store.drop({ from: 'storage', coneId: 'one' }, c(1, 1));
    store.reset();
    expect(store.getState().placed).toHaveLength(0);
    expect(store.getState().storage).toEqual({ one: 2, bar2: 1 });
  });
});
