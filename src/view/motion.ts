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

  /** 스테이지 선택 ◀ ▶: 한 번 누르면 끝까지 부드럽게 넘김 (ease-out) — 가정값 */
  selectGlide: {
    duration: 600,
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

  /** coneshow: 도감 → 콘 소개 자동 이동, 큰 콘 미끄러짐, 글 바뀜 */
  coneShow: {
    /*
     * 도감에 들어오자마자 판이 확대되며 넘어감.
     * 사용자 수정(2026-11-26): 더 빠르고 쫀쫀하게, 디즈니 애니메이션처럼
     * → ① 예비 동작: 살짝 움츠러들었다가 ② 확 튀어 나가듯 크게 확대 ③ 끝에서 사라짐
     */
    zoomDelay: 300, // 도감이 보인 뒤 움직이기 시작할 때까지 (사용자 수정 2026-11-26: 0.3초)
    zoomDuration: 1000, // 움직이는 시간 (끝나면 바로 이동)
    zoomAnticipate: 0.9, // ① 움츠러드는 크기
    zoomAnticipateAt: 0.22, // ① 이 지점(전체의 22%)까지 움츠러듦
    zoomAnticipateEasing: 'cubic-bezier(0.33, 1, 0.68, 1)', // 빠르게 움츠렸다 멈칫
    zoomScale: 5, // ② 끝 크기 배율
    zoomEasing: 'cubic-bezier(0.5, 0, 0.9, 0.3)', // ② 바로 출발해서 끝으로 갈수록 확 가속
    zoomFadeFrom: 0.75, // ③ 이 지점부터 투명해지기 시작
    pageFade: 250, // 남은 배경(하늘·BACK)이 콘 소개 화면으로 바뀌는 시간
    slide: 550, // 큰 콘이 좌우로 미끄러지는 시간
    slideEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    thumbFade: 200, // 하단 콘 밝아지기·흐려지기
    textFade: 300, // 좌측 하단 글이 바뀔 때
    swipeMin: 60, // 스와이프로 인정하는 최소 거리(디자인 px)
  },
} as const;
