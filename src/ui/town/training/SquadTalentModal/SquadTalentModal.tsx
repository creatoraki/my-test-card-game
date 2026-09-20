// 训练点分配弹窗 —— 编队页点小队徽章直接开这一层。
//
// ★ 天赋树与徽章选择共用 useSquadTalent 的同一套交互规则，当前只由这里承载在编队画布上。
//   之所以要这一层: 训练点由队员卡组等级换算而来, 玩家在编队页才知道"该给谁升卡组",
//   却要离开当前编队页才能分配, 这条动线太长。
// ⚠ 尺寸全是设计 px, 缩放交给外层 StageCanvas。

import { useEffect, useState, type Ref } from "react";
import { SQUAD_BADGES } from "@/data";
import { TalentPanelShell } from "../TalentArtwork/TalentPanelShell";
import { TalentHeader } from "../TalentArtwork/TalentHeader";
import { cx } from "@/ui/common/cx";
import type { Rect } from "@/ui/common/panelMorph";
import { BadgeSelectModal } from "../BadgeSelectModal";
import { SquadResourceBar } from "../SquadResourceBar";
import { TalentTreeRadial } from "../TalentTreeRadial";
import { useSquadTalent } from "../useSquadTalent";
import s from "./SquadTalentModal.module.css";

interface Props {
  closing?: boolean;
  onClose: () => void;
  morph: {
    ref: Ref<HTMLElement>;
    rect: Rect;
    ready: boolean;
  };
}

export function SquadTalentModal({ closing = false, onClose, morph }: Props) {
  const talent = useSquadTalent();
  // 未启用徽章时直接展开选择, 引导首次选择。
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
    <div className={cx(s.layer, closing && s["is-closing"])} data-talent-closing={closing}
      role="dialog" aria-modal="true" aria-label="训练点分配">
      <div className={s.veil} aria-hidden="true" />

      <TalentPanelShell closing={closing} onClose={onClose} morph={morph}>
        <TalentHeader remaining={talent.remaining} total={talent.trainingPoints} />
        {talent.badge ? (
          <>
            <TalentTreeRadial
              key={talent.badge.id}
              className={s.tree}
              badge={talent.badge}
              activated={talent.activated}
              remaining={talent.remaining}
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
            />
            <SquadResourceBar highlightKey={talent.hoverKey} className={s["resource-bar"]} />
          </>
        ) : (
          // 空态不再糊一块小面板: 直接用背景板同款的衬线碑文落在板心, 整块字就是打开徽章选择的入口。
          <button className={s.empty} type="button" onClick={() => setPickerOpen(true)}>
            <span className={s["empty-title"]}>尚未启用徽章</span>
            <span className={s["empty-rule"]} aria-hidden="true" />
            <span className={s["empty-sub"]}>点此择定一枚小队徽章，天赋树将在此展开</span>
          </button>
        )}
      </TalentPanelShell>

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
