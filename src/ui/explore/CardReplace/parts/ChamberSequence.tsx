// 培养舱内的原地演出: 原卡被扫描 → 自上而下溶解成数据流 → 新卡自下而上成形 → 闪光收束。
//   · 卡面溶解 / 成形走 CSS 遮罩(前沿变量 --front 线性推进), 时间轴与 useReplaceSequence 同源(chamberTimeline);
//   · 光边、碎屑、全息线框、气泡、冲击环由 GLSL 叠在卡面之上(chamberTransmute), 用同一条前沿公式;
//   · 删牌只溶解不成形, 复制不溶解(原卡留在舱里, 复制件在其上成形)。
// 挂载即开播(CSS 动画与着色器 uPhase 同帧起算); 播完(done)卸掉着色器画布, 只留结果卡面。
import { useMemo, useState, type CSSProperties } from "react";
import type { Card } from "@/engine";
import { GlslSprite, GLSL_COMMON, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { chamberTimeline, type ReplacePhase } from "../useReplaceSequence";
import type { DeckServiceMode } from "../deckServiceModes";
import { GLSL_CHAMBER_TRANSMUTE } from "./chamberTransmute.glsl";
import { DeckCardFace } from "./DeckCardFace";
import { CARD_H, CARD_W, CHAMBER_CARD_SCALE, CHAMBER_FX } from "./deckGeometry";
import s from "./ChamberSequence.module.css";

const PROGRAM: GlslProgramDef = {
  key: "deck.chamberTransmute",
  fragment: [GLSL_COMMON, GLSL_CHAMBER_TRANSMUTE].join("\n"),
};

const CARD_DW = CARD_W * CHAMBER_CARD_SCALE;
const CARD_DH = CARD_H * CHAMBER_CARD_SCALE;
/** 卡面在着色器画布里的框(左下原点)。 */
const CARD_RECT = [(CHAMBER_FX.w - CARD_DW) / 2, (CHAMBER_FX.h - CARD_DH) / 2, CARD_DW, CARD_DH] as const;

const sec = (ms: number) => ms / 1000;
const segUniform = (seg: [number, number] | null) => (seg ? [sec(seg[0]), sec(seg[1])] : [-1, -1]);

interface Props {
  mode: DeckServiceMode;
  before?: Card;
  after?: Card;
  phase: ReplacePhase;
}

export function ChamberSequence({ mode, before, after, phase }: Props) {
  const [seed] = useState(Math.random);
  const line = useMemo(() => chamberTimeline(mode), [mode]);
  const uniforms = useMemo<GlslUniforms>(() => ({
    uCard: CARD_RECT,
    uScan: segUniform(line.scan),
    uDissolve: segUniform(line.dissolve),
    uForm: segUniform(line.form),
    uSettle: segUniform(line.settle),
  }), [line]);

  const vars = {
    "--scan-at": `${line.scan[0]}ms`,
    "--scan-dur": `${line.scan[1] - line.scan[0]}ms`,
    ...(line.dissolve && { "--dis-at": `${line.dissolve[0]}ms`, "--dis-dur": `${line.dissolve[1] - line.dissolve[0]}ms` }),
    ...(line.form && { "--form-at": `${line.form[0]}ms`, "--form-dur": `${line.form[1] - line.form[0]}ms` }),
    "--settle-at": `${line.settle[0]}ms`,
    "--fx-w": `${CHAMBER_FX.w}px`,
    "--fx-h": `${CHAMBER_FX.h}px`,
  } as CSSProperties;

  return (
    <div className={s.seq} style={vars}>
      {before && (
        <div className={s.card} data-role="old" data-dissolve={line.dissolve ? "" : undefined} data-card-detail>
          <div className={s.scale}>
            <DeckCardFace card={before} />
          </div>
        </div>
      )}
      {after && line.form && (
        <div className={s.card} data-role="new" data-card-detail>
          <div className={s.scale}>
            <DeckCardFace card={after} />
          </div>
        </div>
      )}
      {phase !== "done" && (
        <GlslSprite className={s.fx} program={PROGRAM} width={CHAMBER_FX.w} height={CHAMBER_FX.h} uniforms={uniforms} seed={seed} pixelRatio={2} />
      )}
    </div>
  );
}
