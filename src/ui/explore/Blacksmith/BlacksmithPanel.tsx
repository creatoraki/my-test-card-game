import { useEffect, useState } from "react";
import { cardDisplayName } from "@/engine";
import blacksmithArt from "@/assets/explore-corridor/公共NPC/锻造师.webp";
import type { ExploreState } from "@/explore/types";
import { BLACKSMITH_SERVICES, type BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { useTownStore } from "@/store/town/townStore";
import { activeBlacksmith, blacksmithServiceReason } from "@/store/explore/blacksmithRules";
import { openBlacksmith, performBlacksmithService, pickBlacksmithDraw } from "@/store/explore/blacksmithActions";
import { closeCorridorObject } from "@/store/explore/exploreCorridor";
import { CardRewardPicker } from "@/ui/common/card/CardRewardPicker";
import { CardReplaceModal } from "../CardReplace/CardReplaceModal";
import { DossierChoice, DossierInfoBox, DossierNotice, DossierResult, EventDossierPanel, type DossierAction } from "../EventDossier";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import theme from "@/ui/town/shop/styles/shopTheme.module.css";
import { BlacksmithCardPicker } from "./BlacksmithCardPicker";
import { BlacksmithResult } from "./BlacksmithResult";
import { useDialogFocus } from "../ExploreScreen/useDialogFocus";
import s from "./Blacksmith.module.css";

/** 锻造师是独立事件；事件页展示插画，选卡页复用卡组窗口。 */
export function BlacksmithPanel({ session }: { session: ExploreState }) {
  const characters = useTownStore(state => state.characters);
  const [service, setService] = useState<BlacksmithService | null>(null);
  const forge = activeBlacksmith(session)?.blacksmith;
  useEffect(() => { openBlacksmith(); }, [session.phase, session.corridor?.activeObjectId]);
  const members = session.party.filter(member => member.alive);
  const room = session.dungeon?.rooms[session.dungeon.currentRoomId];
  const replacementResult = forge?.selected === "replace" && forge.result?.before && forge.result.after
    ? { charId: forge.result.charId, before: forge.result.before, after: forge.result.after } : undefined;
  const drawOptions = forge?.status === "drawing" && forge.offers
    ? forge.offers.map(card => ({ key: card.uid, card, ownerCharId: forge.charId })) : null;
  const choosing = Boolean(service && service !== "replace" && forge?.status !== "drawing");
  const selectionDialog = useDialogFocus({ active: choosing, onEscape: () => setService(null) });
  const completed = forge?.status === "completed";
  const leave: DossierAction = { id: "leave", label: completed ? "离开锻造师" : "暂不交易，继续前进", icon: "leave", sfx: "back", onClick: closeCorridorObject };
  const actions: DossierAction[] = forge?.status === "available" ? [
    ...forge.services.map(kind => {
      const info = BLACKSMITH_SERVICES[kind];
      const reason = blacksmithServiceReason(session, characters, kind);
      return {
        id: kind, label: info.name, icon: "upgrade" as const,
        cost: reason ? `临期食品${info.food}份 · ${reason}` : `任意临期食品${info.food}份`,
        costTone: reason ? "red" as const : "cyan" as const,
        disabled: Boolean(reason), onClick: () => setService(kind),
      };
    }), leave,
  ] : completed ? [leave] : [];
  const resultNotes = forge?.selected ? [`已消耗临期食品${BLACKSMITH_SERVICES[forge.selected].food}份。`] : [];
  if (forge?.result?.before) resultNotes.push(`原卡牌：${cardDisplayName(forge.result.before)}${forge.selected === "copy" ? "，保留原样。" : "，已连同模组移除。"}`);
  if (forge?.result?.after) resultNotes.push(`已获得「${cardDisplayName(forge.result.after)}」。`);

  return <>
    <EventDossierPanel theme="blacksmith" kicker={`锻造师 · ${room?.label ?? ""}号房间`} title="锻造师" enTitle="卡组锻造服务"
      contentKey={forge?.status ?? "preparing"} active={!service && forge?.status !== "drawing"}
      onClose={forge?.status === "drawing" ? undefined : closeCorridorObject}>
      {completed ? <DossierResult story={["锻造师收起工具，本次服务已结束。", "另一项服务不再可用。"]} notes={resultNotes} actions={actions} />
        : <DossierChoice lines={[
          "炉火映亮了锻造师的面罩，他向小队展示了本次可用的两种服务。",
          "每次相遇只能选择一种服务，临期食品可以混付。",
          ...(forge?.services.map(kind => `${BLACKSMITH_SERVICES[kind].name}：${BLACKSMITH_SERVICES[kind].description}`) ?? ["锻造师正在准备服务……"]),
        ]} info={<DossierInfoBox><DossierNotice title={`可用临期食品 ${serviceFoodCount(session)} 份`} note="打开与离开不消耗净化粒子。服务成功后本次交易结束。" /></DossierInfoBox>} actions={actions} />}
    </EventDossierPanel>
    {choosing && forge && service && service !== "replace" && <div className={s.backdrop}>
      <section ref={selectionDialog.panel} onKeyDown={selectionDialog.onKeyDown} tabIndex={-1} role="dialog" aria-modal="true"
        aria-label={`锻造师 · ${BLACKSMITH_SERVICES[service].name}`} className={`${theme.theme} ${s.theme}`} data-shop-root>
        <ShopWindow className={s.window} contentClassName={s.content} ariaLabel={`锻造师 · ${BLACKSMITH_SERVICES[service].name}`}
          header={<ShopHeader title={`锻造师 · ${BLACKSMITH_SERVICES[service].name}`} subtitle="本次相遇只提供一次服务。"
            stats={<span className={s.wallet}>可用临期食品 <strong>{serviceFoodCount(session)}</strong> 份 · 支持混付</span>}
            onBack={() => setService(null)} closeLabel="返回锻造师事件" />}>
          <aside className={s.portrait}><img src={blacksmithArt} alt="锻造师" /><p>「选一项，我替你把卡组打磨得更顺手。」</p></aside>
          <div className={s.workbench}>
            {completed ? <BlacksmithResult forge={forge} onClose={() => setService(null)} />
              : <BlacksmithCardPicker key={service} session={session} service={service} onBack={() => setService(null)} />}
          </div>
        </ShopWindow>
      </section>
    </div>}
    <CardRewardPicker options={drawOptions} title="锻造师 · 三选一抽牌" kicker="已支付临期食品一份"
      caption="选择一张加入角色卡组，本次相遇的另一项服务已失效。" allowSkip={false}
      onConfirm={option => pickBlacksmithDraw(option.card.uid)} onSkip={() => {}} />
    <CardReplaceModal action={service === "replace" && forge ? { result: replacementResult } : null} members={members} lockedCharId={null}
      kicker="锻造师 · 换牌" paymentNote="确认成功后消耗临期食品三份"
      unavailableReason={forge?.status === "available" ? blacksmithServiceReason(session, characters, "replace") : null}
      onReplace={(charId, uid) => performBlacksmithService("replace", charId, uid)} onFinish={() => setService(null)} />
  </>;
}
