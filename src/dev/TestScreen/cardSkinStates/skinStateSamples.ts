// 卡牌皮肤状态对照的样本表: 每条 = 一种老手牌卡面的特殊态 + 新皮肤(三选一卡面)对应的新版。
// 只在 ?page=test 的测试页使用; 卡牌每次切换都重新实例化, 不写入任何存档。
import { makeCard } from "@/data";
import type { Card } from "@/engine";
import type { PickCardExit } from "@/ui/common/card/CardRewardPicker";

export interface SkinSampleProps {
  playable?: boolean;
  activated?: boolean;
  /** 生效费用相对卡面原费用的差值(激活态演示「费用被压低」)。 */
  costDelta?: number;
  starPay?: number;
  rootRelease?: boolean;
}

export interface SkinSample {
  id: string;
  group: string;
  label: string;
  oldNote: string;
  newNote: string;
  build: () => Card;
  props?: SkinSampleProps;
  /** 强制交互态为选中(选中态样本)。 */
  selected?: boolean;
  /** 离场演出样本: 循环播放。 */
  exit?: PickCardExit;
}

const card = (id: string, patch: Partial<Card> = {}) => () => Object.assign(makeCard(id), patch);

export const SKIN_SAMPLES: readonly SkinSample[] = [
  {
    id: "common", group: "稀有度与卡型", label: "普通",
    build: card("snowflake"),
    oldNote: "蚀刻黑钢卡面, 无蚀刻纹; 三层棱为中性冷灰。",
    newNote: "冷灰蓝钢框 + 卡口钢螺丝, 即三选一设计稿原样。",
  },
  {
    id: "uncommon", group: "稀有度与卡型", label: "罕见",
    build: card("kagutsuchi"),
    oldNote: "卡底叠 45° 交叉细蚀刻网(7px), 只在配图外的金属面可见。",
    newNote: "钢框转回火蓝钢(明显偏蓝, 与普通卡拉开) + 6px 斜蚀刻纹 + 天蓝内缘倒角, 卡口螺丝换成蓝钢菱形宝石。",
  },
  {
    id: "rare", group: "稀有度与卡型", label: "稀有",
    build: card("sword-mound"),
    oldNote: "更密的 5px 蚀刻网 + 斜向宽蚀刻带; 边棱抛光提亮; 两个斜口内侧各铆一块角板。",
    newNote: "钢框抛光成香槟银 + 4px 密蚀刻纹 + 金色内缘倒角, 卡口嵌金色宝石, 左上/右下斜口加金色角板。",
  },
  {
    id: "fast", group: "稀有度与卡型", label: "速攻",
    build: card("falling-sakura"),
    oldNote: "费用水晶换琥珀色辉光(普通卡为荧光黄绿)。",
    newNote: "华丽宝石换橙→青柠配色, 数字描边换深棕(新皮肤原生支持)。",
  },
  {
    id: "passive", group: "稀有度与卡型", label: "被动",
    build: card("whetstone"),
    oldNote: "费用水晶换成 13px 刻字小钢牌「被动」; 边棱压成低饱和并加一道常亮内描边。",
    newNote: "宝石位换成银框深蓝铭牌「被动」(24px); 钢框转石板蓝 + 常亮浅蓝内缘, 不压暗。",
  },
  {
    id: "unplayable", group: "战斗状态", label: "打不出",
    build: card("snowflake"), props: { playable: false },
    oldNote: "整卡 opacity .55, 三层棱塌成一层暗棱, 卡厚减半 —— 读作「断电贴死在基座上」。",
    newNote: "整卡压暗去色但保持不透明(不透出背景), 钢框与线稿同步断电压暗。",
  },
  {
    id: "upgraded", group: "战斗状态", label: "已升级",
    build: () => makeCard("snowflake", true),
    oldNote: "左上费用徽章下方两道短斜凿痕 + 卡名加亮加粗。",
    newNote: "卡名压条右端金色双箭头 + 配图/说明分界线转金(凿痕会被大宝石压住, 故改位)。",
  },
  {
    id: "contaminated", group: "战斗状态", label: "污染",
    build: card("snowflake", { contaminated: true }),
    oldNote: "边棱沿环自左上暗锈到右下亮红; 四角红色污渍 + 自卡边长出的裂缝; 右上病毒符号; 说明区转暗红; 归属竖标转红。",
    newNote: "钢框整圈锈红腐蚀 + 横穿钢框的裂缝与锈点; 卡内污渍/裂缝/暗红说明区沿用; 病毒符号进右上徽记列的红框插槽。",
  },
  {
    id: "activated", group: "战斗状态", label: "激活(额外收益)",
    build: card("snowflake"), props: { activated: true, costDelta: -1 },
    oldNote: "通电青白边棱 + 卡外呼吸辉光与脉冲波 + 轮廓跑动流光 + 卡内能量扫掠 + 整卡呼吸 + 费用水晶能量环。",
    newNote: "钢框转电青通电色 + 两道沿钢框外缘跑动的流光与呼吸外缘; 卡外辉光改新卡形; 扫掠与宝石能量环沿用; 整卡(含钢框)一起呼吸。",
  },
  {
    id: "selected", group: "战斗状态", label: "选中", selected: true,
    build: card("snowflake"),
    oldNote: "整张抬高 60px + 卡厚加到 8px + 整圈抛光亮棱 + 卡底提亮 + 一次表面反光扫过。",
    newNote: "钢框转暗紫金属 + 紫色霓虹选中框呼吸(设计稿原样), 并补上老卡面的一次表面反光扫过。",
  },
  {
    id: "rooted", group: "战斗状态", label: "缠根",
    build: card("snowflake", { rooted: true }), props: { playable: false, rootRelease: true },
    oldNote: "整卡平铺斜向藤纹 + 绿雾, 中间「缠根」小框与「解缠 · 1 水晶」按钮。",
    newNote: "藤蔓缠绕在钢框左右与底边, 钢框转苔绿; 卡面罩苔绿暗雾 + 居中解缠按钮; 「缠根」标识(借用「根深」图标)排在卡外左上标记行; 同时按打不出压暗。",
  },
  {
    id: "module", group: "角标", label: "已装模组",
    build: card("snowflake", { cardModule: { uid: "demo-module", itemId: "rush-module" } }),
    oldNote: "右上 44px 斜切小方框装模组图标(新钢框右上角板会把它压住)。",
    newNote: "进右上徽记列: 52px 银框深蓝镶嵌插槽, 悬停浮出模组释义。",
  },
  {
    id: "marks", group: "角标", label: "卡牌标记",
    build: card("snowflake", { marks: ["mindsEye", "scorching"] }),
    oldNote: "手牌里是卡顶上方一排 40px 毛玻璃图标(悬停释义); 牌堆里是卡内右上 30px 小方块。",
    newNote: "回到卡外左上(同老手牌落位), 每个标记一格 52px 镶嵌插槽, 悬停向上浮出释义。",
  },
  {
    id: "cultivate", group: "角标", label: "培育中",
    build: card("salt-moss", { cultivateLeft: 2 }),
    oldNote: "只在手牌里出现: 卡顶上方的培育徽记 + 剩余回合数。",
    newNote: "卡外左上标记行: 培育徽记插槽 + 右下大号剩余回合数, 悬停向上浮出培育说明。",
  },
  {
    id: "ripe", group: "角标", label: "培育成熟",
    build: card("salt-moss", { cultivateLeft: 0 }),
    oldNote: "徽记换成熟图标 + 黄绿外发光。",
    newNote: "插槽外框转黄绿 + 内发光, 徽记换成熟图标。",
  },
  {
    id: "star-pay", group: "角标", label: "星辉代付",
    build: card("star-shatter"), props: { starPay: 1 },
    oldNote: "费用徽章右侧 12px 小签「✨N」, 悬停释义。",
    newNote: "宝石右侧金色铭牌: 四芒星 + 22px 数字, 悬停浮出代付说明。",
  },
  {
    id: "resonance", group: "角标", label: "共鸣强化",
    build: card("resonance-fork", { resonanceStacks: 2 }),
    oldNote: "右上 11px 电青小签「共鸣 +N」。",
    newNote: "卡外左上标记行: 电青外框插槽, 借用「回响」图标 + 右下大号「+N」, 悬停浮出共鸣说明。",
  },
  {
    id: "marks-combo", group: "角标", label: "多标记同场",
    build: card("salt-moss", { rooted: true, marks: ["mindsEye", "scorching"], cultivateLeft: 2, resonanceStacks: 1 }),
    props: { playable: false },
    oldNote: "手牌里卡顶上方: 标记一排, 培育紧随其后; 缠根铺在卡面上, 共鸣是卡内小签。",
    newNote: "卡外左上一行: 缠根 → 卡牌标记 → 培育 → 共鸣, 每格 52px 插槽, 外框按种类配色。",
  },
  {
    id: "leave", group: "离场演出", label: "出牌离场", exit: "leave",
    build: card("snowflake"),
    oldNote: "只有卡面本体向上出鞘 + 微偏转 + 渐隐(影子与厚度一起隐去)。",
    newNote: "钢框 / 选中框 / 角标是卡面的兄弟层, 故整张卡一起出鞘。",
  },
  {
    id: "discard", group: "离场演出", label: "弃牌白光", exit: "discard",
    build: card("snowflake"),
    oldNote: "弹起 → 过曝成白光 → 向外化开。",
    newNote: "同一节奏, 整张卡(含钢框)一起过曝化开。",
  },
  {
    id: "purge", group: "离场演出", label: "阵亡碎裂", exit: "purge",
    build: card("snowflake"),
    oldNote: "红光一闪 → 碎成几块抖散。",
    newNote: "同一碎片轮廓, 外扩到钢框与选中框, 红光改走 drop-shadow 绕新卡形。",
  },
];
