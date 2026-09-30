// 置换演出: 原卡被扫描、压缩成一道数据线, 数据线再展开成新卡; 最后原卡残影退到左侧、新卡落在右侧,
// 中间箭头串起来, 结论文字写明「谁换成了谁」。分镜由 useReplaceSequence 推进, 这里只按 data-phase 摆结构。
import { cardDisplayName, type Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import type { ReplacePhase } from "./useReplaceSequence";
import s from "./ReplaceShowcase.module.css";

interface Props {
  before: Card;
  after: Card;
  ownerName: string;
  phase: ReplacePhase;
}

const PHASE_TEXT: Partial<Record<ReplacePhase, string>> = {
  scan: "正在解析原卡结构……",
  collapse: "原卡数据压缩中……",
  reveal: "新卡成形",
  settle: "置换完成",
};

export function ReplaceShowcase({ before, after, ownerName, phase }: Props) {
  return (
    <div className={s.stage} data-phase={phase}>
      <span className={s.floor} aria-hidden />
      <span className={s.column} aria-hidden />

      <ShowcaseCard role="old" card={before} label="原卡" />
      <span className={s.line} aria-hidden />
      <span className={s.ring} aria-hidden />
      <span className={s.arrow} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <ShowcaseCard role="new" card={after} label="新卡" />

      <p className={s.summary} key={phase} aria-live="polite">
        {phase === "done" ? (
          <>
            「<strong className={s.oldName}>{cardDisplayName(before)}</strong>」已替换为「
            <strong className={s.newName}>{cardDisplayName(after)}</strong>」，新卡已加入{ownerName}的卡组
          </>
        ) : PHASE_TEXT[phase]}
      </p>
    </div>
  );
}

function ShowcaseCard({ role, card, label }: { role: "old" | "new"; card: Card; label: string }) {
  return (
    <div className={s.slot} data-role={role}>
      <span className={s.halo} aria-hidden />
      <div className={s.face}>
        <div className={s.scale} data-card-detail>
          <HandCard card={card} variant="pile" playable selected={false} />
        </div>
        <span className={s.beam} aria-hidden />
        <span className={s.flash} aria-hidden />
      </div>
      {role === "old" && <span className={s.stamp}>已移除</span>}
      <span className={s.caption}>
        <b>{label}</b>
        <span className={s.captionName}>{cardDisplayName(card)}</span>
      </span>
    </div>
  );
}
