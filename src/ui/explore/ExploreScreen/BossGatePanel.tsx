import type { ExploreState } from "@/explore/types";
import { challengeBossGate, closeBossGatePanel } from "@/store/exploreCorridor";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import { EventPanelChoice } from "@/ui/common/EventPanel";
import { ExploreObjectPanel } from "./ExploreObjectPanel";

export function BossGatePanel({ session }: { session: ExploreState }) {
  const actionable = session.phase === "atNode";

  return (
    <ExploreObjectPanel
      accent="#e0524a"
      kicker="封锁红门"
      title="首领所在"
      status={actionable ? "挑战可用" : "面板锁定"}
      scene="choice"
      contentKey="boss-gate"
      active={actionable}
      onEscape={closeBossGatePanel}
    >
      <EventPanelChoice
        heading="首领所在"
        hint="红门之后封存着这片区域的核心敌意。你可以先继续搜索房间里的物件，准备妥当后再回来开启挑战。"
        signal="准备妥当后再开启挑战"
        options={[{
          id: "challenge-boss",
          name: "挑战首领",
          description: "开启首领战后将无法返回副本继续搜索。胜利即通关；失败或撤退按撤离副本结算。",
          cost: "开启后无法返回副本继续搜索",
          costTone: "red",
          disabled: !actionable,
        }]}
        onPick={(_, event) => {
          if (!event) return;
          setTransitionOrigin(event.clientX, event.clientY);
          challengeBossGate();
        }}
        backLabel="暂不挑战，继续搜索"
        onBack={() => {
          if (actionable) closeBossGatePanel();
        }}
      />
    </ExploreObjectPanel>
  );
}
