// 训练点分配弹窗 —— 编队页点小队徽章直接开这一层。
//
// ★ 与训练室(TrainingScene)是**同一棵树、同一套交互**: 两边都消费 useSquadTalent,
//   区别只在承载方式 —— 训练室是设施场景, 这里是一层浮在编队画布上的居中面板。
//   之所以要这一层: 训练点由队员卡组等级换算而来, 玩家在编队页才知道"该给谁升卡组",
//   却要跑回大厅进训练室才能分配, 这条动线太长。
// ⚠ 尺寸全是设计 px, 缩放交给外层 StageCanvas。

import { useEffect, useState } from "react";
import { SQUAD_BADGES } from "@/data";
import { cx } from "@/ui/common/cx";
import { BadgeSelectModal } from "../BadgeSelectModal";
import { SquadResourceBar } from "../SquadResourceBar";
import { TalentTreeRadial } from "../TalentTreeRadial";
import { useSquadTalent } from "../useSquadTalent";
import s from "./SquadTalentModal.module.css";

interface Props {
  onClose: () => void;
  className?: string;
}

export function SquadTalentModal({ onClose, className }: Props) {
  const talent = useSquadTalent();
  // 未启用徽章时直接展开选择, 引导首次选择(与训练室一致)。
  const [pickerOpen, setPickerOpen] = useState(() => !talent.badge);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      // 徽章选择自己会处理 Esc, 这里只在它关着的时候收掉整层。
      if (!pickerOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pickerOpen]);

  return (
    <div className={cx(s.layer, className)} role="dialog" aria-modal="true" aria-label="训练点分配">
      {/* 遮罩点击 = 关闭。⚠ 面板自身 stopPropagation, 免得点在树上也把弹窗关了。 */}
      <button className={s.veil} type="button" aria-label="关闭训练点分配" onClick={onClose} />

      <div className={s.panel} onClick={(event) => event.stopPropagation()}>
        {talent.badge ? (
          <>
            <TalentTreeRadial
              className={s.tree}
              badge={talent.badge}
              activated={talent.activated}
              remaining={talent.remaining}
              totalTrainingPoints={talent.trainingPoints}
              locked={talent.locked}
              resourceLabels={talent.resourceLabels}
              pulse={talent.pulse}
              shakeId={talent.shakeId}
              onRequestShake={talent.setShakeId}
              onActivate={talent.activate}
              onQuickBuy={talent.quickBuy}
              onRefund={talent.refund}
              onHoverKey={talent.setHoverKey}
              onCoreClick={() => setPickerOpen((open) => !open)}
              onClose={onClose}
            />
            <SquadResourceBar highlightKey={talent.hoverKey} className={s["resource-bar"]} />
          </>
        ) : (
          <div className={s.empty} role="status">
            <h3 className={s["empty-title"]}>尚未启用徽章</h3>
            <p className={s["empty-sub"]}>先选一枚小队徽章, 天赋树才会在这里展开。</p>
            <button className={s["empty-open"]} type="button" onClick={() => setPickerOpen(true)}>
              选择徽章
            </button>
            <button className={s["empty-close"]} type="button" aria-label="关闭" onClick={onClose}>
              ×
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <BadgeSelectModal
          badges={SQUAD_BADGES}
          activeId={talent.badge?.id ?? null}
          locked={talent.locked}
          resourceLabels={talent.resourceLabels}
          spentPoints={talent.spent}
          onConfirm={(picked) => {
            if (talent.selectBadge(picked)) setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
