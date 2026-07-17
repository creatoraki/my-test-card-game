import { ANIM, type HitFx } from "./animations";
import { SpriteFx } from "./SpriteFx";

// 命中表现的共用件: 敌人(CombatantView)与我方头像栏(AllyBar)都靠这两个导出, 保证两边的
// 特效着色、命中时序、飘字完全一致 —— 只有承载它们的外壳不同(场上立绘 vs 玻璃头像卡)。

// 由 hit 推出「受击反应类名 + CSS 变量」, 挂在单位根节点(.combatant)上。
//   --vfx-color:  特效主色, 供闪光/冲击环/光晕/飘字着色
//   --vfx-impact: 挂载 → 砸中的偏移, 把受击抖动/闪白推迟到序列帧真正命中那一刻
//                 (emoji 系缺省 0, 行为不变)
// 攻击 → 受击抖动闪光; 辅助 → 柔和光晕。
export function hitFxVars(hit: HitFx | null): {
  reactClass: string;
  vars: Record<string, string>;
} {
  const preset = hit ? ANIM[hit.anim] : null;
  if (!preset) return { reactClass: "", vars: {} };
  return {
    reactClass: preset.kind === "attack" ? "hit-react" : "bless-react",
    vars: {
      "--vfx-color": preset.color,
      "--vfx-impact": `${preset.sprite?.impactMs ?? 0}ms`,
    },
  };
}

// 首击特效(序列帧/斩击/火爆/柔光…) + 伤害/治疗飘字, 命中时刻挂载。
// key={hit.seq}: 连续命中时强制重挂载以重放动画。
// 序列帧用 anchorTop 把锚点下移到立绘脚下(剑插地处), emoji 系维持 .vfx 的默认定位。
// 两者都相对最近的定位祖先(= 单位根节点)定位, 故本组件必须挂在 .combatant 内部。
export function HitFxLayer({ hit }: { hit: HitFx | null }) {
  const preset = hit ? ANIM[hit.anim] : null;
  // 提出局部 const 保住闭包内的类型窄化(直接在 JSX 里写 preset.sprite! 会丢窄化)
  const sprite = preset?.sprite;

  return (
    <>
      {hit && preset && (
        <div
          className={`vfx vfx-${hit.anim} vfx-${preset.kind}`}
          key={hit.seq}
          style={sprite ? { top: `${sprite.anchorTop}px` } : undefined}
          aria-hidden
        >
          {sprite ? <SpriteFx sprite={sprite} /> : <span className="vfx-emoji">{preset.emoji}</span>}
        </div>
      )}
      {hit?.float && (
        <div key={`f${hit.seq}`} className={`float-num float-${hit.float.tone}`}>
          {hit.float.text}
        </div>
      )}
    </>
  );
}
