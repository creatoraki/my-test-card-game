// 建一场战斗 —— 把城镇档案、探索会话与遗物合成一份引擎认识的开局参数。

import { mapCombatModifier } from "../../data/mapCombatBalance";
import type { AllyInit, Card } from "../../engine";
import { applyModifier } from "../../engine";
import {
  ASSEMBLE_REWARD_POOLS,
  BOND_DEFS,
  activeBonds,
  addSquadMods,
  getCharacter,
  getItemDef,
  mergeMods,
  nextTier,
  squadModsOf,
} from "../../data";
import { burdenNow, encounterModifier } from "../../explore/session";
import { relicBattleMods } from "../../explore/relicModifiers";
import { useBattleStore, type BattleMeta } from "../battleStore";
import { applyPendingContamination } from "../exploreAftermath";
import { useExploreStore } from "../exploreStore";
import { bondCountsOf, deriveStats, useTownStore, type CharacterState } from "../townStore";

function battleMeta(characters: Record<string, CharacterState>, party: string[]): BattleMeta {
  const counts = bondCountsOf(characters, party);
  const active = new Map(activeBonds(counts).map((entry) => [entry.def.id, entry.tier]));
  return {
    bonds: Object.values(BOND_DEFS).map((def) => {
      const count = counts[def.id] ?? 0;
      return { def, count, tier: active.get(def.id) ?? null, next: nextTier(def, count) };
    }),
  };
}

// - 战斗卡组 = 上阵角色个人卡组的集合。createBattle 直接引用传入的卡实例(不拷贝), 而个人卡组是
//   城镇的持久资产, 故必须传副本, 否则战斗中的改动会污染城镇卡组。
// - 只有存活角色参战: 本次远征内阵亡的角色不出战, 其个人卡组也一并排除。
// - 净化粒子档位经 encounterModifier 注入 —— 引擎不认识能量, 只认识 EncounterModifier。
export function launchBattle(encounterId: string): void {
  const session = useExploreStore.getState().session;
  if (!session) return;

  applyPendingContamination(session.party.map((p) => p.charId));
  const { characters, party, squadTalent } = useTownStore.getState();

  // ★ 羁绊在**开战瞬间快照**, 与负重同一个范式(见 engine/stats.burdenValue 的注释):
  //   局外算好, 灌进面板, 引擎不认识羁绊 —— 正如它不认识装备与背包。
  //   刻意不进 deriveStats: 那是**单角色**换算点(角色详情/编队页都在用), 而羁绊是**全队**系统,
  //   塞进去会让「看某个角色的面板」凭空多出队友装备带来的加成。
  const active = activeBonds(bondCountsOf(characters, party));
  const bondMods = mergeMods(active.map((a) => a.tier.mods)); // 每人各叠一份
  // 背包遗物的属性修正走同一条合成 —— 引擎不认识物品容器, 它只收一份算好的面板。
  // ⚠ 这一份修正对**每一名角色各叠一次** ⇒ 里面绝不能出现 burdenAdapt 这类「小队合计」属性。
  const relicMods = mergeMods([
    ...session.backpack
      .map((stack) => getItemDef(stack.itemId).relic?.mods)
      .filter((mods): mods is NonNullable<typeof mods> => Boolean(mods)),
    ...relicBattleMods(session),
  ]);
  const relicIds = session.backpack
    .filter((stack) => getItemDef(stack.itemId).category === "relic")
    .map((stack) => stack.itemId);

  const alive = session.party.filter((p) => p.alive);
  const battleDeck: Card[] = alive.flatMap((p) => structuredClone(characters[p.charId].deck));
  const allies: AllyInit[] = alive.map((p) => {
    const c = getCharacter(p.charId);
    // 局外第一层(角色基础 + 装备)已由 deriveStats 算完; 羁绊是叠在它之上的第二层。
    let s = applyModifier(deriveStats(characters[p.charId]), bondMods);
    s = applyModifier(s, relicMods);
    const characterState = characters[p.charId];
    return {
      id: c.id,
      charId: c.id,
      name: c.name,
      emoji: c.emoji,
      stats: s, // ★ 局外已结算的完整面板(角色基础 + 装备 + 羁绊)
      startHp: p.hp, // ★ 血量跨战斗继承
      startHpLimit: p.hpLimit,
      pollution: characterState.pollution,
      sick: characterState.sick,
      quirks: [...characterState.quirks],
    };
  });

  const mod = { ...encounterModifier(session.energy), ...mapCombatModifier(session.mapId, session.difficulty) };
  const meta = battleMeta(characters, party);
  // ★ 负重在**开战瞬间快照**(设计文档 §6.3): 引擎不认识背包, 只收这一个有效负重点数。
  const burden = burdenNow(session);
  const squadMods = addSquadMods(
    squadModsOf(squadTalent.badgeId, squadTalent.nodes),
    ...active.map((a) => a.tier.squadMods),
    ...session.backpack.map((stack) => getItemDef(stack.itemId).relic?.squadMods),
  );
  useBattleStore
    .getState()
    .init(
      encounterId,
      {
        allies,
        deck: battleDeck,
        burden,
        fallenAllies: session.party.length - alive.length,
        squadMods,
        squadBuffRewardPools: ASSEMBLE_REWARD_POOLS,
        relics: relicIds,
      },
      undefined,
      mod,
      meta,
    );
}
