// 编队页 —— 据点的**一级全屏页**(runStore 的 screen === "formation"), 入口是大厅 bento 右上那块
// 「编队」砖。⚠ 它不是设施内场景: 不走 TownScreen 的进设施运镜, 也不挂在据点画布里,
//   而是与 explore / battle 平级的顶层界面, 切换由 ui/ScreenTransition 负责。
//
// ★★ 角色详情**不再是另一个 screen**: 它是本页的第二种态。点卡不跳页, 而是同一张画布里
//   做一次元素重组 —— 卡阵以被点那张为原点飞散, 那一张由飞行层先滑到左侧、再横向展宽成
//   立绘取景窗, 右侧工作区从同一条水平带裂开生长。编排全在 formationMorph/, 与 runStore 无关。
//   (旧版走的是原生 View Transition 的共享元素过场; 伪元素挂在文档根上拿不到元素的 --i,
//    错峰只能靠一张手写的延迟表, 做不出按距离飞散这一档 —— 那套已随本次改版删除。)
//
// ★ 版面只留三样东西 + 一个返回按钮:
//     队伍列表(CrewGrid) · 小队徽章(SquadBadgeDial, 兼训练点待办提醒) · 小队羁绊(SquadBondBar)。
//   面包屑、巨型标题与整行说明文字全部撤掉 —— 那些占掉了 216px 的顶部空间, 而这一页
//   真正要看的是人。
// ★ 徽章与羁绊住在**常驻通栏面板**(SquadHud): 两态共用同一份 DOM, 重组期间原地不动,
//   给这场形变留一个参照系; 返回按钮退到左下角。
//
// ★ 与冬眠仓同一套**亮玻璃**视觉(背景就是冬眠仓.png 那张紫粉白场景): 深紫墨文字 + 白玻璃卡,
//   强调色深紫罗兰 #7c4dbe。
// 与大厅/战斗同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/hooks/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照着 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { RULES } from "@/engine";
import { getCharacter } from "@/data";
import { useRunStore } from "@/store/runStore";
import { useTownStore } from "@/store/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { cx } from "@/ui/common/cx";
import { CRYO_BG_ART } from "@/ui/art/sceneArt";
import { CharacterDetailView } from "@/ui/character/CharacterDetailView";
import { SquadTalentModal } from "@/ui/town/training/SquadTalentModal";
import { useSquadTalent } from "@/ui/town/training/useSquadTalent";
import { CrewGrid } from "./CrewGrid";
import { SquadHud } from "./SquadHud";
import { MorphFlyer } from "./formationMorph/MorphFlyer";
import {
  BACK_GATHER_MS,
  BACK_MORPH_MS,
  PANEL_DELAY_MS,
  PANEL_GROW_MS,
  SCATTER_MS,
} from "./formationMorph/morphChoreo";
import { useFormationMorph } from "./formationMorph/useFormationMorph";
import s from "./FormationScreen.module.css";

// 飞行层两端的字号与圆角 —— 与两侧的实际样式对齐:
//   21px / 16px = 卡面(glowCard.module.css 的 .glow-card-name 与 CHARACTER_CARD_GLOW.borderRadius)
//   44px / 16px = 详情态立绘取景窗(FigureStage.module.css 的 .name 与 .stage)
const CARD_FONT = 21;
const CARD_RADIUS = 16;
const FIGURE_FONT = 44;
const FIGURE_RADIUS = 16;

export function FormationScreen() {
  const characters = useTownStore((state) => state.characters);
  const awakened = useTownStore((state) => state.awakened);
  const party = useTownStore((state) => state.party);
  const toggleParty = useTownStore((state) => state.toggleParty);
  const enterTown = useRunStore((state) => state.enterTown);

  const talent = useSquadTalent();
  const [talentOpen, setTalentOpen] = useState(false);
  const morph = useFormationMorph();

  // 卡阵的入场动画只在**本页首次**铺开时播。从详情态回来时卡阵是重新挂载的, 那一次归位
  // 由收拢动画负责, 再叠一次入场就成了"刚落位又整片闪一下"(详见 CrewCard 的 entrance)。
  const entranceRef = useRef(true);
  useEffect(() => {
    entranceRef.current = false;
  }, []);

  const size = RULES.progression.partySize;

  // ★ 展示顺序在**挂载那一刻**定死: 上阵者按 party 次序在前, 其余待命者按唤醒先后接在后面。
  // ⚠⚠ 刻意**不依赖 party** —— 上阵/下阵只换卡片外观, 绝不让它在网格里跳位置。
  //   旧版把 party 放进依赖, 每次 toggle 整片阵列重排, 观感就是"闪了一下重新渲染"。
  // ★ 详情态回来时**不会**重排: 本页全程不卸载, baseOrder 一直活着 —— 这也是把详情做成
  //   同页一态而不是另一个 screen 的顺带好处。
  const [baseOrder] = useState(() => [...party, ...awakened.filter((id) => !party.includes(id))]);
  // 本页停留期间 awakened 若有增减, 只做「删掉消失的、把新人追加到末尾」, 已有的一律不重排。
  const roster = useMemo(() => {
    const kept = baseOrder.filter((id) => awakened.includes(id));
    const added = awakened.filter((id) => !baseOrder.includes(id));
    return added.length ? [...kept, ...added] : kept;
  }, [baseOrder, awakened]);

  // Esc 返回据点。⚠ 只在编队态且没有过场在跑时响应 —— 详情态那一层的 Esc 归
  //   CharacterDetailView(它要先逐层收掉锻造浮层与装备仓库), 两边互不打架。
  const canLeave = morph.mode === "roster" && morph.phase === "idle" && !talentOpen;
  useEffect(() => {
    if (!canLeave) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") enterTown();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canLeave, enterTown]);

  const back = useCallback(() => {
    if (morph.mode === "detail") morph.backToRoster();
    else enterTown();
  }, [enterTown, morph]);

  const flight = morph.flight;
  const flightDef = flight ? getCharacter(flight.charId) : null;

  return (
    <StageCanvas
      viewportClassName={s.viewport}
      className={cx(s.screen, s.stage)}
      // 过场时长从 formationMorph/morphChoreo.ts 下发给 CSS —— 唯一真相点在 TS 那边,
      // 「减少动态效果」时它已经把数值归零, 各处的 CSS 动画因此一并失效, 不必各写一份兜底。
      style={
        {
          "--fm-scatter-ms": `${SCATTER_MS}ms`,
          "--fm-gather-ms": `${BACK_GATHER_MS}ms`,
          "--fm-gather-delay": `${morph.phase === "toRoster" ? BACK_MORPH_MS : 0}ms`,
          "--fm-panel-ms": `${PANEL_GROW_MS}ms`,
          "--fm-panel-delay": `${PANEL_DELAY_MS}ms`,
        } as CSSProperties
      }
    >
      {/* 背景: 冬眠仓那张 16:9 场景图, 与画布同比例 ⇒ cover 只等比缩小, 无裁切无变形。
          ⚠ 两态共用这一张 —— 底图从头到尾不动, 动的只有它上面的元素。 */}
      <img className={s.bg} src={CRYO_BG_ART} alt="" draggable={false} />
      {/* 提亮层: 背景本身是浅色紫粉白, 这里再往白里推一档, 给玻璃卡挣出对比度。
          ⚠ 不是压暗层 —— 压暗会毁掉这张图的气质(与 CryoScene 同一条取舍)。 */}
      <div className={s.veil} />

      {morph.showRoster && (
        <CrewGrid
          // 盒子外扩 36px 是给外发光让位; 卡片带从 (76, 196) 起, 水平带为 196..968。
          style={{ left: "40px", top: "160px", width: "1840px", height: "844px", gap: "20px" }}
          roster={roster}
          characters={characters}
          party={party}
          size={size}
          hiddenId={morph.hiddenId}
          anchorId={morph.phase === "idle" ? null : morph.charId}
          scatter={morph.phase === "toDetail" ? "out" : morph.phase === "toRoster" ? "in" : null}
          entrance={entranceRef.current}
          onOpen={(charId, el) => morph.openDetail(charId, el)}
          onToggle={toggleParty}
        />
      )}

      {morph.showDetail && morph.charId && (
        <CharacterDetailView
          charId={morph.charId}
          morphing={morph.phase === "toDetail"}
          leaving={morph.phase === "toRoster"}
          escEnabled={!talentOpen}
          onBack={morph.backToRoster}
        />
      )}

      {flight && flightDef && (
        <MorphFlyer
          key={`${flight.charId}-${flight.reverse ? "back" : "go"}`}
          characterId={flightDef.id}
          emoji={flightDef.emoji}
          name={flightDef.name}
          color={flightDef.color}
          from={flight.from}
          to={flight.to}
          fromFontSize={flight.reverse ? FIGURE_FONT : CARD_FONT}
          toFontSize={flight.reverse ? CARD_FONT : FIGURE_FONT}
          fromRadius={flight.reverse ? FIGURE_RADIUS : CARD_RADIUS}
          toRadius={flight.reverse ? CARD_RADIUS : FIGURE_RADIUS}
          reverse={flight.reverse}
          delay={flight.reverse ? 0 : SCATTER_MS}
          ms={flight.ms}
          onDone={morph.finishFlight}
        />
      )}

      {/* 常驻 HUD: 通栏面板里的徽章与羁绊, 左下角返回按钮。两态共用, 过场期间原地不动。 */}
      <SquadHud
        onBack={back}
        backLabel={morph.mode === "detail" ? "返回编队" : "返回据点"}
        badge={talent.badge}
        remaining={talent.remaining}
        total={talent.trainingPoints}
        onBadgeClick={() => setTalentOpen(true)}
        characters={characters}
        party={party}
      />

      {talentOpen && <SquadTalentModal onClose={() => setTalentOpen(false)} />}
    </StageCanvas>
  );
}
