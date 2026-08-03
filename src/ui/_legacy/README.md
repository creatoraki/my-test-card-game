# _legacy —— 归档区

这里的文件**全项目零引用**，保留是为了将来可能捡回，不是活代码。

| 文件 | 状态 |
| --- | --- |
| `ShelfTabRail3D.tsx` / `.css` | 商店货架的 three.js 立体页签吊牌。`ShopScene.tsx` 后来自己重新定义了 `ShopTab` / `SHOP_TABS` 并改用 CSS 版页签，此组件随之弃用。**全项目唯一使用 `three` 的地方**——若确定不再捡回，`package.json` 的 `three` / `@types/three` 也可一并移除。 |
| `StartGameButton.tsx` / `.css` | 主菜单开始按钮的旧实现，已被 `menu/MenuStartButton` 取代。 |
| `TerminalNav.tsx` / `.css` | 顶部终端导航条的占位实现，从未接入。 |

## 规则

- **本目录不参与 CSS Modules 改造**：css 保持普通全局 `.css`，由各自 tsx `import`。因为无人渲染，全局类名不会污染任何在用界面。
- 想捡回其中任何一个：先按 `docs/code-map/styles.md` 的五条铁律转成 `*.module.css`，再移出本目录。
- 想彻底删除：直接删，git 历史里随时找得回。
