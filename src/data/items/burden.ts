import type { ItemDef } from "../../items/types";

export const BURDEN_ITEM_DEFS: ItemDef[] = [
  {
    id: "heavy-burden",
    name: "沉重的负担",
    category: "material",
    rarity: "common",
    desc: "被旧系统强行挂上背包的配重件。锁扣已经熔死，远征途中卸不下来。",
    maxStack: 1,
    icon: "material",
    undroppable: true,
  },
];