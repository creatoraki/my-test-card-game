// 被瞄准的角色立绘框特效: 四角锁定括号收拢 + 红色边缘警示 + 扫描线 + 准星, 左上角「被瞄准」铭牌。
// 只认 AimMark 列表, 不关心是哪种技能 —— 任何带 aims 的状态都会走到这里(见 engine/combat/aim.ts)。
// 叠在立绘卡框之上、状态图标之下; 除铭牌外不吃指针事件, 不影响点选角色。

import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { cx } from "@/ui/common/shared/cx";
import type { AimMark } from "./aimMarks";
import s from "./AimLockFrame.module.css";

const AIM_ACCENT = "#ff5a4a";

interface Props {
  marks: AimMark[];
}

export function AimLockFrame({ marks }: Props) {
  if (!marks.length) return null;
  return (
    <div className={s["aim-lock"]}>
      <span className={s.wash} aria-hidden="true">
        <span className={s.scan} />
      </span>
      <span className={s.reticle} aria-hidden="true">
        <ReticleSvg />
      </span>
      <span className={cx(s.corner, s.tl)} aria-hidden="true" />
      <span className={cx(s.corner, s.tr)} aria-hidden="true" />
      <span className={cx(s.corner, s.bl)} aria-hidden="true" />
      <span className={cx(s.corner, s.br)} aria-hidden="true" />
      <AimTag marks={marks} />
    </div>
  );
}

function AimTag({ marks }: Props) {
  const { point, bind } = useHoverTooltip();
  return (
    <span className={s.tag} tabIndex={0} {...bind}>
      <CrosshairSvg className={s["tag-icon"]} />
      <span className={s["tag-text"]}>被瞄准</span>
      {marks.length > 1 && <b className={s["tag-count"]}>×{marks.length}</b>}
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title="被瞄准" accent={AIM_ACCENT} desc="以下敌人正锁定该角色，瞄准技能发动时将以该角色为目标。">
            <ul className={s.list}>
              {marks.map((mark) => (
                <li key={mark.key} className={s.item}>
                  {mark.art && <img className={s["item-art"]} src={mark.art} alt="" draggable={false} />}
                  <span className={s["item-source"]}>{mark.source}</span>
                  <span className={s["item-skill"]}>「{mark.skill}」</span>
                </li>
              ))}
            </ul>
          </TooltipCard>
        </HoverTooltip>
      )}
    </span>
  );
}

function ReticleSvg() {
  return (
    <svg viewBox="0 0 100 100" className={s["reticle-svg"]}>
      <circle cx="50" cy="50" r="34" fill="none" strokeWidth="2.5" strokeDasharray="34 19.4" />
      <circle cx="50" cy="50" r="22" fill="none" strokeWidth="1.5" opacity="0.7" />
      <path d="M50 4v18M50 78v18M4 50h18M78 50h18" strokeWidth="3" strokeLinecap="square" />
      <circle cx="50" cy="50" r="3" stroke="none" className={s["reticle-dot"]} />
    </svg>
  );
}

function CrosshairSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="none" strokeWidth="2" />
      <path d="M12 1v6M12 17v6M1 12h6M17 12h6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" stroke="none" fill="currentColor" />
    </svg>
  );
}
