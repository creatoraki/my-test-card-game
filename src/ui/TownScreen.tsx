// 城镇 —— 远征之间的常驻中枢。目前开放「远征」与「编队」, 其余设施为占位。

import { useRunStore } from "../store/runStore";
import { useTownStore } from "../store/townStore";
import { TerminalNav } from "./TerminalNav";
import "./TownScreen.css";

interface Facility {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

// 未开放的设施 —— 逐个实现后从这里挪走。
const LOCKED_FACILITIES: Facility[] = [
  { id: "shop", name: "补给站", emoji: "🛒", desc: "用远征所得兑换物资。" },
  { id: "forge", name: "锻造台", emoji: "🔨", desc: "强化指定的行动卡。" },
  { id: "tavern", name: "酒馆", emoji: "🍺", desc: "招募新的作战单位。" },
  { id: "archive", name: "档案库", emoji: "📚", desc: "回顾战术日志与图鉴。" },
];

export function TownScreen() {
  const openExpedition = useRunStore((s) => s.openExpedition);
  const openFormation = useRunStore((s) => s.openFormation);
  const characters = useTownStore((s) => s.characters);
  const party = useTownStore((s) => s.party);
  const resetProfile = useTownStore((s) => s.resetProfile);

  const totalCards = party.reduce((n, id) => n + (characters[id]?.deck.length ?? 0), 0);

  return (
    <div className="screen town terminal-screen">
      <TerminalNav active="城镇" />
      <main className="town-main">
        <div className="screen-kicker">方舟 / 驻扎区</div>
        <h1 className="terminal-heading">中枢城镇</h1>
        <p className="muted">
          选择一处设施。上阵 {party.length}/3 · 合计行动卡 {totalCards} 张 —— 养成进度会永久留在这里。
        </p>

        <div className="town-facilities">
          <button className="facility open" onClick={() => openExpedition()}>
            <span className="facility-emoji">🧭</span>
            <span className="facility-name">远征</span>
            <small>选择地图, 出发作战。</small>
          </button>

          <button className="facility open" onClick={() => openFormation()}>
            <span className="facility-emoji">🗃️</span>
            <span className="facility-name">编队</span>
            <small>编辑队伍, 分配属性点, 改造个人卡组。</small>
          </button>

          {LOCKED_FACILITIES.map((f) => (
            <button key={f.id} className="facility" disabled>
              <span className="facility-lock">未开放</span>
              <span className="facility-emoji">{f.emoji}</span>
              <span className="facility-name">{f.name}</span>
              <small>{f.desc}</small>
            </button>
          ))}
        </div>

        <div className="town-footer">
          <button onClick={() => resetProfile()}>重置存档</button>
        </div>
      </main>
    </div>
  );
}
