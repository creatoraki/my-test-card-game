import { BRASS_CURSOR, cursorDataUri, type BrassCursorState } from "@/ui/art/cursor";
import s from "./BrassStateGallery.module.css";

const PREVIEW = 64;

/** 全局指针状态 → 演示文案与对应的全局变量。 */
const STATES: readonly { id: BrassCursorState; label: string; usage: string }[] = [
  { id: "default", label: "默认", usage: "全站默认" },
  { id: "pointer", label: "可交互", usage: "按钮与可点对象" },
  { id: "pressed", label: "按下", usage: "鼠标左键按住" },
  { id: "help", label: "说明", usage: "悬停看说明" },
  { id: "forbidden", label: "禁止", usage: "禁用按钮" },
  { id: "wait", label: "加载", usage: "加载中(转动)" },
  { id: "grab", label: "拖拽", usage: "可横向拖动" },
  { id: "grabbing", label: "拖拽中", usage: "拖动进行时" },
  { id: "aim", label: "瞄准", usage: "选取目标" },
];

/** 全局黄铜指针全套状态：每格悬停即为该状态的真实指针(读全局 --cursor-* 变量)。 */
export function BrassStateGallery() {
  return (
    <section className={s.gallery}>
      <h2 className={s.title}>全局黄铜指针 · 全部状态</h2>
      <p className={s.hint}>每格悬停即可试用；「加载」格会逐帧转动，「按下」格按住左键也能看到。</p>
      <div className={s.grid}>
        {STATES.map((state) => (
          <div key={state.id} className={s.cell} style={{ cursor: `var(--cursor-${state.id})` }}
            data-cursor-busy={state.id === "wait" || undefined}>
            <img className={state.id === "wait" ? s.spin : undefined} src={cursorDataUri(BRASS_CURSOR[state.id], PREVIEW)}
              width={PREVIEW} height={PREVIEW} alt={`${state.label}指针`} draggable={false} />
            <strong className={s.label}>{state.label}</strong>
            <span className={s.usage}>{state.usage}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
