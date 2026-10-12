import { useEffect, useState } from "react";
import sceneArt from "@/assets/占位场景素材.webp";
import { MAGIC_FX_SPECS } from "./magicFxSpecs";
import { MagicFxStage } from "./MagicFxStage";
import { MagicFxPanel } from "./MagicFxPanel";
import s from "./MagicFxShowcase.module.css";

/** 循环播放时两次之间的间隔(ms，按实际时间计)。 */
const LOOP_GAP = 600;

/** 攻击动效演示：预言家 / 咒术师各 6 种 GLSL 魔法攻击(含全屏群攻)，并标注分配到的卡牌。 */
export function MagicFxShowcase() {
  const [specId, setSpecId] = useState<string>(MAGIC_FX_SPECS[0].id);
  const [playId, setPlayId] = useState(0);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [count, setCount] = useState(3);
  const spec = MAGIC_FX_SPECS.find((item) => item.id === specId) ?? MAGIC_FX_SPECS[0];

  const replay = () => setPlayId((n) => n + 1);
  const pick = (id: string) => {
    setSpecId(id);
    replay();
  };
  const changeCount = (value: number) => {
    setCount(value);
    replay();
  };

  useEffect(() => {
    if (!loop) return;
    const timer = window.setTimeout(() => setPlayId((n) => n + 1), spec.totalMs / rate + LOOP_GAP);
    return () => window.clearTimeout(timer);
  }, [loop, playId, rate, spec, count]);

  return (
    <div className={s.root} style={{ backgroundImage: `url(${sceneArt})` }}>
      <MagicFxStage spec={spec} playId={playId} rate={rate} count={count} />
      <MagicFxPanel
        spec={spec}
        onPick={pick}
        controls={{ rate, loop, count, setRate, setLoop, setCount: changeCount, replay }}
      />
    </div>
  );
}
