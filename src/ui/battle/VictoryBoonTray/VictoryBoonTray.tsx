import type { CSSProperties, KeyboardEvent } from "react";
import { useExploreStore } from "@/store/exploreStore";
import { RailPopover } from "@/ui/common/RailPopover";
import { victoryStagger } from "@/ui/battle/victoryChoreo";
import type { BattleBoonKind, PendingBoon } from "@/explore/types";
import { CardOfferIcon, EquipCrateIcon, HealDewIcon } from "./boonIcons";
import s from "./VictoryBoonTray.module.css";

interface Props {
  style?: CSSProperties;
}

const BOON_META: Record<BattleBoonKind, {
  Icon: ({ className }: { className?: string }) => JSX.Element;
  name: string;
  desc: string;
}> = {
  healDew: {
    Icon: HealDewIcon,
    name: "治疗露珠",
    desc: "拾取后，所有存活队员恢复 5 点生命，不会复活阵亡队员。",
  },
  cardOffer: {
    Icon: CardOfferIcon,
    name: "卡牌奖励",
    desc: "为每名存活队员生成 1 张候选卡牌，选择其中 1 张加入对应角色卡组。",
  },
  equipCrate: {
    Icon: EquipCrateIcon,
    name: "随机装备箱",
    desc: "开启后按本场掉落系数生成 1 件随机装备，并尝试附加 1 条羁绊。",
  },
};

function activate(event: KeyboardEvent<HTMLDivElement>, onActivate: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function BoonCell({ boon, index, onTake }: { boon: PendingBoon; index: number; onTake: (uid: string) => void }) {
  const meta = BOON_META[boon.kind];
  const Icon = meta.Icon;
  return (
    <div
      className={s.cell}
      data-rail-item
      data-boon-kind={boon.kind}
      tabIndex={0}
      style={{ "--vc-delay": victoryStagger(index) } as CSSProperties}
      aria-label={`${meta.name}，点击拾取`}
      role="button"
      onClick={() => onTake(boon.uid)}
      onKeyDown={(event) => activate(event, () => onTake(boon.uid))}
    >
      <Icon className={s.icon} />
      <RailPopover side={index % 2 ? "bottom-right" : "bottom-left"}>
        <strong>{meta.name}</strong>
        <p>{meta.desc}</p>
        <small className={s["popover-hint"]}>点击拾取</small>
      </RailPopover>
    </div>
  );
}

export function VictoryBoonTray({ style }: Props) {
  const pendingBoons = useExploreStore((state) => state.session?.pendingBoons ?? []);
  const takeBoon = useExploreStore((state) => state.takeBoonAction);

  return (
    <section className={s.tray} style={style} aria-label="战斗胜利额外奖励">
      <div className={s.heading}>
        <span>额外奖励</span>
        <small>{pendingBoons.length ? `${pendingBoons.length} 项待拾取` : "已清空"}</small>
      </div>
      <div className={`${s.grid} ${!pendingBoons.length ? s["empty-grid"] : ""}`}>
        {pendingBoons.length ? (
          pendingBoons.map((boon, index) => <BoonCell key={boon.uid} boon={boon} index={index} onTake={takeBoon} />)
        ) : (
          <div className={s.empty}>本场没有待处理的额外奖励</div>
        )}
      </div>
    </section>
  );
}
