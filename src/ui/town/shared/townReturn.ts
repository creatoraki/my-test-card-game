// 「回据点要补播反向换场」的一次性标记 —— 纯表现层数据: 不进 store, 也不参与存档。
//
// 背景: 据点全景里有的建筑通到的是**顶层全屏页**(如队员宿舍 → 编队页), 不是设施内场景。
// 顶层页切回 town 时 TownScreen 是全新挂载的, 天然停在 idle(全景 + HUD 都在场), 那段
// 「像素块铺回全景 + HUD 依次飞回」的反向演出就没机会播。故由离开方在切页前登记一下,
// TownScreen 挂载时读到它, 就把自己的初始状态摆成「演出中途」再往下播完。
//
// ⚠ 刻意拆成 peek + clear 两步(而不是 transitionOrigin 那样的一次性 take): TownScreen 要在
//   useState 初值里读它, 而 main.tsx 开着 React.StrictMode —— 初值函数会被调用两次,
//   一次性的 take 会让第二次读成 null。消费统一放在挂载 effect 里。

let pending: string | null = null;

/** 顶层页返回据点前登记: facility 与 stationBuildings 里的绑定值一致(如 "formation")。 */
export function markTownReturn(facility: string): void {
  pending = facility;
}

/** 只读, 不消费 —— 供 useState 初值使用。 */
export function peekTownReturn(): string | null {
  return pending;
}

/** 消费掉标记, 免得下一次进据点误播一遍反向演出。 */
export function clearTownReturn(): void {
  pending = null;
}
