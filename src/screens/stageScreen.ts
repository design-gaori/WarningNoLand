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
import { playEffect } from '../audio/sound';
import { STAGE1_LAYOUT } from '../view/layout';
import { MOTION } from '../view/motion';

export const RESULT_MS = 2500; // Q28

/**
 * C3 카드 펼침: i번째 카드를 "간격이 fromGap이었을 때의 자리"에서 지금 자리로 옮긴다.
 * (Figma: 카드 320, 간격 −200 → 카드 배율만큼 같이 줄임) 그림만 움직이고 자리·판정은 그대로.
 */
function spreadCards(storageEl: HTMLElement, cardS: number): void {
  const m = MOTION.cardSpread;
  const gap = STAGE1_LAYOUT.storage.gap;
  storageEl.querySelectorAll<HTMLElement>('.card-slot').forEach((slot, i) => {
    if (i === 0 || typeof slot.animate !== 'function') return;
    slot.getAnimations().forEach((a) => a.cancel()); // 펼치는 중에 다시 누르면 처음부터
    const from = i * (m.fromGap * cardS - gap);
    slot.animate([{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }], {
      duration: m.duration,
      easing: m.easing,
      fill: 'backwards',
    });
  });
}

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
    // 2-9 + C6: 콘을 격자에 놓기 성공(보관함에서 놓기·옮기기)했을 때만 이펙트와 효과음
    onDrop: (source, result) => {
      if (result.outcome !== 'placed' && result.outcome !== 'moved') return;
      const id = source.from === 'board' ? source.instanceId : result.state.placed[result.state.placed.length - 1]?.instanceId;
      if (id) board.popOnNextRender(id);
      playEffect();
    },
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
    if (interaction.isBusy() || clearTimer !== undefined) return;
    store.reset(); // 4-12
    // 사용자 요청: RESTART 때도 카드가 다시 펼쳐짐
    spreadCards(shell.storage, Number(app.style.getPropertyValue('--card-s')) || 1);
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
  // 글꼴이 늦게 로드되면 안내 띠 문구 너비가 바뀌므로 한 번 더 맞춤
  void document.fonts.ready.then(() => relayout(vp));

  // C3: 들어올 때마다 보관 카드가 겹친 상태(간격 −200)에서 최종 간격으로 펼쳐짐. 입력은 막지 않음
  spreadCards(shell.storage, Number(app.style.getPropertyValue('--card-s')) || 1);

  return {
    relayout,
    destroy() {
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
      unsubscribe();
      interaction.destroy();
    },
  };
}
