/** 칸 좌표 (G-3). 게임 상태·판정은 이 좌표로만 다룬다. */
export interface Cell {
  readonly col: number;
  readonly row: number;
}

/** 안전콘 정의 (G-9) */
export interface ConeDef {
  readonly id: string;
  /** 기준 칸 (0,0)에 대한 상대 칸 좌표. 회전 없음(2-4). */
  readonly pattern: readonly Cell[];
  readonly asset: { readonly piece: string; readonly icon: string };
}

/** 스테이지에서 쓸 콘 종류와 처음 수량 */
export interface StageConeSupply {
  readonly coneId: string;
  readonly count: number;
}

export interface PlacementSpec {
  readonly coneId: string;
  readonly anchor: Cell;
}

/** 스테이지 정의 (G-10 + Q21: 격자는 배치 가능한 칸 목록으로 정의) */
export interface StageDef {
  readonly id: string;
  readonly name: string;
  /** 콘을 놓을 수 있는 빈 칸 (땅 칸은 포함하지 않음) */
  readonly cells: readonly Cell[];
  readonly start: readonly Cell[];
  readonly end: readonly Cell[];
  /** 중간 섬. 섬마다 칸 목록 하나. */
  readonly islands: readonly (readonly Cell[])[];
  readonly cones: readonly StageConeSupply[];
  /** 풀 수 있는지 확인용 예시 해답 (10-4-1) */
  readonly exampleSolution?: readonly PlacementSpec[];
}

/** 보드에 놓인 콘 하나 */
export interface PlacedCone {
  readonly instanceId: string;
  readonly coneId: string;
  /** 기준 칸 (0,0)이 놓인 칸 */
  readonly anchor: Cell;
}

/** 게임 상태. 화면 좌표(px)는 넣지 않는다. */
export interface GameState {
  readonly placed: readonly PlacedCone[];
  /** 콘 종류별 보관함 남은 수 */
  readonly storage: Readonly<Record<string, number>>;
  readonly nextInstance: number;
}

export type PlacementFailure = 'out-of-grid' | 'land' | 'occupied';
export type ActionFailure = PlacementFailure | 'no-stock' | 'unknown-cone' | 'unknown-instance';
