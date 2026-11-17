/**
 * 스테이지 목록 (G-10): data/stages/*.json 을 모두 읽는다.
 * 스테이지를 추가하려면 data/stages/에 JSON 파일만 추가하면 된다.
 * 순서는 파일 이름의 숫자 순서(stage-1, stage-2, …, stage-10).
 */
import conesJson from '../../data/cones.json';
import { parseCones, parseStage } from '../logic/data';
import type { ConeDef, StageDef } from '../logic/types';

const stageFiles = import.meta.glob('../../data/stages/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const CONES: readonly ConeDef[] = parseCones(conesJson);

const naturalKey = (path: string): number => Number(/(\d+)\.json$/.exec(path)?.[1] ?? Number.MAX_SAFE_INTEGER);

export const STAGES: readonly StageDef[] = Object.keys(stageFiles)
  .sort((a, b) => naturalKey(a) - naturalKey(b) || a.localeCompare(b))
  .map((path) => parseStage(stageFiles[path], CONES));

export function findStage(id: string): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}
