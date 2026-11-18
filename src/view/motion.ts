/**
 * 모션 값 모음 (STEP 10). 여기 숫자만 바꾸면 연출이 바뀐다.
 * 시간 단위: ms. 거리 단위: 디자인 px(1920 기준). 모든 연출은 입력을 막지 않는다.
 */
export const MOTION = {
  /** C5 안내 띠: 왼쪽으로 흐르는 속도(디자인 px / 초) */
  tickerSpeed: 60,

  /** 2-9 콘을 놓을 때: 살짝 눌렸다 튀기 */
  drop: {
    duration: 180,
    squashY: 0.9, // 눌릴 때 세로 배율
    stretchX: 1.06, // 눌릴 때 가로 배율
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  /**
   * C4 도감 아이콘 (사용자 수정): 마우스를 올리면 위로 올라간 채 유지, 내리면 내려옴.
   * 터치(마우스 올림 없음)는 탭할 때 올라갔다 내려오기(duration).
   */
  coneBounce: {
    height: 24, // 위 여백 31 안에서 잘리지 않게
    // 사용자 요청: 더 부드럽게 → 넘침(튕김) 없는 감속 곡선, 시간 0.16초 → 0.3초
    hoverDuration: 300, // 올라가기·내려오기 각각
    hoverEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    duration: 560, // 터치 탭: 올라갔다 내려오기 전체 (0.36초 → 0.56초)
    easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
  },

  /** C3 보관 카드 펼침: 겹친 상태(간격 −200) → 최종 간격 */
  cardSpread: {
    duration: 800, // 사용자 요청으로 0.5초 → 0.8초

    fromGap: -200,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },

  /** C2 표지판 등장: 아래에서 위로 "뿅" */
  signPop: {
    duration: 450,
    stagger: 120, // 왼쪽(도감)부터 차례로
    fromY: 400, // 시작 위치: 아래로 이만큼
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // 살짝 넘쳤다 돌아옴
  },

  /** BACK·RESTART 마우스 올림: Figma hover(15:2) 색으로 바뀌는 시간 */
  buttonHover: {
    duration: 150,
  },

  /** C3 Game Clear 띠 등장 */
  clearFade: {
    duration: 200,
    easing: 'ease-out',
  },

  /** C1 메인 Game Start 둥둥 */
  startFloat: {
    period: 2400,
    amplitude: 12, // 사용자 요청으로 6 → 12px

  },

  /** C1 메인 콘 모양 순환 */
  mainCones: {
    interval: 500, // 모양이 바뀌는 간격
    stagger: 300, // 3개가 엇갈리는 시간
    popDuration: 200, // 바뀔 때 살짝 튀는 시간
    popScale: 1.06,
  },
} as const;
