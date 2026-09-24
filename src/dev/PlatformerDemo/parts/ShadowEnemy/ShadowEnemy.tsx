import { memo, type CSSProperties } from "react";
import type { EnemyState } from "../../types";
import s from "./ShadowEnemy.module.css";

export interface EnemyView {
  root: HTMLDivElement | null;
  flip: HTMLDivElement | null;
}

const RIM = "#5b4a80";
const BODY = "#16131f";
const SHADE = "#08070d";

/** 黑影剪影：佝偻人形 + 破碎斗篷下摆 + 暗红双眼，外缘一圈冷紫描边光。 */
function ShadowFigure() {
  return (
    <svg className={s.figure} viewBox="-80 -180 160 190" width={160} height={190} aria-hidden>
      <ellipse cx={0} cy={2} rx={46} ry={9} fill="#05040a" opacity={0.45} />
      <path
        d="M-6 -168 C18 -170 30 -150 26 -128 C44 -118 50 -92 46 -64 L54 -30 L40 -38 L42 -6 L28 -20 L18 0 L8 -18 L-4 2 L-14 -18 L-28 -2 L-30 -24 L-44 -12 L-40 -44 C-48 -76 -40 -110 -24 -126 C-30 -150 -24 -166 -6 -168 Z"
        fill={BODY}
        stroke="#000000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M10 -150 C22 -140 24 -128 22 -120 C40 -108 44 -84 40 -60 L46 -34 L36 -40 L36 -12 L24 -24 L16 -6 L10 -22 C20 -60 22 -100 10 -150 Z" fill={SHADE} />
      <path d="M-26 -124 C-40 -104 -44 -74 -38 -46" fill="none" stroke={RIM} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <path d="M-8 -164 C-20 -160 -24 -148 -22 -134" fill="none" stroke={RIM} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <path d="M26 -96 C40 -90 52 -76 58 -58" fill="none" stroke="#000000" strokeWidth={9} strokeLinecap="round" />
      <path d="M26 -96 C40 -90 52 -76 58 -58" fill="none" stroke={BODY} strokeWidth={4} strokeLinecap="round" />
      <g className={s.eyes}>
        <ellipse cx={6} cy={-140} rx={5} ry={2.6} fill="#ff5a4a" />
        <ellipse cx={20} cy={-139} rx={4} ry={2.2} fill="#ff5a4a" />
      </g>
    </svg>
  );
}

function Exclaim() {
  return (
    <svg className={s.exclaim} viewBox="-24 -60 48 64" width={48} height={64} aria-hidden>
      <path d="M-9 -54 L9 -54 L5 -14 L-5 -14 Z" fill="#ff3b3b" stroke="#ffffff" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke" />
      <circle cx={0} cy={-3} r={6.5} fill="#ff3b3b" stroke="#ffffff" strokeWidth={5} paintOrder="stroke" />
      <path d="M-4 -48 L-2 -22" stroke="#ffb3a8" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

/** 巡逻黑影。位置、朝向由游戏循环直接写入；表现状态由 data-mode 驱动 CSS。 */
export const ShadowEnemy = memo(function ShadowEnemy({ id, register }: { id: string; register: (id: string, view: EnemyView) => void }) {
  const view: EnemyView = { root: null, flip: null };
  return (
    <div
      ref={(el) => { view.root = el; register(id, view); }}
      className={s.enemy}
      data-mode="patrol"
      aria-hidden
    >
      <div ref={(el) => { view.flip = el; }} className={s.flip}>
        <div className={s.body}>
          <ShadowFigure />
          {[0, 1, 2, 3, 4].map((i) => <i key={i} className={s.wisp} style={{ left: 50 + i * 16, animationDelay: `${i * -0.37}s` }} />)}
        </div>
      </div>
      <div className={s.alert}><Exclaim /></div>
      <div className={s.burst}>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} style={{ "--angle": `${i * 36}deg`, "--dist": `${60 + (i % 3) * 22}px` } as CSSProperties} />
        ))}
      </div>
    </div>
  );
});

const f = (n: number) => n.toFixed(2);

export function applyEnemyView(view: EnemyView, e: EnemyState) {
  const { root, flip } = view;
  if (!root) return;
  root.style.transform = `translate3d(${f(e.x)}px, ${f(e.y)}px, 0)`;
  if (flip) flip.style.transform = `scaleX(${e.dir})`;
  if (root.dataset.mode !== e.mode) root.dataset.mode = e.mode;
}
