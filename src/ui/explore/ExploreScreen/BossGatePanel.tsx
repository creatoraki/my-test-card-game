import type { ExploreState } from "@/explore/types";
import { challengeBossGate, closeBossGatePanel } from "@/store/exploreCorridor";
import { setTransitionOrigin } from "@/ui/app/transitionOrigin";
import {
  DossierChoice,
  DossierIcon,
  DossierInfoBox,
  DossierNotice,
  EventDossierPanel,
} from "@/ui/explore/EventDossier";

const BOSS_ACCENT = "#e0524a";

export function BossGatePanel({ session }: { session: ExploreState }) {
  const actionable = session.phase === "atNode";

  return (
    <EventDossierPanel
      accent={BOSS_ACCENT}
      kicker="封锁红门 · 首领区域"
      title="首领所在"
      enTitle="SEALED RED GATE"
      contentKey="boss-gate"
      active={actionable}
      onClose={actionable ? closeBossGatePanel : undefined}
    >
      <DossierChoice
        body={<p>红门之后封存着这片区域的核心敌意。先搜索物件，准备妥当再来挑战。</p>}
        info={
          <DossierInfoBox tone="danger" icon={<DossierIcon name="warn" />}>
            <DossierNotice title="开启后无法返回副本" note="胜利即通关，失败按撤离结算" />
          </DossierInfoBox>
        }
        actions={[
          {
            id: "challenge-boss",
            label: "挑战首领",
            icon: "upgrade",
            sfx: "confirm",
            disabled: !actionable,
            onClick: (event) => {
              setTransitionOrigin(event.clientX, event.clientY);
              challengeBossGate();
            },
          },
          { id: "leave", label: "暂不挑战，继续搜索", icon: "leave", sfx: "back", disabled: !actionable, onClick: closeBossGatePanel },
        ]}
      />
    </EventDossierPanel>
  );
}
