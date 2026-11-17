import { describe, expect, it } from 'vitest';
import { clientToApp, computeViewport } from '../src/view/viewport';
import { cardScale, tickerHeight } from '../src/view/shell';

describe('보관 카드 배율 (마지막 카드 아래 ~ 안내 띠 = 위 여백 48)', () => {
  const bottomOf3 = (s: number) => 48 + 3 * 320 * s + 2 * 8;

  it('1920×1080: 카드 3장 + 아래 여백 48이 딱 맞음 (배율 0.9583, 252×307)', () => {
    const s = cardScale(1080, 48, 3);
    expect(s).toBeCloseTo(0.95833, 4);
    expect(1080 - 48 - bottomOf3(s)).toBeCloseTo(48, 6);
  });

  it('주소창 있는 아이맥(보이는 높이 985.7): 더 줄여서 3장이 다 보이고 아래 여백 48 유지', () => {
    const tH = tickerHeight(2240 / 1920);
    const s = cardScale(985.71, tH, 3);
    expect(985.71 - tH - bottomOf3(s)).toBeCloseTo(48, 2);
  });

  it('세로로 긴 창(1200)에서도 1080 기준 크기보다 커지지 않음', () => {
    expect(cardScale(1200, 48, 3)).toBeCloseTo(0.95833, 4);
  });
});

describe('화면 배율 (가로형 답변 1: 배율 = 창 너비 ÷ 1920)', () => {
  it('1920×1080 → 배율 1, 보이는 높이 1080', () => {
    const vp = computeViewport(1920, 1080, false);
    expect(vp).toMatchObject({ rotated: false, u: 1, viewHDesign: 1080 });
  });

  it('주소창이 있는 아이맥 창(2240×1150) → 배율 1.1667, 보이는 높이 약 986 (나머지는 스크롤)', () => {
    const vp = computeViewport(2240, 1150, false);
    expect(vp.u).toBeCloseTo(2240 / 1920);
    expect(vp.viewHDesign).toBeCloseTo(985.7, 1);
  });

  it('데스크톱(마우스)은 세로로 긴 창이어도 회전하지 않는다', () => {
    expect(computeViewport(800, 1200, false).rotated).toBe(false);
  });
});

describe('모바일 세로 → 90° 회전 (Q2)', () => {
  it('터치 기기 세로(390×844) → 회전, 앱은 844×390', () => {
    const vp = computeViewport(390, 844, true);
    expect(vp).toMatchObject({ rotated: true, appW: 844, appH: 390 });
    expect(vp.u).toBeCloseTo(844 / 1920);
  });

  it('터치 기기 가로(844×390) → 회전 없음, 같은 배율', () => {
    const land = computeViewport(844, 390, true);
    const port = computeViewport(390, 844, true);
    expect(land.rotated).toBe(false);
    expect(land.u).toBeCloseTo(port.u);
    expect(land.viewHDesign).toBeCloseTo(port.viewHDesign);
  });

  it('회전 시 화면 좌표 → 앱 좌표 역변환', () => {
    const vp = computeViewport(390, 844, true);
    // 앱 (0,0) = 화면 오른쪽 위 (390, 0)
    expect(clientToApp(vp, 390, 390, 0)).toEqual({ x: 0, y: 0 });
    // 앱 (844, 390) = 화면 왼쪽 아래 (0, 844)
    expect(clientToApp(vp, 390, 0, 844)).toEqual({ x: 844, y: 390 });
    // 회전 안 하면 그대로
    const flat = computeViewport(844, 390, true);
    expect(clientToApp(flat, 844, 10, 20)).toEqual({ x: 10, y: 20 });
  });
});
