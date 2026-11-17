import { describe, expect, it } from 'vitest';
import { anchorForGrab, patternCells } from '../src/logic/placement';
import { createInitialState, dropCone } from '../src/logic/state';
import { c, makeRules, placeAll } from './helpers';

// 격자 (1,0)~(4,0), (1,1)~(4,1) / 시작 (0,0) / 도착 (5,0)
const rules = makeRules({
  cells: [[1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [3, 1], [4, 1]],
  start: [[0, 0]],
  end: [[5, 0]],
  cones: [
    { coneId: 'one', count: 2 },
    { coneId: 'ell3', count: 1 },
  ],
});

describe('놓기 규칙 dropCone (4-7, Q16·Q17·Q24, 질문 3)', () => {
  describe('보관함에서 꺼낸 콘', () => {
    const s0 = createInitialState(rules);
    const src = { from: 'storage', coneId: 'ell3' } as const;

    it('놓을 수 있으면 배치, 수량 −1', () => {
      const r = dropCone(rules, s0, src, c(1, 0));
      expect(r.outcome).toBe('placed');
      expect(r.state.storage.ell3).toBe(0);
    });

    it('포인터가 격자 밖 → 보관함(상태 그대로)', () => {
      expect(dropCone(rules, s0, src, null)).toMatchObject({ outcome: 'to-storage', state: s0 });
    });

    it('포인터는 격자 안이지만 패턴 일부가 격자 밖 → 보관함', () => {
      const r = dropCone(rules, s0, src, c(4, 1)); // (4,1)(5,1)(5,2)
      expect(r).toMatchObject({ outcome: 'to-storage', reason: 'out-of-grid', state: s0 });
    });

    it('땅 칸에 걸침 → 원래 자리(보관함)', () => {
      expect(dropCone(rules, s0, src, c(4, 0))).toMatchObject({ outcome: 'back-to-origin', reason: 'land', state: s0 });
    });
  });

  describe('보드에 놓여 있던 콘', () => {
    const s = placeAll(rules, [['one', 1, 0], ['one', 3, 0]]);
    const id = s.placed[0]!.instanceId; // (1,0)
    const src = { from: 'board', instanceId: id } as const;

    it('빈 칸으로 옮기기', () => {
      const r = dropCone(rules, s, src, c(2, 1));
      expect(r.outcome).toBe('moved');
      expect(r.state.placed[0]!.anchor).toEqual(c(2, 1));
      expect(r.state.storage.one).toBe(0);
    });

    it('포인터가 격자 밖 → 보관함, 수량 +1', () => {
      const r = dropCone(rules, s, src, null);
      expect(r.outcome).toBe('to-storage');
      expect(r.state.placed).toHaveLength(1);
      expect(r.state.storage.one).toBe(1);
    });

    it('완전히 격자 밖 칸 → 보관함, 수량 +1', () => {
      const r = dropCone(rules, s, src, c(9, 9));
      expect(r).toMatchObject({ outcome: 'to-storage', reason: 'out-of-grid' });
      expect(r.state.storage.one).toBe(1);
    });

    it('다른 콘이 있는 칸 → 이전 칸 그대로', () => {
      const r = dropCone(rules, s, src, c(3, 0));
      expect(r).toMatchObject({ outcome: 'back-to-origin', reason: 'occupied', state: s });
    });

    it('땅 칸 → 이전 칸 그대로', () => {
      expect(dropCone(rules, s, src, c(0, 0))).toMatchObject({ outcome: 'back-to-origin', reason: 'land', state: s });
    });
  });
});

describe('잡은 칸 기준 배치 (4-6 보충, 질문 2)', () => {
  it('잡은 패턴 칸이 포인터 칸에 온다', () => {
    const ell3 = rules.cones.get('ell3')!; // (0,0)(1,0)(1,1)
    const grabbed = c(1, 1); // 아래쪽 칸을 잡음
    const pointer = c(3, 1);
    const anchor = anchorForGrab(pointer, grabbed);
    expect(anchor).toEqual(c(2, 0));
    expect(patternCells(ell3, anchor)).toContainEqual(pointer);
  });

  it('기준 칸을 잡으면 기획서 4-6과 같다', () => {
    expect(anchorForGrab(c(4, 2), c(0, 0))).toEqual(c(4, 2));
  });
});
