// 新皮肤卡面的卡外标记行(354×483 设计 px): 与老手牌一致, 排在卡顶上方、左对齐 —— 缠根 → 卡牌标记 → 培育 → 共鸣。
// 每个标记一格 52px 镶嵌插槽(PickSocket), 悬停向上浮出 TooltipCard 释义。
// 缠根 / 共鸣没有专属图标, 借用现有 BUFF 图: 缠根 = 「根深」, 共鸣 = 「回响」。
import { CARD_MARK_DEFS, cultivateReady, cultivateWitherSoon, type Card } from "@/engine";
import { cardMarkArtOf } from "@/ui/art/battle/cardMarkArt";
import { CULTIVATION_ART, CULTIVATED_ART } from "@/ui/art/battle/buffArt";
import { statusArtOf } from "@/ui/art/battle/statusArt";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { cultivateTip } from "@/ui/common/card/HandCard/parts/CardMarks";
import { PickSocket, socketEmblemClass, socketIconClass } from "./PickSocket";
import s from "./PickFaceMarks.module.css";

const ROOTED_ART = statusArtOf("deepRoots");
const RESONANCE_ART = statusArtOf("echo");

const ROOTED_DESC = "不能打出或操作。下次我方回合开始自动解除；也可支付 1 枚法力水晶立即解缠，不推进时刻。被蟹搬走后只能击杀取回。";

function markDesc(card: Card, markId: string, desc: string) {
  if (markId !== "returnTax") return desc;
  const stacks = card.costStacks ?? 0;
  return `当前 ${stacks} 层：本卡费用 +${stacks}。每次回手继续叠加，本回合结束时移除。`;
}

const artIcon = (art: string | undefined, fallback: string) => (art ? <img src={art} alt="" /> : fallback);

export function PickFaceMarks({ card }: { card: Card }) {
  const marks = (card.marks ?? []).flatMap((id) => (CARD_MARK_DEFS[id] ? [CARD_MARK_DEFS[id]] : []));
  const ready = card.cultivate ? cultivateReady(card) : false;
  const wither = card.cultivate ? cultivateWitherSoon(card) : false;
  const resonance = card.resonanceStacks ?? 0;
  if (!card.rooted && !marks.length && !card.cultivate && resonance <= 0) return null;

  return (
    <div className={s.row}>
      {card.rooted && (
        <PickSocket kind="rooted" tipAt="top" tip={<TooltipCard icon={artIcon(ROOTED_ART, "🌿")} title="缠根" desc={ROOTED_DESC} />}>
          <span className={socketIconClass}>{artIcon(ROOTED_ART, "🌿")}</span>
        </PickSocket>
      )}
      {marks.map((mark) => {
        const icon = artIcon(cardMarkArtOf(mark.id), mark.emoji);
        return (
          <PickSocket key={mark.id} kind="mark" tipAt="top" tip={<TooltipCard icon={icon} title={mark.name} desc={markDesc(card, mark.id, mark.desc)} />}>
            <span className={socketIconClass}>{icon}</span>
          </PickSocket>
        );
      })}
      {card.cultivate && (
        <PickSocket
          kind={wither ? "wither" : ready ? "ripe" : "grow"}
          tipAt="top"
          tip={<TooltipCard title={card.grafted ? "嫁接" : "培育"} desc={cultivateTip(card)} />}
          count={ready ? undefined : card.cultivateLeft ?? card.cultivate.turns}
        >
          <img className={socketEmblemClass} src={ready ? CULTIVATED_ART : CULTIVATION_ART} alt="" />
        </PickSocket>
      )}
      {resonance > 0 && (
        <PickSocket
          kind="resonance"
          tipAt="top"
          tip={
            <TooltipCard
              icon={artIcon(RESONANCE_ART, "♪")}
              title="共鸣强化"
              desc={`本卡已获得 ${resonance} 次共鸣强化，打出时按次数增强共鸣效果；打出后清零。`}
            />
          }
          count={`+${resonance}`}
        >
          <span className={socketIconClass}>{artIcon(RESONANCE_ART, "♪")}</span>
        </PickSocket>
      )}
    </div>
  );
}
