import { CHARACTERS } from "../data";
import { RULES } from "../engine";
import { useRunStore } from "../store/runStore";
import { CharacterPortrait } from "./CharacterPortrait";
import { TerminalNav } from "./TerminalNav";

export function MenuScreen() {
  const enterTown = useRunStore((s) => s.enterTown);

  return (
    <div className="screen menu terminal-screen">
      <TerminalNav active="启动" />
      <main className="menu-main">
        <div className="screen-kicker">系统 / 远征控制台</div>
        <h1 className="title">时刻方舟</h1>
        <p className="subtitle">时刻制回合 / 共享牌库 / 构筑闭环</p>

        <div className="party-preview">
          {CHARACTERS.map((c) => (
            <div key={c.id} className="party-member" style={{ borderColor: c.color }}>
              <div className="party-tag">UNIT-01 / READY</div>
              <CharacterPortrait characterId={c.id} emoji={c.emoji} alt={`${c.name}立绘`} className="menu-portrait" />
              <span style={{ color: c.color }}>{c.name}</span>
              <small>生命容量 {c.maxHp}</small>
            </div>
          ))}
        </div>

        <button className="primary big" onClick={() => enterTown()}>
          开始游戏
        </button>

        {/* <div className="menu-hint">
          <p>作战协议 / 基础规则</p>
          <ul>
            <li>每回合有 {RULES.resource.perRound} 点<b>法力水晶</b>用于出牌; 打<b>普通牌</b>会推进 1 时刻, <b>速攻牌</b>不推进。</li>
            <li>敌人头顶 <b>⏱倒计时</b> 到 0 时行动; 回合结束时还没动过的敌人也会补一次行动。</li>
            <li>全队共享一个牌库; 用<b>嘲讽</b>拉仇恨可改变敌人的攻击目标。</li>
            <li>击败敌人后可<b>选卡 / 强化</b>, 卡组在整场远征中持续成长。</li>
          </ul>
        </div> */}
      </main>
    </div>
  );
}
