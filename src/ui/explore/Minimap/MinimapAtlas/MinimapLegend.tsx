// 大图下方的图例条 —— 8 项, 方块直接复用 MinimapTile 的迷你尺寸, 保证与地图上的样式永远一致。
// 宝箱房间目前没有数据来源, 只在图例中展示样式。

import type { MapIcon, MapTone } from "../minimapModel";
import { MinimapTile } from "../MinimapTile";
import s from "./MinimapLegend.module.css";

const ITEMS: { tone: MapTone; icon: MapIcon; name: string }[] = [
  { tone: "current", icon: "arrow", name: "当前位置" },
  { tone: "cleared", icon: "check", name: "已完成房间" },
  { tone: "unknown", icon: "question", name: "未探索房间" },
  { tone: "elite", icon: "demon", name: "精英房间" },
  { tone: "trap", icon: "trap", name: "陷阱房间" },
  { tone: "chest", icon: "chest", name: "宝箱房间" },
  { tone: "boss", icon: "boss", name: "首领房间" },
];

export function MinimapLegend() {
  return <ul className={s.legend} aria-label="图例">
    {ITEMS.map((item) => <li key={item.tone} className={s.item}>
      <span className={s.swatch}>
        <MinimapTile tone={item.tone} icon={item.icon} size={50} />
      </span>
      <span className={s.name}>{item.name}</span>
    </li>)}
    <li className={s.item}>
      <span className={s.swatch}><i className={s.road} aria-hidden /></span>
      <span className={s.name}>道路连接</span>
    </li>
  </ul>;
}

export default MinimapLegend;
