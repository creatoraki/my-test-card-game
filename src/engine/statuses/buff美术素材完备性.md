# 状态（buff / debuff）美术素材完备性

> 统计时间：2026-09-17
> 状态来源：`src/engine/statuses/index.ts` 汇总的 `STATUS_DEFS`
> 美术登记：`src/ui/art/statusArt.ts` 中的 `STATUS_ART`（新增美术只需在此登记，`StatusPips` 与 `HitFxLayer` 自动生效）
> 素材目录：`src/assets/buffs/`
> 未登记美术的状态会回退显示 `emoji`。

## 总览

| 项目 | 数量 |
| --- | --- |
| 状态总数 | 50（增益 36 / 减益 14） |
| 已登记美术 | 21 |
| 有素材但未登记 | 3（再生、荆棘、洞察） |
| 完全缺素材 | 26 |
| 额外：护盾（非状态） | 已登记（`SHIELD_ART`） |

图例：✅ 已登记　⚠️ 素材已存在但未登记　❌ 缺素材

## 明细

### 持续伤害 / 持续效果（`dot.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| poison | 中毒 | 减益 | ☠️ | ✅ | 中毒.png |
| burn | 灼烧 | 减益 | 🔥 | ✅ | dot/灼烧.png |
| regen | 再生 | 增益 | 💚 | ⚠️ | 再生.png |
| thorns | 荆棘 | 增益 | 🌵 | ⚠️ | 荆棘.png |
| vitality | 生机 | 增益 | 🌱 | ✅ | 生机.png |
| cactusCounterattack | 仙人掌 | 增益 | 🌵 | ✅ | 仙人掌.png |

### 通用增益（`buffs.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| starlight | 星辉 | 增益 | ✨ | ✅ | 星辉.png |
| ironwall | 铁壁 | 增益 | 🛡️ | ✅ | 铁壁.png |
| strength | 力量 | 增益 | 💪 | ✅ | 力量.png |
| overload | 过载 | 增益 | ☢️ | ✅ | 过载.png |
| rashomon | 罗生门 | 增益 | ⛩️ | ✅ | 罗生门.png |
| sharp | 锋利 | 增益 | 🗡️ | ✅ | 锋利.png |
| chargedShell | 充能外壳 | 增益 | 🔋 | ✅ | 充能外壳.png |
| retortWall | 反应釜壁 | 增益 | ⚗️ | ✅ | 反应釜壁.png |
| bountyHunter | 赏金猎人 | 增益 | 🎯 | ✅ | 赏金猎人.png |
| insight | 洞察 | 增益 | 👁️ | ⚠️ | 洞察.png |
| tequila | 龙舌兰 | 增益 | 🌵 | ✅ | 龙舌兰.png |
| taunt | 嘲讽 | 增益 | 💢 | ✅ | 嘲讽.png |

### 通用减益（`debuffs.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| weak | 虚弱 | 减益 | 💧 | ❌ | — |
| vulnerable | 易伤 | 减益 | 🎯 | ❌ | — |
| hunterMark | 猎人标记 | 减益 | 🔻 | ❌ | — |
| armorBreak | 破甲 | 减益 | 🩹 | ❌ | — |
| attackDown | 萎靡 | 减益 | 📉 | ❌ | — |
| aimed | 瞄准 | 减益 | 🎯 | ❌ | — |
| jam | 电磁干扰 | 减益 | 📶 | ❌ | — |

### 控制（`control.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| stun | 眩晕 | 减益 | 💫 | ❌ | — |

### 精算师（`actuary.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| insurance | 保险 | 增益 | 🧾 | ✅ | 保险.png |
| echo | 回响 | 增益 | 🔁 | ✅ | 回响.png |
| feignInjury | 假装受伤 | 增益 | 🎭 | ✅ | 假装受伤.png |
| deductible | 免赔 | 增益 | 📉 | ✅ | 免赔.png |

### 剑客（`swordsman.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| mirrorMoon | 镜月 | 增益 | 🌙 | ❌ | — |
| ironCloak | 铁衣 | 增益 | 🛡️ | ❌ | — |
| windCut | 风切 | 增益 | 🌪️ | ❌ | — |
| zanshin | 残心 | 增益 | 🫀 | ❌ | — |
| zanshinFocus | 残心·凝神 | 增益 | 🎯 | ❌ | — |
| yachiyo | 八千代 | 增益 | 🌸 | ❌ | — |

### 植物学家（`botanist.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| twinFlower | 双生花 | 增益 | 🌼 | ❌ | — |
| rootBond | 根系联结 | 增益 | 🌿 | ❌ | — |
| thornCrown | 棘冠 | 增益 | 👑 | ❌ | — |
| ivyThorn | 常春藤刺 | 增益 | 🍃 | ❌ | — |
| aimLock | 锚定瞄准 | 增益 | 🔒 | ❌ | — |

### 预言家（`prophet.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| zenithStar | 天顶星 | 增益 | 🌠 | ❌ | — |
| gravityLens | 引力透镜 | 增益 | 🔭 | ❌ | — |
| drift | 漂流 | 增益 | 🛟 | ❌ | — |

### 废弃楼层敌人（`abandonedFloor.ts`）

| id | 名称 | 类型 | 回退 emoji | 美术 | 素材文件 |
| --- | --- | --- | --- | --- | --- |
| static | 静电 | 减益 | ⚡ | ❌ | — |
| flammable | 易燃 | 减益 | 🧨 | ✅ | debuffs/易燃.png |
| scorched | 焦灼 | 减益 | 🌡️ | ✅ | debuffs/焦灼.png |
| salvageArmor | 回收装甲 | 增益 | 🛠️ | ❌ | — |
| escort | 护航 | 增益 | 🛡️ | ❌ | — |
| conductiveFilm | 导电薄膜 | 增益 | 🔌 | ❌ | — |

## 待处理事项

1. **素材已有、只差登记（3 个）**：`regen`（再生.png）、`thorns`（荆棘.png）、`insight`（洞察.png）。需要在 `statusArt.ts` 的 import、`STATUS_ART`、`STATUS_ART_SOURCES` 三处补上。
2. **目录中没有对应状态的素材（2 个）**：`不周山.png`、`坚固.png`。代码里找不到这两个名称，可能对应还没实现的状态，也可能是改名前的旧素材。
3. **完全缺素材（26 个）**：通用减益 7 个、控制 1 个、剑客 6 个、植物学家 5 个、预言家 3 个、废弃楼层 4 个。
4. **重复的回退 emoji**：🎯（赏金猎人 / 易伤 / 瞄准 / 残心·凝神）、🛡️（铁壁 / 铁衣 / 护航）、🌵（荆棘 / 仙人掌 / 龙舌兰）、📉（萎靡 / 免赔）。这些状态缺素材时，只看图标无法区分，建议优先补图。
5. `src/assets/buffs/dot/` 与 `src/assets/buffs/debuffs/` 已分别承载持续效果和废弃楼层减益的独立素材。
