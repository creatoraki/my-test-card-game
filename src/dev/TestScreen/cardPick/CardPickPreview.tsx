// 开发预览: 卡牌三选一面板在 1920×1080 画布上的实际效果, 可叠加设计稿半透明对照。
// 只在 ?page=test 的测试页出现; 候选卡就用设计稿里出现过的三张(狼雀=速攻、逆流、引路棘冠)。
import { useMemo, useState } from "react";
import { makeCard } from "@/data";
import { CardRewardPicker, type CardPickOption } from "@/ui/common/card/CardRewardPicker";
import { PreviewStage } from "../preview/PreviewStage";
import designRef from "../../../../生图模型输出目录/三选一卡牌_方案一_全息锻造台.png";
import s from "./CardPickPreview.module.css";

const SAMPLE = [
  { charId: "swordsman", cardId: "wolf-sparrow" },
  { charId: "prophet", cardId: "countercurrent" },
  { charId: "botanist", cardId: "guiding-crown" },
];

export function CardPickPreview() {
  const [round, setRound] = useState(0);
  const [overlay, setOverlay] = useState(0);
  const options = useMemo<CardPickOption[]>(
    () => SAMPLE.map(({ charId, cardId }) => ({ key: `${round}-${cardId}`, card: makeCard(cardId), ownerCharId: charId })),
    [round],
  );

  return (
    <PreviewStage controls={
      <>
        <span>设计稿叠加</span>
        {[0, 0.5, 1].map((value) => (
          <button key={value} type="button" aria-pressed={overlay === value} onClick={() => setOverlay(value)}>
            {value === 0 ? "关" : value === 1 ? "全显" : "半透明"}
          </button>
        ))}
      </>
    }>
      <CardRewardPicker
        options={options}
        kicker="额外奖励"
        title="选择一张卡牌"
        caption="候选卡牌将加入对应角色的卡组。"
        skipLabel="放弃卡牌"
        onConfirm={() => setRound((value) => value + 1)}
        onSkip={() => setRound((value) => value + 1)}
      />
      {overlay > 0 && (
        <img className={s.overlay} src={designRef} alt="" draggable={false} style={{ opacity: overlay }} />
      )}
    </PreviewStage>
  );
}
