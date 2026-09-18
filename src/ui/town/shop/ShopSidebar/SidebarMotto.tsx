import s from "./ShopSidebar.module.css";

const LINES = ["HUMANITY", "STILL SEEKS", "A TOMORROW."];

/** 底栏中下部的装饰标语：警示三角 + 三行箭头前缀英文。 */
export function SidebarMotto() {
  return (
    <div className={s.motto}>
      <svg className={s.mottoIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 1.5h14M2.5 15h11L8 4.5Z" stroke="var(--rail-accent, #ff3b4e)" strokeWidth="1.2" strokeLinejoin="miter" />
        <path d="M8 9v2.5" stroke="var(--rail-accent, #ff3b4e)" strokeWidth="1.4" />
      </svg>
      <ul className={s.mottoLines}>
        {LINES.map((line, index) => (
          <li key={line}>
            <span className={s.mottoArrow}>›</span>
            {line}
            {index === 0 && <i className={s.mottoMark} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
