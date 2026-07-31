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

// 底部手牌盘上的大卡。自上而下三段: **顶行(费用水晶 + 卡名)** + **正方形配图区** + **底部效果说明**。
// ★ 配图区恒为卡宽见方(卡高 = 卡宽 + 顶行高 + 说明区高, 见 ui/BattleScreen.css 的 --hand-card-h),
//   素材是 1:1 的方图, 配 background-size: contain ⇒ 整幅图完整可见; 上下两条信息区都是**实位**,
//   一个像素都不压配图, 唯一压上去的只有机能边框最外 4~6px。
// 目标范围 / 稀有度 / 普速文字等更完整的数据仍由右侧固定面板(CardInfoPanel)承载 —— 卡面只放
// "打不打得起(费用) / 是什么(卡名) / 干什么(效果)"这三样即可决策。普/速的卡面线索仍是**框色**
// (普通青蓝 / 速攻品红紫, 见 HandCard.css 的 --card-hue)。
// 本组件渲染的是**两层**: 外层 .hand-slot(不动的占位壳, 吃悬停与版式) + 内层 .hand-card(卡面本体,
// 只做位移动画)。分层的理由见下方 return 处的注释 —— 少了这层, 悬停会无限抖动。
// 卡之间是鱼鳞叠(负 margin), 悬浮时向上弹出半张卡高 + 置顶露出完整卡面(**不放大**, 见 HandCard.css);
// 详情面板由 BattleScreen 依 onHover 上报的悬停态派生, 这里不需要上报自身矩形。
export function HandCard({ card, playable, selected, leaving, dealIndex, onExited, onClick, onHover }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const hasArt = Boolean(art);
  // 说明区高度固定(一排卡必须等高), 故长文本靠**降字号**消化而不是撑高卡。
  // 按字数分三档而不是 JS 实测宽高: 零测量、零布局抖动, 也不需要 useLayoutEffect;
  // 极端超长的仍会被 .hc-text 的行数截断兜住, 完整文字在右侧 CardInfoPanel 永远读得到。
  const textSize = card.text.length <= 24 ? "lg" : card.text.length <= 44 ? "md" : "sm";
  const handStyle = {
    // 归属角色配色: 落到机框卡扣、信息条上沿能量线与聚焦光晕上
    ["--owner-color" as string]: owner.color,
    ["--deal-i" as string]: dealIndex ?? 0,
    ...(hasArt ? { ["--hand-art" as string]: `url(${art})` } : {}),
  } as React.CSSProperties;

  return (
    // ★ 外壳 .hand-slot: 一个**永不位移**的占位框, 悬停命中区与层序全归它, 卡本身只负责视觉位移。
    //   ⚠ 这一层不是可有可无的包装 —— 悬停上弹的幅度是半张卡高(168px), 若命中区跟着卡一起走,
    //     鼠标停在卡下半部时卡一弹起就脱离光标 ⇒ 失焦落回 ⇒ 又盖住光标 ⇒ 无限抖动。
    //     壳不动 ⇒ 光标始终在壳内, 悬停态稳定。上弹后卡越出壳外的那半张由 CSS 的悬停桥
    //     (.hand-slot:hover::after, 见 HandCard.css)补上命中区, 故移到弹起的卡上也不会掉焦。
    //   ⚠ 尺寸/负 margin 叠压/张数自适应等版式规则全部认这一层, 见 ui/BattleScreen.css 的 .hand-slot。
    <div
      className={`hand-slot${selected ? " selected" : ""}${leaving ? " leaving" : ""}`}
      onMouseEnter={() => !leaving && onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
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
      >
        {/* 配图层: 夹在顶行与说明区之间的正方形取景窗, 整幅 1:1 素材完整展示(不裁剪、不被信息条覆盖) */}
        {hasArt && <span className="hc-art" aria-hidden />}

        {/* 机框层: 全卡扫描线 + 四角 L 卡扣 + 两个斜切角上的亮线。纯装饰, 不吃点击 */}
        <span className="hc-frame" aria-hidden />

        {/* 描边环: 跟着 14px 斜切角走的单层主环(4px) + 常驻巡游流光(见 HandCard.css .hc-edge) */}
        <span className="hc-edge" aria-hidden />

        {/* 侧边刻度齿: 左右内侧各一列仪表刻度, 纯装饰 */}
        <span className="hc-ticks" aria-hidden />

        {/* 顶行: 费用水晶(数字压在水晶中央桌面上) + 卡名, 同一行左起排 */}
        <span className="hc-head">
          <span className="hc-cost" title="消耗法力水晶">
            <ManaCrystalIcon className="mana-crystal hc-cost-crystal" />
            <span className="hc-cost-value">{card.cost}</span>
          </span>
          <span className="hc-name">{card.name}</span>
        </span>

        {/* 底部效果说明: 定高区域, 字号按文字长度分三档(见上方 textSize) */}
        <span className={`hc-text ${textSize}`}>{card.text}</span>
      </div>
    </div>
  );
}
