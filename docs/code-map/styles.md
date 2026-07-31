# 样式层

路径：`src/styles/` 与 `src/ui/*.css`。

| 文件 | 作用 |
| --- | --- |
| [index.css](../../src/styles/index.css) | 公共 CSS 的唯一入口，按 tokens、base、layout、widgets 顺序导入。 |
| [tokens.css](../../src/styles/tokens.css) | 颜色、边框、圆角、物品稀有度等设计令牌。 |
| [base.css](../../src/styles/base.css) | reset、页面底纹、按钮、表单和基础元素。 |
| [layout.css](../../src/styles/layout.css) | 屏幕骨架、终端布局和公共浮层。 |
| [widgets.css](../../src/styles/widgets.css) | 奖励、卡组摘要、战利品和经验条等跨界面小部件。 |

组件样式通常与 `.tsx` 同名并由组件自己导入。战斗、主菜单、据点和探索等设计画布使用固定设计尺寸，修改布局前先查看对应组件 CSS 与 [stage.ts](../../src/ui/stage.ts)，不要随意加入窗口断点或 `vw`/`vh` 坐标。
