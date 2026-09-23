// 详情态预热层 —— 一棵真实的 CharacterDetailView, 渲染在近乎全透明的离屏层里,
// 目的只有一个: 让浏览器把这棵树的样式匹配、布局、clip-path mask 与立绘解码提前跑完。
// 为什么要这么做、为什么不能用 display:none, 见 useDetailPrewarm.ts 与 DetailPrewarm.module.css。
//
// ★ 第一步付掉的是**结构**那笔账(版面、mask、字形)加第一位的立绘; 之后每步只换 charId,
//   React 只 diff 出立绘与几个数字, 专职把那一位的立绘热到详情尺寸。
// ⚠ 这一层里有真实的 <button>(页签、升级), 必须 inert + aria-hidden 挡住焦点与读屏。

import { CharacterDetailView } from "@/ui/character/CharacterDetailView";
import s from "./DetailPrewarm.module.css";

const noop = () => {};

// React 18 还不认 inert 这个 prop(19 才转成布尔属性), 只能按原生属性塞进去。
// 空字符串 = 属性存在 = 生效。
const INERT = { inert: "" } as Record<string, string>;

export function DetailPrewarm({ charId }: { charId: string }) {
  return (
    <div className={s.prewarm} aria-hidden="true" {...INERT}>
      <CharacterDetailView
        charId={charId}
        morphing={false}
        leaving={false}
        // 浮层(换装仓库、卡面浮卡、锻造中枢)一律不挂: 它们各有各的入场演出, 预热用不上。
        closingOverlays
        // 不注册 window keydown —— 真实那层的 Esc 只有一份。
        escEnabled={false}
        prewarm
        canPrevious={false}
        canNext={false}
        onPrevious={noop}
        onNext={noop}
        onBack={noop}
      />
    </div>
  );
}
