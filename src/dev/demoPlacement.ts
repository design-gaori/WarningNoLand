/**
 * 개발 모드 전용 테스트 배치 (STEP 7 지시 5).
 * 콘 그림이 칸에 맞게 그려지는지, 앞뒤 가림이 올바른지 눈으로 확인하기 위한 것.
 *
 * 제거 방법: 이 파일을 지우고 src/main.ts의 "DEV DEMO" 블록을 지우면 된다.
 * 끄기: 주소 뒤에 ?demo=0
 * 배포 빌드(npm run build)에는 포함되지 않는다(import.meta.env.DEV 조건).
 */
import type { Rules } from '../logic/placement';
import { placeFromStorage } from '../logic/state';
import type { GameState } from '../logic/types';

/** 스테이지 데이터의 예시 해답(exampleSolution)을 그대로 놓는다 — 콘끼리 맞닿은 앞뒤 가림을 볼 수 있음 */
export function applyDemoPlacement(rules: Rules, state: GameState): GameState {
  let s = state;
  for (const p of rules.stage.exampleSolution ?? []) {
    const r = placeFromStorage(rules, s, p.coneId, p.anchor);
    if (!r.ok) {
      console.warn(`[demo] 배치 실패 ${p.coneId} @ ${p.anchor.col},${p.anchor.row}: ${r.reason}`);
      continue;
    }
    s = r.state;
  }
  return s;
}
