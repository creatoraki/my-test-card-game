import { createSession } from "@/explore/session";
import type { BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { useExploreStore } from "@/store/explore/exploreStore";
import { partySnapshot } from "@/store/run/party";
import { freshProfile } from "@/store/town/townProfile";
import { useTownStore } from "@/store/town/townStore";

/** 正式服务直接操作 store；演示期间暂停落盘，退出时恢复原状态。 */
export function beginBlacksmithDemo(services: [BlacksmithService, BlacksmithService]): () => void {
  const originalTown = useTownStore.getState();
  const originalSession = useExploreStore.getState().session;
  const originalStorage = useTownStore.persist.getOptions().storage;
  useTownStore.persist.setOptions({ storage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  } });
  const restore = () => {
    useTownStore.setState(originalTown, true);
    useExploreStore.setState({ session: originalSession });
    useTownStore.persist.setOptions({ storage: originalStorage });
  };
  try {
    const profile = freshProfile(false);
    // 给删牌演示预留一张可删额度，避免初始卡组刚好卡住最低张数。
    for (const character of Object.values(profile.characters)) {
      character.minDeckSize = Math.max(1, character.deck.length - 1);
    }
    useTownStore.setState(profile);
    const session = createSession("neon-city", partySnapshot(), 20261007, [
      { uid: "锻造演示牛奶", itemId: "milk", count: 5 },
      { uid: "锻造演示面包", itemId: "bread", count: 5 },
    ]);
    if (!session.dungeon || !session.corridor) throw new Error("锻造师演示房间未生成");
    const room = session.dungeon.rooms[session.dungeon.currentRoomId];
    const object = { id: "演示锻造师", kind: "blacksmith" as const, x: 1200, used: false, level: 1 as const };
    room.curios = [{ ...object, blacksmith: { services, status: "available" } }];
    session.corridor.objects = [{ ...object, nodeIndex: 0 }];
    session.corridor.activeObjectId = object.id;
    session.landedIndex = 0;
    session.phase = "forging";
    useExploreStore.setState({ session });
  } catch (error) {
    restore();
    throw error;
  }
  return restore;
}
