import { cx } from "@/ui/common/cx";
import { ShopBack } from "@/ui/town/shop/ShopBack";
import { ShopBrand } from "@/ui/town/shop/ShopScene/ShopBrand";
import { ShopSidebar } from "@/ui/town/shop/ShopSidebar";
import theme from "../museumTheme.module.css";
import { MuseumPanel } from "../MuseumPanel";
import s from "./MuseumScene.module.css";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function MuseumScene({ leaving = false, onBack }: Props) {
  return (
    <div
      className={cx(theme.theme, s.root, leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <ShopSidebar />
      <ShopBrand label="博物馆" subLabel="MUSEUM" />
      <MuseumPanel onBack={onBack} />
      {onBack && <ShopBack onClick={onBack} />}
    </div>
  );
}

export default MuseumScene;
