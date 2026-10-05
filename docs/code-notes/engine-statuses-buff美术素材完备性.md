# 状态与卡牌增益美术素材完备性

> 2026-10-05 目录整理：素材现按实际机制细分，目录规则见 [素材目录说明](../../src/assets/buffs/README.md)。痛楚归入持续伤害；敌方标记、卡牌标记、培育、组装与药剂各自独立。下方数量和缺失表是原统计日期的历史快照。

> 统计时间：2026-09-29  
> 战斗状态来源：`src/engine/statuses/index.ts` 汇总的 `STATUS_DEFS`，包括由预言定义动态生成的状态。  
> 状态美术登记：`src/ui/art/battle/statusArt.ts` 中的 `STATUS_ART`；未登记状态在战斗状态栏回退显示定义里的 emoji。  
> 非状态增益登记：`src/ui/art/battle/buffArt.ts`（培育、组装部件、魔药）；护盾素材也由 `statusArt.ts` 导出。  
> 卡牌标记来源：`src/engine/cards/cardMarks.ts`；手牌标记由 `src/ui/common/card/HandCard/parts/CardMarks.tsx` 显示。

## 统计

| 范围 | 总数 | 已有专属图像素材 | 缺少专属图像素材 |
| --- | ---: | ---: | ---: |
| 战斗增益状态 | 50 | 20 | **30** |
| 战斗减益状态 | 17 | 11 | **6** |
| 战斗状态合计 | **67** | **31** | **36** |
| 卡牌标记 / 卡牌附加效果 | 11 | 0 | **11** |

卡牌标记使用 emoji 字符绘制，不视为项目专属图像素材。若把战斗增益状态和卡牌标记合并看，当前有 **41 个增益或卡牌标记 ID 没有专属图像素材**；减益另有 6 个。

素材目录 `src/assets/buffs/` 当前有 39 个文件：38 个由状态或非状态增益登记/预加载，另有 1 张未使用的备用护盾图。当前没有与有效状态对应、但遗漏在 `STATUS_ART` 外的素材。护盾不是 `STATUS_DEFS` 状态，不计入 67 个状态。

## 缺少素材的战斗增益状态（30）

| 定义来源 | id | 名称 | emoji 回退 |
| --- | --- | --- | --- |
| `swordsman.ts` | `mirrorMoon` | 镜月 | 🌙 |
| `swordsman.ts` | `ironCloak` | 铁衣 | 🛡️ |
| `swordsman.ts` | `windCut` | 风切 | 🌪️ |
| `swordsman.ts` | `zanshin` | 残心 | 🫀 |
| `swordsman.ts` | `zanshinFocus` | 残心·凝神 | 🎯 |
| `swordsman.ts` | `yachiyo` | 八千代 | 🌸 |
| `botanist.ts` | `thornCrown` | 棘冠 | 👑 |
| `botanist.ts` | `halfDraw` | 半熟保鲜 | 🥭 |
| `botanist.ts` | `agaveBloom` | 龙舌花信 | 🌺 |
| `botanist.ts` | `debuffImmune` | 免疫 | 🛡️ |
| `botanist.ts` | `rootNetwork` | 根系网络 | 🌿 |
| `botanist.ts` | `pollen` | 花粉 | 🌼 |
| `botanist.ts` | `bloom` | 盛放 | 🌸 |
| `botanist.ts` | `myceliumWeb` | 菌丝网络 | 🍄 |
| `prophet.ts` | `zenithStar` | 天顶星 | 🌠 |
| `prophet.ts` | `gravityLens` | 引力透镜 | 🔭 |
| `prophet.ts` | `drift` | 漂流 | 🛟 |
| `prophet.ts` | `milkyWay` | 银河 | 🌌 |
| `prophet.ts` | `cascade` | 倒泻 | 🌊 |
| `prophecy.ts` | `prophecyGoodOmen` | 预言·吉兆 | 🍀 |
| `prophecy.ts` | `prophecyOmen` | 预言·预兆 | 🔮 |
| `prophecy.ts` | `prophecyIllOmen` | 预言·凶兆 | 🦉 |
| `prophecy.ts` | `prophecyApocalypse` | 预言·天启 | 📯 |
| `abandonedFloor.ts` | `salvageArmor` | 回收装甲 | 🛠️ |
| `abandonedFloor.ts` | `escort` | 护航 | 🛡️ |
| `abandonedFloor.ts` | `conductiveFilm` | 导电薄膜 | 🔌 |
| `alchemist.ts` | `emberWall` | 余烬护壁 | 🔥 |
| `alchemist.ts` | `quench` | 淬火 | 🗡️ |
| `alchemist.ts` | `philosophersStone` | 贤者之石 | 💎 |
| `alchemist.ts` | `ouroboros` | 衔尾蛇 | 🐍 |

## 缺少素材的战斗减益状态（6）

| 定义来源 | id | 名称 | emoji 回退 |
| --- | --- | --- | --- |
| `control.ts` | `stun` | 眩晕 | 💫 |
| `botanistFoe.ts` | `insectTrap` | 捕虫夹 | 🪤 |
| `botanistFoe.ts` | `slow` | 迟滞 | 🐌 |
| `prophecy.ts` | `illOmen` | 凶兆 | 🦉 |
| `abandonedFloor.ts` | `static` | 静电 | ⚡ |
| `alchemist.ts` | `etch` | 蚀刻 | 🧪 |

其余 20 个增益状态和 11 个减益状态均已登记图像素材。注意 `prophecyIllOmen`（预言家身上的增益“预言·凶兆”）与 `illOmen`（敌人身上的减益“凶兆”）是两个不同状态，目前两者都没有专属素材。

## 卡牌自身的增益与标记

### 卡牌标记（11 项均无独立图像素材）

`CARD_MARK_DEFS` 定义的标记在手牌和牌堆卡面上显示 emoji；代码没有为这些标记登记单独的图片素材。

| id | 名称 | 当前显示 |
| --- | --- | --- |
| `starPact` | 星契 | 🌟 |
| `mindsEye` | 心眼 | 👁️ |
| `heavy` | 沉重 | 🪨 |
| `scorching` | 灼热 | 🔥 |
| `countercurrent` | 逆流 | 🌀 |
| `domino` | 多米诺 | 🁢 |
| `cometTail` | 彗尾 | ☄️ |
| `streamer` | 流光 | 💫 |
| `swordMound` | 剑冢 | 🪦 |
| `divineSight` | 神眼 | 👁️ |
| `noto` | 纳刀 | ⚔️ |

卡牌标记可能改变卡牌费用、打出效果或所属者，不全是正向效果；这里按“卡牌自身的增益/附加标记”一并统计。若标记效果给角色施加了战斗状态，该状态图标仍按前面的 `STATUS_DEFS` / `STATUS_ART` 口径统计，不重复计数。例如“灼热”施加的灼烧状态已有素材，但“灼热”标记自身没有独立图片。

### 卡牌上的进度与激活提示

| 效果 | 当前表现 | 专属素材情况 |
| --- | --- | --- |
| 培育 / 嫁接 | 生长阶段使用 `培育.webp`；成熟徽记使用组件绘制的图形；嫁接沿用培育提示 | 已有培育素材；嫁接没有独立素材 |
| 共鸣强化 | 卡面直接显示“共鸣 +次数” | 没有独立图标素材 |
| 卡牌激活收益 | `cardBoon.ts` 计算培育就绪、降费、应星支付、共鸣、自身层数、瀑布、计数器和条件等激活原因；卡牌统一显示激活辉光 | 共用卡牌激活效果，没有按原因区分的图标素材；不属于额外战斗状态 ID |

卡牌效果对角色施加的 BUFF 并非卡牌标记：它们已经包含在 67 个战斗状态的统计中。卡牌侧目前确实存在 11 个无独立素材的标记，以及 1 种使用通用激活辉光的提示机制。

## 已有素材但不属于缺失状态

| 项目 | 素材 / 登记 | 说明 |
| --- | --- | --- |
| 护盾 | `src/assets/buffs/战斗/护盾/护盾.webp`，由 `SHIELD_ART` 导出 | 护盾不是状态定义，不计入状态总数；`src/assets/buffs/备选/护盾.webp` 是未使用的备用图。 |
| 培育 | `src/assets/buffs/标记/培育/培育.webp`，由 `BUFF_ART.cultivate` 登记 | 卡牌培育标记使用。 |
| 组装 A-D | `src/assets/buffs/部件/组装/组装A.webp` 至 `组装D.webp`，由 `BUFF_ART` 登记 | 用于组装部件展示。 |
| 魔药 | `src/assets/buffs/道具/药剂/魔药.webp`，由 `BUFF_ART.potion` 登记并预加载 | 非状态素材；不计入状态图标统计。 |

## 统计口径与维护入口

1. 状态清单取自 `STATUS_DEFS`，包括由 `PROPHECY_LIST` 生成的 4 个预言状态；凶兆标记状态 `illOmen` 另计 1 个减益。
2. 状态只有同时存在于 `STATUS_ART` 并引用素材文件，才算“已有专属图像素材”。emoji 是无素材时的回退显示，不计为图像素材。
3. 新增状态图标在 `src/ui/art/battle/statusArt.ts` 登记，素材放在 `src/assets/buffs/` 对应目录；`StatusPips` 与 `HitFxLayer` 会读取同一登记表。
4. 非状态素材在 `src/ui/art/battle/buffArt.ts` 登记；卡牌标记目前由 `CARD_MARK_DEFS` 提供 emoji，尚无独立卡牌标记图集。
