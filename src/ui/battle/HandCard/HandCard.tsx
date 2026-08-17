import { memo } from "react";
import type { Card } from "@/engine";
import { CARD_MARK_DEFS } from "@/engine";
import { getCharacter } from "@/data";
import { ManaCrystal } from "@/ui/common/ManaCrystal";
import { cardArt } from "@/ui/art/cardArt";
import { clearHandHover, setHandHover } from "@/ui/battle/handFocusStore";
import { DiscardIcon, RedrawIcon } from "@/ui/battle/HandTools";
import { cx } from "@/ui/common/cx";
import { useCardText } from "@/ui/common/cardText";
import { CardTextRich } from "@/ui/common/CardTextRich";
import s from "./HandCard.module.css";

interface Props {
  card: Card;
  playable: boolean;
  unaffordable?: boolean; // 费用不足仍可点击查看提示，不应按结构性不可用卡渲染
  selected: boolean;
  variant?: "hand" | "pile";
  leaving?: boolean; // true: 出牌/丢弃后向上出鞘渐隐(见 HandCard.css .hand-card.leaving)
  discarding?: boolean; // true: 弃牌后原地下沉翻面渐隐
  purged?: boolean; // true: 所属角色阵亡后碎裂消散
  dealDelay?: number; // 抽牌飞入的绝对延迟(ms), 由父级按批次计算
  onExited?: (uid: string) => void; // 出鞘动画播完 → 通知父级把它从渲染列表移除
  onClick?: (uid: string) => void;
  actionBadge?: "redraw" | "discard" | null;
  onAction?: (uid: string) => void;
  cost?: number;
  starPay?: number;
  // ⚠ 这里刻意**没有** onHover —— 悬停不再经过父级。见下方 onMouseEnter 处的注释。
}

// 底部手牌盘上的大卡, 质感是**蚀刻黑钢板**(拉丝+噪点+不均匀反光的表面 + 三层棱的真倒角 + 可见卡厚)。
// 自上而下**两段实位**: **正方形配图区**(上) + **底部效果说明**(下), 卡高 = 卡宽 + 说明区高
// (见 ui/BattleScreen.css 的 --hand-card-h), 比例恒为 220:308 ≈ 1:1.4。
// ★ 配图区恒为卡宽见方, 素材是 1:1 的方图, 配 background-size: contain ⇒ 整幅图完整可见。
// ★ 费用与卡名都是**压在配图上的浮层**, 不占实位 —— 这是把卡高从 336 压到 308(1:1.4)的关键:
//   费用做成嵌在左上斜口内侧的立体金属徽章(实体卡的"角钉"), 卡名做成贴在配图下沿的渐变压条。
//   代价是配图左上角约 46×46 与底部一条 30px 被压住, 这是刻意的取舍 —— 素材本就留了边。
// 目标范围 / 普速文字等更完整的数据仍由右侧固定面板(CardInfoPanel)承载 —— 卡面只放
// "打不打得起(费用) / 是什么(卡名) / 干什么(效果)"这三样即可决策。
// ★ 卡面上**没有任何色相**(见 HandCard.css 开头): 普/速靠**剪影**区分(速攻卡左边棱开一道咬口),
//   稀有度靠**蚀刻纹与边棱工艺**分三档, 能不能打靠**厚度**。唯一的两点颜色是费用水晶的辉光
//   (走全站 --accent)与卡名压条左端那道归属角色竖标。
// 本组件渲染的是**两层**: 外层 .hand-slot(不动的占位壳, 吃悬停与版式) + 内层 .hand-card(卡面本体,
// 只做位移动画)。分层的理由见下方 return 处的注释 —— 少了这层, 悬停会无限抖动。
// 本组件同时服务手牌托盘与牌堆弹窗, 两套版式分别锁在 [data-hand-tray] / [data-pile-grid] 下。
// 卡之间是鱼鳞叠(负 margin), 悬浮时向上弹出半张卡高 + 置顶露出完整卡面(**不放大**, 见 HandCard.css);
// 详情面板(CardInfoPanel)与队伍槽高亮(AllyBar)读的是本组件写进 ui/handFocusStore.ts 的悬停卡,
// 两者各自订阅、与 BattleScreen 无关; 这里不需要上报自身矩形, 也不需要回调冒泡。
export const HandCard = memo(function HandCard({
  card,
  playable,
  unaffordable,
  selected,
  variant = "hand",
  leaving,
  discarding,
  purged,
  dealDelay,
  onExited,
  onClick,
  actionBadge,
  onAction,
  cost,
  starPay = 0,
}: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const hasArt = Boolean(art);
  const text = useCardText(card);
  const effectiveCost = cost ?? card.cost;
  // 说明区高度固定(一排卡必须等高), 故长文本靠**降字号**消化而不是撑高卡。
  // 按字数分三档而不是 JS 实测宽高: 零测量、零布局抖动, 也不需要 useLayoutEffect;
  // 极端超长的仍会被 .hc-text 的行数截断兜住, 完整文字在右侧 CardInfoPanel 永远读得到。
  const textSize = text.length <= 24 ? "lg" : text.length <= 44 ? "md" : "sm";
  const handStyle = {
    // 归属角色配色: 现在只落在**卡名压条左端那道竖标**上(见 HandCard.css .hc-title::before)。
    // ⚠ 刻意只留这一处 —— 金属刻板的卡面上配色越少越贵气, 归属辨识主要靠队伍槽本身。
    ["--owner-color" as string]: owner.color,
    ["--deal-delay" as string]: `${dealDelay ?? 0}ms`,
    ...(hasArt ? { ["--hand-art" as string]: `url(${art})` } : {}),
  } as React.CSSProperties;

  return (
    // ★ 外壳 .hand-slot: 一个**永不位移**的占位框, 悬停命中区、点击处理器与层序全归它, 卡本身只负责视觉位移。
    //   ⚠ 这一层不是可有可无的包装 —— 悬停上弹的幅度是半张卡高(168px), 若命中区跟着卡一起走,
    //     鼠标停在卡下半部时卡一弹起就脱离光标 ⇒ 失焦落回 ⇒ 又盖住光标 ⇒ 无限抖动。
    //     壳不动 ⇒ 光标始终在壳内, 悬停态稳定。上弹后卡越出壳外的那半张由 CSS 的悬停桥
    //     (.hand-slot:hover::after, 见 HandCard.css)补上命中区, 故移到弹起的卡上也不会掉焦。
    //   ⚠ 尺寸/负 margin 叠压/张数自适应等版式规则全部认这一层, 见 HandTray.module.css 与本文件末尾。
    <div
      className={cx(
        s["hand-slot"],
        (playable || unaffordable) && s.playable,
        selected && s.selected,
        leaving && s.leaving,
      )}
      style={handStyle}
      // data-hand-slot: 供 BattleScreen 的 `.hand-tray:has([data-hand-slot]:nth-last-child(N))`
      // 按张数收紧叠压量。类名被哈希后那条选择器够不着, 属性可以(样式铁律 2)。
      data-hand-slot
      // ★ 悬停**直接写进 ui/handFocusStore.ts**, 不再经由 props 冒泡到 BattleScreen。
      //   这是战斗画面最重要的一条性能约束: 旧写法是 onHover → BattleScreen 的 setHoveredUid,
      //   一次顶层 setState ⇒ 全屏组件树重渲染, 而鼠标扫过一排卡每跨一张就有两次。现在只有
      //   真正需要这个值的两个订阅方(CardInfoPanel / AllyBar)会重渲染。
      // ⚠ 本组件**只写不读** store —— 一旦在这里订阅, 十张卡就会跟着悬停一起重渲染,
      //   等于把刚搬走的开销原样搬回来。卡自己的悬停视觉全部由 CSS :hover 驱动(见 HandCard.css)。
      onMouseEnter={() => variant === "hand" && !leaving && setHandHover(card, effectiveCost)}
      onMouseLeave={() => variant === "hand" && clearHandHover(card)}
      onClick={variant === "hand" ? (e) => {
        e.stopPropagation();
        if (leaving) return;
        onClick?.(card.uid);
      } : undefined}
    >
      {variant === "hand" && actionBadge && !leaving && (
        <button
          type="button"
          className={cx(s["hc-action"], s[`hc-action-${actionBadge}`])}
          aria-label={actionBadge === "redraw" ? "换掉这张牌" : "丢弃这张牌"}
          title={actionBadge === "redraw" ? "换掉这张牌" : "丢弃这张牌"}
          onClick={(e) => {
            e.stopPropagation();
            onAction?.(card.uid);
          }}
        >
          {actionBadge === "redraw" ? <RedrawIcon /> : <DiscardIcon />}
        </button>
      )}
      {variant === "hand" && !actionBadge && !leaving && (card.marks?.length ?? 0) > 0 && (
        <span className={s["hc-marks"]}>
          {card.marks!.map((markId) => {
            const mark = CARD_MARK_DEFS[markId];
            if (!mark) return null;
            return (
              <span key={markId} className={s["hc-mark"]} aria-label={mark.name}>
                <span className={s["hc-mark-icon"]} aria-hidden>{mark.emoji}</span>
                <span className={s["hc-mark-tip"]} role="tooltip">
                  <span className={s["hc-mark-tip-name"]}>{mark.emoji} {mark.name}</span>
                  <span className={s["hc-mark-tip-desc"]}>{mark.desc}</span>
                </span>
              </span>
            );
          })}
        </span>
      )}
      <div
        className={cx(
          s["hand-card"],
          hasArt && s["has-art"],
          s[card.cardType],
          // 稀有度档位 → .r-basic / .r-common / .r-uncommon / .r-rare。basic 与 common 同为无纹,
          // 卡面上其余档位表现为**蚀刻纹密度 + 边棱工艺**,
          // 一个像素的配色都不用(理由见 src/styles/tokens.css: 那套 --rarity-* 是物品的, 别套用)。
          // ⚠ rarity 在 CardDef 上是可选的(engine/types.ts), 缺省当 common —— 否则那张卡会一层纹都没有,
          //   与 common 看起来一样但走的是"未定义"的路径, 将来加档时容易漏。
          s[`r-${card.rarity ?? "common"}`],
          !playable && !unaffordable && s.unplayable,
          selected && s.selected,
          leaving && s.leaving,
          discarding && s.discarding,
          purged && s.purged,
          card.upgraded && s.upgraded,
          card.contaminated && s.contaminated,
        )}
        onTransitionEnd={(e) => {
          // 出鞘过渡(位移)结束 → 通知父级把它移出渲染列表。
          // ⚠ 出鞘方向已从横向改竖向, 但仍走 transform, 故这条判断继续成立。
          if (leaving && !discarding && !purged && e.propertyName === "transform") onExited?.(card.uid);
        }}
        onAnimationEnd={(e) => {
          if (purged && e.animationName.includes("cardShatter")) onExited?.(card.uid);
          if (discarding && e.animationName.includes("cardDiscardSink")) onExited?.(card.uid);
        }}
      >
        {/* 配图层: 卡上段的正方形取景窗, 整幅 1:1 素材完整展示(不裁剪) */}
        {hasArt && <span className={s["hc-art"]} aria-hidden />}

        {/* 机框层: 四角 L 卡扣(金属亮色)。纯装饰, 不吃点击 */}
        <span className={s["hc-frame"]} aria-hidden />

        {/* 描边环: 跟着 14px 斜切角走的金属斜面(上/左受光 + 下/右背光, 见 HandCard.css .hc-edge) */}
        <span className={s["hc-edge"]} aria-hidden />

        {/* 费用徽章: 嵌在配图左上斜口内侧的立体金属圆盘, 数字压在水晶中央桌面上 */}
        <span className={s["hc-cost"]} title="消耗法力水晶">
          <ManaCrystal className={s["hc-cost-crystal"]} still tone={card.cardType === "fast" ? "haste" : "mana"} />
          <span className={s["hc-cost-value"]}>{effectiveCost}</span>
        </span>
        {starPay > 0 && (
          <span className={s["hc-star-pay"]}>
            ✨{starPay}
            <span className={s["hc-star-pay-tip"]} role="tooltip">
              消耗 {starPay} 层星辉，实付 {effectiveCost - starPay} 点法力水晶
            </span>
          </span>
        )}

        {/* 卡名压条: 贴在配图下沿的渐变浮层(透明 → 实底), 不占实位 */}
        <span className={s["hc-title"]}>{card.name}</span>

        {/* 底部效果说明: 定高区域, 字号按文字长度分三档(见上方 textSize) */}
        <span className={cx(s["hc-text"], s[textSize])}><CardTextRich text={text} /></span>

        {/* 选中角标: 右上角一块配色三角切片。选中态**唯一**的不依赖位移的线索 ——
            鼠标移开手牌区后, 玩家仍要能一眼认出锁定的是哪张。仅 .selected 时渲染。 */}
        {selected && <span className={s["hc-selected-mark"]} aria-hidden />}
        {card.contaminated && (
          <span className={s["hc-pollution-mark"]} title="污染卡 · 抽到时污染值 +2" aria-label="污染卡">
            ☣
          </span>
        )}
        {variant === "pile" && card.marks?.map((markId) => {
          const mark = CARD_MARK_DEFS[markId];
          if (!mark) return null;
          return (
            <span key={markId} className={s["hc-mark-inline"]} title={`${mark.name} · ${mark.desc}`} aria-label={mark.name}>
              {mark.emoji}
            </span>
          );
        })}
      </div>
    </div>
  );
});
