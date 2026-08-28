import type { CSSProperties, KeyboardEvent } from "react";
import { useExploreStore } from "@/store/exploreStore";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import { victoryStagger } from "@/ui/battle/victoryChoreo";
import { VictoryPlaque } from "@/ui/battle/VictoryPlaque";
import { cx } from "@/ui/common/cx";
import type { BattleBoonKind, PendingBoon } from "@/explore/types";
import cardOfferArt from "@/assets/通用素材/卡牌奖励.png";
import healDewArt from "@/assets/通用素材/治疗露珠.png";
import equipCrateArt from "@/assets/通用素材/装备宝箱.png";
import victoryCell from "@/ui/battle/styles/victoryCell.module.css";
import s from "./VictoryBoonTray.module.css";

interface Props {
  style?: CSSProperties;
}

const VICTORY_TOOLTIP_THEME = inventoryThemeVars(VICTORY_INVENTORY_COLORS);
const BOON_SLOT_COUNT = 4;

const BOON_META: Record<BattleBoonKind, { name: string; desc: string }> = {
  healDew: {
    name: "治疗露珠",
    desc: "拾取后，所有存活队员恢复 5 点生命，不会复活阵亡队员。",
  },
  cardOffer: {
    name: "卡牌奖励",
    desc: "为每名存活队员生成 1 张候选卡牌，选择其中 1 张加入对应角色卡组。",
  },
  equipCrate: {
    name: "随机装备箱",
    desc: "开启后按本场掉落系数生成 1 件随机装备，并尝试附加 1 条羁绊。",
  },
};

const BOON_ART: Record<BattleBoonKind, string> = {
  healDew: healDewArt,
  cardOffer: cardOfferArt,
  equipCrate: equipCrateArt,
};

function activate(event: KeyboardEvent<HTMLDivElement>, onActivate: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function BoonCell({ boon, index, onTake }: { boon: PendingBoon; index: number; onTake: (uid: string) => void }) {
  const meta = BOON_META[boon.kind];
  const { point, bind } = useHoverTooltip();
  return (
    <div
      className={cx(victoryCell.cell, s.cell)}
      data-boon-kind={boon.kind}
      tabIndex={0}
      {...bind}
      style={{ "--vc-delay": victoryStagger(index) } as CSSProperties}
      aria-label={`${meta.name}，点击拾取`}
      role="button"
      onClick={() => onTake(boon.uid)}
      onKeyDown={(event) => activate(event, () => onTake(boon.uid))}
    >
      <img className={s.icon} src={BOON_ART[boon.kind]} alt="" draggable={false} />
      {point && (
        <HoverTooltip point={point} themeStyle={VICTORY_TOOLTIP_THEME}>
          <strong>{meta.name}</strong>
          <p>{meta.desc}</p>
          <small>点击拾取</small>
        </HoverTooltip>
      )}
    </div>
  );
}

export function VictoryBoonTray({ style }: Props) {
  const pendingBoons = useExploreStore((state) => state.session?.pendingBoons ?? []);
  const takeBoon = useExploreStore((state) => state.takeBoonAction);
  const cells = [
    ...pendingBoons,
    ...Array.from({ length: Math.max(0, BOON_SLOT_COUNT - pendingBoons.length) }, () => null),
  ];

  return (
    <section className={s.tray} style={style} aria-label="战斗胜利额外奖励">
      <div className={s.row}>
        <VictoryPlaque
          label="额外奖励"
          variant="boon"
        />
        <div className={s["boon-tray"]}>
          <div className={cx(victoryCell.grid, s.grid)}>
            {cells.map((boon, index) => boon ? (
              <BoonCell key={boon.uid} boon={boon} index={index} onTake={takeBoon} />
            ) : (
              <div className={victoryCell.empty} key={`empty-${index}`} aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
