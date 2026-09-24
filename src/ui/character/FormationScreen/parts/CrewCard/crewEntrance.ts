// 编队卡入场动画的时间轴 —— 唯一真相点在这里, CrewGrid 以 CSS 变量下发给 CrewCard.module.css。
// ★ TS 这边还要用它算「整片卡阵何时入场完毕」: 详情预热(DetailPrewarm)必须等到那之后才开工,
//   否则预热层那一整棵详情树的挂载与光栅化会正好压在入场动画上, 表现就是进页面时卡一下。

/** 单张卡的入场时长。 */
export const CREW_IN_MS = 420;
/** 第一张卡的起播延迟。 */
export const CREW_IN_DELAY_MS = 120;
/** 相邻两张卡的错峰间隔。 */
export const CREW_IN_STEP_MS = 55;

/** count 张卡全部入场完毕所需的时长(ms)。 */
export function crewEntranceMs(count: number): number {
  return CREW_IN_DELAY_MS + Math.max(0, count - 1) * CREW_IN_STEP_MS + CREW_IN_MS;
}

/** 下发给卡阵容器的 CSS 变量。 */
export const CREW_ENTRANCE_VARS = {
  "--crew-in-ms": `${CREW_IN_MS}ms`,
  "--crew-in-delay": `${CREW_IN_DELAY_MS}ms`,
  "--crew-in-step": `${CREW_IN_STEP_MS}ms`,
} as const;
