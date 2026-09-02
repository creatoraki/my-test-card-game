// 训练室 —— 据点设施场景(极简版): 只有暗底金色背景与浮升光粒 + 居中的径向天赋树。
//
// 原页头 / 剩余点读数 / 左栏徽章条 / 底部六格属性预览 / 锁定横幅 / 重置与确认弹窗
// 全部移除; 剩余训练点与投入进度显示在树面板头部。徽章切换改为点击天赋树中央的
// 徽章核心节点, 弹出居中的选择 modal; 选中后经底栏确认切换(已投入点会随切换返还清空)。
//
// ★ 徽章/天赋的全部交互与规则判定住在 ../useSquadTalent —— 编队页的训练点分配弹窗
//   (SquadTalentModal)消费的是同一份, 两处不再各写一遍。

import { useMemo, useState } from "react";
import { SQUAD_BADGES } from "@/data";
import { cx } from "@/ui/common/cx";
import { BadgeSelectModal } from "../BadgeSelectModal";
import { SquadResourceBar } from "../SquadResourceBar";
import { TalentTreeRadial } from "../TalentTreeRadial";
import { useSquadTalent } from "../useSquadTalent";
import s from "./TrainingScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function TrainingScene({ leaving = false, onBack }: Props) {
  const talent = useSquadTalent();
  // 未启用徽章时 modal 默认展开, 引导首次选择。
  const [drawerOpen, setDrawerOpen] = useState(() => !talent.badge);

  // 背景浮升光粒(暗底金色氛围): 黄金角分布 + 负延迟, 初始即散布在途中。
  const particles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: (i * 137.508) % 100,
        size: 2 + ((i * 7) % 5),
        duration: 9 + ((i * 13) % 16),
        delay: -((i * 3.7) % 14),
      })),
    [],
  );

  return (
    <div className={cn("tr-scene", leaving && "is-leaving")}>
      <div className={cn("tr-particles")} aria-hidden>
        {particles.map((p, i) => (
          <span
            key={i}
            className={cn("tr-particle")}
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <main className={cn("tr-stage-wrap")}>
        {talent.badge ? (
          <div className={s["tr-tree-shell"]}>
            <TalentTreeRadial
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
              onCoreClick={() => setDrawerOpen((open) => !open)}
              onClose={onBack}
              className={s["tr-tree"]}
            />
            <SquadResourceBar highlightKey={talent.hoverKey} className={s["tr-resource-bar"]} />
          </div>
        ) : (
          <div className={cn("tr-empty")} role="status">
            <span className={cn("tr-panel-kicker")}>NO BADGE</span>
            <h3 className={cn("tr-empty-title")}>尚未启用徽章</h3>
            <p className={cn("tr-empty-sub")}>点击下方按钮选择一枚小队徽章, 天赋树将在这里展开。</p>
            <button className={cn("tr-empty-open")} type="button" onClick={() => setDrawerOpen(true)}>
              选择徽章
            </button>
            {onBack && (
              <button className={cn("tr-empty-close")} type="button" aria-label="返回据点" onClick={onBack}>
                ×
              </button>
            )}
          </div>
        )}
      </main>

      {drawerOpen && (
        <BadgeSelectModal
          badges={SQUAD_BADGES}
          activeId={talent.badge?.id ?? null}
          locked={talent.locked}
          resourceLabels={talent.resourceLabels}
          spentPoints={talent.spent}
          onConfirm={(picked) => {
            if (talent.selectBadge(picked)) setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
