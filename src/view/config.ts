/**
 * 화면 설정값 (렌더링 전용).
 * 비교용으로 주소 뒤에 붙여 바꿀 수 있다: ?grid=0 (격자선 끄기) / ?grid=1 (켜기)
 */
export interface ViewConfig {
  /** G-6 격자선(빈 칸의 흰 마름모 테두리). Figma stage1 기준 기본값: 켬 */
  readonly showGridLines: boolean;
}

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  showGridLines: true,
};

export function readViewConfig(search: string = location.search): ViewConfig {
  const q = new URLSearchParams(search);
  const grid = q.get('grid');
  return {
    showGridLines: grid === null ? DEFAULT_VIEW_CONFIG.showGridLines : grid !== '0' && grid !== 'off',
  };
}
