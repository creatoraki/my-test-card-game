// 医疗室(据点设施 cryo)的设施内界面：复苏舱、疗养舱与圣水池。
// 外壳与商店、研究中心、博物馆同一套语言（左侧信息条：底栏 + 铭牌 + 导航 + 返回，右侧常驻切角窗口），
// 主题令牌见上级的 cryoTheme.module.css（白 + 蓝 + 紫）。

import { cx } from "@/ui/common/cx";
import { ShopBack } from "@/ui/town/shop/ShopBack";
import { ShopBrand } from "@/ui/town/shop/ShopScene/ShopBrand";
import { ShopSidebar } from "@/ui/town/shop/ShopSidebar";
import theme from "../cryoTheme.module.css";
import { CryoPanel } from "../CryoPanel";
import s from "./CryoScene.module.css";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function CryoScene({ leaving = false, onBack }: Props) {
  return (
    <div
      className={cx(theme.theme, s.root, leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <ShopSidebar />
      <ShopBrand label="医疗室" subLabel="MEDICAL BAY" />
      <CryoPanel onBack={onBack} />
      {onBack && <ShopBack onClick={onBack} />}
    </div>
  );
}

export default CryoScene;
