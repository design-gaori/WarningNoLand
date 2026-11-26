import type { Viewport } from '../view/viewport';

export type Route = { readonly name: 'main' } | { readonly name: 'select' } | { readonly name: 'cone' } | { readonly name: 'coneshow' } | { readonly name: 'stage'; readonly stageId: string };

/** 화면 하나 (메인·스테이지 선택·도감·게임) */
export interface Screen {
  /** 창 크기가 바뀔 때 */
  relayout(vp: Viewport): void;
  /** 다른 화면으로 갈 때: 이벤트 해제·타이머 정리 */
  destroy(): void;
}

export interface AppContext {
  readonly app: HTMLElement;
  /** fade: 이전 화면이 서서히 사라지며 새 화면이 나타남 */
  navigate(route: Route, opts?: { fade?: boolean }): void;
  /** 현재 화면 배율 정보 */
  viewport(): { vp: Viewport; winW: number };
  /** 예기치 못한 오류 표시 (13-10) */
  showError(err: unknown): void;
}
