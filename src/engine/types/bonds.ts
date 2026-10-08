// ---------------------------------------------------------------------------
// 羁绊运行态 —— 开战时由局外传入「id + 档位」, 规则行为见 engine/bonds。
// 全部字段可序列化(只有数字 / 布尔 / 字符串), 随 BattleState 一起 structuredClone。
// ---------------------------------------------------------------------------

export interface BattleBond {
  id: string;
  tier: number; // 达到的档位, 从 1 开始(3/6/9 规格的 9 点 = 3; 6/12 规格的 12 点 = 2)
}

// 「每回合 N 次」类限制与本回合计数, 回合开始时整体重置。
export interface BondRoundState {
  strengthHeavyUsed: boolean; // 力量 9: 本回合第一张重攻已用掉速攻降费
  chariotHits: Record<string, number>; // 战车: 本回合每名敌人已被多少张攻击牌打过(本张牌结算完才计入)
  chariotFastPending: boolean; // 战车 9: 下一张攻击牌视为速攻
  chariotFastUsed: boolean;
  priestessUsed: boolean; // 女祭司 9: 本回合首张单体治疗牌已变全体
  emperorAoeUsed: boolean; // 皇帝 8: 本回合首次全体攻击已收束
  wheelDraw: boolean; // 命运之轮 3/6/9 各自每回合 1 次
  wheelMana: boolean;
  wheelGift: boolean;
  starReturnUsed: boolean; // 星星 9
  hangedSuspendUsed: boolean; // 倒吊人 9
  hermitPeekUsed: boolean; // 隐者 6: 本回合第一次弃牌已触发
  hermitPeekPending: boolean; // 隐者 6: 待打开的「预知」选择(在当前动作结算完后打开)
  hermitManualUsed: boolean; // 隐者 9
  moonSpreadUsed: boolean; // 月亮 3
  sunSpreadUsed: boolean; // 太阳 3
  deathDraws: number; // 死神 4: 本回合击杀抽牌次数
  devilBloodUsed: boolean; // 恶魔 4
  devilFreePlays: number; // 恶魔 12: 本回合已免费打出的张数
  temperanceDot: string[]; // 节制 9: 本回合已转化过持续伤害的我方单位
}

export interface BondBattleState {
  deathSaveUsed: boolean; // 死神 12: 每场战斗 1 次
  hermitExtraDraw: number; // 隐者 3: 回合末弃置的张数, 下回合开始多抽
}

// 出牌期临时台账: 一张牌结算期间有效, 出牌开始时清空。
export interface BondPlayState {
  touched: string[]; // 战车: 本张攻击牌打到过的敌人
  healAll: boolean; // 女祭司 9: 本张单体治疗改为全体
}

export interface BondRuntime {
  list: BattleBond[];
  round: BondRoundState;
  battle: BondBattleState;
  play: BondPlayState;
  suspended: string[]; // 倒吊人 9: 悬置区的卡牌 uid, 下回合开始自动打出
}
