# 未引用 PNG 素材清单

> 盘点日期：2026-10-10

项目规定运行时素材一律使用 WebP。下面这些 PNG 目前**没有被任何代码引用**（已检查静态 import、CSS `url()` 和 `import.meta.glob`），也**没有同名 WebP**。暂不处理，只做登记。

**接入代码前必须先转成 WebP**，不要直接 import 这里的 `.png`。转换参数可参照 `scripts/` 下现有的 `convert-*.mjs` / `process-*.mjs` 脚本。

## 技能卡面 `src/assets/skills/`

| 文件 | 大小 |
|---|---|
| `swordsman/不周山.png` | 583 KB |
| `swordsman/云隐.png` | 591 KB |
| `swordsman/幻陇.png` | 638 KB |
| `swordsman/止水.png` | 598 KB |
| `swordsman/萤火.png` | 586 KB |
| `swordsman/蜂群.png` | 614 KB |
| `alchemist/备用1.png` | 772 KB |
| `alchemist/无限财宝.png` | 764 KB |
| `alchemist/溶解替身.png` | 745 KB |

## 敌人立绘 `src/assets/敌人立绘/`

| 文件 | 大小 |
|---|---|
| `废壳电蜗/idle.png` | 1.3 MB |
| `漏电巡检球/idle.png` | 1.5 MB |
| `破壳电缆虫/idle.png` | 1.1 MB |
| `备选/磁索吞噬兽/idle.png` | 2.5 MB |
| `备选/磁轨犀王/idle.png` | 2.5 MB |
| `备选/裂壳蓄能蜗/idle.png` | 2.4 MB |
| `备选/锈潮壁垒蟹/idle.png` | 2.5 MB |
| `备选/锈蚀花冠兽/idle.png` | 2.7 MB |

## 场景 `src/assets/场景/`

| 文件 | 大小 |
|---|---|
| `霓虹街区.png` | 3.1 MB |

## 工作流原稿 `src/assets/test-screen/工作流/`

| 文件 | 大小 | 备注 |
|---|---|---|
| `生态方舟_平台路面_厚20px_底部留空50px.png` | 79 KB | 《生态方舟_建筑路面生成与无缝拼接工作流.md》的编辑原稿，作为工作流输入保留 PNG |
