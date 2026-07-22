import manaCrystalArt from "../assets/道具/法力水晶.png";

interface Props {
  className?: string;
}

// 法力水晶图标。原先是手绘 SVG(♦ 菱形宝石), 现改为美术素材 assets/道具/法力水晶.png(64×64)。
// ⚠ 素材是**正方形**, 而旧 SVG 是 32×40 的竖长比例 —— 所有用到 .mana-crystal 的地方
// (顶栏水晶条 / 手牌费用 / 卡面费用 / 出牌亮相)尺寸都已在 styles.css 里改成 1:1;
// 这里再挂一道 object-fit: contain 兜底, 万一某处漏改也只会留白边而不会把水晶压扁。
export function ManaCrystalIcon({ className }: Props) {
  return <img className={className} src={manaCrystalArt} alt="" aria-hidden="true" draggable={false} />;
}
