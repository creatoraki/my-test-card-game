import { useState } from "react";
import { getCharacter, getItemDef, makeCard } from "@/data";
import { EQUIP_SLOTS, useTownStore } from "@/store/townStore";
import { useExploreStore } from "@/store/exploreStore";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { CardView } from "@/ui/character/CardView";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./RewardOverlay.module.css";

export default function RewardOverlay() {
  const session = useExploreStore((state) => state.session);
  const grantExpTo = useExploreStore((state) => state.grantExpTo);
  const resolvePendingAction = useExploreStore((state) => state.resolvePendingAction);
  const acceptEquipOffer = useExploreStore((state) => state.acceptEquipOffer);
  const reforgeBackpackItem = useExploreStore((state) => state.reforgeBackpackItem);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const grantFreeDraw = useTownStore((state) => state.grantFreeDraw);
  const pickDraw = useTownStore((state) => state.pickDraw);
  const removeCardFree = useTownStore((state) => state.removeCardFree);
  const reforgeEquipped = useTownStore((state) => state.reforgeEquipped);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const action = session?.pendingActions[0];
  if (!session || !action) return null;

  const selectableCharacters = session.party.filter((member) => member.alive);
  const chosenCharId = selectedChar && characters[selectedChar] ? selectedChar : null;
  const chosenCharacter = chosenCharId ? characters[chosenCharId] : null;
  const finish = () => resolvePendingAction();

  return (
    <div className={s["reward-layer"]}>
      <section className={s["reward-panel"]} aria-label="事件奖励">
        <header className={s["reward-head"]}>
          <div>
            <span className={s["reward-kicker"]}>GROWTH PROTOCOL / REWARD</span>
            <h3 className={s["reward-title"]}>{titleOf(action.kind)}</h3>
          </div>
          <span className={s["reward-step"]}>待处理奖励</span>
        </header>

        {action.kind === "expOne" && (
          <CharacterPicker
            members={selectableCharacters}
            selected={chosenCharId}
            onSelect={setSelectedChar}
            caption={`选择一名存活角色，获得 ${action.amount} 点经验`}
            onSkip={finish}
            onConfirm={() => {
              if (!chosenCharId) return;
              grantExpTo(chosenCharId);
              finish();
            }}
          />
        )}

        {action.kind === "forgeDraw" && (
          <FreeDraw
            members={selectableCharacters}
            selected={chosenCharId}
            character={chosenCharacter}
            onSelect={setSelectedChar}
            onStart={() => {
              if (chosenCharId) grantFreeDraw(chosenCharId);
            }}
            onSkip={finish}
            onPick={(cardId) => {
              if (!chosenCharId) return;
              pickDraw(chosenCharId, cardId);
              finish();
            }}
          />
        )}

        {action.kind === "forgeRemove" && (
          <FreeRemove
            members={selectableCharacters}
            selected={chosenCharId}
            character={chosenCharacter}
            onSelect={setSelectedChar}
            onSkip={finish}
            onRemove={(uid) => {
              if (!chosenCharId) return;
              removeCardFree(chosenCharId, uid);
              finish();
            }}
            onSkip={finish}
          />
        )}

        {action.kind === "equipOffer" && (
          <EquipOffers
            offers={action.offers}
            onPick={(index) => {
              acceptEquipOffer(index);
              finish();
            }}
            onSkip={finish}
          />
        )}

        {action.kind === "reforge" && (
          <ReforgePicker
            backpack={session.backpack}
            characters={party.map((id) => ({ charId: id, character: characters[id] })).filter(
              (entry): entry is { charId: string; character: NonNullable<typeof entry.character> } =>
                Boolean(entry.character),
            )}
            bias={action.bias}
            onBackpack={(uid) => {
              reforgeBackpackItem(uid);
              finish();
            }}
            onEquipped={(charId, slot) => {
              reforgeEquipped(charId, slot, action.bias);
              finish();
            }}
            onSkip={finish}
          />
        )}
      </section>
    </div>
  );
}

function titleOf(kind: string): string {
  switch (kind) {
    case "expOne":
      return "定向训练";
    case "forgeDraw":
      return "免费卡组锻造";
    case "forgeRemove":
      return "免费卡组整理";
    case "equipOffer":
      return "装备候选";
    case "reforge":
      return "羁绊重铸";
    default:
      return "事件奖励";
  }
}

function CharacterPicker({
  members,
  selected,
  onSelect,
  caption,
  onSkip,
  onConfirm,
}: {
  members: { charId: string; name: string; emoji: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  caption: string;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={s["reward-body"]}>
      <p className={s["reward-caption"]}>{caption}</p>
      {members.length ? (
        <div className={s["character-list"]}>
          {members.map((member) => (
          <button
            className={cx(s["character-choice"], selected === member.charId && s["is-selected"])}
            type="button"
            key={member.charId}
            onClick={() => onSelect(member.charId)}
          >
            <span className={s["character-emoji"]}>{member.emoji}</span>
            <span>{member.name}</span>
          </button>
          ))}
        </div>
      ) : (
        <p className={s["reward-empty"]}>当前没有可用的存活角色。</p>
      )}
      <footer className={s["reward-foot"]}>
        <span>{members.length ? (selected ? "目标已锁定" : "请选择角色") : "奖励无法执行"}</span>
        {members.length ? (
          <button className={cx(s["reward-btn"], s["is-primary"])} type="button" disabled={!selected} onClick={onConfirm}>
            确认奖励
          </button>
        ) : (
          <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
        )}
      </footer>
    </div>
  );
}

function FreeDraw({
  members,
  selected,
  character,
  onSelect,
  onStart,
  onSkip,
  onPick,
}: {
  members: { charId: string; name: string; emoji: string }[];
  selected: string | null;
  character: { pendingDraw: string[] | null } | null;
  onSelect: (id: string) => void;
  onStart: () => void;
  onSkip: () => void;
  onPick: (cardId: string) => void;
}) {
  return (
    <div className={s["reward-body"]}>
      {!character?.pendingDraw ? (
        <>
          <p className={s["reward-caption"]}>选择一名角色，免费生成三张角色专属卡牌。</p>
          {members.length ? (
            <div className={s["character-list"]}>
              {members.map((member) => (
              <button
                className={cx(s["character-choice"], selected === member.charId && s["is-selected"])}
                type="button"
                key={member.charId}
                onClick={() => onSelect(member.charId)}
              >
                <span className={s["character-emoji"]}>{member.emoji}</span>
                <span>{member.name}</span>
              </button>
              ))}
            </div>
          ) : (
            <p className={s["reward-empty"]}>当前没有可用的存活角色。</p>
          )}
          <footer className={s["reward-foot"]}>
            <span>{members.length ? (selected ? "免费锻造不消耗经验" : "请选择角色") : "奖励无法执行"}</span>
            {members.length ? (
              <button className={cx(s["reward-btn"], s["is-primary"])} type="button" disabled={!selected} onClick={onStart}>
                开始锻造
              </button>
            ) : (
              <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
            )}
          </footer>
        </>
      ) : character.pendingDraw.length ? (
        <>
          <p className={s["reward-caption"]}>三张候选卡牌已经生成，选择一张加入卡组。</p>
          <div className={s["card-list"]}>
            {character.pendingDraw.map((cardId) => (
              <div className={s["card-choice"]} key={cardId}>
                <CardView card={makeCard(cardId)} playable selected={false} onClick={() => onPick(cardId)} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className={s["reward-empty"]}>当前角色没有可生成的卡牌候选。</p>
          <footer className={s["reward-foot"]}>
            <span>本次免费锻造无法执行</span>
            <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
          </footer>
        </>
      )}
    </div>
  );
}

function FreeRemove({
  members,
  selected,
  character,
  onSelect,
  onSkip,
  onRemove,
}: {
  members: { charId: string; name: string; emoji: string }[];
  selected: string | null;
  character: { deck: ReturnType<typeof makeCard>[]; minDeckSize: number } | null;
  onSelect: (id: string) => void;
  onSkip: () => void;
  onRemove: (uid: string) => void;
}) {
  const removable = character && character.deck.length > character.minDeckSize ? character.deck : [];
  return (
    <div className={s["reward-body"]}>
      {!character ? (
        <>
          <p className={s["reward-caption"]}>选择一名角色，从其卡组中免费移除一张卡牌。</p>
          {members.length ? (
            <div className={s["character-list"]}>
              {members.map((member) => (
              <button
                className={cx(s["character-choice"], selected === member.charId && s["is-selected"])}
                type="button"
                key={member.charId}
                onClick={() => onSelect(member.charId)}
              >
                <span className={s["character-emoji"]}>{member.emoji}</span>
                <span>{member.name}</span>
              </button>
              ))}
            </div>
          ) : (
            <>
              <p className={s["reward-empty"]}>当前没有可处理的角色卡组。</p>
              <footer className={s["reward-foot"]}>
                <span>本次免费删卡无法执行</span>
                <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
              </footer>
            </>
          )}
        </>
      ) : removable.length ? (
        <>
          <p className={s["reward-caption"]}>选择要移除的卡牌。卡组至少保留 {character.minDeckSize} 张。</p>
          <div className={s["card-list"]}>
            {removable.map((card) => (
              <div className={s["card-choice"]} key={card.uid}>
                <CardView card={card} playable selected={false} onClick={() => onRemove(card.uid)} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className={s["reward-empty"]}>当前角色已经达到最小卡组下限。</p>
          <footer className={s["reward-foot"]}>
            <span>本次免费删卡无法执行</span>
            <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
          </footer>
        </>
      )}
    </div>
  );
}

function EquipOffers({
  offers,
  onPick,
  onSkip,
}: {
  offers: ItemStack[];
  onPick: (index: number) => void;
  onSkip: () => void;
}) {
  return (
    <div className={s["reward-body"]}>
      <p className={s["reward-caption"]}>候选属性已在事件结算时确定，选择一件放入拾取框。</p>
      <div className={s["item-list"]}>
        {offers.map((stack, index) => (
          <div className={s["item-choice"]} key={stack.uid}>
            <ItemSlot stack={stack} showName onClick={() => onPick(index)} />
          </div>
        ))}
      </div>
      {!offers.length && <p className={s["reward-empty"]}>当前没有可用装备候选。</p>}
      <footer className={s["reward-foot"]}>
        <span>未选择的候选不会进入背包</span>
        <button className={s["reward-btn"]} type="button" onClick={onSkip}>
          放弃候选
        </button>
      </footer>
    </div>
  );
}

function ReforgePicker({
  backpack,
  characters,
  bias,
  onBackpack,
  onEquipped,
  onSkip,
}: {
  backpack: ItemStack[];
  characters: { charId: string; character: { equipped: Record<EquipSlot, ItemStack | null> } }[];
  bias?: "offense" | "defense";
  onBackpack: (uid: string) => void;
  onEquipped: (charId: string, slot: EquipSlot) => void;
  onSkip: () => void;
}) {
  const backpackEquipment = backpack.filter((stack) => getItemDef(stack.itemId).category === "equipment");
  const equipped = characters.flatMap(({ charId, character }) =>
    EQUIP_SLOTS.flatMap((slot) => {
      const stack = character.equipped?.[slot];
      return stack ? [{ charId, slot, stack }] : [];
    }),
  );
  return (
    <div className={s["reward-body"]}>
      <p className={s["reward-caption"]}>
        选择一件装备重铸羁绊{bias ? `，当前偏向${bias === "offense" ? "攻击" : "防御"}` : ""}。
      </p>
      <div className={s["reforge-groups"]}>
        <div>
          <span className={s["group-label"]}>探索背包</span>
          <div className={s["item-list"]}>
            {backpackEquipment.map((stack) => (
              <ItemSlot key={stack.uid} stack={stack} showName onClick={() => onBackpack(stack.uid)} />
            ))}
          </div>
        </div>
        <div>
          <span className={s["group-label"]}>角色装备</span>
          <div className={s["item-list"]}>
            {equipped.map(({ charId, slot, stack }) => (
              <div className={s["equipped-choice"]} key={`${charId}-${slot}`}>
                <ItemSlot stack={stack} showName onClick={() => onEquipped(charId, slot)} />
                <span>{getCharacter(charId).name} · {SLOT_LABEL[slot]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {!backpackEquipment.length && !equipped.length && (
        <>
          <p className={s["reward-empty"]}>没有可重铸的装备。</p>
          <footer className={s["reward-foot"]}>
            <span>本次羁绊重铸无法执行</span>
            <button className={s["reward-btn"]} type="button" onClick={onSkip}>结束奖励</button>
          </footer>
        </>
      )}
    </div>
  );
}
