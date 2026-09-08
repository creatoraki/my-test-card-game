// 研究中心(据点设施 worklog)的设施内界面：承载模组装配与模组制造。
// 入口砖与面板的形变状态统一由 useModulePanels 管理，设施 id worklog 保持不变。
// 场景层皮肤 = 冷青墨玻璃，令牌见同目录 ResearchScene.module.css。

import { useMemo, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { DrawerEntries } from "@/ui/town/drawerEntry";
import { useModulePanels } from "../ModuleEntries";
import s from "./ResearchScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

interface Props {
  leaving?: boolean;
}

export function ResearchScene({ leaving = false }: Props) {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const modules = useModulePanels();
  const moduleStacks = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).category === "module"),
    [storage],
  );
  const installedCount = Object.values(characters).reduce(
    (count, character) => count + character.deck.filter((card) => card.cardModule).length,
    0,
  );

  return (
    <div className={cn("term-scene", leaving && "is-leaving")}>
      <header className={cn("term-header")} style={{ left: "56px", top: "42px" }}>
        <h2 className={cn("term-title")}>研究中心</h2>
        <p className={cn("term-sub")}>模组装配 · 模组制造</p>
      </header>

      <div className={cn("term-readout")} style={{ right: "56px", top: "42px" }}>
        <Readout label="终端积分" value={loot.toLocaleString()} />
        <Readout label="库存模组" value={String(moduleStacks.length)} />
        <Readout label="已装配" value={String(installedCount)} />
      </div>

      <DrawerEntries
        leaving={leaving}
        style={
          {
            right: 0,
            top: 138,
            width: 500,
            height: 216,
            "--peek": "296px",
            ...modules.entryVars,
            "--asm-ink": "#eaf7fb",
            "--asm-ink-dim": "#a6c8d4",
            "--asm-line": "#7fe3e02e",
            "--asm-frame": "#35d6d0",
            "--asm-fill": "linear-gradient(150deg, #0e2b33cc, #08191fe0)",
            "--asm-filter": "blur(14px) saturate(115%) brightness(0.9)",
            "--asm-shadow": "inset 0 1px 0 #ffffff26, 0 22px 46px -26px #04141aa8",
          } as CSSProperties
        }
      >
        {modules.entries}
      </DrawerEntries>

      {modules.panels}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("term-chip")}>
      <span className={cn("term-chip-label")}>{label}</span>
      <strong className={cn("term-chip-value")}>{value}</strong>
    </div>
  );
}
