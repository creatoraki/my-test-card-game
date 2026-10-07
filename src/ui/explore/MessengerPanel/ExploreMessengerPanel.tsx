import type { ExploreState } from "@/explore/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { MessengerPanel } from "./MessengerPanel";

/** 信使交互独立呈现，关闭或投递后直接结束本次交互。 */
export function ExploreMessengerPanel({ session }: { session: ExploreState }) {
  const shipHome = useExploreStore((state) => state.shipHome);
  const confirmNode = useExploreStore((state) => state.confirmNode);

  return <MessengerPanel
    backpack={session.backpack}
    shipped={session.shipped}
    onClose={confirmNode}
    onSend={(uids, food) => {
      shipHome(uids, food);
      if (!useExploreStore.getState().session?.chuteOpen) confirmNode();
    }}
  />;
}
