/**
 * 화면 전환·배율·오류 처리.
 * 상태는 저장하지 않는다 → 새로고침하면 항상 메인 화면 처음 상태(13-8).
 *
 * 흐름: 메인 —Game Start→ 스테이지 선택 —Stage N→ 게임 —성공→ (Game Clear 2.5초) → 메인
 *                         스테이지 선택 —도감 보기→ 도감 —1.5초, 페이드→ 콘 소개(coneshow) —BACK→ 스테이지 선택
 * 오류(13-10): "오류가 발생했습니다!" 띠(Figma error)를 화면 가운데 2.5초 → 메인
 */
import { findStage } from '../game/stages';
import { mountCone } from '../screens/coneScreen';
import { mountConeShow } from '../screens/coneShowScreen';
import { MOTION } from '../view/motion';
import { showBanner } from '../screens/common';
import { mountMain } from '../screens/mainScreen';
import { mountSelect } from '../screens/selectScreen';
import { mountStage, RESULT_MS } from '../screens/stageScreen';
import { applyViewport, computeViewport, type Viewport } from '../view/viewport';
import type { AppContext, Route, Screen } from './types';

export function startApp(app: HTMLElement, initial: Route): void {
  const coarse = window.matchMedia('(pointer: coarse)');
  let vp: Viewport = computeViewport(window.innerWidth, window.innerHeight, coarse.matches);
  let current: Screen | null = null;
  let navSeq = 0;
  let errorTimer: number | undefined;
  let errorShowing = false;

  const relayout = (): void => {
    vp = computeViewport(window.innerWidth, window.innerHeight, coarse.matches);
    applyViewport(app, vp, window.innerWidth);
    current?.relayout(vp);
  };

  const ctx: AppContext = {
    app,
    viewport: () => ({ vp, winW: window.innerWidth }),
    navigate(route, opts) {
      void go(route, false, opts?.fade === true);
    },
    showError(err) {
      console.error(err);
      if (errorShowing) return;
      errorShowing = true;
      showBanner(app, 'error');
      errorTimer = window.setTimeout(() => {
        errorShowing = false;
        void go({ name: 'main' }, true);
      }, RESULT_MS);
    },
  };

  /** 페이드 전환: 이전 화면을 맨 위에 잠시 남겨 두고 투명하게 → 새 화면이 부드럽게 나타남 (입력은 막지 않음) */
  function fadeOutOld(old: HTMLElement): void {
    app.appendChild(old);
    if (typeof old.animate !== 'function') {
      old.remove();
      return;
    }
    const a = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MOTION.coneShow.pageFade, easing: 'ease-in-out', fill: 'forwards' });
    a.onfinish = () => old.remove();
    a.oncancel = () => old.remove();
  }

  async function go(route: Route, fromError = false, fade = false): Promise<void> {
    const seq = ++navSeq;
    if (errorTimer !== undefined && !fromError) {
      window.clearTimeout(errorTimer);
      errorTimer = undefined;
      errorShowing = false;
    }
    try {
      current?.destroy();
    } catch (e) {
      console.error(e);
    }
    current = null;
    // 남아 있던 이전 페이드 층은 정리
    app.querySelectorAll(':scope > .fade-old').forEach((n) => n.remove());
    let old: HTMLElement | null = null;
    if (fade) {
      old = document.createElement('div');
      old.className = 'fade-old';
      old.append(...app.childNodes);
    }
    try {
      let next: Screen;
      switch (route.name) {
        case 'main':
          next = mountMain(ctx);
          break;
        case 'select':
          next = mountSelect(ctx);
          break;
        case 'cone':
          next = mountCone(ctx);
          break;
        case 'coneshow':
          next = mountConeShow(ctx);
          break;
        case 'stage': {
          const stage = findStage(route.stageId);
          if (!stage) throw new Error(`스테이지 없음: ${route.stageId}`);
          next = await mountStage(ctx, stage);
          break;
        }
      }
      if (seq !== navSeq) {
        next.destroy(); // 그사이 다른 화면으로 이동함
        return;
      }
      current = next;
      app.dataset.screen = route.name;
      relayout();
      if (old) fadeOutOld(old);
    } catch (e) {
      if (fromError && route.name === 'main') {
        // 메인 화면도 열 수 없으면 반복하지 않고 오류 띠만 남긴다
        console.error(e);
        showBanner(app, 'error');
        return;
      }
      ctx.showError(e);
    }
  }

  window.addEventListener('resize', relayout);
  coarse.addEventListener('change', relayout);
  window.addEventListener('error', (e) => ctx.showError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => ctx.showError(e.reason));

  applyViewport(app, vp, window.innerWidth);
  void go(initial);
}
