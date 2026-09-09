// 训练点分配弹窗 —— 编队页点小队徽章直接开这一层。
//
// ★ 天赋树与徽章选择共用 useSquadTalent 的同一套交互规则，当前只由这里承载在编队画布上。
//   之所以要这一层: 训练点由队员卡组等级换算而来, 玩家在编队页才知道"该给谁升卡组",
//   却要离开当前编队页才能分配, 这条动线太长。
// ⚠ 尺寸全是设计 px, 缩放交给外层 StageCanvas。

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { SQUAD_BADGES } from "@/data";
import { HudPanelShell, HUD_TONE_GOLD } from "@/ui/common/HudPanelShell";
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
    seed?: ReactNode;
    seedLabel?: string;
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
    <div className={s.layer} role="dialog" aria-modal="true" aria-label="训练点分配">
      <div className={s.veil} aria-hidden="true" />

      <HudPanelShell closing={closing} onClose={onClose} label="训练点分配" tone={HUD_TONE_GOLD} morph={morph}>
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
          </div>
        )}
      </HudPanelShell>

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
