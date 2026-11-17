import { describe, expect, it } from 'vitest';
import { autoScrollDelta } from '../src/view/interaction';
import { grabbedPatternCell } from '../src/view/grab';
import { TEST_CONES } from './helpers';
import { parseCones } from '../src/logic/data';
import conesJson from '../data/cones.json';

describe('잡은 패턴 칸 찾기 (LOGIC 질문 2)', () => {
  const cones = parseCones(conesJson);
  const tree = cones.find((c) => c.id === 'tree')!; // (0,0)(1,0), SVG 330.85 × 360.86
  const sign = cones.find((c) => c.id === 'sign-board')!; // (0,0)(1,0)(2,0)(0,1), SVG 556.66 × 427.31

  it('트리: 왼쪽 칸 중심을 잡으면 (0,0), 오른쪽 아래 칸 중심을 잡으면 (1,0)', () => {
    const H = 360.86;
    expect(grabbedPatternCell(tree, 330.85, H, { x: 108.81, y: H - 79.12 - 70.7 })).toEqual({ col: 0, row: 0 });
    expect(grabbedPatternCell(tree, 330.85, H, { x: 108.81 + 113.225, y: H - 79.12 })).toEqual({ col: 1, row: 0 });
  });

  it('트리 본체(칸 위로 솟은 부분)를 잡으면 가장 가까운 칸', () => {
    expect(grabbedPatternCell(tree, 330.85, 360.86, { x: 108.81, y: 40 })).toEqual({ col: 0, row: 0 });
  });

  it('표지판: 맨 오른쪽 칸 (2,0)과 왼쪽 아래 칸 (0,1)', () => {
    const W = 556.66;
    const H = 427.31;
    // 가장 왼쪽 칸 = (0,1): 중심 x 108.81, 가장 아래 칸 = (2,0): 중심 y = H − 79.12
    expect(grabbedPatternCell(sign, W, H, { x: 108.81, y: H - 79.12 - 70.7 })).toEqual({ col: 0, row: 1 });
    expect(grabbedPatternCell(sign, W, H, { x: 108.81 + 3 * 113.225, y: H - 79.12 })).toEqual({ col: 2, row: 0 });
  });

  it('(테스트 콘 정의도 읽힘)', () => {
    expect(TEST_CONES.length).toBe(3);
  });
});

describe('드래그 중 자동 스크롤 (Q32)', () => {
  const bottomEdge = 1032; // 1920×1080에서 안내 띠 위 끝

  it('화면 가운데에서는 스크롤하지 않음', () => {
    expect(autoScrollDelta(500, bottomEdge)).toBe(0);
    expect(autoScrollDelta(80, bottomEdge)).toBe(0);
    expect(autoScrollDelta(952, bottomEdge)).toBe(0);
  });

  it('위 끝 80px 안: 위로(음수), 끝에 가까울수록 빠름', () => {
    expect(autoScrollDelta(40, bottomEdge)).toBeCloseTo(-9);
    expect(autoScrollDelta(0, bottomEdge)).toBeCloseTo(-18);
    expect(autoScrollDelta(-50, bottomEdge)).toBeCloseTo(-18);
  });

  it('안내 띠 위 80px 안: 아래로(양수), 띠에 닿으면 최대', () => {
    expect(autoScrollDelta(992, bottomEdge)).toBeCloseTo(9);
    expect(autoScrollDelta(1032, bottomEdge)).toBeCloseTo(18);
    expect(autoScrollDelta(1070, bottomEdge)).toBeCloseTo(18);
  });
});
