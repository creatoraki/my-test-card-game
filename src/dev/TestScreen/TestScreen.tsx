import { useState } from "react";
import { FlatMaterialScene } from "./flatMaterials/FlatMaterialScene";
import { EnergyTierShowcase } from "./energy/EnergyTierShowcase";
import s from "./TestScreen.module.css";

export function TestScreen() {
  const [page, setPage] = useState<"energy" | "scene">("energy");
  return <div className={s.root}>
    <nav className={s.tabs} aria-label="演示页面">
      <button type="button" aria-pressed={page === "energy"} onClick={() => setPage("energy")}>粒子档位演示</button>
      <button type="button" aria-pressed={page === "scene"} onClick={() => setPage("scene")}>场景与面板演示</button>
    </nav>
    {page === "energy" ? <EnergyTierShowcase /> : <FlatMaterialScene />}
  </div>;
}
