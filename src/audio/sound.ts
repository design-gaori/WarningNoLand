/**
 * 소리 (STEP 10 지시 8). 값은 여기서 조절한다.
 * - 배경음: 웹사이트 실행 중 계속 반복. 브라우저 정책상 사용자가 처음 누르기(클릭·터치·키) 전에는
 *   소리를 낼 수 없으므로 첫 입력 순간 시작한다. 화면이 바뀌어도 끊기지 않는다.
 * - 효과음: playEffect() — 콘을 격자에 놓기 성공 / 도감 아이콘 누르기
 */
import bgmUrl from '../../assets/audio/background.mp3?url';
import effectUrl from '../../assets/audio/effect.mp3?url';

export const SOUND = {
  bgmVolume: 0.4,
  effectVolume: 0.8,
  /** 효과음이 빠르게 겹칠 때 동시에 낼 수 있는 수 */
  effectVoices: 4,
} as const;

let bgm: HTMLAudioElement | null = null;
const voices: HTMLAudioElement[] = [];
let nextVoice = 0;
let unlocked = false;

function startBgm(): void {
  if (!bgm) return;
  void bgm.play().catch(() => {
    /* 아직 허용되지 않음 → 다음 입력 때 다시 시도 */
    unlocked = false;
  });
}

/** 앱 시작 시 한 번 호출 */
export function installSound(): void {
  if (bgm) return;
  bgm = new Audio(bgmUrl);
  bgm.loop = true;
  bgm.preload = 'auto';
  bgm.volume = SOUND.bgmVolume;
  for (let i = 0; i < SOUND.effectVoices; i++) {
    const a = new Audio(effectUrl);
    a.preload = 'auto';
    a.volume = SOUND.effectVolume;
    voices.push(a);
  }
  const unlock = (): void => {
    if (unlocked) return;
    unlocked = true;
    startBgm();
  };
  // capture 단계: 게임 조작이 이벤트를 막아도 첫 입력을 놓치지 않게
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
  window.addEventListener('touchend', unlock, { capture: true });
  startBgm(); // 자동 재생이 허용된 환경(키오스크 설정 등)이면 바로 시작
}

/** 효과음 한 번 */
export function playEffect(): void {
  const a = voices[nextVoice];
  if (!a) return;
  nextVoice = (nextVoice + 1) % voices.length;
  a.currentTime = 0;
  void a.play().catch(() => {
    /* 첫 입력 전이면 무시 */
  });
}

/** 개발 확인용 */
export function soundState(): { bgmPlaying: boolean; bgmTime: number } {
  return { bgmPlaying: !!bgm && !bgm.paused, bgmTime: bgm?.currentTime ?? 0 };
}
