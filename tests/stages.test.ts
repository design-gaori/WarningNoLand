/**
 * 스테이지 추가 대비 점검 (STEP 11). data/stages/*.json 에 파일이 늘어나면 자동으로 함께 검사된다.
 * 실패하면 "데이터가 틀렸거나, 아직 디자인이 정해지지 않은 경우"다 → docs/STAGE_GUIDE_스테이지추가md.md 참고.
 * 화면 값(디자인 px)은 Figma stage1 배치(view/layout.ts)를 기준으로 한다.
 */
import { describe, expect, it } from 'vitest';
import { isConnected } from '../src/logic/connection';
import { areNeighbors, BASE_CELL, cellKey, cellToScreen } from '../src/logic/grid';
import { createRules } from '../src/logic/placement';
import { createInitialState, placeFromStorage } from '../src/logic/state';
import { CONES, STAGES } from '../src/game/stages';
import { STAGE1_LAYOUT as L } from '../src/view/layout';
import { SLOTS } from '../src/screens/selectScreen';

const files = Object.keys(import.meta.glob('../data/stages/*.json'));
const pieceFiles = new Set(Object.keys(import.meta.glob('../assets/svg/piece/*.svg', { query: '?raw' })));
const iconFiles = new Set(Object.keys(import.meta.glob('../assets/svg/icon/*.svg', { query: '?raw' })));
const BOARD_SCALE = L.board.figmaCellW / BASE_CELL.width;

/** 칸 마름모의 바운딩 박스 (디자인 px, 1920 기준) */
function tileBox(c: { col: number; row: number }) {
  const p = cellToScreen(c, { x: 0, y: 0 });
  const cx = L.board.originX + p.x * BOARD_SCALE;
  const cy = L.board.originY + p.y * BOARD_SCALE;
  const hw = (BASE_CELL.width / 2) * BOARD_SCALE;
  const hh = (BASE_CELL.height / 2) * BOARD_SCALE;
  return { l: cx - hw, r: cx + hw, t: cy - hh, b: cy + hh };
}

describe('콘 에셋 (스테이지에서 쓰는 콘이 화면에 그려질 수 있는지)', () => {
  it('콘 20종 모두 게임용(piece)·카드/도감용(icon) SVG가 있다', () => {
    for (const c of CONES) {
      expect(pieceFiles.has(`../assets/svg/piece/${c.id}.svg`), `piece/${c.id}.svg`).toBe(true);
      expect(iconFiles.has(`../assets/svg/icon/${c.id}.svg`), `icon/${c.id}.svg`).toBe(true);
    }
  });
});

describe('스테이지 목록', () => {
  it('파일 이름과 id가 같다 (stage-N.json ↔ "stage-N"), id 중복 없음', () => {
    expect(STAGES).toHaveLength(files.length);
    const ids = files.map((f) => /([^/]+)\.json$/.exec(f)?.[1]);
    expect(STAGES.map((s) => s.id).sort()).toEqual([...ids].sort());
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length);
  });

  it(`스테이지 선택 화면 표지판(${SLOTS.length}개)보다 스테이지가 많지 않다 — 넘치면 선택 화면 디자인이 먼저 필요`, () => {
    expect(STAGES.length).toBeLessThanOrEqual(SLOTS.length);
  });
});

describe.each(STAGES.map((s) => [s.id, s] as const))('%s', (_id, stage) => {
  const rules = createRules(stage, CONES);
  const allCells = [...stage.cells, ...stage.start, ...stage.end, ...stage.islands.flat()];

  it('중간 섬 없음 — 섬 그래픽·경로 규칙이 아직 정해지지 않음(BOARD_NOTES 질문 1)', () => {
    expect(stage.islands).toHaveLength(0);
  });

  it('보관 카드는 5종 이하 — Figma 디자인이 최대 5장 (2026-11-28 사용자 확인, 4장부터 보관 영역 스크롤 Q37)', () => {
    expect(stage.cones.length).toBeLessThanOrEqual(5);
  });

  it('시작·도착 땅의 모든 칸이 격자 칸과 변을 공유한다', () => {
    for (const land of [...stage.start, ...stage.end]) {
      expect(stage.cells.some((g) => areNeighbors(g, land)), `땅 ${cellKey(land)}`).toBe(true);
    }
  });

  it('시작 땅이 맨 위: 모든 칸의 (열+행) ≥ 시작 땅 — 위로 넘치면 화면 위에서 잘림', () => {
    const top = Math.min(...stage.start.map((c) => c.col + c.row));
    expect(top).toBe(0);
    for (const c of allCells) expect(c.col + c.row, cellKey(c)).toBeGreaterThanOrEqual(top);
  });

  it(`보드가 화면 안: 왼쪽 끝 ≥ 0, 오른쪽 끝 ≤ 보관 카드 시작(${L.storage.x}) (디자인 px)`, () => {
    for (const c of allCells) {
      const b = tileBox(c);
      expect(b.l, `칸 ${cellKey(c)} 왼쪽`).toBeGreaterThanOrEqual(0);
      expect(b.r, `칸 ${cellKey(c)} 오른쪽`).toBeLessThanOrEqual(L.storage.x);
    }
  });

  it('보드가 BACK·RESTART 버튼 자리와 겹치지 않는다', () => {
    const btn = { l: L.back.x, r: L.restart.x + L.restart.w, t: L.back.y, b: L.restart.y + L.restart.h };
    for (const c of allCells) {
      const b = tileBox(c);
      const overlap = b.l < btn.r && b.r > btn.l && b.t < btn.b && b.b > btn.t;
      expect(overlap, `칸 ${cellKey(c)}`).toBe(false);
    }
  });

  it('예시 해답이 있고, 수량 안에서 규칙대로 놓아 연결에 성공한다 (15-3)', () => {
    expect(stage.exampleSolution, '예시 해답(exampleSolution) 필요').toBeDefined();
    let s = createInitialState(rules);
    for (const p of stage.exampleSolution!) {
      const r = placeFromStorage(rules, s, p.coneId, p.anchor);
      expect(r.ok, `${p.coneId} @ ${cellKey(p.anchor)}: ${r.ok ? '' : r.reason}`).toBe(true);
      s = r.state;
    }
    expect(isConnected(rules, s)).toBe(true);
  });

  it('처음 상태(콘 없음)에서는 연결되지 않는다 — 놓기도 전에 Game Clear가 뜨지 않게', () => {
    expect(isConnected(rules, createInitialState(rules))).toBe(false);
  });
});
