// 远征途中的模组操作 —— 背包里的模组随时装载、模组箱原地开箱。
//
// ★ 卡组是城镇侧的持久数据, 装配本身走 townStore.replaceModuleStack(唯一校验点);
//   这里只负责探索会话这一半: 把新模组从背包扣掉、把顶下来的旧模组放回原格。
// ⚠ 与 curioActions 同样是 store 外的纯函数编排, 不再往 exploreStore 里塞。

import { canOpenBackpack, useItem, type ItemUseResult } from "@/explore/session";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "./exploreStore";
import { useTownStore } from "../town/townStore";

/**
 * 背包里的模组 → 卡牌。允许顶替: 旧模组**原位**回到这一格(新模组离开、旧模组进来, 净 0 格)。
 * 成功返回 true; 阶段不允许 / 条件不符时不做任何改动。
 */
export function installBackpackModule(uid: string, charId: string, cardUid: string): boolean {
  const session = useExploreStore.getState().session;
  if (!session || !canOpenBackpack(session)) return false;
  const stack = session.backpack.find((entry) => entry.uid === uid);
  if (!stack || getItemDef(stack.itemId).category !== "module") return false;

  const result = useTownStore.getState().replaceModuleStack(charId, cardUid, stack);
  if (!result) return false;
  const { replaced } = result;
  useExploreStore.setState({
    session: {
      ...session,
      backpack: replaced
        ? session.backpack.map((entry) => (entry.uid === uid ? replaced : entry))
        : session.backpack.filter((entry) => entry.uid !== uid),
    },
  });
  return true;
}

export interface CrateOpenResult {
  message: string;
  opened: ItemStack;
}

/** 背包里的模组箱原地开箱。返回展示文案与开出的那件(已放进箱子那一格), 用不了返回 null。 */
export function openBackpackCrate(uid: string): CrateOpenResult | null {
  const session = useExploreStore.getState().session;
  if (!session) return null;
  const draft = structuredClone(session);
  const result: ItemUseResult | null = useItem(draft, uid);
  if (!result?.opened) return null;
  useExploreStore.setState({ session: draft });
  return { message: `${result.itemName} · ${result.note}`, opened: result.opened };
}
