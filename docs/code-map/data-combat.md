# 内容数据：战斗侧

路径：`src/data/`。这里只存可以替换的配置，计算逻辑放在 `engine/`、`explore/`、`items/`。所有内容都通过 [data/index.ts](../../src/data/index.ts) 的 getter 按 id 读取（`getCardDef`、`getCharacter`、`getEnemyDef`、`getEncounter`…）。地图和物品一侧见 [data-world.md](data-world.md)。

## 卡牌

| 文件 | 作用 |
| --- | --- |
| [cards.ts](../../src/data/cards/index.ts) | `CARD_DEFS` 的汇总入口。 |
| [basicCards.ts](../../src/data/cards/neutral/basicCards.ts) | 每个角色 3 张基础卡（攻击 / 治疗 / 护盾），以及统一的初始卡组。基础卡不进抽卡池，也不计入携带上限。 |
| [cards/swordsman/](../../src/data/cards/swordsman/index.ts) | 剑士：攻击、功能与防御、被动三张分表。 |
| [cards/prophet/](../../src/data/cards/prophet/index.ts) | 预言家：攻击、辅助、被动、临时卡。 |
| [cards/botanist/](../../src/data/cards/botanist/index.ts) | 植物学家：攻击、辅助、被动、临时卡。 |
| [cards/alchemist/](../../src/data/cards/alchemist/index.ts) | 炼金术士：攻击、防御、辅助、被动，另有组装奖励卡与 `ASSEMBLE_REWARD_POOLS`。 |
| [cards/actuary/](../../src/data/cards/actuary/index.ts) | 精算师：攻击、治疗、辅助、被动。 |
| [cards/neutral/](../../src/data/cards/neutral/index.ts) | 不属于任何角色的中立卡（废料弹片、眩晕锤）。 |

卡牌说明文字里用 `{0}` 这类占位符引用效果数值，由 `engine/cards/cardText.ts` 渲染。被动卡没有费用、不能打出，持在手中时按事件自动生效。

## 角色

| 文件 | 作用 |
| --- | --- |
| [characters.ts](../../src/data/roster/characters.ts) | 5 名角色：主题色、固定的基础属性面板（没有等级）、初始卡组、按稀有度分档的个人抽卡池。长期成长只来自装备和卡组锻造。 |

## 敌人与遭遇战

| 文件 | 作用 |
| --- | --- |
| [enemies/index.ts](../../src/data/enemies/index.ts) | 敌人注册表 `ENEMIES`，汇总小怪、宝箱怪、精英、首领和生态方舟敌人。 |
| [enemies/types.ts](../../src/data/enemies/types.ts) | `EnemyDef` / `EnemyMove`：属性、招式、蓄力时刻、权重、目标偏好、每回合行动上限、击杀经验、掉落表、胜利奖励表。 |
| [enemies/minions/](../../src/data/enemies/minions/index.ts) | 废弃楼层的 5 种小怪（维修蜘蛛、清扫无人机、玻璃水母、红绿灯机器人、收音机机器人）；公共掉落在 `shared.ts`。 |
| [enemies/elites.ts](../../src/data/enemies/floor/elites.ts) / [enemies/boss.ts](../../src/data/enemies/floor/boss.ts) | 废弃楼层的精英和首领。⚠ 掉落表目前只服务废弃楼层；新增地区时要改成“档位 × 地区”两个维度。 |
| [enemies/mimics.ts](../../src/data/enemies/floor/mimics.ts) | 宝箱怪：只有自保招式，到点离场，必掉装备箱或卡牌候选。 |
| [enemies/ecoArk/](../../src/data/enemies/ecoArk/minions.ts) | 生态方舟的小怪、精英、首领和公共掉落。 |
| [encounters.ts](../../src/data/encounters/index.ts) + [encounters/ecoArk.ts](../../src/data/encounters/ecoArk.ts) | 遭遇战编成：敌人 id 与站位（站位只用于战斗画面取景）。 |

⚠ 敌人的基础命中和基础格挡不写在数据里，由 `engine/combat/stats.ts` 在建局时统一注入；数据里写的同名属性会在这个基础上累加。

## 卡牌模组与羁绊

| 文件 | 作用 |
| --- | --- |
| [cardModules/index.ts](../../src/data/cardModules/index.ts) | 卡牌模组注册表，包含装配判定 `canEquipModule` 和幂等重算 `recomputeCardModule`。⚠ 它与 `data/index.ts` 互相引用。 |
| [cardModules/character.ts](../../src/data/cardModules/character.ts) | 角色关键词模组：在研究中心制造，只能装到非制造者角色的卡上。 |
| [cardModules/genericT1.ts](../../src/data/cardModules/genericT1.ts) | 1 阶通用模组：只能从战斗掉落，只看卡牌的结构条件。 |
| [moduleCrafting.ts](../../src/data/crafting/moduleCrafting.ts) | 模组制造配方：消耗角色经验和仓库材料，并提供制造前的检查。 |
| [bonds.ts](../../src/data/roster/bonds.ts) | 羁绊：由上阵队伍 9 个装备槽上的羁绊标签驱动的全队加成，包括分级、重铸和激活计算。 |
| [squadTalents.ts](../../src/data/roster/squadTalents.ts) | 小队徽章和天赋节点图：路径、花费、激活与退还的判定（训练室的数据真相点）。 |
