import type { Ally, Combatant } from "../engine";
import { getCharacter } from "../data";
import type { HitFx } from "./animations";
import { CharacterPortrait } from "./CharacterPortrait";
import { HitFxLayer, hitFxVars } from "./HitFxLayer";
import { HpBar } from "./HpBar";
import { StatusPips } from "./StatusPips";
import "./AllyBar.css";
import "./unit-badges.css";

// 固定槽位数: 队伍区恒定 3 格, 与 engine/rules.ts 的 progression.maxParty(3)对齐。
// 人数不足时空出来的格子渲染成空槽, 保持构图稳定; 若未来开放第 4 个上阵位,
// 这里与 maxParty 需一起改。
const ALLY_SLOTS = 3;

interface Props {
  allies: Combatant[];
  hits: Record<string, HitFx>; // 各目标当前的受击特效
  attackerId: string | null; // 正在弹出的施法者
  aggroTargetId?: string; // 敌人预计攻击的目标(仅在意图已揭示时下发)
  focusCharId?: string; // 当前悬停/选中手牌的归属角色 —— 该槽位变宽 + 按归属配色点亮
  targetable: boolean; // 当前是否处于「选择一名友军」的状态
  onSelect: (id: string) => void;
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
export function AllyBar({ allies, hits, attackerId, aggroTargetId, focusCharId, targetable, onSelect }: Props) {
  return (
    <div className="ally-bar">
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
            focused={cmb.id === focusCharId}
            targetable={targetable && cmb.alive}
            onClick={() => onSelect(cmb.id)}
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
  isAggroTarget: boolean;
  focused: boolean;
  targetable: boolean;
  onClick: () => void;
}

// 单个角色槽: 描边卡框 + 半身立绘, 底部红(生命)/绿(护盾)双条, 右上/右下两枚角标。
//
// 根节点刻意仍带 .combatant.player 两个类名: 前冲(.attacking)、受击抖动闪白(.hit-react)、
// 受益光晕(.bless-react)、阵亡(.dead)、特效层(.vfx/.float-num)的定位 —— 这些规则全部
// scoped 在 .combatant 上, 复用它们即可让队伍卡与敌人立绘共享同一套演出, 无需重写一遍。
// .ally-slot 只负责覆盖尺寸与内部排布 —— 选择器是 .ally-bar .ally-slot(0-2-0), 特异性本就
// 高于 .combatant(0-1-0), 故与 AllyBar.css / CombatantView.css 的加载顺序无关。
function AllySlot({ cmb, hit, attacking, isAggroTarget, focused, targetable, onClick }: SlotProps) {
  // 绿条 = 护盾。护盾没有上限概念, 按占最大生命的比例画并封顶 100% —— 只求「有多厚」的量感。
  const blockPct = Math.min(100, (cmb.block / cmb.maxHp) * 100);
  const dead = !cmb.alive;
  const { reactClass, vars } = hitFxVars(hit);
  // 归属配色: 与 HandCard 下发 --owner-color 同一套路, 聚焦高亮与手牌光晕同色呼应
  const ownerColor = getCharacter((cmb as Ally).charId).color;

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
        focused ? "card-focus" : "",
        attacking ? "attacking" : "",
        reactClass,
      ].join(" ")}
      style={{ "--owner-color": ownerColor, ...vars } as React.CSSProperties}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable) onClick();
      }}
    >
      {/* 悬空外挂的状态图标排: 不占流, 浮在卡框正上方。
          占流会把 .vfx / .float-num 的定位一起压偏(与敌人的 .intent 同一套路)。 */}
      <div className="ally-badges">
        <StatusPips statuses={cmb.statuses} />
      </div>

      <div className="ally-frame">
        {/* 角标: 右上=护盾数值(无护盾不渲染), 右下=仇恨值。绝对定位浮在立绘之上。 */}
        {cmb.block > 0 && (
          <span className="block-badge ally-corner-top" title="护盾">
            🛡️{cmb.block}
          </span>
        )}
        <span className="threat ally-corner-bot" title="仇恨值">
          🎯{(cmb as Ally).threat}
        </span>

        <div className="ally-figure">
          <CharacterPortrait
            characterId={(cmb as Ally).charId}
            emoji={cmb.emoji}
            alt={`${cmb.name}立绘`}
            className="ally-portrait"
          />
        </div>

        {/* 一体化双条: 贴卡框底边, 自身不带圆角/描边 —— 轮廓由 .ally-frame 的 overflow 裁出 */}
        <div className="ally-bars">
          <HpBar hp={cmb.hp} maxHp={cmb.maxHp} name={cmb.name} flush />
          <div className="block-bar" title={`护盾 ${cmb.block}`}>
            <div className="block-fill" style={{ width: `${blockPct}%` }} />
          </div>
        </div>
      </div>

      <HitFxLayer hit={hit} />

      {dead && <div className="dead-overlay">☠</div>}
    </div>
  );
}
