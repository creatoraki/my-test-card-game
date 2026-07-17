import type { Ally, Combatant } from "../engine";
import type { HitFx } from "./animations";
import { CharacterPortrait } from "./CharacterPortrait";
import { HitFxLayer, hitFxVars } from "./HitFxLayer";
import { StatusPips } from "./StatusPips";

// 固定槽位数: 中间 80% 恒定均分成 4 格。刻意与实际上阵人数(engine/rules.ts 的
// progression.maxParty, 当前 3)解耦 —— 人数变化不改变格宽, 空出来的格子渲染成空槽,
// 构图永远稳定。要开放第 4 个上阵位只需改 maxParty, 这里无需跟着动。
const ALLY_SLOTS = 4;

interface Props {
  allies: Combatant[];
  hits: Record<string, HitFx>; // 各目标当前的受击特效
  attackerId: string | null; // 正在弹出的施法者
  aggroTargetId?: string; // 敌人预计攻击的目标(仅在意图已揭示时下发)
  targetable: boolean; // 当前是否处于「选择一名友军」的状态
  onSelect: (id: string) => void;
}

// 我方队伍头像栏: 舞台底部的一条固定构图 —— 左 10% / 中 80% / 右 10%, 高度占设计画布全高的 15%。
// 左右两段是纯透明占位(留给后续内容), 中间 80% 均分成 ALLY_SLOTS 个横向槽位。
//
// 它仍在 .battle-stage 内 ⇒ 跟随分镜相机推近/平移, 且每格带 data-cmb-id 供 BattleScreen 的
// computeCamera 取包围盒定位聚焦目标。这是「头像栏留在舞台内」的全部意义。
export function AllyBar({ allies, hits, attackerId, aggroTargetId, targetable, onSelect }: Props) {
  return (
    <div className="ally-bar">
      <div className="ally-bar-side" />
      <div className="ally-bar-main">
        {Array.from({ length: ALLY_SLOTS }, (_, i) => {
          const cmb = allies[i];
          if (!cmb) return <div key={`empty${i}`} className="ally-slot empty" />;
          return (
            <AllySlot
              key={cmb.id}
              cmb={cmb}
              hit={hits[cmb.id] ?? null}
              attacking={cmb.id === attackerId}
              isAggroTarget={cmb.id === aggroTargetId && cmb.alive}
              targetable={targetable && cmb.alive}
              onClick={() => onSelect(cmb.id)}
            />
          );
        })}
      </div>
      <div className="ally-bar-side" />
    </div>
  );
}

interface SlotProps {
  cmb: Combatant;
  hit: HitFx | null;
  attacking: boolean;
  isAggroTarget: boolean;
  targetable: boolean;
  onClick: () => void;
}

// 单个角色槽: 黑色玻璃蒙板, 玻璃下透出立绘裁出的头部片段作头像。
// 自上而下: 悬空外挂的徽章排(护盾/仇恨/BUFF) → 玻璃头像 → 与玻璃一体化的血条。
//
// 根节点刻意仍带 .combatant.player 两个类名: 前冲(.attacking)、受击抖动闪白(.hit-react)、
// 受益光晕(.bless-react)、阵亡(.dead)、特效层(.vfx/.float-num)的定位 —— 这些规则全部
// scoped 在 .combatant 上, 复用它们即可让头像卡与敌人立绘共享同一套演出, 无需重写一遍。
// .ally-slot 只负责覆盖尺寸与内部排布(写在 styles.css 主题层之后, 故能盖过 .combatant 的宽度)。
function AllySlot({ cmb, hit, attacking, isAggroTarget, targetable, onClick }: SlotProps) {
  const hpPct = Math.max(0, (cmb.hp / cmb.maxHp) * 100);
  const dead = !cmb.alive;
  const { reactClass, vars } = hitFxVars(hit);

  return (
    <div
      data-cmb-id={cmb.id}
      className={[
        "combatant",
        "player",
        "ally-slot",
        dead ? "dead" : "",
        targetable ? "targetable" : "",
        isAggroTarget ? "aggro-target" : "",
        attacking ? "attacking" : "",
        reactClass,
      ].join(" ")}
      style={Object.keys(vars).length ? (vars as React.CSSProperties) : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable) onClick();
      }}
    >
      {/* 悬空外挂: 不占流, 浮在玻璃卡正上方 */}
      <div className="ally-badges">
        {cmb.block > 0 && (
          <span className="block-badge" title="护盾">
            🛡️{cmb.block}
          </span>
        )}
        <span className="threat" title="仇恨值">
          🎯{(cmb as Ally).threat}
        </span>
        <StatusPips statuses={cmb.statuses} />
      </div>

      <div className="ally-glass">
        <div className="ally-avatar">
          <CharacterPortrait
            characterId={(cmb as Ally).charId}
            emoji={cmb.emoji}
            alt={`${cmb.name}头像`}
            className="avatar-portrait"
          />
        </div>

        {/* 一体化血条: 贴玻璃底边, 自身不带圆角/描边, 轮廓由 .ally-glass 的 overflow 裁出 */}
        <div className="hp-bar hp-flush">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
          <span className="cmb-name">{cmb.name}</span>
          <span className="hp-text">
            {Math.max(0, cmb.hp)}/{cmb.maxHp}
          </span>
        </div>
      </div>

      <HitFxLayer hit={hit} />

      {dead && <div className="dead-overlay">☠</div>}
    </div>
  );
}
