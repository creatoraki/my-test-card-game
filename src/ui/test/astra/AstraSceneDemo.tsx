import { useCallback, useState } from "react";
import stationBackgroundUrl from "@/assets/场景/测试/背景素材.png";
import shopBackgroundUrl from "@/assets/场景/商店.png";
import PixelSwap from "./PixelSwap/PixelSwap";
import { ShopScene } from "./ShopScene";
import { StationScene } from "./StationScene";
import s from "./AstraSceneDemo.module.css";

// PixelSwap 会把切换层整份克隆到每个像素上，所以只把「背景图」交给它，
// 建筑热区、招牌、按钮等交互层放在上方单独淡入淡出，避免点击时卡顿。
function ScenePlate({ src, alt }: { src: string; alt: string }) {
  return <img className={s.plate} src={src} alt={alt} draggable={false} />;
}

export function AstraSceneDemo() {
  const [inShop, setInShop] = useState(false);
  const [swapping, setSwapping] = useState(false);

  // 过渡未结束前忽略新的切换请求，避免重复点击叠加。
  const go = useCallback(
    (next: boolean) => {
      if (swapping || next === inShop) return;
      setSwapping(true);
      setInShop(next);
    },
    [inShop, swapping]
  );

  const handleComplete = useCallback(() => setSwapping(false), []);

  return (
    <div className={s.root}>
      <div className={s.stage}>
        <PixelSwap
          className={s.swap}
          aspectRatio="16 / 9"
          trigger="manual"
          active={inShop}
          pattern="random"
          pixelSize={96}
          duration={900}
          pixelDuration={420}
          onComplete={handleComplete}
          firstContent={<ScenePlate src={stationBackgroundUrl} alt="空间站" />}
          secondContent={<ScenePlate src={shopBackgroundUrl} alt="商店" />}
        />
        <div className={s.overlay} data-visible={!inShop && !swapping}>
          <StationScene onEnter={() => go(true)} />
        </div>
        <div className={s.overlay} data-visible={inShop && !swapping}>
          <ShopScene onBack={() => go(false)} />
        </div>
      </div>
    </div>
  );
}
