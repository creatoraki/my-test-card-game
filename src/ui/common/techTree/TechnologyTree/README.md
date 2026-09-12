# 公共科技树面板

`TechnologyTree` 是完整的受控界面组件，提供金色切角外框、页头、可滚动的分支图、节点详情、材料清单和底部操作栏。采用纯净深色背景，不包含场景绘画和装饰文案。

从 `@/ui/common/techTree` 导入组件与类型。调用方提供 `nodes`、`core`、`canvas`、`selectedId` 和操作回调，组件不读取状态仓库，也不计算升级规则。`credits` 仅展示当前积分，消耗摘要由每个节点的 `costLabel` 提供。

- `TechnologyNode`：节点坐标、前置关系、真实状态、图标、说明、效果和材料持有量。
- `TechnologyCore`：基础节点名称、中心坐标和图标；基础节点固定已解锁，不计入研究进度。
- `canvas`：科技树内容尺寸，坐标单位为设计像素；内容溢出时在图区域滚动。
- `onSelect`：受控选中，所有状态的节点均可查看详情。
- `onResearch`：只在所选节点状态为 `available` 时派发节点编号。
- `onClose`：关闭按钮、返回按钮及退出键共用；面板提供键盘焦点约束和关闭后的焦点恢复。
- `className`：公共组件的布局与外观扩展入口。

节点状态为 `done`（已解锁）、`available`（可解锁）、`lacking`（材料不足）、`locked`（前置未解锁）。已解锁使用金色圆环与勾选角标，选中使用青色六边框，锁定使用灰蓝六边框和锁。

`TechnologyGraph`、`TechnologyMedallion`、`TechnologyDetail`、`TechnologyMaterials`、`TechnologyFooter` 可以分别复用。图标接受任意 React 内容；`TechnologyArtwork` 是参考图图标的可选适配器，素材登记在 `ui/art/techTreeArt.ts`，只显示圆盘内部图案。

面板填满调用方容器。全屏弹层应挂载到 `data-stage-canvas` 画布内部，使页面继续使用全站 1920×1080 设计尺寸与缩放规则。开关动画由业务容器编排。

商店接入示例见 `town/shop/MarketPanel/MarketUpgradePanel.tsx`，四个原有升级的视图适配集中在 `UpgradeTree/shopTechnologyView.tsx`。
