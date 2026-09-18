// 左侧信息条底栏：全高半透明玻璃底板 + 左上侧挂板 + 中下部标语。
// 铭牌、导航、返回按钮各自绝对定位叠在它上面；颜色走 --rail-* 变量。
import { SidebarMotto } from "./SidebarMotto";
import s from "./ShopSidebar.module.css";

export function ShopSidebar() {
  return (
    <div className={s.sidebar} aria-hidden="true">
      <div className={s.panel} />
      <svg className={s.corner} width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M1.5 0V2L26 26.5H28" stroke="var(--rail-line, #ffffff1f)" />
      </svg>
      <svg className={s.tab} width="16" height="88" viewBox="0 0 16 88" fill="none">
        <path d="M3 8 11 2V86L3 80Z" fill="#c9c4c5" fillOpacity=".16" />
        <path d="M11 2V86" stroke="#e6e0e1" strokeOpacity=".45" />
        <path d="M11 0V7M11 81V88" stroke="var(--rail-accent, #ff3b4e)" strokeWidth="2" />
        <path d="M11 0V7M11 81V88" stroke="var(--rail-accent, #ff3b4e)" strokeWidth="5" opacity=".45" className={s.blur} />
      </svg>
      <SidebarMotto />
    </div>
  );
}
