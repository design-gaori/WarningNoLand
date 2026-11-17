/**
 * 게임 화면 (스테이지). STEP 6~8의 셸·보드·보관함·조작을 묶고, 성공 흐름을 연결한다.
 *
 * 성공 흐름 (STEP 9 답변): 콘을 놓아 시작~도착(+모든 섬)이 연결되는 순간 →
 *   Game Clear 띠(화면 가운데, 가로 꽉 참, 종이 질감 아래) 2.5초, 그동안 입력 막음(13-9) → 메인 화면.
 *   스테이지 상태는 저장하지 않으므로 다시 들어오면 처음 상태(13-8).
 * 실패 흐름: 따로 변화 없음(STEP 9).
 */
import type { AppContext, Screen } from '../app/types';
import { createStore } from '../game/store';
import { createRules } from '../logic/placement';
import { createInitialState } from '../logic/state';
import type { StageDef } from '../logic/types';
import { createBoardView } from '../view/board';
import { readViewConfig } from '../view/config';
import { installInteraction } from '../view/interaction';
import { BOARD_SCALE, buildShell, relayoutShell, tickerHeight } from '../view/shell';
import { createStorageView } from '../view/storage';
import type { Viewport } from '../view/viewport';
import { CONES } from '../game/stages';
import { showBanner } from './common';

export const RESULT_MS = 2500; // Q28

export async function mountStage(ctx: AppContext, stage: StageDef): Promise<Screen> {
  const { app } = ctx;
  const rules = createRules(stage, CONES);
  const store = createStore(rules, createInitialState(rules));

  // ── DEV DEMO: 개발 모드에서 ?demo=1 일 때만 테스트 배치 (src/dev/demoPlacement.ts). 제거할 때 이 블록을 지운다.
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1') {
    const { applyDemoPlacement } = await import('../dev/demoPlacement');
    store.replace(applyDemoPlacement(rules, store.getState()));
  }
  // ── /DEV DEMO

  const shell = buildShell(app, stage, store.getState());
  const board = createBoardView(shell.board, rules, readViewConfig(), BOARD_SCALE);
  const storage = createStorageView(shell.storage, rules);

  let hidden: string | undefined;
  const rerender = (hiddenInstance?: string): void => {
    hidden = hiddenInstance;
    const st = store.getState();
    board.render(st, hidden).catch(ctx.showError);
    storage.render(st).catch(ctx.showError);
  };
  await Promise.all([board.render(store.getState()), storage.render(store.getState())]);

  let vp: Viewport = ctx.viewport().vp;
  const interaction = installInteraction({
    app,
    store,
    board,
    storageEl: shell.storage,
    scroller: shell.scroller,
    dragLayer: shell.dragLayer,
    boardScale: BOARD_SCALE,
    getViewport: () => ({ vp, winW: ctx.viewport().winW }),
    rerender,
    getTickerH: () => tickerHeight(vp.u),
  });

  // 성공 판정 → Game Clear → 메인
  let clearTimer: number | undefined;
  const unsubscribe = store.subscribe(() => {
    rerender(hidden);
    if (clearTimer === undefined && store.isConnected()) {
      interaction.setEnabled(false);
      showBanner(app, 'clear');
      clearTimer = window.setTimeout(() => ctx.navigate({ name: 'main' }), RESULT_MS);
    }
  });

  shell.restart.addEventListener('click', () => {
    if (!interaction.isBusy() && clearTimer === undefined) store.reset(); // 4-12
  });
  // BACK (Figma 7:194) → 스테이지 선택. 상태는 저장하지 않음(다시 들어오면 처음 상태)
  shell.back.addEventListener('click', () => {
    if (!interaction.isBusy() && clearTimer === undefined) ctx.navigate({ name: 'select' });
  });

  // ── DEV HOOK: 개발 모드에서만 자동 확인용 (src/dev/debugHook.ts)
  if (import.meta.env.DEV) {
    const { installDebugHook } = await import('../dev/debugHook');
    installDebugHook({ store, board, scroller: shell.scroller });
  }

  const relayout = (next: Viewport): void => {
    vp = next;
    relayoutShell(app, shell, stage, vp.u, vp.viewHDesign);
  };
  relayout(vp);

  return {
    relayout,
    destroy() {
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
      unsubscribe();
      interaction.destroy();
    },
  };
}
