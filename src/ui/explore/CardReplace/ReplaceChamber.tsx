// 置换弹窗右侧的「置换舱」: 放大展示已放入的卡, 并把这次置换会发生什么逐条讲清楚 ——
// 换出范围(随机普通卡、几种可能)、原卡模组去向、食品费用是否够。
import { cardDisplayName, type Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import s from "./ReplaceChamber.module.css";

interface Props {
  card: Card | null;
  candidates: number;
  foodCost: number;
  foodHave: number;
}

export function ReplaceChamber({ card, candidates, foodCost, foodHave }: Props) {
  const short = foodHave < foodCost;
  return (
    <aside className={s.chamber}>
      <header className={s.head}>
        <span className={s.label}>置换舱</span>
        <span className={s.status} data-ready={card ? "" : undefined}>
          <i aria-hidden />
          {card ? "目标已锁定" : "等待放入"}
        </span>
      </header>

      <div className={s.bay} data-filled={card ? "" : undefined}>
        <span className={s.bayGrid} aria-hidden />
        <span className={s.bracket} data-at="tl" aria-hidden />
        <span className={s.bracket} data-at="tr" aria-hidden />
        <span className={s.bracket} data-at="bl" aria-hidden />
        <span className={s.bracket} data-at="br" aria-hidden />
        {card ? (
          <div className={s.card} key={card.uid} data-card-detail>
            <div className={s.scale}>
              <HandCard card={card} variant="pile" playable selected={false} />
            </div>
            <span className={s.sweep} aria-hidden />
          </div>
        ) : (
          <div className={s.empty}>
            <span className={s.emptyGlyph} aria-hidden>？</span>
            <span>从左侧选择一张卡牌</span>
          </div>
        )}
      </div>

      <dl className={s.facts}>
        <div className={s.fact}>
          <dt>放入卡牌</dt>
          <dd>{card ? `「${cardDisplayName(card)}」` : "未选择"}</dd>
        </div>
        <div className={s.fact}>
          <dt>置换结果</dt>
          <dd>{card ? `随机普通卡 · ${candidates} 种可能` : "随机普通卡"}</dd>
        </div>
        <div className={s.fact} data-tone={card?.cardModule ? "warn" : undefined}>
          <dt>原卡模组</dt>
          <dd>{card ? (card.cardModule ? "将随原卡一并移除" : "无模组") : "—"}</dd>
        </div>
        <div className={s.fact} data-tone={short ? "danger" : undefined}>
          <dt>服务费用</dt>
          <dd>{foodCost ? `临期食品 ×${foodCost}（持有 ${foodHave}）` : "免费"}</dd>
        </div>
      </dl>
    </aside>
  );
}
