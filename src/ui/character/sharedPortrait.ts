// 共享元素过场的「交接棒」—— 编队页 ↔ 角色详情页之间, 告诉即将挂载的那一页
// 「该给哪张卡挂 view-transition-name: vt-portrait」。
//
// ★ 为什么需要它: 转场靠 document.startViewTransition(), 而共享元素的配对完全由
//   **两侧同名的 view-transition-name** 决定。详情页只有一个立绘展示柜, name 可以写死在
//   CSS 里; 编队页却有一整排卡, 必须有人告诉它"这一程飞的是哪一位"。
//     去程(编队 → 详情): 点击时本页还挂载着, 用组件自己的 state 记下即可, 不经过本模块。
//     回程(详情 → 编队): 编队页是**新挂载**的, 没有任何上下文 ⇒ 由详情页在导航前存进这里,
//                        编队页挂载时取走。
//
// ⚠ 刻意**不进 store/runStore**: 与 ui/transitionOrigin.ts 同一条理由 —— 纯表现层的一次性
//   数据, 进 store 会被持久化, 且任何订阅者都要为一个只活半秒的值重渲染。
//
// ⚠⚠ 必须 take-once(取走即清): 留着不清的话, 下次点**别的**卡时会有两个元素同时叫
//   vt-portrait —— view-transition-name 全局唯一是硬规则, 撞名浏览器会直接放弃整次过场。

let pending: string | null = null;

/** 存: 导航前调用, 声明下一页要接手的是哪位角色。 */
export function setSharedPortrait(charId: string | null): void {
  pending = charId;
}

/** 取: 消费一次即清。没有待交接的角色时返回 null。 */
export function takeSharedPortrait(): string | null {
  const v = pending;
  pending = null;
  return v;
}
