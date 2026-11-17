/**
 * 화면 배율과 모바일 회전 계산 (렌더링 전용. 게임 상태와 무관).
 *
 * - 배율 u = (가로 방향 화면 너비) ÷ 1920  (가로형 답변 1: Figma 비율 기준, 세로로 넘치면 스크롤)
 * - 터치 기기에서 세로로 들고 있으면 앱 전체를 90° 돌려 가로 화면처럼 보여준다 (Q2)
 */
export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export interface Viewport {
  /** 90° 회전 여부 */
  readonly rotated: boolean;
  /** 회전을 반영한 앱의 가로·세로 (CSS px) */
  readonly appW: number;
  readonly appH: number;
  /** 디자인 px 1 = 화면 px u */
  readonly u: number;
  /** 화면에 보이는 세로 높이 (디자인 px) */
  readonly viewHDesign: number;
}

export function computeViewport(winW: number, winH: number, coarsePointer: boolean): Viewport {
  const rotated = coarsePointer && winH > winW;
  const appW = rotated ? winH : winW;
  const appH = rotated ? winW : winH;
  const u = appW / DESIGN_W;
  return { rotated, appW, appH, u, viewHDesign: appH / u };
}

/**
 * 브라우저 좌표(clientX/Y) → 앱 좌표(회전 전 기준, CSS px).
 * 회전 시 앱은 시계 방향 90°로 돌아가 있다: 앱 (x, y) → 화면 (winW − y, x)
 */
export function clientToApp(vp: Viewport, winW: number, clientX: number, clientY: number): { x: number; y: number } {
  if (!vp.rotated) return { x: clientX, y: clientY };
  return { x: clientY, y: winW - clientX };
}

/** 계산 결과를 #app에 적용한다 */
export function applyViewport(app: HTMLElement, vp: Viewport, winW: number): void {
  app.style.width = `${vp.appW}px`;
  app.style.height = `${vp.appH}px`;
  app.style.transform = vp.rotated ? `translate(${winW}px, 0) rotate(90deg)` : 'none';
  app.style.setProperty('--u', String(vp.u));
  app.style.setProperty('--view-h', String(vp.viewHDesign));
  app.dataset.rotated = String(vp.rotated);
}
