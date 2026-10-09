import { makeCard } from "@/data";
import type { ExploreState } from "@/explore/types";
import { CardFace } from "@/ui/common/card/CardFace";
import { EventPanelStage, EventPanelBody, EventPanelFoot, EventPanelButton, EventPanelNotice } from "@/ui/common/widget/EventPanel";
import { MemberList } from "./RewardCharacters";
import s from "@/ui/explore/styles/rewardKit.module.css";
/** 角色卡牌奖励的兜底页: 全队混合抽没有生成任何候选(卡池抽干 / 限携已满)时才出现; 有候选时三选一由 CardRewardPicker 弹窗负责。 */
export function FreeDraw({ onFinish }: { onFinish: () => void }) {
  return (
    <EventPanelStage>
      <EventPanelBody caption="全队当前没有可加入卡组的卡牌候选。">
        <EventPanelNotice>全队当前没有可加入卡组的卡牌候选。</EventPanelNotice>
      </EventPanelBody>
      <EventPanelFoot note="本次卡牌奖励无法执行">
        <EventPanelButton onClick={onFinish}>结束奖励</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

export function FreeRemove({
  members,
  selected,
  character,
  onSelect,
  onSkip,
  onRemove,
}: {
  members: ExploreState["party"];
  selected: string | null;
  character: { deck: ReturnType<typeof makeCard>[]; minDeckSize: number } | null;
  onSelect: (id: string) => void;
  onSkip: () => void;
  onRemove: (uid: string) => void;
}) {
  const removable = character && character.deck.length > character.minDeckSize ? character.deck : [];
  if (!character) {
    return (
      <EventPanelStage>
        <EventPanelBody caption="选择一名角色，从其卡组中免费移除一张卡牌。" scroll={false}>
          {members.length ? (
            <MemberList members={members} selected={selected} onSelect={onSelect} />
          ) : (
            <EventPanelNotice>当前没有可处理的角色卡组。</EventPanelNotice>
          )}
        </EventPanelBody>
        <EventPanelFoot note={members.length ? "选择角色后展开其卡组" : "本次免费删卡无法执行"}>
          {!members.length && <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>}
        </EventPanelFoot>
      </EventPanelStage>
    );
  }
  return (
    <EventPanelStage>
      <EventPanelBody
        caption={
          removable.length
            ? `选择要移除的卡牌。卡组至少保留 ${character.minDeckSize} 张。`
            : "当前角色已经达到最小卡组下限。"
        }
      >
        {removable.length ? (
          <div className={s["card-list"]}>
            {removable.map((card, index) => (
              <div className={s["card-choice"]} key={card.uid} onClick={() => onRemove(card.uid)}>
                <CardFace card={card} dealDelay={Math.min(index, 14) * 22} />
              </div>
            ))}
          </div>
        ) : (
          <EventPanelNotice>当前角色已经达到最小卡组下限。</EventPanelNotice>
        )}
      </EventPanelBody>
      <EventPanelFoot note={removable.length ? "点击卡牌即可移除" : "本次免费删卡无法执行"}>
        {!removable.length && <EventPanelButton onClick={onSkip}>结束奖励</EventPanelButton>}
      </EventPanelFoot>
    </EventPanelStage>
  );
}


