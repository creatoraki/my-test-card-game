import { useState } from "react";
import { ARROW_DEMOS, FxDemo } from "@/dev/FxDemo";
import s from "./TestScreen.module.css";

// 测试页: 仅开发环境通过 ?page=test 进入。当前挂载弓箭攻击特效的分页演示。
export function TestScreen() {
  const [activeId, setActiveId] = useState(ARROW_DEMOS[0].id);
  const active = ARROW_DEMOS.find((fx) => fx.id === activeId) ?? ARROW_DEMOS[0];

  return (
    <main className={s.root}>
      <nav className={s.tabs} aria-label="特效演示分页">
        {ARROW_DEMOS.map((fx) => (
          <button
            key={fx.id}
            type="button"
            className={fx.id === active.id ? s.activeTab : undefined}
            aria-current={fx.id === active.id ? "page" : undefined}
            onClick={() => setActiveId(fx.id)}
          >
            {fx.name}
          </button>
        ))}
      </nav>
      <section className={s.page} key={active.id} aria-label={`${active.name}演示`}>
        <FxDemo fx={active} />
      </section>
    </main>
  );
}
