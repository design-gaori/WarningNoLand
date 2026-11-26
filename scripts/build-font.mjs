/**
 * 한글 글꼴 YES Gothic(YES24 고딕) ExtraBold를 사이트에 쓰는 글자만 남겨 woff2로 만든다.
 * 원본 TTF(14MB)는 저장소에 넣지 않는다 → 이 PC에 설치된 파일을 읽는다.
 *
 * 사용: npm run font   (화면 글·data/cone-texts.json 등 한글이 바뀌면 다시 실행)
 * 원본 위치가 다르면: npm run font -- "D:\\fonts\\YES24GothicEB.ttf"
 *
 * 글자 수집 범위: src/, data/, index.html 안의 모든 글자 + 기본 영문·숫자·문장부호
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import subsetFont from 'subset-font';

const SRC = process.argv[2] ?? 'C:\\Windows\\Fonts\\YES24GothicEB.ttf';
const OUT = 'assets/fonts/yes24-gothic-eb.woff2';
const ROOTS = ['src', 'data', 'index.html'];
const EXTS = new Set(['.ts', '.json', '.html', '.css']);

function collect(path, acc) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const f of readdirSync(path)) collect(join(path, f), acc);
  } else if (EXTS.has(extname(path))) {
    for (const ch of readFileSync(path, 'utf8')) acc.add(ch);
  }
}

const chars = new Set();
for (const r of ROOTS) collect(r, chars);
// 기본 영문·숫자·문장부호(띄어쓰기 포함)는 항상 넣는다
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
for (const ch of '‘’“”…·') chars.add(ch);

const text = [...chars].filter((ch) => ch >= ' ').join('');
const hangul = [...chars].filter((ch) => /[\u3131-\u318e\uac00-\ud7a3]/.test(ch)).length;

const buf = await subsetFont(readFileSync(SRC), text, { targetFormat: 'woff2' });
mkdirSync('assets/fonts', { recursive: true });
writeFileSync(OUT, buf);
console.log(`${OUT}: 한글 ${hangul}자 포함, ${(buf.length / 1024).toFixed(1)} KB`);
