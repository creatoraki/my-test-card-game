// 战斗胜利的「换牌」奖励: 只做数据适配, 选卡 / 置换演出全部交给探索侧共用的 CardReplaceModal。
import { useMemo } from "react";
import { useExploreStore } from "@/store/explore/exploreStore";
import { replaceBattleCard } from "@/store/explore/exploreGrowthServices";
import { CardReplaceModal } from "@/ui/explore/CardReplace";

export function VictoryCardReplace() {
  const action = useExploreStore((state) => state.session?.pendingCardReplace ?? null);
  const party = useExploreStore((state) => state.session?.party);
  const clearCardReplace = useExploreStore((state) => state.clearCardReplace);
  const members = useMemo(() => (party ?? []).filter((member) => member.alive), [party]);

  return (
    <CardReplaceModal
      action={action}
      members={members}
      lockedCharId={null}
      kicker="额外奖励 / 换牌"
      onReplace={replaceBattleCard}
      onFinish={clearCardReplace}
    />
  );
}
