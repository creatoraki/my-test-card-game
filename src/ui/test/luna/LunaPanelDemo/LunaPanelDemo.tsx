import s from "./LunaPanelDemo.module.css";

/** Luna tab 的面板边框预览：只展示外轮廓、霓虹色和毛玻璃内容层。 */
export function LunaPanelDemo() {
  return (
    <section className={s.root} aria-label="露娜霓虹面板预览">
      <div className={s.frameDecor} aria-hidden="true">
        <span className={`${s.sideBorder} ${s.sideBorderLeft} ${s.sideBorderTop}`} />
        <span className={`${s.sideBorder} ${s.sideBorderLeft} ${s.sideBorderMiddle}`} />
        <span className={`${s.sideBorder} ${s.sideBorderLeft} ${s.sideBorderBottom}`} />
        <span className={`${s.sideBorder} ${s.sideBorderRight} ${s.sideBorderTop}`} />
        <span className={`${s.sideBorder} ${s.sideBorderRight} ${s.sideBorderMiddle}`} />
        <span className={`${s.sideBorder} ${s.sideBorderRight} ${s.sideBorderBottom}`} />
        <span className={`${s.bottomBlock} ${s.bottomBlockLeft}`} />
        <span className={`${s.bottomBlock} ${s.bottomBlockRight}`} />
      </div>
      <div className={s.frameGlow} aria-hidden="true" />
      <div className={s.frame} aria-hidden="true">
        <div className={s.glass} />
        <span className={s.tubeCore} />
      </div>
    </section>
  );
}
