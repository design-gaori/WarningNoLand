import type { Cell } from './types';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface CellSize {
  readonly width: number;
  readonly height: number;
}

/**
 * 기준 칸 크기 (G-2). 0.기본틀.svg 마름모 꼭짓점 기준:
 * 가로 199.57 − 0.94 = 198.63, 세로 124.63 − 0.59 = 124.04
 */
export const BASE_CELL: CellSize = { width: 198.63, height: 124.04 };

export const cell = (col: number, row: number): Cell => ({ col, row });

export const cellKey = (c: Cell): string => `${c.col},${c.row}`;

export const sameCell = (a: Cell, b: Cell): boolean => a.col === b.col && a.row === b.row;

/**
 * 칸 → 화면 좌표 (G-3). 반환값은 그 칸 마름모의 **중심**.
 * origin = 칸 (0,0) 마름모 중심의 화면 위치.
 * x = origin.x + (col − row) × w/2,  y = origin.y + (col + row) × h/2
 */
export function cellToScreen(c: Cell, origin: Point, size: CellSize = BASE_CELL): Point {
  return {
    x: origin.x + (c.col - c.row) * (size.width / 2),
    y: origin.y + (c.col + c.row) * (size.height / 2),
  };
}

/** 화면 좌표 → 소수 칸 좌표 (cellToScreen의 정확한 역함수) */
export function screenToFractional(p: Point, origin: Point, size: CellSize = BASE_CELL): { col: number; row: number } {
  const u = (p.x - origin.x) / (size.width / 2);
  const v = (p.y - origin.y) / (size.height / 2);
  return { col: (u + v) / 2, row: (v - u) / 2 };
}

/** 점이 그 칸의 마름모 안(경계 포함)에 있는가 */
export function isInsideDiamond(p: Point, c: Cell, origin: Point, size: CellSize = BASE_CELL): boolean {
  const center = cellToScreen(c, origin, size);
  const dx = Math.abs(p.x - center.x) / (size.width / 2);
  const dy = Math.abs(p.y - center.y) / (size.height / 2);
  return dx + dy <= 1 + 1e-9;
}

/**
 * 화면 좌표 → 그 점을 포함하는 마름모의 칸 (포인터 → 칸 변환).
 * 마름모 경계 위의 점은 둘 중 한 칸으로 정해진다(반올림 규칙).
 * 격자(스테이지 칸 목록) 안인지는 따로 확인해야 한다.
 */
export function screenToCell(p: Point, origin: Point, size: CellSize = BASE_CELL): Cell {
  const f = screenToFractional(p, origin, size);
  // `+ 0`: Math.round가 돌려주는 -0을 0으로 맞춘다
  return { col: Math.round(f.col) + 0, row: Math.round(f.row) + 0 };
}

/** 변을 공유하는 4칸 (G-4). 꼭짓점만 닿는 칸은 이웃이 아니다. */
export function neighbors(c: Cell): Cell[] {
  return [
    { col: c.col + 1, row: c.row },
    { col: c.col - 1, row: c.row },
    { col: c.col, row: c.row + 1 },
    { col: c.col, row: c.row - 1 },
  ];
}

export function areNeighbors(a: Cell, b: Cell): boolean {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}
