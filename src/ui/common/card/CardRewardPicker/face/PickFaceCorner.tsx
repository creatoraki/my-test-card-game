// 新皮肤卡面左上角的两块铭牌(354×483 设计 px):
//   · 被动铭牌: 占费用宝石的位置。被动卡没有费用, 老卡面是一块 13px 的刻字小钢牌, 这里换成与宝石同重量级的银框深蓝铭牌;
//   · 星辉代付: 紧贴宝石右侧的金色铭牌(老卡面是 12px 的「✨N」小签), 悬停浮出代付说明。
import type { Card } from "@/engine";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./PickFaceCorner.module.css";

function StarGlyph() {
  return (
    <svg className={s.star} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 L14.6 9.4 L22.5 12 L14.6 14.6 L12 22.5 L9.4 14.6 L1.5 12 L9.4 9.4 Z" />
    </svg>
  );
}

export function PickFaceCorner({ card, cost, starPay }: { card: Card; cost: number; starPay: number }) {
  if (card.cardType === "passive") {
    return (
      <span className={s.passive} aria-label="被动卡，无法打出">
        <span className={s.passiveText}>被动</span>
      </span>
    );
  }
  if (starPay <= 0) return null;
  return (
    <span className={s.starPay} aria-label={`可用 ${starPay} 层星辉代付`}>
      <StarGlyph />
      <span className={s.starValue}>{starPay}</span>
      <span className={s.tip} role="tooltip">
        <TooltipCard title="星辉代付" desc={`消耗 ${starPay} 层星辉，实付 ${cost - starPay} 点法力水晶`} />
      </span>
    </span>
  );
}
