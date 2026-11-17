/**
 * 보관 영역 카드: 콘 그림(축소) + 남은 수량 (6-9). 렌더링 전용.
 * 축소 방식(Q38): 콘 그림(SVG.2)의 칸 패턴 좌우 끝과 카드 좌우 가장자리 사이 여백이 14가 되도록 축소.
 * 카드 높이에 다 들어가지 않으면 높이에 맞춰 더 줄인다(이때 좌우 여백은 14보다 넓어짐).
 */
import type { Rules } from '../logic/placement';
import type { GameState } from '../logic/types';
import { cloneArt, loadArt } from './board';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 카드(Figma 263×320) 안 그림 영역 — 카드 바깥 테두리 기준 */
const CARD = { w: 263, h: 320, border: 3 } as const;
const ART_AREA = { left: 14, right: 263 - 14, top: 54, bottom: 320 - 14 } as const;

export interface StorageView {
  render(state: GameState): Promise<void>;
}

export function createStorageView(storageEl: HTMLElement, rules: Rules): StorageView {
  const cards = new Map<string, { card: HTMLElement; text: HTMLElement; svg: SVGSVGElement }>();
  for (const card of storageEl.querySelectorAll<HTMLElement>('.card')) {
    const coneId = card.dataset.coneId ?? '';
    const text = card.querySelector<HTMLElement>('.card-count-text');
    if (!text) continue;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'card-art-layer');
    svg.setAttribute('viewBox', `0 0 ${CARD.w} ${CARD.h}`);
    svg.setAttribute('width', String(CARD.w));
    svg.setAttribute('height', String(CARD.h));
    // 카드 테두리 안쪽(padding box) 기준 위치 보정
    svg.style.left = `${-CARD.border}px`;
    svg.style.top = `${-CARD.border}px`;
    card.appendChild(svg);
    cards.set(coneId, { card, text, svg });
  }

  let drawn = false;

  return {
    async render(state) {
      for (const supply of rules.stage.cones) {
        const c = cards.get(supply.coneId);
        if (!c) continue;
        const left = state.storage[supply.coneId] ?? 0;
        c.text.textContent = `${left}/${supply.count}`;
        c.card.dataset.empty = String(left <= 0);
      }
      if (drawn) return;
      drawn = true;
      await Promise.all(
        rules.stage.cones.map(async (supply) => {
          const c = cards.get(supply.coneId);
          if (!c) return;
          const art = await loadArt('piece', supply.coneId);
          const aw = ART_AREA.right - ART_AREA.left;
          const ah = ART_AREA.bottom - ART_AREA.top;
          const s = Math.min(aw / art.w, ah / art.h);
          const w = art.w * s;
          const h = art.h * s;
          const node = cloneArt(art, ART_AREA.left + (aw - w) / 2, ART_AREA.top + (ah - h) / 2, w, h);
          node.setAttribute('class', 'art art-storage');
          node.dataset.coneId = supply.coneId;
          c.svg.replaceChildren(node);
        }),
      );
    },
  };
}
