import { useState } from "react";
import { SciFiPanel, type SciFiPanelColors } from "@/ui/common/SciFiPanel";
import reference from "@/assets/test/panel素材.png";
import s from "./SciFiPanelDemo.module.css";

const presets = {
  蓝色原型: { armor: "#061e40", trim: "#247bce", energy: "#16cefa", accent: "#c07aff", highlight: "#b0efff", circuit: "#155582" },
  琥珀终端: { armor: "#30220e", trim: "#a97c30", energy: "#ffc654", accent: "#ff754f", highlight: "#fff0bc", circuit: "#80622c" },
  翡翠终端: { armor: "#072b27", trim: "#298579", energy: "#54edbd", accent: "#b7f173", highlight: "#d9fff1", circuit: "#206951" },
} satisfies Record<string, SciFiPanelColors>;
const labels: Record<keyof SciFiPanelColors, string> = {
  armor: "金属底板", trim: "边框描边", energy: "能量灯带", accent: "角部嵌件", highlight: "材质高光", circuit: "网格电路",
};

export function SciFiPanelDemo() {
  const [colors, setColors] = useState<SciFiPanelColors>(presets.蓝色原型);
  const [background, setBackground] = useState("#021426");
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(640);
  const [zoom, setZoom] = useState(1);
  const [texture, setTexture] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [count, setCount] = useState(0);
  const [stress, setStress] = useState(false);
  return (
    <div className={s.root}>
      <header className={s.heading}>
        <div><span className={s.eyebrow}>LUNA / COMPONENT LAB</span><h1>全息面板</h1><p>独立材质配色 · 弹性尺寸 · 原生内容布局</p></div>
        <span className={s.version}>PANEL / 01</span>
      </header>
      <div className={s.layout}>
        <aside className={s.controls} aria-label="面板设置">
          <h2>材质与外观</h2>
          <div className={s.presets}>{Object.entries(presets).map(([name, palette]) => <button type="button" key={name} onClick={() => setColors(palette)}>{name}</button>)}</div>
          {(Object.keys(labels) as (keyof SciFiPanelColors)[]).map(key => (
            <label className={s.color} key={key}><span>{labels[key]}</span><code>{colors[key]}</code><input aria-label={labels[key]} type="color" value={colors[key]} onChange={e => setColors({ ...colors, [key]: e.target.value })} /></label>
          ))}
          <label className={s.color}><span>内容背景</span><code>{background}</code><input aria-label="内容背景" type="color" value={background} onChange={e => setBackground(e.target.value)} /></label>
          <h2>尺寸与缩放</h2>
          <label className={s.range}>宽度 <output>{width} px</output><input aria-label="宽度" type="range" min="260" max="1500" step="10" value={width} onChange={e => setWidth(+e.target.value)} /></label>
          <label className={s.range}>高度 <output>{height} px</output><input aria-label="高度" type="range" min="200" max="1000" step="10" value={height} onChange={e => setHeight(+e.target.value)} /></label>
          <label className={s.range}>祖先 zoom <output>{Math.round(zoom * 100)}%</output><input aria-label="祖先 zoom" type="range" min="0.5" max="1.5" step="0.05" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
          <label className={s.toggle}><input type="checkbox" checked={texture} onChange={e => setTexture(e.target.checked)} />网格与电路纹理</label>
          <label className={s.toggle}><input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} />透明内容背景</label>
          <label className={s.toggle}><input type="checkbox" checked={showContent} onChange={e => setShowContent(e.target.checked)} />示例内容</label>
          <label className={s.toggle}><input type="checkbox" checked={stress} onChange={e => setStress(e.target.checked)} />展示 24 个面板</label>
          <details className={s.reference}><summary>查看原始素材</summary><img src={reference} alt="蓝色科幻面板原始素材" loading="lazy" /></details>
        </aside>
        <section className={s.preview} aria-label="面板预览">
          <div className={s.previewBar}><span>LIVE PREVIEW</span><span>{width} × {height} / {Math.round(zoom * 100)}%</span></div>
          <div className={s.viewport}>
            <div className={s.stage} style={{ zoom }}>
              <SciFiPanel width={width} height={height} colors={colors} background={transparent ? "transparent" : background} texture={texture} data-testid="demo-panel" aria-label="可调色面板">
                {showContent && <div className={s.sample}>
                  <div className={s.sampleHeader}><div><span className={s.eyebrow}>DEEP SPACE / SYSTEM ONLINE</span><h2>远航控制中心</h2></div><span className={s.status}>● 已连接</span></div>
                  <p>边框、内容与交互控件共享同一布局坐标系。调整左侧参数，预览不同材质与尺寸。</p>
                  <div className={s.metrics}>{[["航行距离", "28,640", "km"], ["核心能源", "98.6", "%"], ["信号延迟", "12", "ms"]].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>)}</div>
                  <div className={s.sampleSection}><span className={s.eyebrow}>MISSION LOG</span><h3>星际航线已就绪</h3><p>这部分是普通 React children，可放置表单、列表、卡牌或业务组件。缩小面板高度后，内容在框内滚动。</p></div>
                  <label className={s.field}>航线名称<input placeholder="输入航线名称，测试缩放下的表单" defaultValue="织女星 · 第七航道" /></label>
                  <div className={s.actions}><button type="button" onClick={() => setCount(count + 1)}>确认航线</button><span role="status">已确认 {count} 次</span></div>
                  <div className={s.log}>{["导航阵列自检完成", "能量回路稳定", "轨道参数同步完成", "等待舰长确认"].map((entry, index) => <div key={entry}><code>0{index + 1} / SYSTEM</code><span>{entry}</span><span>正常</span></div>)}</div>
                </div>}
              </SciFiPanel>
              {stress && <div className={s.stress}>{Array.from({ length: 24 }, (_, i) => <SciFiPanel key={i} width={300} height={200} padding={4} colors={colors} texture={texture} background={transparent ? "transparent" : background}><span className={s.eyebrow}>NODE / {String(i + 1).padStart(2, "0")}</span><p>航行系统在线</p></SciFiPanel>)}</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
