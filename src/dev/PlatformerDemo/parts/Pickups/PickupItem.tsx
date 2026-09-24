import { memo, useState, type CSSProperties } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import type { PickupSpawn } from "../../types";
import { PICKUP_INFO } from "../../engine/pickup";
import { PickupIcon } from "./PickupArt";
import s from "./Pickups.module.css";

export const PICKUP_BOX = 112;

interface Props {
  spawn: PickupSpawn;
  /** 由游戏循环写 data-near，标记是否处于拾取范围。 */
  register: (id: string, el: HTMLDivElement | null) => void;
  /** 返回 false 表示距离太远，物件原地提示。 */
  onPick: (spawn: PickupSpawn, el: HTMLElement) => boolean;
}

/** 场景中的可拾取物件：悬浮显示名称，范围内发光，点击拾取或提示「距离太远」。 */
export const PickupItem = memo(function PickupItem({ spawn, register, onPick }: Props) {
  const info = PICKUP_INFO[spawn.kind];
  const { point, bind } = useHoverTooltip("top");
  const [warn, setWarn] = useState(0);

  return (
    <div
      ref={(el) => register(spawn.id, el)}
      className={s.item}
      style={{ left: spawn.x - PICKUP_BOX / 2, top: spawn.y - PICKUP_BOX + 8, "--accent": info.accent } as CSSProperties}
      role="button"
      tabIndex={-1}
      aria-label={`拾取${info.name}`}
      {...bind}
      onClick={(event) => {
        if (!onPick(spawn, event.currentTarget)) setWarn((n) => n + 1);
      }}
    >
      <span className={s.halo} aria-hidden />
      <span className={s.art}>
        <PickupIcon kind={spawn.kind} size={PICKUP_BOX} />
      </span>
      {warn > 0 && (
        <span key={warn} className={s.warn} onAnimationEnd={() => setWarn(0)}>距离太远</span>
      )}
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={info.name} desc={info.desc} accent={info.accent}>
            <span className={s.tip}>靠近后点击即可拾取</span>
          </TooltipCard>
        </HoverTooltip>
      )}
    </div>
  );
});
