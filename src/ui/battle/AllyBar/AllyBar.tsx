import { memo } from "react";
import type { Ally, Card, Combatant } from "@/engine";
import { getCharacter } from "@/data";
import type { HitFx } from "@/ui/battle/animations";
import { UNIT_BODY_ATTR, unitShellAttrs } from "@/ui/battle/unitShell";
import { DEATH, type DeathPhase } from "@/ui/battle/deathChoreo";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import { useHandHoverOwner } from "@/ui/battle/handFocusStore";
import { HitFxLayer, hitFxVars } from "@/ui/battle/fx/HitFxLayer";
import { HpBar } from "@/ui/common/HpBar";
import { ShieldBar } from "@/ui/common/ShieldBar";
import { StatusPips } from "@/ui/common/StatusPips";
import { PollutionMeter } from "@/ui/common/PollutionMeter/PollutionMeter";
import s from "./AllyBar.module.css";
// 敌我两种外壳共用的两枚徽章。同域共享样式模块, 双方各自 import(样式铁律 1)。
import ub from "@/ui/battle/styles/unitBadges.module.css";

// 固定槽位数: 队伍区恒定 3 格, 与 engine/rules.ts 的 progression.maxParty(3)对齐。
// 人数不足时空出来的格子渲染成空槽, 保持构图稳定; 若未来开放第 4 个上阵位,
// 这里与 maxParty 需一起改。
const ALLY_SLOTS = 3;

interface Props {
  allies: Combatant[];
  hits: Record<string, HitFx>; // 各目标当前的受击特效
  attackerId: string | null; // 正在弹出的施法者
  // 「选中」的那张手牌(可为 null)。悬停的那张不走 props, 由本组件自己订阅 —— 见下方组件注释。
  focusFallbackCard: Card | null;
  targetable: boolean; // 当前是否处于「选择一名友军」的状态
  onSelect: (id: string) => void;
  deathPhaseOf: (id: string) => DeathPhase;
  deathRate?: number;
  deathVanishMs?: number;
}

// 我方队伍卡: 底部 HUD 最左一段, 3 格描边立绘卡。
//
// 悬停/选中手牌时, 归属角色的槽位加宽(flex-grow 过渡)并按归属配色点亮 —— 队伍段总宽
// 恒定(--hud-party-w), 加宽在段内由其余槽位微收消化, 手牌列的位置因此纹丝不动。
// 立绘取景以 --slot-base-w 为基准(固定设计宽), 槽位伸缩只改变取景窗、立绘尺寸不变。
//
// ⚠ 它在 .battle-scene **之外**(挂在 .battle-hud 里)⇒ **不跟随分镜相机**。
// 由此带来的一个副作用是刻意保留的: computeCamera 只在 .battle-stage 内按 data-cmb-id
// 查询聚焦目标, 我方在舞台外 ⇒ 查不到 ⇒ 它的 `if (!isFinite(left)) return null` 兜底生效,
// 镜头保持全景。于是「打我方/自身牌时不推近, 只播特效 + 震屏」是自然结果, 不需要特判。
//
// ★ 聚焦角色 = (悬停的手牌 ?? 选中的手牌).ownerCharId, 但**悬停那半自己订阅** store
//   (ui/handFocusStore.ts)而不走 props —— 它以前挂在 BattleScreen 上, 鼠标扫过手牌会把
//   整个战斗界面重渲染一遍。代价是悬停变化时本组件必然重渲染, 所以下面的 AllySlot 必须
//   用 React.memo 挡住: 三格里只有「刚失焦」和「刚聚焦」那两格的 props 真的变了。
export function AllyBar({
  allies,
  hits,
  attackerId,
  focusFallbackCard,
  targetable,
  onSelect,
  deathPhaseOf,
  deathRate = 1,
  deathVanishMs = DEATH.vanish,
}: Props) {
  const focusCharId = useHandHoverOwner() ?? focusFallbackCard?.ownerCharId;
  return (
    <div
      className={s["ally-bar"]}
      style={{ "--death-rate": deathRate, "--death-vanish-ms": `${deathVanishMs}ms` } as React.CSSProperties}
    >
      {Array.from({ length: ALLY_SLOTS }, (_, i) => {
        const cmb = allies[i];
        if (!cmb) return <div key={`empty${i}`} className={cx(s["ally-slot"], s.empty)} />;
        return (
          <AllySlot
            key={cmb.id}
            cmb={cmb}
            hit={hits[cmb.id] ?? null}
            attacking={cmb.id === attackerId}
            focused={cmb.id === focusCharId}
            targetable={targetable && cmb.alive}
            deathPhase={deathPhaseOf(cmb.id)}
            // ⚠ 直接透传而不是 `() => onSelect(cmb.id)` —— 内联箭头每次渲染都是新引用,
            //   会让下面的 React.memo 永远命中不了。id 改由 AllySlot 自己带上。
            onClick={onSelect}
          />
        );
      })}
    </div>
  );
}

interface SlotProps {
  cmb: Combatant;
  hit: HitFx | null;
  attacking: boolean;
  focused: boolean;
  targetable: boolean;
  deathPhase: DeathPhase;
  onClick: (id: string) => void; // 收 id 而非零参闭包, 才能让父级透传同一个引用(见上)
}

// 单个角色槽: 描边卡框 + 半身立绘, 底部红(生命)/绿(护盾)双条, 右上/右下两枚角标。
//
// 根节点挂一整套「单位外壳」的 data-* 属性(契约见 battle/unitShell.ts): 前冲、受击抖动闪白、
// 受益光晕、命中特效层与飘字的定位 —— 这些规则只写一份, 住在 fx/HitFxLayer.module.css,
// 靠属性同时命中敌人立绘(CombatantView 的 .combatant)与本组件的队伍卡, 两边演出必然一致。
// ★ 改造前是靠「根节点也挂一个 .combatant 类」共享的; CSS Modules 之后类名会被哈希,
//   跨组件复用类名不再可能, 故换成属性(样式铁律 2)。
// .ally-slot 只负责本卡的尺寸与内部排布。
//
// ★ 包了 React.memo: 手牌悬停会让父级 AllyBar 重渲染(它订阅了悬停 store), 但三格里通常
//   只有两格的 focused 真的翻转。没有这层 memo, 每次跨卡都要重跑三份立绘 + 血条 + 状态图标 +
//   特效层。⚠ 生效的前提是**所有 props 引用都稳定** —— onClick 已改为父级直接透传,
//   cmb/hit 来自 store 与 hits 表, 悬停时不变。
const AllySlot = memo(function AllySlot({
  cmb,
  hit,
  attacking,
  focused,
  targetable,
  deathPhase,
  onClick,
}: SlotProps) {
  const dead = deathPhase === "dead";
  const downed = cmb.alive && cmb.hp <= 0;
  const { react, vars } = hitFxVars(hit);
  // 归属配色: 与 HandCard 下发 --owner-color 同一套路, 聚焦高亮与手牌光晕同色呼应
  const ownerColor = getCharacter((cmb as Ally).charId).color;

  return (
    <div
      data-cmb-id={cmb.id}
      // 外壳状态一律走 data-*(见 battle/unitShell.ts) —— 前冲/受击/受益的规则住在
      // fx/HitFxLayer.module.css, 它够不着本文件被哈希的类名。
      // `card-focus` 是**本组件独有**的(敌人没有手牌归属聚焦), 故仍是普通局部类。
      {...unitShellAttrs({ side: "player", dead, downed, death: deathPhase, targetable, attacking, react })}
      className={cx(s["ally-slot"], focused && s["card-focus"])}
      style={{ "--owner-color": ownerColor, ...vars } as React.CSSProperties}
      // 只有在卡牌要求选择友军时响应点击, 普通状态下角色卡保持纯展示。
      onClick={(e) => {
        e.stopPropagation();
        if (targetable) onClick(cmb.id);
      }}
    >
      <span className={s["ally-glow"]} aria-hidden="true" />
      <div className={s["ally-status"]}>
        <StatusPips
          statuses={cmb.statuses}
          shield={cmb.shield}
          detail
          reverse
          popoverSide="top-left"
        />
      </div>

      <div className={s["ally-frame"]}>
        <div className={s["ally-figure"]} {...UNIT_BODY_ATTR}>
          <CharacterPortrait
            characterId={(cmb as Ally).charId}
            emoji={cmb.emoji}
            alt={`${cmb.name}立绘`}
            className={s["ally-portrait"]}
          />
        </div>

        {/* 一体化双条: 贴卡框底边, 自身不带圆角/描边 —— 轮廓由 .ally-frame 的 overflow 裁出 */}
        <div className={s["ally-bars"]}>
          <HpBar hp={cmb.hp} hpLimit={cmb.hpLimit} maxHp={cmb.maxHp} flush slowDrain />
          <PollutionMeter value={(cmb as Ally).pollution} />
          <ShieldBar shield={cmb.shield} maxHp={cmb.maxHp} flush />
        </div>
      </div>

      <HitFxLayer hit={hit} />

      {dead && (
        <div className={s["ally-dead-overlay"]} aria-label="阵亡">
          <span className={s["ally-dead-cracks"]} aria-hidden="true" />
          <span className={s["ally-dead-label"]}>阵亡</span>
          <span className={cx(ub["dead-overlay"], s["ally-dead-skull"])} aria-hidden="true">☠</span>
        </div>
      )}
    </div>
  );
});
