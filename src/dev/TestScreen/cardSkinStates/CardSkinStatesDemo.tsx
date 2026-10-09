// 测试页: 卡牌两套皮肤的特殊状态对照。左侧选状态, 右侧并排展示老皮肤(手牌卡面)与新皮肤(三选一卡面)。
// 顶部交互态可把「悬停 / 选中」叠加到任意状态上; 离场演出样本自动循环播放。
import { useEffect, useMemo, useState } from "react";
import type { PickCardExit } from "@/ui/common/card/CardRewardPicker";
import { PreviewStage } from "../preview/PreviewStage";
import { SkinPair, type Interaction } from "./SkinPair";
import { SKIN_SAMPLES } from "./skinStateSamples";
import s from "./CardSkinStatesDemo.module.css";

const INTERACTIONS: { id: Interaction; label: string }[] = [
  { id: "none", label: "常态" },
  { id: "hover", label: "悬停" },
  { id: "selected", label: "选中" },
];

const GROUPS = [...new Set(SKIN_SAMPLES.map((sample) => sample.group))];

/** 离场循环: 静置 → 播放 → 留空 → 重新挂载。 */
const EXIT_IDLE_MS = 900;
const EXIT_PLAY_MS = 1400;

export function CardSkinStatesDemo() {
  const [sampleId, setSampleId] = useState(SKIN_SAMPLES[0].id);
  const [interaction, setInteraction] = useState<Interaction>("none");
  const [round, setRound] = useState(0);
  const [exit, setExit] = useState<PickCardExit | null>(null);
  const sample = SKIN_SAMPLES.find((entry) => entry.id === sampleId) ?? SKIN_SAMPLES[0];
  // 每轮(切换样本 / 重播)重新实例化卡牌, 保证 uid 与状态都是新的。
  const card = useMemo(() => sample.build(), [sample, round]);

  // 重新挂载与清空 exit 必须同批提交, 否则新挂载的卡会带着上一轮的 exit 闪一帧。
  const restart = () => {
    setExit(null);
    setRound((value) => value + 1);
  };

  useEffect(() => {
    if (!sample.exit) return;
    const play = window.setTimeout(() => setExit(sample.exit ?? null), EXIT_IDLE_MS);
    const again = window.setTimeout(restart, EXIT_IDLE_MS + EXIT_PLAY_MS);
    return () => {
      window.clearTimeout(play);
      window.clearTimeout(again);
    };
  }, [sample, round]);

  const pick = (id: string) => {
    setSampleId(id);
    restart();
  };

  return (
    <PreviewStage>
      <div className={s.layout}>
        <nav className={s.menu} aria-label="卡牌状态">
          <h1 className={s.title}>卡牌皮肤状态对照</h1>
          {GROUPS.map((group) => (
            <div key={group} className={s.group}>
              <h2 className={s.groupTitle}>{group}</h2>
              <div className={s.items}>
                {SKIN_SAMPLES.filter((entry) => entry.group === group).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={s.item}
                    aria-pressed={entry.id === sample.id}
                    onClick={() => pick(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className={s.main}>
          <div className={s.toolbar}>
            <span className={s.toolLabel}>叠加交互态</span>
            {INTERACTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={s.tool}
                aria-pressed={interaction === entry.id}
                disabled={Boolean(sample.selected || sample.exit)}
                onClick={() => setInteraction(entry.id)}
              >
                {entry.label}
              </button>
            ))}
            <button type="button" className={s.tool} onClick={restart}>
              {sample.exit ? "重播" : "重置卡牌"}
            </button>
          </div>
          <SkinPair
            key={`${sample.id}-${round}`}
            sample={sample}
            card={card}
            interaction={sample.exit ? "none" : interaction}
            exit={exit}
          />
        </main>
      </div>
    </PreviewStage>
  );
}
