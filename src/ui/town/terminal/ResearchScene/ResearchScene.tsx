// 研究中心(据点设施 worklog)的设施内界面：模组装配、模组制造与全局科技树。
// 外壳与商店、博物馆同一套语言（左侧信息条：底栏 + 铭牌 + 导航 + 返回，右侧常驻切角窗口），
// 主题令牌见同目录上级的 researchTheme.module.css（黑 + 红）。设施 id worklog 保持不变。

import { cx } from "@/ui/common/cx";
import { ShopBack } from "@/ui/town/shop/ShopBack";
import { ShopBrand } from "@/ui/town/shop/ShopScene/ShopBrand";
import { ShopSidebar } from "@/ui/town/shop/ShopSidebar";
import theme from "../researchTheme.module.css";
import { ResearchPanel } from "../ResearchPanel";
import s from "./ResearchScene.module.css";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function ResearchScene({ leaving = false, onBack }: Props) {
  return (
    <div
      className={cx(theme.theme, s.root, leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <ShopSidebar />
      <ShopBrand label="研究中心" subLabel="RESEARCH CENTER" />
      <ResearchPanel onBack={onBack} />
      {onBack && <ShopBack onClick={onBack} />}
    </div>
  );
}

export default ResearchScene;
