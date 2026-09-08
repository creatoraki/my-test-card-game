import { box } from "@/ui/common/panelMorph";
import { cx } from "@/ui/common/cx";
import { VENDING_RECT, WAREHOUSE_RECT } from "./useShopPanelsMorph";
import s from "./ShopScene.module.css";

/**
 * 商店面板的静态投影。
 *
 * 阴影必须和 PanelShell 保持兄弟关系，不能包住面板：祖先 filter 会把面板的
 * backdrop-filter 变成失效的 backdrop root。投影内容本身不随面板内部变化，浏览器
 * 只需栅格化这一层，不会因为货架悬浮或面板装饰扫光而重算整块面板。
 */
export function PanelShadows() {
  return (
    <>
      <i
        className={cx(s["sx-panel-shadow"], s["is-warehouse"])}
        style={box(WAREHOUSE_RECT)}
        aria-hidden="true"
      />
      <i
        className={cx(s["sx-panel-shadow"], s["is-vending"])}
        style={box(VENDING_RECT)}
        aria-hidden="true"
      />
    </>
  );
}

