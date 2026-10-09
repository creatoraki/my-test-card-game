// 手牌模式徽章(换牌 / 弃牌 / 选择): 挂在托盘卡槽左上外侧, 不随卡面上弹; 卡外标记行在模式期间由卡槽整行隐藏让位。
import { DiscardIcon, RedrawIcon } from "@/ui/battle/HandTools";
import { cx } from "@/ui/common/shared/cx";
import s from "./HandTrayAction.module.css";

export type HandTrayActionKind = "redraw" | "discard" | "choose";

const LABEL: Record<HandTrayActionKind, string> = {
  redraw: "换掉这张牌",
  discard: "丢弃这张牌",
  choose: "选择这张牌",
};

export function HandTrayAction({ kind, onAction }: { kind: HandTrayActionKind; onAction: () => void }) {
  return (
    <button
      type="button"
      className={cx(s.action, s[kind])}
      aria-label={LABEL[kind]}
      onClick={(event) => {
        event.stopPropagation();
        onAction();
      }}
    >
      {kind === "redraw" ? <RedrawIcon /> : kind === "choose" ? "选择" : <DiscardIcon />}
    </button>
  );
}
