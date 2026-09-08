import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { picnicFoods } from "@/explore/picnic";
import type { PicnicResult } from "@/explore/picnic";
import { EXPLORE_RULES } from "@/explore/rules";
import { useExploreStore } from "@/store/exploreStore";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelResult,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { cx } from "@/ui/common/cx";
import s from "./PicnicPanel.module.css";

export default function PicnicPanel({ onClose }: { onClose: () => void }) {
  const session = useExploreStore((state) => state.session);
  const resolve = useExploreStore((state) => state.picnic);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [result, setResult] = useState<PicnicResult | null>(null);

  const foods = session ? picnicFoods(session) : [];
  const selectedTotal = Object.values(picks).reduce((sum, count) => sum + count, 0);
  const selectedSlots = useMemo(
    () => Object.entries(picks).flatMap(([itemId, count]) => Array.from({ length: count }, () => itemId)),
    [picks],
  );

  if (!session) return null;

  const addFood = (itemId: string, available: number) => {
    const selected = picks[itemId] ?? 0;
    if (selectedTotal >= EXPLORE_RULES.picnic.maxFoods || selected >= available) return;
    setPicks((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }));
  };

  const removeFood = (index: number) => {
    const itemId = selectedSlots[index];
    if (!itemId) return;
    setPicks((current) => {
      const nextCount = (current[itemId] ?? 0) - 1;
      if (nextCount <= 0) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return { ...current, [itemId]: nextCount };
    });
  };

  const startPicnic = () => {
    const next = resolve(picks);
    if (!next) return;
    setResult(next);
  };

  const scene = result ? "result" : "pick";
  return (
    <div className={s.layer}>
      <section className={cx(s.panel, s["panel-reveal"])} style={panelRevealVars()} aria-label="野餐技能">
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanelFrame
          accent="#f0b46a"
          kicker="远征技能 / 野餐"
          title="野餐"
          status={<span className={s.status}>已选 {selectedTotal} / {EXPLORE_RULES.picnic.maxFoods}</span>}
          scene={scene === "pick" ? "choice" : "result"}
          contentKey={`picnic-${scene}`}
        >
          {result ? (
            <EventPanelResult
              seal="🧺"
              eyebrow="远征技能 · 结算"
              heading={result.recipeName ?? "平平无奇的一餐"}
              story={result.story}
              notes={result.notes.map((text, index) => ({ text, delayMs: 180 + index * 120 }))}
              footNote="效果已生效，本趟远征不能再次野餐"
              confirmLabel="收起"
              onConfirm={onClose}
            />
          ) : (
            <EventPanelStage>
              <EventPanelBody className={s["picnic-body"]}>
                <section className={s["food-section"]}>
                  <div className={s["section-heading"]}>
                    <strong>临期食品</strong>
                    <span>从背包里挑选，最多 4 份</span>
                  </div>
                  <div className={s["food-grid"]}>
                    {foods.map((food) => {
                      const selected = picks[food.itemId] ?? 0;
                      const full = selectedTotal >= EXPLORE_RULES.picnic.maxFoods || selected >= food.count;
                      return (
                        <div className={s["food-item"]} key={food.itemId}>
                          <ItemSlot
                            stack={{ uid: `picnic-${food.itemId}`, itemId: food.itemId, count: food.count }}
                            selected={selected > 0}
                            disabled={full}
                            aria-label={`选择${getItemDef(food.itemId).name}，剩余 ${food.count - selected} 份`}
                            onClick={() => addFood(food.itemId, food.count)}
                          />
                          <span>剩余 {food.count - selected} 份</span>
                        </div>
                      );
                    })}
                  </div>
                  {!foods.length && <p className={s.empty}>背包里没有可用于野餐的临期食品。</p>}
                </section>

                <section className={s["cloth-section"]}>
                  <div className={s["section-heading"]}>
                    <strong>野餐布</strong>
                    <span>点击食物移除一份</span>
                  </div>
                  <div className={s["cloth-grid"]}>
                    {Array.from({ length: EXPLORE_RULES.picnic.maxFoods }, (_, index) => {
                      const itemId = selectedSlots[index];
                      if (!itemId) return <EmptySlot key={index} className={s["cloth-slot"]} />;
                      return (
                        <ItemSlot
                          key={`${itemId}-${index}`}
                          className={cx(s["cloth-slot"], s["cloth-food"])}
                          stack={{ uid: `picnic-picked-${itemId}-${index}`, itemId, count: 1 }}
                          showCount={false}
                          aria-label={`移除一份${getItemDef(itemId).name}`}
                          onClick={() => removeFood(index)}
                        />
                      );
                    })}
                  </div>
                  <p className={s["hidden-recipe"]}>食谱不会公开——把不同的食物凑在一起试试。</p>
                </section>
              </EventPanelBody>
              <EventPanelFoot note="野餐结束后，本趟远征不能再次使用这项技能">
                <EventPanelButton tone="primary" onClick={startPicnic}>
                  开始野餐
                </EventPanelButton>
                <EventPanelButton onClick={onClose}>收起</EventPanelButton>
              </EventPanelFoot>
            </EventPanelStage>
          )}
        </EventPanelFrame>
      </section>
    </div>
  );
}
