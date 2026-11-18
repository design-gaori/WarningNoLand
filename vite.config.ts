import { defineConfig } from 'vite';

/**
 * base './' : 빌드 결과의 파일 경로를 상대 경로로 만든다.
 * GitHub Pages 주소(https://design-gaori.github.io/WarningNoLand/)처럼 하위 폴더에 올려도,
 * 전시 PC에서 dist/ 를 어느 위치에 두어도 그대로 동작한다. 개발 서버(npm run dev)에는 영향 없음.
 */
export default defineConfig({
  base: './',
});
