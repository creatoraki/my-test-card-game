import s from "./DemoPanel.module.css";

export interface WidthPreset {
  id: string;
  label: string;
  width: number;
}

export interface BakeStats {
  drawMs: number;
  slowestTileMs: number;
  tiles: number;
  buildings: number;
  street: number;
  props: number;
}

interface DemoPanelProps {
  seed: number;
  roomSeeds: readonly number[];
  onSeed: (seed: number) => void;
  onRandom: () => void;
  widthPresets: readonly WidthPreset[];
  widthId: string;
  onWidth: (id: string) => void;
  showBounds: boolean;
  onToggleBounds: () => void;
  auto: boolean;
  onToggleAuto: () => void;
  baking: boolean;
  progress: number;
  stats: BakeStats | null;
}

const ROOM_NAMES = ["一", "二", "三", "四", "五", "六"];

const cls = (...names: (string | false)[]) => names.filter(Boolean).join(" ");

/** 演示控制面板：切换房间种子、房间宽度、调试层与自动巡航，并展示烘焙进度与耗时。 */
export function DemoPanel(props: DemoPanelProps) {
  const { stats } = props;
  return <aside className={s.panel}>
    <h2 className={s.title}>程序化近景演示</h2>
    <p className={s.seed}>当前种子　<b>{props.seed}</b></p>

    <div className={s.group}>
      <span className={s.caption}>房间</span>
      <div className={s.row}>
        {props.roomSeeds.map((roomSeed, i) => <button key={roomSeed} type="button"
          className={cls(s.chip, roomSeed === props.seed && s.active)}
          onClick={() => props.onSeed(roomSeed)}>房间{ROOM_NAMES[i] ?? i + 1}</button>)}
        <button type="button" className={cls(s.chip, s.accent)} onClick={props.onRandom}>随机新房间</button>
      </div>
    </div>

    <div className={s.group}>
      <span className={s.caption}>房间宽度</span>
      <div className={s.row}>
        {props.widthPresets.map((preset) => <button key={preset.id} type="button"
          className={cls(s.chip, preset.id === props.widthId && s.active)}
          onClick={() => props.onWidth(preset.id)}>{preset.label}</button>)}
      </div>
    </div>

    <div className={s.row}>
      <button type="button" className={cls(s.chip, props.showBounds && s.active)} onClick={props.onToggleBounds}>显示占地框</button>
      <button type="button" className={cls(s.chip, props.auto && s.active)} onClick={props.onToggleAuto}>自动巡航</button>
    </div>

    <div className={s.progress} aria-label="烘焙进度">
      <div className={s.progressFill} style={{ transform: `scaleX(${props.progress})` }} />
    </div>
    {props.baking
      ? <p className={s.stats}>烘焙中　{Math.round(props.progress * 100)}%</p>
      : stats && <p className={s.stats}>
        绘制 {stats.drawMs.toFixed(0)} 毫秒 · 最慢一块 {stats.slowestTileMs.toFixed(0)} 毫秒<br />
        共 {stats.tiles} 块 · 前排 {stats.buildings} 栋建筑 · 设施 {stats.street} 件 · 交互物 {stats.props} 件
      </p>}
    <p className={s.hint}>左右方向键移动角色，镜头跟随；靠近交互物会高亮</p>
  </aside>;
}
