import { describe, expect, it } from 'vitest';
import {
  BASE_CELL,
  areNeighbors,
  cellToScreen,
  isInsideDiamond,
  neighbors,
  screenToCell,
} from '../src/logic/grid';
import { c } from './helpers';

const O = { x: 500, y: 300 };
const W = BASE_CELL.width;
const H = BASE_CELL.height;

describe('기준 칸 크기 (G-2)', () => {
  it('0.기본틀.svg 꼭짓점 기준 198.63 × 124.04', () => {
    expect(W).toBeCloseTo(198.63, 2);
    expect(H).toBeCloseTo(124.04, 2);
  });
});

describe('칸 → 화면 좌표 (G-3)', () => {
  it('공식: x = 원점x + (열−행)·w/2, y = 원점y + (열+행)·h/2', () => {
    expect(cellToScreen(c(0, 0), O)).toEqual({ x: 500, y: 300 });
    const p = cellToScreen(c(3, 1), O);
    expect(p.x).toBeCloseTo(500 + 2 * (W / 2));
    expect(p.y).toBeCloseTo(300 + 4 * (H / 2));
    const q = cellToScreen(c(-2, 5), O);
    expect(q.x).toBeCloseTo(500 - 7 * (W / 2));
    expect(q.y).toBeCloseTo(300 + 3 * (H / 2));
  });

  it('칸 크기를 바꿔도(확대·축소) 같은 칸 좌표로 돌아온다 (G-7)', () => {
    for (const size of [BASE_CELL, { width: 236.12, height: 147.02 }, { width: 99.3, height: 62.0 }]) {
      for (let col = -3; col <= 6; col++)
        for (let row = -3; row <= 6; row++) {
          expect(screenToCell(cellToScreen(c(col, row), O, size), O, size)).toEqual(c(col, row));
        }
    }
  });
});

describe('화면 좌표 → 칸 (역변환 + 마름모 안쪽 판정)', () => {
  it('마름모 네 꼭짓점 바로 안쪽은 그 칸이다', () => {
    const ctr = cellToScreen(c(2, 3), O);
    const e = 0.02;
    const inside = [
      { x: ctr.x, y: ctr.y - (H / 2) * (1 - e) }, // 위
      { x: ctr.x, y: ctr.y + (H / 2) * (1 - e) }, // 아래
      { x: ctr.x - (W / 2) * (1 - e), y: ctr.y }, // 왼쪽
      { x: ctr.x + (W / 2) * (1 - e), y: ctr.y }, // 오른쪽
    ];
    for (const p of inside) {
      expect(screenToCell(p, O)).toEqual(c(2, 3));
      expect(isInsideDiamond(p, c(2, 3), O)).toBe(true);
    }
  });

  it('마름모의 바운딩 박스 모서리(마름모 밖)는 다른 칸이다', () => {
    const ctr = cellToScreen(c(2, 3), O);
    const corner = { x: ctr.x + W / 2 - 1, y: ctr.y - H / 2 + 1 }; // 오른쪽 위 구석
    expect(isInsideDiamond(corner, c(2, 3), O)).toBe(false);
    expect(screenToCell(corner, O)).toEqual(c(2, 2)); // 오른쪽 위로 변을 공유하는 칸
  });

  it('무작위 점: 돌려받은 칸의 마름모 안에 반드시 들어 있다', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) {
      const p = { x: O.x + (rnd() - 0.5) * 3000, y: O.y + (rnd() - 0.5) * 2000 };
      expect(isInsideDiamond(p, screenToCell(p, O), O)).toBe(true);
    }
  });
});

describe('이웃 칸 (G-4)', () => {
  it('변을 공유하는 4칸만 이웃', () => {
    const n = neighbors(c(5, 5)).map((x) => `${x.col},${x.row}`).sort();
    expect(n).toEqual(['4,5', '5,4', '5,6', '6,5']);
  });

  it('꼭짓점만 닿는 칸(대각선 4칸)은 이웃이 아니다', () => {
    for (const d of [c(6, 6), c(4, 4), c(6, 4), c(4, 6)]) expect(areNeighbors(c(5, 5), d)).toBe(false);
  });

  it('화면에서도: 이웃 칸 중심 사이 중점은 두 마름모의 공유 변 위에 있다', () => {
    const a = cellToScreen(c(1, 1), O);
    const b = cellToScreen(c(2, 1), O);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    expect(isInsideDiamond(mid, c(1, 1), O)).toBe(true);
    expect(isInsideDiamond(mid, c(2, 1), O)).toBe(true);
  });
});
