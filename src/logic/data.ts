import { cellKey } from './grid';
import type { Cell, ConeDef, PlacementSpec, StageDef } from './types';

/** JSON의 [열, 행] 배열을 Cell로 바꾼다 */
function toCell(v: unknown, where: string): Cell {
  if (!Array.isArray(v) || v.length !== 2 || !Number.isInteger(v[0]) || !Number.isInteger(v[1])) {
    throw new Error(`${where}: 칸 좌표는 [열, 행] 정수 쌍이어야 합니다: ${JSON.stringify(v)}`);
  }
  return { col: v[0] as number, row: v[1] as number };
}

function toCells(v: unknown, where: string): Cell[] {
  if (!Array.isArray(v)) throw new Error(`${where}: 배열이어야 합니다`);
  return v.map((x, i) => toCell(x, `${where}[${i}]`));
}

function assertUnique(cells: readonly Cell[], where: string): void {
  const seen = new Set<string>();
  for (const c of cells) {
    const k = cellKey(c);
    if (seen.has(k)) throw new Error(`${where}: 중복 칸 ${k}`);
    seen.add(k);
  }
}

/** data/cones.json → ConeDef 목록 (형식 검사 포함) */
export function parseCones(json: unknown): ConeDef[] {
  const list = (json as { cones?: unknown }).cones;
  if (!Array.isArray(list)) throw new Error('cones.json: "cones" 배열이 없습니다');
  const ids = new Set<string>();
  return list.map((raw, i) => {
    const r = raw as { id?: unknown; pattern?: unknown; asset?: { piece?: unknown; icon?: unknown } };
    const where = `cones[${i}]`;
    if (typeof r.id !== 'string' || !r.id) throw new Error(`${where}: id가 없습니다`);
    if (ids.has(r.id)) throw new Error(`${where}: id 중복 ${r.id}`);
    ids.add(r.id);
    const pattern = toCells(r.pattern, `${where}(${r.id}).pattern`);
    if (pattern.length === 0) throw new Error(`${where}: 패턴이 비었습니다`);
    if (!pattern.some((c) => c.col === 0 && c.row === 0)) throw new Error(`${where}(${r.id}): 패턴에 기준 칸 (0,0)이 없습니다`);
    assertUnique(pattern, `${where}(${r.id}).pattern`);
    if (typeof r.asset?.piece !== 'string' || typeof r.asset?.icon !== 'string') {
      throw new Error(`${where}(${r.id}): asset.piece / asset.icon이 필요합니다`);
    }
    return { id: r.id, pattern, asset: { piece: r.asset.piece, icon: r.asset.icon } };
  });
}

/** data/stages/*.json → StageDef (형식·참조 검사 포함) */
export function parseStage(json: unknown, cones: readonly ConeDef[]): StageDef {
  const r = json as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  if (!id) throw new Error('stage: id가 없습니다');
  const where = `stage(${id})`;
  const cells = toCells(r.cells, `${where}.cells`);
  const start = toCells(r.start, `${where}.start`);
  const end = toCells(r.end, `${where}.end`);
  if (!Array.isArray(r.islands)) throw new Error(`${where}.islands: 배열이어야 합니다(없으면 [])`);
  const islands = r.islands.map((isl, i) => toCells(isl, `${where}.islands[${i}]`));
  if (start.length === 0 || end.length === 0) throw new Error(`${where}: 시작·도착 땅이 필요합니다`);

  const all = [...cells, ...start, ...end, ...islands.flat()];
  assertUnique(all, `${where}: 격자·땅 칸이 겹칩니다`);

  if (!Array.isArray(r.cones)) throw new Error(`${where}.cones: 배열이어야 합니다`);
  const known = new Set(cones.map((c) => c.id));
  const supply = r.cones.map((s, i) => {
    const x = s as { coneId?: unknown; count?: unknown };
    if (typeof x.coneId !== 'string' || !known.has(x.coneId)) throw new Error(`${where}.cones[${i}]: 없는 콘 ${String(x.coneId)}`);
    if (!Number.isInteger(x.count) || (x.count as number) < 1) throw new Error(`${where}.cones[${i}]: 수량은 1 이상의 정수`);
    return { coneId: x.coneId, count: x.count as number };
  });

  let exampleSolution: PlacementSpec[] | undefined;
  if (r.exampleSolution !== undefined) {
    if (!Array.isArray(r.exampleSolution)) throw new Error(`${where}.exampleSolution: 배열이어야 합니다`);
    exampleSolution = r.exampleSolution.map((p, i) => {
      const x = p as { coneId?: unknown; anchor?: unknown };
      if (typeof x.coneId !== 'string') throw new Error(`${where}.exampleSolution[${i}]: coneId`);
      return { coneId: x.coneId, anchor: toCell(x.anchor, `${where}.exampleSolution[${i}].anchor`) };
    });
  }

  return {
    id,
    name: typeof r.name === 'string' ? r.name : id,
    cells,
    start,
    end,
    islands,
    cones: supply,
    ...(exampleSolution ? { exampleSolution } : {}),
  };
}
