import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/outfit/900.css';
import './styles/app.css';

import { startApp } from './app/router';
import { installSound, soundState } from './audio/sound';
import { MOTION } from './view/motion';
import type { Route } from './app/types';

const app = document.getElementById('app');
if (!app) {
  document.body.textContent = '오류가 발생했습니다!'; // 13-10
} else {
  // 새로고침하면 항상 메인 화면(13-8)
  let initial: Route = { name: 'main' };

  // ── DEV ONLY: 개발 확인용으로 바로 특정 화면 열기 (?screen=stage&stage=stage-1 / ?screen=select / ?screen=cone)
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search);
    const screen = q.get('screen');
    if (screen === 'select' || screen === 'cone' || screen === 'coneshow') initial = { name: screen };
    if (screen === 'stage') initial = { name: 'stage', stageId: q.get('stage') ?? 'stage-1' };
  }
  // ── /DEV ONLY

  installSound(); // C6: 배경음 반복(첫 입력 때 시작), 효과음 준비
  document.documentElement.style.setProperty('--button-hover-ms', `${MOTION.buttonHover.duration}ms`);
  if (import.meta.env.DEV) (window as unknown as { __sound: typeof soundState }).__sound = soundState;

  startApp(app, initial);
}
