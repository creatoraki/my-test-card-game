// 羁绊的类型定义 —— 数据表、系别与界面共用。
// 《羁绊重构设计文档》: 羁绊是规则型的全队构筑, 每一档改变一条战斗规则, 不再给纯属性加成。
// 引擎只认识「羁绊 id + 达到的档位」, 具体行为在 engine/bonds 下按 id 注册。

import type { SquadResourceMods } from "@/engine/types";

/** 六个系别: 定向重铸与地图掉落偏向都按系别工作。 */
export type BondFamily = "blade" | "bulwark" | "chrono" | "flow" | "etch" | "karma";

export interface BondTier {
  count: number; // 激活门槛(羁绊点数)
  desc: string; // 本档效果全文(UI 文案)
  // 全队只叠一份的资源项(抽牌、法力、待机次数), 开战时并入小队资源修正。
  squadMods?: Partial<SquadResourceMods>;
}

export interface BondDef {
  id: string;
  name: string; // 塔罗牌名, 同时就是羁绊名
  title: string; // 意象副标题, 如「驯狮」
  arcana: string; // 大阿尔卡那编号(纯展示)
  family: BondFamily;
  desc: string; // 主题一句话
  // 羁绊主题色: 同系同色相、系内分明度; BondTag 色签 / 悬浮卡强调色都读这一份。
  color: string;
  tiers: BondTier[]; // 由低到高, activeBonds 取达到的最高档
}
