// 医疗室常驻界面: 左侧导航只替换窗口内容, 三页共用同一套页眉读数与换页演出(与商店 / 研究中心同构)。
// 疗养科技是疗养舱的子页, 用法同商店「设施升级」: 导航仍高亮疗养舱。
import { useState, type CSSProperties } from "react";
import { SANCTUARY_RULES } from "@/data";
import { useTownStore } from "@/store/townStore";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { NavigationRail } from "@/ui/town/shop/ShopNavigation";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import { NutritionPanel } from "../NutritionPanel";
import { NutritionUpgradePanel } from "../NutritionTechTree";
import { RevivePanel } from "../RevivePanel";
import { SanctuaryPanel } from "../SanctuaryPanel";
import { CryoNavIcon } from "./CryoNavIcon";
import s from "./CryoPanel.module.css";

export type CryoPage = "revive" | "nutrition" | "sanctuary";
type CryoView = CryoPage | "nutritionTech";

const ENTRIES = [
  { id: "nutrition", label: "疗养舱", subLabel: "RECOVERY", icon: <CryoNavIcon page="nutrition" /> },
  { id: "sanctuary", label: "圣水池", subLabel: "SANCTUARY", icon: <CryoNavIcon page="sanctuary" /> },
  { id: "revive", label: "复苏舱", subLabel: "REVIVE", icon: <CryoNavIcon page="revive" /> },
] as const;

const TITLES: Record<CryoView, string> = {
  revive: "复苏舱",
  nutrition: "疗养舱",
  sanctuary: "圣水池",
  nutritionTech: "疗养舱升级",
};

const SUBTITLES: Record<CryoView, string> = {
  revive: "唤醒阵亡队员，档案归零后重新待命。",
  nutrition: "低温疗养恢复队员体力上限。",
  sanctuary: `投入诅咒遗物，${SANCTUARY_RULES.days} 天后净化为祝福。`,
  nutritionTech: "投入水晶，扩建疗养席位、提升疗养液配比。",
};

const PAGE_LEAVE_MS = 170;
const PAGE_ENTER_MS = 280;

export function CryoPanel({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<CryoView>("nutrition");
  const { value: shownView, phase } = useSwapTransition(view, view, PAGE_LEAVE_MS, PAGE_ENTER_MS);
  const awakened = useTownStore((state) => state.awakened);
  const fallen = useTownStore((state) => state.fallen);
  const loot = useTownStore((state) => state.loot);
  const reviveFallen = useTownStore((state) => state.reviveFallen);
  const admitToNutritionPods = useTownStore((state) => state.admitToNutritionPods);
  const purifyRelic = useTownStore((state) => state.purifyRelic);
  const [podSlot, setPodSlot] = useState(0);

  return (
    <>
      <NavigationRail
        entries={ENTRIES}
        value={view === "nutritionTech" ? "nutrition" : view}
        onChange={setView}
        ariaLabel="医疗室功能"
      />
      <ShopWindow
        className={s.window}
        frameTone="med"
        ariaLabel={TITLES[shownView]}
        header={
          <ShopHeader
            title={TITLES[shownView]}
            subtitle={SUBTITLES[shownView]}
            stats={
              <>
                <CryoStat label="在编队员" value={String(awakened.length)} />
                <CryoStat label="阵亡" value={String(fallen.length)} alert={fallen.length > 0} />
                <CryoStat label="居民积分" value={loot.toLocaleString()} />
              </>
            }
            onBack={onBack}
            closeLabel="关闭医疗室，返回据点"
          />
        }
      >
        <div className={s.page} data-page-phase={phase}>
          {shownView === "revive" && (
            <RevivePanel awakened={awakened} fallen={fallen} loot={loot} slot={podSlot} onSelect={setPodSlot} onRevive={reviveFallen} />
          )}
          {shownView === "nutrition" && (
            <NutritionPanel onAdmit={admitToNutritionPods} onUpgrade={() => setView("nutritionTech")} />
          )}
          {shownView === "nutritionTech" && <NutritionUpgradePanel onBack={() => setView("nutrition")} />}
          {shownView === "sanctuary" && <SanctuaryPanel onPurify={purifyRelic} />}
        </div>
      </ShopWindow>
    </>
  );
}

function CryoStat({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={s.stat} style={alert ? ({ "--stat-value": "var(--sx-alert)" } as CSSProperties) : undefined}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
