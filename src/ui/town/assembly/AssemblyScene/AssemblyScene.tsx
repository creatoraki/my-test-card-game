// 工房(据点设施 assembly)的装备侧界面：这里只保留装备升阶与羁绊重铸。
// 模组装配与模组制造已迁入研究中心(terminal)，入口与浮层分别由各自模块管理。

import { useMemo, type CSSProperties } from "react";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { DrawerEntries } from "@/ui/town/drawerEntry";
import { buildEquipTargets } from "../EquipTargetList";
import { useEquipPanels } from "./EquipEntries";
import s from "./AssemblyScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

interface Props {
  leaving?: boolean;
}

export function AssemblyScene({ leaving = false }: Props) {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const equip = useEquipPanels();
  const equipTargets = useMemo(() => buildEquipTargets(storage, characters), [characters, storage]);
  const equipmentCount = equipTargets.length;
  const equippedCount = equipTargets.filter((entry) => entry.ownerName).length;

  return (
    <div className={cn("asm-scene", leaving && "is-leaving")}>
      <header className={cn("asm-header")} style={{ left: "56px", top: "42px" }}>
        <h2 className={cn("asm-title")}>工房</h2>
        <p className={cn("asm-sub")}>装备升阶 · 羁绊重铸</p>
      </header>

      <div className={cn("asm-readout")} style={{ right: "56px", top: "42px" }}>
        <Readout label="可改装装备" value={equipmentCount} />
        <Readout label="已装备" value={equippedCount} />
      </div>

      <DrawerEntries
        leaving={leaving}
        style={
          {
            right: "0px",
            top: "138px",
            width: "500px",
            height: "216px",
            "--peek": "296px",
            ...equip.entryVars,
          } as CSSProperties
        }
      >
        {equip.entries}
      </DrawerEntries>

      {equip.panels}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("asm-chip")}>
      <span className={cn("asm-chip-label")}>{label}</span>
      <strong className={cn("asm-chip-value")}>{value}</strong>
    </div>
  );
}
