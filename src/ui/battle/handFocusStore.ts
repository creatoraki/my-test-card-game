import { create } from "zustand";
import type { Card } from "../engine";

// ============================================================================
// 手牌悬停态: 一个只装一张卡的极小 store。
//
// ★ 存在的唯一理由是**性能**。它以前是 BattleScreen 的一个顶层 useState(hoveredUid),
//   于是鼠标每跨过一张手牌就有两次(mouseleave + mouseenter)顶层 setState ⇒ 整个 793 行的
//   BattleScreen 子树全量重渲染: 每个敌人 CombatantView、顶栏的一排法力水晶 SVG、时刻标尺、
//   队伍卡、十张结构复杂的 HandCard、右侧详情面板……全部重跑一遍 render + diff。
//   而这个值真正影响的只有**两处**: 右侧 CardInfoPanel 的内容, 与 AllyBar 里归属角色那一格
//   的高亮。把它挪出组件树后, 悬停只会重渲染这两个订阅方, 其余一律不动。
//
// ⚠ 它是**纯 UI 瞬态**, 不是游戏状态 —— 不进 src/store/(那里的东西要可序列化/可存档),
//   也绝不能进 BattleState。放在 ui/ 下, 与它服务的组件同级。
//
// ⚠ 存整个 Card 而不是 uid: 订阅方要的东西(ownerCharId / 名称 / 效果文本)卡上全有,
//   存 uid 的话它们还得各自拿 battle.cards 回查一次, 等于又把 battle 拖成了依赖。
// ============================================================================

interface HandFocusState {
  hovered: Card | null;
}

const useStore = create<HandFocusState>(() => ({ hovered: null }));

// 下面三个都是**模块级函数**(不是 hook): 引用天然恒定, 于是调用方(HandCard)既不需要订阅
// store, 也不需要 useCallback 去稳定它 —— 这正是 HandCard 能被 React.memo 挡住的前提。
export const setHandHover = (card: Card): void => useStore.setState({ hovered: card });

// ⚠ 只有「当前悬停的还是自己」才清空。鼠标快速划过一排卡时, 浏览器并不保证
//   A.mouseleave 一定早于 B.mouseenter 送达; 无条件清空会把刚点亮的 B 又抹掉,
//   表现为详情面板在滑动中一闪一闪地回到 STANDBY。(旧的 hoveredUid 实现就有这个竞态。)
// ⚠ 比的是 **uid 而不是对象同一性**: 引擎每次 commit 都会产出新的 BattleState, 手上同一张卡
//   在 battle.cards 里可能已换成一个新对象(见 BattleScreen 同步 renderHand 的 useEffect),
//   按引用比会漏判 ⇒ 悬停态永久卡住, 详情面板再也退不回 STANDBY。
export const clearHandHover = (card: Card): void =>
  useStore.setState((s) => (s.hovered?.uid === card.uid ? { hovered: null } : s));

// 无条件清空: 换战斗 / 进入换牌丢弃 / 开始播出牌分镜时用 —— 那些时刻手牌本就要被换掉,
// 留着上一张的详情是错的。
export const resetHandHover = (): void => useStore.setState({ hovered: null });

export const useHandHover = (): Card | null => useStore((s) => s.hovered);
