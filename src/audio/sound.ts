/**
 * 소리 (STEP 10 지시 8). 값은 여기서 조절한다.
 * - 배경음: 웹사이트 실행 중 계속 반복. 브라우저 정책상 사용자가 처음 누르기(클릭·터치·키) 전에는
 *   소리를 낼 수 없으므로 첫 입력 순간 시작한다. 화면이 바뀌어도 끊기지 않는다.
 * - 효과음: playEffect() — 콘을 격자에 놓기 성공 / 도감 아이콘 누르기
 *   (사용자 수정, 2026-11-19: 0.2초쯤 늦게 들림 → Web Audio로 바로 재생 + 파일 앞의 무음(약 58ms)을 건너뜀)
 */
import bgmUrl from '../../assets/audio/background.mp3?url';
import effectUrl from '../../assets/audio/effect.mp3?url';

export const SOUND = {
  bgmVolume: 0.4,
  effectVolume: 0.8,
  /** 효과음 앞 무음을 찾는 기준: 가장 큰 소리의 이 비율을 처음 넘는 곳 */
  effectOnsetThreshold: 0.01,
  /** 소리 시작점보다 이만큼(초) 앞에서 재생 — 첫 소리가 잘리지 않게 */
  effectOnsetLead: 0.005,
} as const;

let bgm: HTMLAudioElement | null = null;
let unlocked = false;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let effectBuffer: AudioBuffer | null = null;
let effectOffset = 0;

function startBgm(): void {
  if (!bgm) return;
  void bgm.play().catch(() => {
    /* 아직 허용되지 않음 → 다음 입력 때 다시 시도 */
    unlocked = false;
  });
}

/** 효과음 파일을 미리 풀어 두고(decode) 앞 무음 길이를 잰다 */
async function loadEffect(): Promise<void> {
  if (!ctx) return;
  const data = await (await fetch(effectUrl)).arrayBuffer();
  const buf = await ctx.decodeAudioData(data);
  const ch = buf.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i] ?? 0));
  let first = 0;
  for (let i = 0; i < ch.length; i++) {
    if (Math.abs(ch[i] ?? 0) > peak * SOUND.effectOnsetThreshold) {
      first = i;
      break;
    }
  }
  effectOffset = Math.max(0, first / buf.sampleRate - SOUND.effectOnsetLead);
  effectBuffer = buf;
}

/** 앱 시작 시 한 번 호출 */
export function installSound(): void {
  if (bgm) return;
  bgm = new Audio(bgmUrl);
  bgm.loop = true;
  bgm.preload = 'auto';
  bgm.volume = SOUND.bgmVolume;

  // iPhone: Web Audio는 무음 스위치를 켜면 소리가 안 남 → 배경음처럼 "재생" 종류로 지정 (Safari 16.4+)
  const nav = navigator as unknown as { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = 'playback';

  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AC) {
    ctx = new AC({ latencyHint: 'interactive' });
    gain = ctx.createGain();
    gain.gain.value = SOUND.effectVolume;
    gain.connect(ctx.destination);
    void loadEffect().catch(() => {
      /* 불러오기 실패 → 효과음 없이 진행 */
    });
  }

  const unlock = (): void => {
    // 효과음: 첫 입력 때 오디오를 깨워 둔다(이후 재생 지연 없음)
    if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
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

/** 효과음 한 번 (여러 번 빠르게 불러도 겹쳐서 재생) */
export function playEffect(): void {
  if (!ctx || !gain || !effectBuffer) return;
  if (ctx.state !== 'running') void ctx.resume().catch(() => {});
  const src = ctx.createBufferSource();
  src.buffer = effectBuffer;
  src.connect(gain);
  src.start(0, effectOffset);
}

/** 개발 확인용 */
export function soundState(): { bgmPlaying: boolean; bgmTime: number; effectReady: boolean; effectOffsetMs: number; audioState: string } {
  return {
    bgmPlaying: !!bgm && !bgm.paused,
    bgmTime: bgm?.currentTime ?? 0,
    effectReady: !!effectBuffer,
    effectOffsetMs: Math.round(effectOffset * 1000),
    audioState: ctx?.state ?? 'none',
  };
}
