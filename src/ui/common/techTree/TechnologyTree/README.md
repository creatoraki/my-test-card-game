# 公共科技树组件

`TechnologyBoard` 是无外框的受控主体，包含分支图、节点详情、材料清单和底部操作栏，适合嵌入已有窗口内容区。它不绘制背景、外框或页头，也不读取业务状态。

`TechnologyTree` 是自带金色切角外框和科技树页头的完整面板，适用于独立的全屏形态。它在内部复用 `TechnologyBoard`，并提供键盘焦点约束、退出键处理和关闭后的焦点恢复。

从 `@/ui/common/techTree` 导入组件与类型。调用方提供 `nodes`、`core`、`canvas`、`selectedId` 和操作回调，组件不读取状态仓库，也不计算升级规则。`credits` 仅展示当前积分，消耗摘要由每个节点的 `costLabel` 提供。

- `TechnologyNode`：节点坐标、前置关系、真实状态、图标、说明、效果和材料持有量。
- `TechnologyCore`：基础节点名称、中心坐标和图标；基础节点固定已解锁，不计入研究进度。
- `canvas`：科技树内容尺寸，坐标单位为设计像素；内容溢出时在图区域滚动。
- `onSelect`：受控选中，所有状态的节点均可查看详情。
- `onResearch`：只在所选节点状态为 `available` 时派发节点编号。
- `onClose`：返回按钮和退出键共用；完整面板另将页头关闭按钮绑定到此回调。
- `className`：公共组件的布局与外观扩展入口。

节点状态为 `done`（已解锁）、`available`（可解锁）、`lacking`（材料不足）、`locked`（前置未解锁）。四种状态共用同一套六边形轮廓，只用描边配色与角标区分：已解锁使用金色六边框与勾选角标，选中使用青色六边框，锁定使用灰蓝六边框和锁。

`TechnologyGraph`、`TechnologyMedallion`、`TechnologyDetail`、`TechnologyMaterials`、`TechnologyFooter` 可以分别复用。图标接受任意 React 内容；`TechnologyArtwork` 是参考图图标的可选适配器，素材登记在 `ui/art/techTreeArt.ts`，只显示六边形内部图案。

`TechnologyBoard` 与 `TechnologyTree` 都填满调用方容器。全屏面板应挂载到 `data-stage-canvas` 画布内部，使页面继续使用全站 1920×1080 设计尺寸与缩放规则。切页动画由业务容器编排。

商店通过 `town/shop/ShopUpgradePanel/` 将 `TechnologyBoard` 嵌入商店窗口的内容区；四个原有升级的视图适配集中在 `town/shop/ShopUpgradePanel/UpgradeTree/shopTechnologyView.tsx`。

## 可选能力

以下参数只对需要的调用方生效，不传时布局与外观和商店升级树完全一致：

- `tabs` / `activeTabId` / `onTabChange`：在科技板顶部渲染一行分类页签（`TechnologyTabs`），用于一次展示多棵子树。
- `level` / `maxLevel`：多级节点。徽章沿外沿六边形画等级进度环，图上与详情页显示 `Lv.x/y`。
- `stateLabel` / `stateDescription` / `actionLabel`：覆盖状态文案、状态说明与底部操作按钮文案，供「已满级 / 可升至 Lv.N」这类多级口径使用。
- `progressLabel` / `progressValue`：替换底部「已解锁节点」读数的口径。
- 省略 `returnLabel` 或 `onClose` 时不渲染返回按钮，适合常驻页内嵌。

配色统一走带默认值的 `--tech-*` 变量（主光、板材、描边、连线、徽章渐变与进度环），换皮场景只在场景根覆盖变量。研究中心的接入见 `town/terminal/ResearchTechView/`。
