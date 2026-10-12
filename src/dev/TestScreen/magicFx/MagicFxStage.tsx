import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import placeholderArt from "@/assets/占位素材.webp";
import type { MagicFxSpec } from "./magicFxSpecs";
import { CASTER, STAGE, targetsFor } from "./magicFxLayout";
import { MagicFxPlayer } from "./MagicFxPlayer";
import { useLoadedImage } from "./useLoadedImage";
import s from "./MagicFxStage.module.css";

/** 按可用区域等比缩放的设计尺寸舞台。 */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE.width, el.clientHeight / STAGE.height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, scale };
}

/** 演示舞台：左侧施法者，右侧 1~3 个受击目标；特效与受击抖动随 playId 重播。 */
export function MagicFxStage({ spec, playId, rate, count }: { spec: MagicFxSpec; playId: number; rate: number; count: number }) {
  const { ref, scale } = useFitScale();
  // 预热立绘贴图：采样立绘的特效(魂魄抽离)首播不必等加载，受击抖动与特效对齐。
  useLoadedImage(placeholderArt);
  const targets = targetsFor(spec, count);

  return (
    <div ref={ref} className={s.area}>
      <div className={s.stage} style={{ width: STAGE.width, height: STAGE.height, scale: String(scale) }}>
        <div className={s.caster} style={{ left: CASTER.x, top: CASTER.y }}>
          <img src={placeholderArt} alt="" className={s.casterArt} draggable={false} />
          <span className={s.label}>施法者 · {spec.owner}</span>
        </div>
        {targets.map((p, i) => {
          // 受击抖动/闪白锚在爆点(群攻全部目标同一拍)，随慢放同步拉长。
          const hitStyle = {
            "--hit-delay": `${spec.impactMs / rate}ms`,
            "--hit-dur": `${420 / rate}ms`,
          } as CSSProperties;
          return (
            <div key={`${i}-${playId}`} className={s.target} style={{ left: p.x, top: p.y }}>
              <div className={s.targetBody} style={hitStyle}>
                <img src={placeholderArt} alt="" className={s.targetArt} draggable={false} />
              </div>
            </div>
          );
        })}
        <MagicFxPlayer key={`${spec.id}-${count}-${playId}`} spec={spec} rate={rate} targets={targets} portrait={placeholderArt} />
      </div>
    </div>
  );
}
