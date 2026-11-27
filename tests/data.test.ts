import { describe, expect, it } from 'vitest';
import conesJson from '../data/cones.json';
import stage1Json from '../data/stages/stage-1.json';
import { findPath, isConnected } from '../src/logic/connection';
import { parseCones, parseStage } from '../src/logic/data';
import { areNeighbors, cellKey } from '../src/logic/grid';
import { createRules, patternCells } from '../src/logic/placement';
import { createInitialState, placeFromStorage, returnToStorage } from '../src/logic/state';

const cones = parseCones(conesJson);
const stage = parseStage(stage1Json, cones);
const rules = createRules(stage, cones);

describe('데이터 파일', () => {
  it('콘 20종이 모두 형식에 맞다 (기준 칸 (0,0) 포함, 중복 칸 없음)', () => {
    expect(cones).toHaveLength(20);
  });

  it('하늘 배경(sky): 없으면 기본, 있으면 #rrggbb 두 색만 받는다', () => {
    expect(stage.sky).toBeUndefined();
    const withSky = parseStage({ ...stage1Json, sky: { top: '#d0e55a', bottom: '#edc73f' } }, cones);
    expect(withSky.sky).toEqual({ top: '#d0e55a', bottom: '#edc73f' });
    expect(() => parseStage({ ...stage1Json, sky: { top: 'yellow', bottom: '#edc73f' } }, cones)).toThrow(/sky/);
    expect(() => parseStage({ ...stage1Json, sky: { top: '#d0e55a' } }, cones)).toThrow(/sky/);
  });

  it('잘못된 데이터는 거부한다', () => {
    expect(() => parseCones({ cones: [{ id: 'x', pattern: [[1, 0]], asset: { piece: 'a', icon: 'b' } }] })).toThrow(/기준 칸/);
    expect(() =>
      parseStage({ ...stage1Json, cones: [{ coneId: 'nope', count: 1 }] }, cones),
    ).toThrow(/없는 콘/);
    expect(() => parseStage({ ...stage1Json, start: [[1, 0]] }, cones)).toThrow(/겹칩니다/);
  });

  it('스테이지 1: 격자 55칸, 시작 (0,0), 도착 (13,10), 섬 없음', () => {
    expect(stage.cells).toHaveLength(55);
    expect(stage.start).toEqual([{ col: 0, row: 0 }]);
    expect(stage.end).toEqual([{ col: 13, row: 10 }]);
    expect(stage.islands).toHaveLength(0);
  });

  it('스테이지 1: 콘 종류와 수량이 데이터와 일치 (15-3)', () => {
    expect(createInitialState(rules).storage).toEqual({ tree: 5, 'sign-board': 5, 'fire-hydrant': 5, 'ice-cream': 5, cat: 5 });
  });

  it('스테이지 1: 시작·도착 땅은 각각 격자 칸과 변을 공유한다', () => {
    const grid = stage.cells;
    expect(grid.some((g) => areNeighbors(g, stage.start[0]!))).toBe(true);
    expect(grid.some((g) => areNeighbors(g, stage.end[0]!))).toBe(true);
  });
});

describe('스테이지 1 예시 해답 (10-4-1, 15-3)', () => {
  function playExample() {
    let s = createInitialState(rules);
    for (const p of stage.exampleSolution!) {
      const r = placeFromStorage(rules, s, p.coneId, p.anchor);
      expect(r.ok, `${p.coneId} @ ${cellKey(p.anchor)}`).toBe(true);
      s = r.state;
    }
    return s;
  }

  it('예시 해답의 모든 콘을 규칙대로 놓을 수 있다', () => {
    const s = playExample();
    expect(s.placed).toHaveLength(11);
    expect(s.storage).toEqual({ tree: 0, 'sign-board': 0, 'fire-hydrant': 4, 'ice-cream': 5, cat: 5 });
  });

  it('예시 해답으로 연결 성공', () => {
    expect(isConnected(rules, playExample())).toBe(true);
  });

  it('예시 해답에서 마지막 콘을 빼면 실패', () => {
    const s = playExample();
    const last = s.placed[s.placed.length - 1]!.instanceId;
    expect(isConnected(rules, returnToStorage(s, last).state)).toBe(false);
  });

  it('예시 해답의 경로: 시작 → 도착, 이웃 칸만, 모두 채워진 칸', () => {
    const s = playExample();
    const path = findPath(rules, s)!;
    expect(path[0]).toEqual({ col: 0, row: 0 });
    expect(path[path.length - 1]).toEqual({ col: 13, row: 10 });
    const filled = new Set([
      ...[...stage.start, ...stage.end].map(cellKey),
      ...s.placed.flatMap((p) => patternCells(rules.cones.get(p.coneId)!, p.anchor).map(cellKey)),
    ]);
    for (let i = 0; i < path.length; i++) {
      expect(filled.has(cellKey(path[i]!))).toBe(true);
      if (i > 0) expect(areNeighbors(path[i - 1]!, path[i]!)).toBe(true);
    }
  });
});
