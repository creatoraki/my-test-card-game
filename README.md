# 《霓虹都市》· 原型

一个网页版卡牌 Roguelite 原型：以时刻制（tick）战斗为核心，结合个人卡组改造、装备养成、区域路由探索和据点持久化。

世界观与已确认机制见 [`游戏设定.md`](/design/游戏设定.md)。具体代码职责不要从本文件展开，按任务读取 [`docs/code-map/README.md`](docs/code-map/README.md) 中对应的模块说明。

## 核心模块

- `engine/`：纯 TypeScript 战斗引擎，负责卡牌、伤害、状态、敌人排程和回合。
- `explore/`：纯 TypeScript 探索引擎，负责区域路由、节点事件、粒子、背包和远征阶段。
- `items/`：物品类型、容器、装备占格和掉落逻辑。
- `data/`：卡牌、角色、敌人、遭遇战、物品、事件和地图数据。
- `store/`：Zustand 状态层；城镇档案持久化，远征过程为临时状态。
- `ui/`：React 页面、组件、场景表现、动画和素材查表。
- `styles/`：全局样式、设计令牌和公共布局。

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 构建工具 | Vite 5 |
| UI 框架 | React 18 |
| 状态管理 | Zustand 4 |
| 语言 | TypeScript 5（严格模式） |
| 测试 | Vitest 2 |

## 运行方式

```bash
npm install
npm run dev
npm test
npm run test:watch
npm run preview
```

## 目录结构

```text
my-test-card-game/
├─ *.md                    # 世界观、系统设计与评审记录
├─ docs/code-map/          # 按模块拆分的代码职责说明
├─ scripts/                # 开发辅助脚本
└─ src/
   ├─ engine/              # 战斗引擎
   ├─ explore/             # 探索引擎
   ├─ items/               # 物品逻辑
   ├─ data/                # 内容数据
   ├─ store/               # 状态与持久化
   ├─ ui/                  # React 视图、表现与事件素材查表（含战斗裂纹过场）
   └─ styles/              # 公共样式
```

详细说明入口：[`docs/code-map/README.md`](docs/code-map/README.md)。
