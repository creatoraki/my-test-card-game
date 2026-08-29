// opus tab 的 demo: 「培育 / 成熟」两枚 BUFF 图标的陈列台。
//
// 这个文件只做「陈列」, 图标本体在 ../GrowthPlate, 两者互不知道对方的存在 ——
// 图标可以直接被正式 UI 引用, 不会把 demo 的排版带过去。
//
// 陈列只做两件事, 都是这两枚图标能不能上线的硬指标:
//   1. 层数角标: 培育的核心表达是"还剩几层", 角标压上去之后不能盖住芽尖/果心;
//   2. 尺寸阶梯: 缩到 20px 还能不能一眼分出幼芽和冠层(状态条里就是这个量级)。
import { GROWTH_SPECS } from "../GrowthPlate";
import { GrowthPlateCard } from "./parts/GrowthPlateCard";
import { GrowthSizeLadder } from "./parts/GrowthSizeLadder";
import s from "./OpusGrowthPlateDemo.module.css";

/** 培育态要展示的层数档位: 从满层数到即将归零。 */
const STACK_STEPS = [3, 2, 1] as const;

const [CULTIVATE, MATURE] = GROWTH_SPECS;

export function OpusGrowthPlateDemo() {
  return (
    <section className={s.root}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>OPUS / BUFF ICON STUDY</span>
          <h1>培育 · 成熟</h1>
          <p>
            同一株植物的前后两段：培育是破土的幼芽配未闭合的倒计时环，成熟是长成的冠层配满圈完成环。
            两枚共用地平线、中轴与外环刻度，差别只压在冠层形态与环的闭合度上。
          </p>
        </div>
        <div className={s.headerStamp}>
          <span>VECTOR PLATE</span>
          <strong>02 / 02</strong>
        </div>
      </header>

      {/* 主陈列: 两枚大图并排, 同规格外框, 一眼对比。 */}
      <div className={s.stage}>
        {GROWTH_SPECS.map((spec) => (
          <article key={spec.id} className={s.card}>
            <GrowthPlateCard spec={spec} corner={spec.code} />
            <div className={s.cardMeta}>
              <strong style={{ color: spec.accent }}>{spec.name}</strong>
              <p>{spec.note}</p>
            </div>
          </article>
        ))}
      </div>

      {/* 层数角标: 培育每回合减一层, 归零后就是成熟。 */}
      <section className={s.block}>
        <div className={s.blockHead}>
          <h2>层数角标</h2>
          <span>培育每回合 -1 层，归零后打出触发额外效果</span>
        </div>
        <div className={s.stackRow}>
          {STACK_STEPS.map((stack) => (
            <div key={stack} className={s.stackItem}>
              <GrowthPlateCard spec={CULTIVATE} size={92} stack={stack} />
              <small>剩余 {stack} 层</small>
            </div>
          ))}
          <span className={s.arrow} aria-hidden="true" />
          <div className={s.stackItem}>
            <GrowthPlateCard spec={MATURE} size={92} badge="完成" />
            <small>归零 · 成熟</small>
          </div>
        </div>
      </section>

      {/* 尺寸阶梯: 从展示图缩到状态条尺寸。 */}
      <section className={s.block}>
        <div className={s.blockHead}>
          <h2>多尺寸预览</h2>
          <span>40px 以下自动去掉网格与内发光，只看线框剪影</span>
        </div>
        <div className={s.ladder}>
          {GROWTH_SPECS.map((spec) => (
            <GrowthSizeLadder key={spec.id} spec={spec} />
          ))}
        </div>
      </section>
    </section>
  );
}
