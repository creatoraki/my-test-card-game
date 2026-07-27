import type { Card } from "../engine";
import { ManaCrystalIcon } from "./ManaCrystalIcon";
import { cardArt } from "./cardArt";
import { CINEMA } from "./animations";
import "./SkillCutInCard.css";

// 整段亮相时长: 与 runSteps 的定时器口径一致。作为 CSS animation-duration,
// 令 @keyframes skill-cutin-fly 的飞入/停留/飞出比例始终对齐 CINEMA 参数。
const CUTIN_MS = CINEMA.cardIn + CINEMA.cardHold + CINEMA.cardOut;

// 出牌「亮相」卡面浮层(仅玩家出牌): 镜头聚焦目标后, 当前技能卡从屏幕左侧飞入 → 停留 → 往右飞出渐隐。
// 挂载即通过 CSS animation(.skill-cutin, @keyframes skill-cutin-fly)播放整段运动, 无需在组件内维护阶段。
// 时序由 BattleScreen.runSteps 用定时器与 CINEMA.cardIn/cardHold/cardOut 对齐控制挂载/卸载。
export function SkillCutInCard({ card }: { card: Card | null }) {
  if (!card) return null;
  const art = cardArt(card.id);

  return (
    // key: 同一批次连续出牌时强制重挂载, 重放飞入动画
    <div
      key={card.uid}
      className={`skill-cutin ${art ? "has-art" : "placeholder"}`}
      style={{ animationDuration: `${CUTIN_MS}ms` }}
      aria-hidden
    >
      {art ? (
        <>
          <img className="cutin-art" src={art} alt={`${card.name}卡面`} />
          <div className="cutin-name">{card.name}</div>
        </>
      ) : (
        <>
          <div className="cutin-head">
            <span className="cutin-cost" title="消耗法力水晶">
              <ManaCrystalIcon className="mana-crystal" />
              <span className="cutin-cost-value">{card.cost}</span>
            </span>
            <span className="cutin-name">{card.name}</span>
            <span className="cutin-type">{card.cardType === "fast" ? "速" : "普"}</span>
          </div>
          <div className="cutin-text">{card.text}</div>
        </>
      )}
    </div>
  );
}
