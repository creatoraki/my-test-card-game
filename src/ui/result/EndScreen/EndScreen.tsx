// 远征结算 —— 通关 / 撤离 / 团灭三种收场共用一页。
// 主角是「远征记录」: session.history 每段一条(落在哪个终点、能量掉到多少),
// 一趟远征结束时那一列就是完整的故事, 比任何汇总数字都更值得看。

import { getCharacter, getMap } from "@/data";
import { energyTier } from "@/explore/session";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import ItemSlot from "@/ui/common/item/ItemSlot";
import s from "./EndScreen.module.css";

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

const TITLES = {
  won: { title: "远征完成", kicker: "远征终端 / 最终报告" },
  retreat: { title: "已撤离", kicker: "远征终端 / 撤离报告" },
  lost: { title: "远征中断", kicker: "远征终端 / 事故报告" },
} as const;

export function EndScreen() {
  const characters = useTownStore((s) => s.characters);
  const bankedLoot = useTownStore((s) => s.loot);
  const party = useTownStore((s) => s.party);
  const lastResult = useRunStore((s) => s.lastResult);
  const mapId = useRunStore((s) => s.mapId);
  const backToTown = useRunStore((s) => s.backToTown);
  const session = useExploreStore((s) => s.session);

  const result = lastResult ?? "lost";
  const { title, kicker } = TITLES[result];
  const map = mapId ? getMap(mapId) : null;
  const wiped = result === "lost";
  const backpack = session?.backpack ?? [];
  const shipped = session?.shipped ?? [];

  return (
    <div className={cx(s["screen"], s["end"], s["terminal-screen"], s["center"])}>
      <div className={s["screen-kicker"]}>{kicker}</div>
      <h1 className={s["terminal-heading"]}>{title}</h1>
      <p className={s["muted"]}>
        {map?.name ?? "未知区域"} ——{" "}
        {result === "won"
          ? "回收总控已停机，这一层安静下来了。"
          : result === "retreat"
            ? "带着已有的收获退了出来。"
            : "全队失去意识，被拖回了城镇。"}
      </p>

      <div className={s["end-loot"]}>
        {wiped ? (
          <span className={s["loot-lost"]}>💠 背包与本趟积分全部遗失</span>
        ) : (
          <span className={cx(s["loot-chip"], s["loot-big"])}>
            💠 居民积分入账 {session?.loot ?? 0}
          </span>
        )}
        <span className={s["muted"]}>城镇余额 {bankedLoot}</span>
        {session && (
          <span className={s["muted"]}>
            剩余净化粒子 {session.energy}〈{energyTier(session.energy).name}〉 · 走了{" "}
            {session.history.length} 段
          </span>
        )}
      </div>

      {/* 带回来的实物 —— 这才是一趟远征真正的产出(设计文档 §6.1)。
          团灭时 session.backpack 已被清空, 于是这里只会剩下投递口寄回的那些,
          「唯一的保险手段」这件事不用文案解释, 玩家自己看得见。 */}
      {session && (backpack.length > 0 || shipped.length > 0) && (
        <div className={s["end-haul"]}>
          <span className={s["hud-label"]}>
            带回据点 {backpack.length + shipped.length} 件
            {wiped && shipped.length > 0 ? "（全靠投递口寄回）" : ""}
          </span>
          <div className={s["end-haul-row"]}>
            {[...shipped, ...backpack].map((st) => (
              <ItemSlot key={st.uid} stack={st} />
            ))}
          </div>
          <span className={s["muted"]}>已存入物资中转仓。</span>
        </div>
      )}

      {/* 本次远征记录: 每结算一个节点一行 —— 第几轮第几段、落在哪条通道、能量怎么掉的。 */}
      {session && session.history.length > 0 && (
        <div className={s["end-log"]}>
          <span className={s["hud-label"]}>本次远征记录</span>
          {session.history.map((h, i) => (
            <div key={`${h.round}-${h.segment}-${i}`} className={s["end-log-row"]}>
              <span className={s["end-log-seg"]}>
                {h.round} 轮 · {h.segment + 1} 段
              </span>
              <span className={s["end-log-lane"]}>{ENTRY_LABELS[h.lane] ?? h.lane + 1} 通道</span>
              <span className={s["end-log-title"]}>{h.eventTitle}</span>
              <span className={s["end-log-note"]}>{h.note}</span>
              <span
                className={cx(
                  s["end-log-energy"],
                  h.energyAfter < h.energyBefore ? s["down"] : s["flat"],
                )}
                style={{ ["--tier-color" as string]: energyTier(h.energyAfter).color }}
              >
                {h.energyBefore} → {h.energyAfter}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={s["deck-summary"]}>
        {party.map((id) => {
          const cs = characters[id];
          if (!cs) return null;
          const c = getCharacter(id);
          return (
            <div key={id} className={s["deck-summary-char"]}>
              <h3>
                {c.emoji} {c.name} · 卡组 Lv.{cs.deckLevel} · 个人卡组({cs.deck.length} 张)
              </h3>
              <div className={s["deck-list"]}>
                {cs.deck.map((card) => (
                  <span
                    key={card.uid}
                    className={cx(s["deck-chip"], card.upgraded && s["upgraded"])}
                  >
                    {card.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button className={cx(s["primary"], s["button-big"])} onClick={() => backToTown()}>
        返回城镇
      </button>
    </div>
  );
}
