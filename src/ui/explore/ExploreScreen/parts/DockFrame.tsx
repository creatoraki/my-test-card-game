import s from "./DockFrame.module.css";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/** 底部 HUD 的装饰外壳：底纹材质、顶/底灯带与漏光、内框线、四角护角、边框上的指示灯。
 *  纯装饰层，铺满 .dock 且压在内容之下，不吃任何事件。 */
export function DockFrame() {
  return <div className={s.frame} aria-hidden="true">
    <span className={s.material} />
    <span className={s.innerLine} />
    <span className={s.lightTop} />
    <span className={s.lightBottom} />
    {CORNERS.map((at) => <span key={at} className={s.corner} data-at={at} />)}
    <span className={s.leds} data-at="left"><i /><i /><i /></span>
    <span className={s.leds} data-at="right"><i /><i /><i /></span>
  </div>;
}
