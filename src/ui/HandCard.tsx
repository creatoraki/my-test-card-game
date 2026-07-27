import type { Card } from "../engine";
import { getCharacter } from "../data";
import { ManaCrystalIcon } from "./ManaCrystalIcon";
import { cardArt } from "./cardArt";
import "./HandCard.css";

interface Props {
  card: Card;
  playable: boolean;
  selected: boolean;
  leaving?: boolean; // true: 出牌/丢弃后向上出鞘渐隐(见 HandCard.css .hand-card.leaving)
  dealIndex?: number; // 抽牌飞入的错峰序号(--deal-i), 让手牌一张张依次飞入
  onExited?: () => void; // 出鞘动画播完 → 通知父级把它从渲染列表移除
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

// 底部手牌盘上的大卡。自上而下只有两段: **正方形配图区** + **图下信息条**(只剩卡名)，
// 费用是左上角一颗直接贴在卡角的 3D 法力水晶(.hc-cost), 数字压在水晶中央桌面上 —— 旧的斜切铭牌已废弃。
// ★ 配图区恒为卡宽见方(卡高 = 卡宽 + 信息条高, 见 ui/BattleScreen.css 的 --hand-card-h), 素材是 1:1
//   的方图, 配 background-size: contain ⇒ 整幅图完整可见, 不裁剪也不被信息条压住。
//   ⚠ 唯二压在配图上的是机能边框(最外 4~6px)与左上那颗水晶 —— 这是刻意的取舍,
//     换来"卡是嵌在终端里的弹药模块"而不是一张贴纸, 配图主体仍完整。
// 普/速、目标范围、效果说明等一律不进卡面 —— 它们统一由右侧固定面板(CardInfoPanel)承载,
// 手牌因此读起来是一排画, 而不是一排数据表。普/速的唯一卡面线索是**框色**
// (普通青蓝 / 速攻品红紫, 见 HandCard.css 的 --card-hue)。
// 卡之间是鱼鳞叠(负 margin), 悬浮时上浮 + 放大 + 置顶露出完整卡面(见 ui/BattleScreen.css .hand-tray);
// 详情面板由 BattleScreen 依 onHover 上报的悬停态派生, 这里不需要上报自身矩形。
export function HandCard({ card, playable, selected, leaving, dealIndex, onExited, onClick, onHover }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const hasArt = Boolean(art);
  const handStyle = {
    // 归属角色配色: 落到机框卡扣、信息条上沿能量线与聚焦光晕上
    ["--owner-color" as string]: owner.color,
    ["--deal-i" as string]: dealIndex ?? 0,
    ...(hasArt ? { ["--hand-art" as string]: `url(${art})` } : {}),
  } as React.CSSProperties;

  return (
    <div
      className={[
        "hand-card",
        hasArt ? "has-art" : "",
        card.cardType,
        playable ? "playable" : "unplayable",
        selected ? "selected" : "",
        leaving ? "leaving" : "",
        card.upgraded ? "upgraded" : "",
      ].join(" ")}
      style={handStyle}
      onTransitionEnd={(e) => {
        // 出鞘过渡(位移)结束 → 通知父级把它移出渲染列表。
        // ⚠ 出鞘方向已从横向改竖向, 但仍走 transform, 故这条判断继续成立。
        if (leaving && e.propertyName === "transform") onExited?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (leaving) return;
        onClick?.();
      }}
      onMouseEnter={() => !leaving && onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* 配图层: 卡上部的正方形取景窗, 整幅 1:1 素材完整展示(不裁剪、不被信息条覆盖) */}
      {hasArt && <span className="hc-art" aria-hidden />}

      {/* 机框层: 全卡扫描线 + 四角 L 卡扣 + 两个斜切角上的亮线。纯装饰, 不吃点击 */}
      <span className="hc-frame" aria-hidden />

      {/* 描边环: 跟着 14px 斜切角走的单层主环(4px) + 常驻巡游流光(见 HandCard.css .hc-edge) */}
      <span className="hc-edge" aria-hidden />

      {/* 侧边刻度齿: 左右内侧各一列仪表刻度, 纯装饰 */}
      <span className="hc-ticks" aria-hidden />

      {/* 左上角费用: 去掉旧的斜切铭牌, 让 3D 水晶直接贴在卡角上, 费用数字压在水晶中央桌面上 */}
      <span className="hc-cost" title="消耗法力水晶">
        <ManaCrystalIcon className="mana-crystal hc-cost-crystal" />
        <span className="hc-cost-value">{card.cost}</span>
      </span>

      {/* 图下信息条: 费用搬去铭牌后只剩卡名, 整条居中 */}
      <span className="hc-bar">
        <span className="hc-name">{card.name}</span>
      </span>
    </div>
  );
}
