// 探索卡卡面 —— 与战斗卡的 CardView 刻意不复用: 两者的信息结构完全不同
// (战斗卡讲"消耗/目标/效果", 探索卡讲"危险度/收益/这一步通往哪")。

import { getEncounter } from "../data";
import type { ExploreCard } from "../explore/types";
import "./ExploreCardView.css";

interface Props {
  card: ExploreCard;
  disabled?: boolean;
  picked?: boolean; // 弃牌选择模式下已勾选
  crossesTier?: boolean; // 打出后会跨危险度档位 → 卡面警示
  onClick?: () => void;
  onHoverChange?: (hovering: boolean) => void;
}

// 遭遇/BOSS 卡开局就绑定了具体 encounter, 故能提前把敌人数亮给玩家 ——
// 玩家因此可以自选先打哪一场(先啃软的攒资源, 还是趁危险度低啃硬的)。
function routeSubtitle(card: ExploreCard): string | null {
  if (!card.encounterId) return null;
  const enc = getEncounter(card.encounterId);
  return `${enc.name} · ${enc.enemies.length} 敌`;
}

export function ExploreCardView({
  card,
  disabled,
  picked,
  crossesTier,
  onClick,
  onHoverChange,
}: Props) {
  const subtitle = routeSubtitle(card);
  const cls = [
    "ex-card",
    `ex-${card.kind}`,
    card.rarity ? `ex-${card.rarity}` : "",
    disabled ? "disabled" : "",
    picked ? "picked" : "",
    crossesTier ? "crosses" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={cls}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {card.danger !== 0 && (
        <span className={`ex-danger ${card.danger > 0 ? "up" : "down"}`}>
          {card.danger > 0 ? `+${card.danger}` : card.danger}
        </span>
      )}
      <span className="ex-emoji">{card.emoji}</span>
      <span className="ex-name">{card.name}</span>
      {subtitle && <span className="ex-sub">{subtitle}</span>}
      <span className="ex-text">{card.text}</span>
      {crossesTier && <span className="ex-warn">⚠ 将跨入下一档</span>}
    </button>
  );
}
