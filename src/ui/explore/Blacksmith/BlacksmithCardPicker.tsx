import { useMemo, useState } from "react";
import { makeCard } from "@/data";
import { cardDisplayName } from "@/engine";
import type { ExploreState } from "@/explore/types";
import { BLACKSMITH_SERVICES, type BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { useTownStore } from "@/store/town/townStore";
import { blacksmithCardReason, blacksmithCharacterReason, blacksmithServiceReason } from "@/store/explore/blacksmithRules";
import { performBlacksmithService, startBlacksmithDraw } from "@/store/explore/blacksmithActions";
import { HandCard } from "@/ui/common/card/HandCard";
import { CardDetail } from "@/ui/common/card/CardDetail";
import s from "./Blacksmith.module.css";

export function BlacksmithCardPicker({ session, service, onBack }: {
  session: ExploreState;
  service: Exclude<BlacksmithService, "replace">;
  onBack: () => void;
}) {
  const characters = useTownStore(state => state.characters);
  const members = session.party.filter(member => member.alive);
  const [charId, setCharId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const character = charId ? characters[charId] : null;
  const card = character?.deck.find(entry => entry.uid === uid) ?? null;
  const copyPreview = useMemo(() => service === "copy" && card ? makeCard(card.id) : null, [service, card?.id]);
  const info = BLACKSMITH_SERVICES[service];
  const reason = blacksmithServiceReason(session, characters, service)
    ?? (character ? blacksmithCharacterReason(character, service) : "请选择存活角色")
    ?? (service !== "draw" ? card && character ? blacksmithCardReason(character, service, card) : "请选择卡牌" : null);
  const confirm = () => {
    if (!charId || reason) return;
    const success = service === "draw" ? startBlacksmithDraw(charId)
      : card ? performBlacksmithService(service, charId, card.uid) : false;
    setFailed(!success);
  };

  return <div className={s.picker}>
    <header className={s.pickerHeader}>
      <h3>{info.name}</h3>
      <p>{info.description}</p>
    </header>
    <div className={s.members} aria-label="选择角色">
      {members.map(member => {
        const memberReason = characters[member.charId] ? blacksmithCharacterReason(characters[member.charId], service) : "角色不可用";
        return <button type="button" key={member.charId} className={s.member} aria-pressed={member.charId === charId}
          disabled={Boolean(memberReason)} onClick={() => { setCharId(member.charId); setUid(null); setFailed(false); }}>
          <strong>{member.name}</strong><span>{memberReason ?? "选择角色"}</span>
        </button>;
      })}
    </div>
    {!members.length && <p className={s.notice}>当前没有存活角色。</p>}
    {service !== "draw" && character && <div className={s.selection}>
      <div className={s.cardGrid} data-pick-grid>
        {character.deck.map(entry => {
          const disabledReason = blacksmithCardReason(character, service, entry);
          return <div key={entry.uid} className={s.cardSlot} role="button" tabIndex={disabledReason ? -1 : 0}
            aria-disabled={Boolean(disabledReason)} aria-pressed={entry.uid === uid}
            aria-label={`选择${cardDisplayName(entry)}${disabledReason ? `，${disabledReason}` : ""}`}
            onClick={() => { if (!disabledReason) { setUid(entry.uid); setFailed(false); } }}
            onKeyDown={event => {
              if ((event.key === "Enter" || event.key === " ") && !disabledReason) { event.preventDefault(); setUid(entry.uid); setFailed(false); }
            }}>
            <HandCard card={entry} variant="pile" playable={!disabledReason} selected={entry.uid === uid} />
            <span>{disabledReason ?? (entry.uid === uid ? "已选择" : "点击选择")}</span>
          </div>;
        })}
      </div>
      <aside className={s.preview}>
        {card ? <>
          <p>{service === "copy" ? "将获得以下干净的同名卡" : "确认后删除以下卡牌及其模组"}</p>
          <CardDetail card={copyPreview ?? card} />
        </> : <p>选择卡牌后查看详情。</p>}
      </aside>
    </div>}
    {service === "draw" && <p className={s.drawNote}>确认后消耗一份临期食品并生成候选，必须完成选牌。本次相遇的另一项服务随即失效。</p>}
    <footer className={s.footer}>
      <p role="status">{failed ? "服务未执行，请重新确认目标与食品数量。" : reason ?? `确认后消耗临期食品${info.food}份，并结束本次服务。`}</p>
      <button type="button" className={s.button} onClick={onBack}>返回服务选择</button>
      <button type="button" className={s.primary} disabled={Boolean(reason)} onClick={confirm}>
        {service === "draw" ? "付费并生成候选" : `确认${info.name}`}
      </button>
    </footer>
  </div>;
}
