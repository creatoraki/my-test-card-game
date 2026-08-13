import { useEffect, useState, type CSSProperties } from "react";
import { RULES, type SquadResourceMods } from "@/engine";
import {
  SQUAD_BADGES,
  getBadge,
  getCharacter,
  nextNodeCost,
  spentPoints,
  squadModsOf,
  type SquadResourceKey,
  type TalentTrackDef,
} from "@/data";
import { useRunStore } from "@/store/runStore";
import { deriveStats, squadTrainingPoints, useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import s from "./TrainingScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const RESOURCE_LABELS: Record<SquadResourceKey, string> = {
  openingHand: "初始手牌",
  drawCount: "回合抽牌",
  redraws: "换牌次数",
  waits: "待机次数",
  mana: "每回合费用",
  handLimit: "手牌上限",
};

const RESOURCE_BASE: Record<SquadResourceKey, number> = {
  openingHand: 4,
  drawCount: RULES.hand.partyBonusDrawCount,
  redraws: RULES.timeline.redrawsPerRound,
  waits: RULES.timeline.waitsPerRound,
  mana: RULES.resource.perRound,
  handLimit: RULES.hand.baseHandLimit,
};

const RESOURCE_CAPS: Partial<Record<SquadResourceKey, number>> = {
  drawCount: RULES.squadCaps.drawCount,
  mana: RULES.squadCaps.mana,
  handLimit: RULES.squadCaps.handLimit,
};

const TRACK_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  handLimit: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 13h30v24H9z" strokeWidth={1.2} opacity={0.38} />
      <path d="M15 18h18M15 24h12M15 30h8" strokeWidth={1.6} />
      <path d="M36 9v8M32 13h8" strokeWidth={1.6} />
    </svg>
  ),
  redraw: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M12 18a14 14 0 0 1 24-3l3 4" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 30a14 14 0 0 1-24 3l-3-4" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 11v8h-8M12 37v-8h8" strokeWidth={1.6} />
    </svg>
  ),
  wait: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="15" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 15v10l7 4" strokeWidth={1.6} />
      <path d="M10 10l4 4M38 10l-4 4" strokeWidth={1.6} />
    </svg>
  ),
  mana: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="m24 5 14 19-14 19L10 24 24 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="m24 12 8.5 12-8.5 12-8.5-12L24 12Z" strokeWidth={1.6} />
      <path d="M24 18v12M18 24h12" strokeWidth={1.4} />
    </svg>
  ),
  draw: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M11 9h26v30H11z" strokeWidth={1.2} opacity={0.38} />
      <path d="M17 15h14M17 22h10M17 29h14" strokeWidth={1.6} />
      <path d="M34 34h6M37 31v6" strokeWidth={1.6} />
    </svg>
  ),
  openingHand: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 14h30v24H9z" strokeWidth={1.2} opacity={0.38} />
      <path d="M16 20h16M16 26h10M16 32h6" strokeWidth={1.6} />
      <path d="M34 7v9M29.5 11.5h9" strokeWidth={1.6} />
    </svg>
  ),
};

function BadgeGlyph() {
  return (
    <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M36 5 60 19v28L36 61 12 47V19L36 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 14 51 23v18l-15 9-15-9V23l15-9Z" strokeWidth={1.6} />
      <circle cx="36" cy="32" r="6" strokeWidth={1.6} />
      <path d="M36 22v20M26 32h20" strokeWidth={1.4} />
    </svg>
  );
}

interface Props {
  leaving?: boolean;
}

interface ResourcePreview {
  key: SquadResourceKey;
  base: number;
  badge: number;
  talent: number;
  role: number;
  final: number;
  cap: number | null;
}

function roleResourceBonus(
  key: SquadResourceKey,
  characters: ReturnType<typeof useTownStore.getState>["characters"],
  party: string[],
): number {
  if (key !== "openingHand" && key !== "drawCount" && key !== "handLimit") return 0;
  return party.reduce((sum, charId) => {
    const character = characters[charId];
    return character ? sum + deriveStats(character)[key === "handLimit" ? "handLimit" : "drawCount"] : sum;
  }, 0);
}

function resourceFinal(
  key: SquadResourceKey,
  base: number,
  mods: SquadResourceMods,
  role: number,
): number {
  const value = base + mods[key] + role;
  const cap = RESOURCE_CAPS[key];
  return cap == null ? Math.max(0, Math.round(value)) : Math.max(0, Math.min(cap, Math.round(value)));
}

function TrackIcon({ track }: { track: TalentTrackDef }) {
  const Icon = TRACK_ICONS[track.id] ?? TRACK_ICONS.handLimit;
  return <Icon className={s["tr-track-icon"]} />;
}

export function TrainingScene({ leaving = false }: Props) {
  const squadTalent = useTownStore((state) => state.squadTalent);
  const characters = useTownStore((state) => state.characters);
  const party = useTownStore((state) => state.party);
  const trainingPoints = useTownStore(squadTrainingPoints);
  const selectSquadBadge = useTownStore((state) => state.selectSquadBadge);
  const investTalent = useTownStore((state) => state.investTalent);
  const resetSquadTalent = useTownStore((state) => state.resetSquadTalent);
  const screen = useRunStore((state) => state.screen);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hoverKey, setHoverKey] = useState<SquadResourceKey | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [bump, setBump] = useState<{ key: SquadResourceKey; n: number } | null>(null);

  const locked = screen !== "town";
  const badge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
  const activeBadge = badge ?? SQUAD_BADGES[0];
  const mods = squadModsOf(squadTalent.badgeId, squadTalent.nodes);
  const spent = badge ? spentPoints(badge, squadTalent.nodes) : 0;
  const remaining = Math.max(0, trainingPoints - spent);
  const previews: ResourcePreview[] = (Object.keys(RESOURCE_LABELS) as SquadResourceKey[]).map((key) => {
    const role = roleResourceBonus(key, characters, party);
    const badgeValue = squadTalent.badgeId ? activeBadge.base[key] ?? 0 : 0;
    const talent = squadTalent.badgeId ? mods[key] - badgeValue : 0;
    return {
      key,
      base: RESOURCE_BASE[key],
      badge: badgeValue,
      talent,
      role,
      final: resourceFinal(key, RESOURCE_BASE[key], mods, role),
      cap: RESOURCE_CAPS[key] ?? null,
    };
  });
  const badgeEffects = (Object.entries(activeBadge.base) as Array<[SquadResourceKey, number | undefined]>).filter(
    ([, value]) => value != null && value !== 0,
  );

  useEffect(() => {
    if (!shakeId) return;
    const timer = window.setTimeout(() => setShakeId(null), 260);
    return () => window.clearTimeout(timer);
  }, [shakeId]);

  return (
    <div className={cn("tr-scene", leaving && "is-leaving")}>
      <header className={cn("tr-header")}>
        <span className={cn("tr-kicker")}>TRAINING BAY</span>
        <h2 className={cn("tr-title")}>训练室</h2>
        <p className={cn("tr-sub")}>小队天赋 · 训练点分配</p>
      </header>

      <div className={cn("tr-readout")}>
        <span className={cn("tr-chip-label")}>剩余训练点</span>
        <div className={cn("tr-chip-value")}>
          <strong key={bump?.n ?? "stable"} className={cn(bump && "is-bumping")}>{remaining}</strong>
          <span>/ {trainingPoints}</span>
        </div>
        <i
          className={cn("tr-readout-meter")}
          style={{ "--meter": `${trainingPoints ? (spent / trainingPoints) * 100 : 0}%` } as CSSProperties}
        />
      </div>

      <main className={cn("tr-layout", locked && "is-locked", !squadTalent.badgeId && "is-unselected")}>
        <section className={cn("tr-badge-panel")} aria-label="小队徽章">
          <div className={cn("tr-panel-kicker")}>{activeBadge.kicker}</div>
          <div className={cn("tr-badge-art")} aria-hidden>
            <BadgeGlyph />
          </div>
          <div className={cn("tr-badge-heading")}>
            <h3 className={cn("tr-badge-name")}>{activeBadge.name}</h3>
            <span className={cn("tr-info")} tabIndex={0} aria-label="查看徽章说明">
              ⓘ
              <span className={cn("tr-pop", "tr-badge-pop")}>
                <strong>{activeBadge.desc}</strong>
                <span>适配条件：{activeBadge.requirement ?? "无要求"}</span>
              </span>
            </span>
          </div>
          <div className={cn("tr-badge-effects")}>
            {badgeEffects.length ? badgeEffects.map(([key, value]) => (
              <span key={key}>效果：{RESOURCE_LABELS[key]} +{value}</span>
            )) : <span>无基础加成</span>}
          </div>
          <button
            className={cn("tr-enable")}
            type="button"
            disabled={locked || squadTalent.badgeId === activeBadge.id}
            onClick={() => selectSquadBadge(activeBadge.id)}
          >
            {squadTalent.badgeId ? "徽章已启用" : "启用徽章"}
          </button>
          <div className={cn("tr-source")} tabIndex={0} aria-label="查看训练点来源">
            <span>训练点来源</span>
            <strong>{trainingPoints}</strong>
            <span className={cn("tr-info")}>ⓘ</span>
            <span className={cn("tr-pop", "tr-source-pop")}>
              {party.length ? (
                party.map((charId) => (
                  <span key={charId} className={cn("tr-source-row")}>
                    <strong>{characters[charId]?.deckLevel ?? 0}</strong>
                    <span>{characters[charId] ? getCharacter(charId).name : "未知队员"} · 卡组等级</span>
                  </span>
                ))
              ) : <span className={cn("tr-source-empty")}>暂无上阵成员</span>}
            </span>
          </div>
        </section>

        <section className={cn("tr-tracks")} aria-label="训练方向">
          {activeBadge.tracks.map((track, index) => {
            const unlocked = Math.max(0, Math.min(track.costs.length, Math.floor(squadTalent.nodes[track.id] ?? 0)));
            const cost = nextNodeCost(track, unlocked);
            const affordable = cost != null && remaining >= cost;
            const disabled = locked || !squadTalent.badgeId || cost == null;
            return (
              <button
                key={track.id}
                className={cn("tr-track", shakeId === track.id && "is-shaking")}
                style={{ "--track-index": index } as CSSProperties}
                type="button"
                disabled={disabled}
                onMouseEnter={() => setHoverKey(track.key)}
                onMouseLeave={() => setHoverKey(null)}
                onFocus={() => setHoverKey(track.key)}
                onBlur={() => setHoverKey(null)}
                onClick={() => {
                  if (locked || !squadTalent.badgeId || cost == null) return;
                  if (!affordable) {
                    setShakeId(track.id);
                    return;
                  }
                  investTalent(track.id);
                  setBump({ key: track.key, n: (bump?.n ?? 0) + 1 });
                }}
              >
                <span className={cn("tr-track-icon-wrap")}><TrackIcon track={track} /></span>
                <span className={cn("tr-track-main")}>
                  <span className={cn("tr-track-heading")}>
                    <strong>{track.name}</strong>
                    <span>+{track.perNode} / 级 · {RESOURCE_LABELS[track.key]}</span>
                  </span>
                  {/* <span className={cn("tr-pop", "tr-track-pop")}>{track.desc}</span> */}
                </span>
                <span className={cn("tr-track-progress")} aria-label={`${unlocked} / ${track.costs.length} 节点`}>
                  {track.costs.map((nodeCost, nodeIndex) => {
                    const latest = nodeIndex === unlocked - 1 && bump?.key === track.key;
                    return (
                      <span
                        key={`${nodeIndex}-${latest ? bump?.n : "stable"}`}
                        className={cn("tr-node", nodeIndex < unlocked && "is-filled", latest && "is-latest")}
                        aria-hidden
                      />
                    );
                  })}
                </span>
                <span className={cn("tr-track-delta")}>
                  {unlocked >= track.costs.length ? "精通" : `+${unlocked * track.perNode}`}
                </span>
                <span className={cn("tr-cost", cost != null && !affordable && "is-unaffordable")}>
                  {cost == null ? "精通" : `[${cost}]`}
                </span>
                <span className={cn("tr-track-arrow")} aria-hidden>▸</span>
              </button>
            );
          })}
        </section>
      </main>

      <section className={cn("tr-bar")} aria-label="队伍属性预览">
        {previews.map((item) => {
          const capped = item.cap != null && item.final >= item.cap;
          const totalBonus = item.badge + item.talent + item.role;
          const isBumping = bump?.key === item.key;
          return (
            <div
              key={item.key}
              className={cn("tr-preview-cell", capped && "is-capped")}
              data-hl={hoverKey === item.key ? "active" : undefined}
              tabIndex={0}
              aria-label={`${RESOURCE_LABELS[item.key]} ${item.final}`}
              onMouseEnter={() => setHoverKey(item.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(item.key)}
              onBlur={() => setHoverKey(null)}
            >
              <span className={cn("tr-preview-name")}>{RESOURCE_LABELS[item.key]}</span>
              <strong
                key={`${item.key}-${isBumping ? bump?.n : "stable"}`}
                className={cn("tr-preview-value", isBumping && "is-bumping")}
              >
                {item.final}
              </strong>
              <span className={cn("tr-preview-bonus")}>{totalBonus > 0 ? `+${totalBonus}` : "—"}</span>
              {capped && <em>封顶</em>}
              <span className={cn("tr-pop", "tr-preview-pop")}>
                {item.badge !== 0 && <span>徽章 +{item.badge}</span>}
                {item.talent !== 0 && <span>天赋 +{item.talent}</span>}
                {item.role !== 0 && <span>队伍 +{item.role}</span>}
                {totalBonus === 0 && <span>暂无额外加成</span>}
              </span>
            </div>
          );
        })}
      </section>

      {locked && <div className={cn("tr-lock-banner")}>远征进行中，方案已锁定</div>}

      <button
        className={cn("tr-reset")}
        type="button"
        disabled={locked || !squadTalent.badgeId || spent === 0}
        onClick={() => setConfirmReset(true)}
      >
        重置分配
      </button>

      {confirmReset && (
        <div className={cn("tr-confirm")} role="dialog" aria-modal="true" aria-label="确认重置分配">
          <div className={cn("tr-confirm-panel")}>
            <span className={cn("tr-panel-kicker")}>RESET ALLOCATION</span>
            <h3>重置整棵训练树？</h3>
            <p>已投入的 {spent} 点训练点将全部返还，徽章保持启用。</p>
            <div className={cn("tr-confirm-actions")}>
              <button type="button" onClick={() => setConfirmReset(false)}>取消</button>
              <button className={cn("tr-confirm-primary")} type="button" onClick={() => { resetSquadTalent(); setConfirmReset(false); }}>
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
