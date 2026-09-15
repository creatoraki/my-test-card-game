import { useEffect, useRef, useState } from "react";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { canOfferAny, visibleDecisions } from "@/explore/curio/visibility";
import { hasCorridorRewards } from "@/explore/corridor/session";
import { interactionCost } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import { closeCorridorObject } from "@/store/exploreCorridor";
import { CorridorSprite } from "@/ui/explore/CorridorScene/CorridorSprite";
import { CurioOfferView } from "./CurioOfferView";
import s from "./CurioPanel.module.css";

export function CurioPanel({
  session,
  onOpenBag,
  covered,
}: {
  session: ExploreState;
  onOpenBag: () => void;
  covered: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const [offerMode, setOfferMode] = useState(false);
  const object = session.corridor?.objects.find((item) => item.id === session.corridor?.activeObjectId);
  const def = object ? CORRIDOR_CURIOS[object.kind] : null;
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
  useEffect(() => {
    if (result) setOfferMode(false);
  }, [result]);
  if (!def || !object || object.kind === "merchant") return null;

  const decisions = visibleDecisions(session, def);
  const offeringAvailable = canOfferAny(session, def);
  const artworkSize = def.size;

  if (offerMode && !result) {
    return <div className={s.backdrop}>
      <section ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-labelledby="curio-heading" tabIndex={-1}>
        <div className={s.art}><span className={s.artHalo} /><CorridorSprite kind={object.kind} size={artworkSize} interacting={false} /><span>{def.name} · {session.dungeon?.rooms[session.dungeon.currentRoomId]?.label ?? "?"} 号房间</span></div>
        <div className={s.content}><CurioOfferView
          backpack={session.backpack}
          objectId={object.id}
          onBack={() => setOfferMode(false)}
          onSubmit={(picks) => useRunStore.getState().offerCurio(picks)}
        /></div>
      </section>
    </div>;
  }

  return <div className={s.backdrop}>
    <section ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-labelledby="curio-heading" tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !result) { event.stopPropagation(); closeCorridorObject(); }
        if (event.key === "Tab") {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className={s.art}><span className={s.artHalo} /><CorridorSprite kind={object.kind} size={artworkSize} interacting={false} /><span>{def.name} · {session.dungeon?.rooms[session.dungeon.currentRoomId]?.label ?? "?"} 号房间</span></div>
      <div className={s.content}>
        <div className={s.eyebrow}>{result ? "搜寻结果" : "驻足调查"}</div>
        <h2 id="curio-heading">{def.name}</h2>
        {!result ? <>
          <p className={s.description}>{def.description}</p>
          <p className={s.cost}>操作物件消耗 {interactionCost(session)} 点净化粒子 · 离开不消耗</p>
          <div className={s.choices}>{decisions.map((decision) => (
            <button key={decision.id} type="button" onClick={() => useRunStore.getState().chooseCurio(decision.id)}>
              <strong>{decision.label}<span>→</span></strong>
            </button>
          ))}</div>
          {offeringAvailable && <button className={s.offer} type="button" onClick={() => setOfferMode(true)}>
            尝试放入什么物体看看会不会发生什么
          </button>}
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
