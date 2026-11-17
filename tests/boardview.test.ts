import { describe, expect, it } from 'vitest';
import { BASE_CELL, cellToScreen } from '../src/logic/grid';
import { ART_SCALE, artRect } from '../src/view/coneArt';
import { compareDepth, frontCell, sortForDrawing } from '../src/view/depth';
import { c } from './helpers';

describe('깊이 정렬 (G-8)', () => {
  it('(열+행)이 큰 칸을 나중에', () => {
    expect(compareDepth([c(0, 0)], [c(1, 1)])).toBeLessThan(0);
    expect(compareDepth([c(3, 0)], [c(0, 1)])).toBeGreaterThan(0);
  });

  it('(열+행)이 같으면 열이 큰 쪽을 나중에', () => {
    expect(compareDepth([c(1, 2)], [c(2, 1)])).toBeLessThan(0);
    expect(compareDepth([c(2, 1)], [c(1, 2)])).toBeGreaterThan(0);
  });

  it('여러 칸 오브젝트는 가장 앞쪽 칸으로 비교', () => {
    expect(frontCell([c(0, 0), c(1, 0), c(2, 0), c(0, 1)])).toEqual(c(2, 0));
    const items = [
      { id: 'front-single', cells: [c(2, 2)] },
      { id: 'multi', cells: [c(0, 0), c(1, 0), c(2, 0)] }, // 앞쪽 칸 (2,0) 합 2
      { id: 'back-single', cells: [c(0, 1)] }, // 합 1
    ];
    expect(sortForDrawing(items).map((i) => i.id)).toEqual(['back-single', 'multi', 'front-single']);
  });
});

describe('콘 그림 배치 (G-11, Q15)', () => {
  it('1칸 그림: 칸 중심이 가운데, 그림 아래 끝(−0.48)이 칸 아래 꼭짓점', () => {
    // icon/safety-cone.svg 217.62 × 234.65
    const r = artRect([c(3, 2)], 217.62, 234.65);
    const ctr = cellToScreen(c(3, 2), { x: 0, y: 0 });
    expect(r.x + 108.81 * ART_SCALE).toBeCloseTo(ctr.x, 6);
    expect(r.y + (234.65 - 0.48) * ART_SCALE).toBeCloseTo(ctr.y + BASE_CELL.height / 2, 6);
    expect(r.w).toBeCloseTo(217.62 * ART_SCALE, 6);
  });

  it('여러 칸 그림: 가장 왼쪽 칸과 가장 아래 칸을 기준으로 맞춘다', () => {
    // sign-board 패턴 (0,0)(1,0)(2,0)(0,1), 기준 칸 (5,5)
    const cells = [c(5, 5), c(6, 5), c(7, 5), c(5, 6)];
    const r = artRect(cells, 556.66, 427.31);
    const left = cellToScreen(c(5, 6), { x: 0, y: 0 }); // 열−행 최소
    const bottom = cellToScreen(c(7, 5), { x: 0, y: 0 }); // 열+행 최대 (6,5)와 (5,6)과 동률 아님: 12
    expect(r.x + 108.81 * ART_SCALE).toBeCloseTo(left.x, 6);
    expect(r.y + (427.31 - 0.48) * ART_SCALE).toBeCloseTo(bottom.y + BASE_CELL.height / 2, 6);
  });

  it('격자 간격 기준 축소(B2): SVG 칸 간격 226.45 → 기준 칸 198.63', () => {
    expect(226.45 * ART_SCALE).toBeCloseTo(BASE_CELL.width, 6);
  });
});
