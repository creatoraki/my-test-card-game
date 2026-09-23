import s from "./DossierDecor.module.css";

/** 纯装饰层：左侧导轨、点阵、角部亮线、右上英文角标、左下水印。全部不接收指针。 */
export function DossierDecor() {
  return (
    <div className={s.decor} aria-hidden>
      <i className={s.dotGrid} />
      <i className={s.rail} />
      <i className={s.railBracket} />
      <i className={s.edgeTop} />
      <i className={s.edgeBottom} />
      <i className={s.midDots} />
      <i className={s.cornerBand} />
      <span className={s.ops}>NEXUS OPERATIONS <b>///</b></span>
      <svg className={s.mark} viewBox="0 0 92 90">
        <path d="M46 0 92 90H62L46 58 30 90H0Z" />
        <path d="M46 26 20 78h13l13-26Z" opacity="0.6" />
      </svg>
      <span className={s.motto}>STRONGER<br />TOMORROW<em>.</em></span>
      <i className={s.mottoRule} />
    </div>
  );
}
