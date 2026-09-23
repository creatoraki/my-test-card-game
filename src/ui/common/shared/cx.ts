// className 拼接 —— 全项目唯一的一个。
//
// CSS Modules 之后, 类名不再是字面量而是 s["xxx"] 查表结果, 于是原来那些
// `className={`a ${b ? "c" : ""}`}` 的模板串会变成一堆 s[...] 嵌套, 极难读。
// 这个函数把「拼接」和「按条件取舍」收成一件事:
//
//   className={cx(s["combatant"], dead && s["dead"], s[`intent-${kind}`])}
//
// ★ 故意不做 clsx 那套对象/数组语法 —— 少一种写法就少一处风格分歧。
// ⚠ 传进来的若是 undefined(拼错了类名, s["typo"] === undefined), 这里会静默丢掉。
//   排查「样式没生效」时先在 devtools 看元素上是不是少了一个哈希类名。
export const cx = (...v: (string | false | null | undefined)[]): string =>
  v.filter(Boolean).join(" ");
