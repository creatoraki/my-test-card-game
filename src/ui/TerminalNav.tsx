// 顶部终端导航条 —— 非战斗界面共用(菜单/城镇/远征)。
// 除 active 外的条目目前均为占位, 尚未实现对应界面。

export function TerminalNav({ active }: { active: string }) {
  return (
    <header className="terminal-nav">
      <span className="terminal-mark">AR//K</span>
      <span>档案库</span>
      <span className="nav-active">{active}</span>
      <span>战术日志</span>
      <span>配置</span>
      <b>R1</b>
    </header>
  );
}
