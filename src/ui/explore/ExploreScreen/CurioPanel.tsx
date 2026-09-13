import { useEffect, useRef } from "react";
import { getItemDef } from "@/data";
import { CORRIDOR_CURIOS } from "@/data/corridorCurios";
import { interactionCost, landedChoices, landedEvent } from "@/explore/session";
import { hasCorridorRewards } from "@/explore/corridor/session";
import type { ExploreState } from "@/explore/types";
import { countByItemId } from "@/items/inventory";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import { closeCorridorObject } from "@/store/exploreCorridor";
import { CorridorSprite } from "@/ui/explore/CorridorScene/CorridorSprite";
import s from "./CurioPanel.module.css";

export function CurioPanel({ session, onOpenBag, covered }: { session: ExploreState; onOpenBag: () => void; covered: boolean }) {
  const panel = useRef<HTMLElement>(null);
  const object = session.corridor?.objects.find((item) => item.id === session.corridor?.activeObjectId);
  const def = object ? CORRIDOR_CURIOS[object.kind] : null;
  const event = landedEvent(session);
  const result = session.phase === "resolving";
  const rewards = hasCorridorRewards(session);

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    if (!panel.current) return;
    panel.current.inert = covered;
    if (!covered) panel.current.focus();
  }, [covered]);
  if (!event || !def || !object) return null;
  const artworkSize = object.kind === "chest" ? 230 : 280;

  return <div className={s.backdrop}>
    <section ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-labelledby="curio-heading" tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !result) { e.stopPropagation(); closeCorridorObject(); }
        if (e.key === "Tab") {
          const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }}>
      <div className={s.art}><span className={s.artHalo} /><CorridorSprite kind={object.kind} size={artworkSize} interacting={false} /><span>遗留物件 · {session.dungeon?.rooms[session.dungeon.currentRoomId]?.label ?? "?"} 号房间</span></div>
      <div className={s.content}>
        <div className={s.eyebrow}>{result ? "搜寻结果" : "驻足调查"}</div>
        <h2 id="curio-heading">{def.name}</h2>
        {!result ? <>
          <p className={s.description}>{event.description}</p>
          <p className={s.cost}>操作物件消耗 {interactionCost(session)} 点净化粒子 · 离开不消耗</p>
          <div className={s.choices}>{landedChoices(session).map((choice, index) => {
            const missing = choice.cost && countByItemId(session.backpack, choice.cost.itemId) < choice.cost.count;
            return <button key={choice.id} type="button" disabled={Boolean(missing)} onClick={() => useRunStore.getState().chooseEventOption(index)}>
              <strong>{choice.label}<span>→</span></strong><span>{choice.desc}</span>
              {choice.cost && <span>需要 {getItemDef(choice.cost.itemId).name} ×{choice.cost.count}{missing ? "（数量不足）" : ""}</span>}
            </button>;
          })}</div>
          <button className={s.leave} type="button" onClick={closeCorridorObject}>暂不处理，继续行走</button>
        </> : <>
          <div className={s.result} aria-live="polite">
            {session.pendingStory.map((text, index) => <p key={`story-${index}`}>{text}</p>)}
            {session.pendingNotes.map((text, index) => <p className={s.note} key={`note-${index}`}>{text}</p>)}
          </div>
          {session.chuteOpen && <button className={s.send} type="button" onClick={onOpenBag}>打开背包，选择寄回物品</button>}
          <button className={s.continue} type="button" disabled={rewards} onClick={() => useExploreStore.getState().confirmNode()}>{rewards ? "请先处理奖励" : "收拾行装，继续探索"}</button>
        </>}
      </div>
    </section>
  </div>;
}
