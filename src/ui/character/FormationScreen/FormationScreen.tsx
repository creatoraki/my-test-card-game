// 编队页 —— 据点的**一级全屏页**(runStore 的 screen === "formation"), 入口是大厅 bento 右上那块
// 「编队」砖。⚠ 它不是设施内场景: 不走 TownScreen 的进设施运镜, 也不挂在据点画布里,
//   而是与 explore / battle 平级的顶层界面, 切换由 ui/ScreenTransition 负责。
//   ⚠ 进/出角色详情页走的**不是**默认淡出淡入, 而是**原生 View Transition 的共享元素过场**:
//     被点那张卡的面板/立绘窗/角色名与详情页的立绘栏/展示柜/大标题挂**同名**
//     view-transition-name, 浏览器自动把它们配对成一次形变; 其余元素各挂各的名, 各演各的
//     飞出。编排见 app/ScreenTransition/ScreenTransition.tsx 的 viewTransition 分支, 画面见 app/viewTransition.global.css。
//
// 设定依据: 游戏设定.md 第四节据点设施表 —— 编成小队原属冬眠仓, 独立成页后冬眠仓只留「唤醒」。
//
// ★ 版面 = 一整片**角色卡阵列**(不是「上阵槽 + 待命区」两段式):
//   全屏的面积足够把所有已唤醒的队员一次铺开, 是否出战靠**深紫粗边 + 左上角三角徽标 +
//   底部动作条**表达, 比两个容器之间来回搬运更直观, 人数涨上去也只是多滚两行。
//   ⚠ 上阵人数上限仍然是 RULES.progression.partySize —— 槽位没画出来了, 规则通过卡片开关与
//     disabled 状态表达; 右上角让给全队羁绊档位条。
//   ⚠⚠ 卡片**站位在进本页那一刻定死**(见组件里的 baseOrder), 上阵/下阵只换外观不换位置。
// ★ 卡面文字**只有角色名**: 数值一律去详情页看 —— 高楼型卡的体量全给立绘与上阵状态,
//   六张并排时才扫得出"现在带谁出门"。
// ★★ 卡面结构是「一扇顶满整卡的取景窗 + 窗内底部的浮动信息层」: 角色名与上阵/下阵动作条
//   都**浮在取景窗内部**(靠共享 kit 的 scrim 托底), 卡片边框内不再有第二块
//   独立的白色文字区 —— 那正是旧版底部文字与边框割裂感的来源。
//
// ★ 与冬眠仓同一套**亮玻璃**视觉(背景就是冬眠仓.png 那张紫粉白场景): 深紫墨文字 + 白玻璃卡,
//   左上是面包屑返回, 右上是 96px 巨型羁绊图标; 名称/效果只在悬浮浮层显示。
//   强调色深紫罗兰 #7c4dbe。旋钮全在 FormationScreen.css 的 --fm-* 里。
//
// 与大厅/战斗同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照着 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { RULES } from "@/engine";
import { getCharacter } from "@/data";
import { useRunStore } from "@/store/runStore";
import { useTownStore, type CharacterState } from "@/store/townStore";
import { CHARACTER_CARD_GLOW, characterGlow } from "@/ui/character/characterGlow";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { takeSharedPortrait } from "@/ui/character/sharedPortrait";
import { CRYO_BG_ART } from "@/ui/art/sceneArt";
import { SquadBondBar } from "@/ui/common/SquadBondBar";
import s from "./FormationScreen.module.css";

// 错峰入场的序号。CSS 用 --i 算 animation-delay(见 .fm-card 那条), 这里只负责把序号递给样式层。
const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

// 未被点中的卡片能拿到独立 view-transition-name 的最大数量。
// ⚠ 名字必须全局唯一, 所以只能"一个索引一个名", 而 app/viewTransition.global.css 里那张错峰
//   延迟表就只能手写这么多条。24 = 编队网格一屏(6 列 × 1 行)的四倍, 溢出的卡此刻滚在视口外,
//   给 none 让它们落进 root 快照跟着淡化即可, 看不出区别。
const VT_CARD_SLOTS = 24;

export function FormationScreen() {
  const characters = useTownStore((s) => s.characters);
  const awakened = useTownStore((s) => s.awakened);
  const party = useTownStore((s) => s.party);
  const toggleParty = useTownStore((s) => s.toggleParty);
  const enterTown = useRunStore((s) => s.enterTown);
  const openCharDetail = useRunStore((s) => s.openCharDetail);

  const size = RULES.progression.partySize;
  const full = party.length >= size;

  // ★ 回程(详情 → 编队)的落地方: 本页是**新挂载**的, 没有任何上下文, 靠详情页在导航前
  //   存进 ui/sharedPortrait.ts 的 id 认领共享名。惰性初值 = 只在挂载时取一次(且取走即清)。
  const [landingId] = useState(takeSharedPortrait);
  // ★ 去程(编队 → 详情)的起飞方: 点击时写入。
  // ⚠ 不用清空: 过场结束时整个 FormationScreen 已经卸载, state 随之消失。
  const [leavingId, setLeavingId] = useState<string | null>(null);
  // 本次过场里与详情页配对的那张卡。⚠ 起飞方**优先**: 从详情返回后再点别的卡时, landingId
  //   还留着上一位的 id, 不让它被盖住就会有两张卡同叫 vt-portrait —— 撞名浏览器会直接放弃过场。
  const sharedId = leavingId ?? landingId;

  // 进详情。
  // ⚠⚠ flushSync 是硬要求, 不是优化: view-transition-name 必须在 startViewTransition() 抓
  //   旧快照**之前**就落进 DOM。openCharDetail 会让 ScreenTransition 在本次提交后立刻发起过场,
  //   若 setLeavingId 与它批到同一次渲染里, 抓快照时这张卡身上还是普通名字 ⇒ 配不上对,
  //   共享元素退化成整页交叉淡化。
  const openDetail = useCallback(
    (id: string) => {
      if (leavingId) return; // 过场期间本页仍挂载着, 挡住重复点击
      flushSync(() => setLeavingId(id));
      openCharDetail(id);
    },
    [leavingId, openCharDetail],
  );

  // ★ 展示顺序在**挂载那一刻**定死: 上阵者按 party 次序在前, 其余待命者按唤醒先后接在后面。
  // ⚠⚠ 刻意**不依赖 party** —— 上阵/下阵只换卡片外观, 绝不让它在网格里跳位置。
  //   旧版把 party 放进依赖, 每次 toggle 整片阵列重排, 观感就是"闪了一下重新渲染"。
  //   下次进本页(含从详情页返回时的重新挂载)才会重新按当前阵容排一次。
  const [baseOrder] = useState(() => [...party, ...awakened.filter((id) => !party.includes(id))]);
  // 本页停留期间 awakened 若有增减, 只做"删掉消失的、把新人追加到末尾", 已有的一律不重排。
  const roster = useMemo(() => {
    const kept = baseOrder.filter((id) => awakened.includes(id));
    const added = awakened.filter((id) => !baseOrder.includes(id));
    return added.length ? [...kept, ...added] : kept;
  }, [baseOrder, awakened]);

  // Esc 返回据点。与左上面包屑按钮同一个出口。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") enterTown();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enterTown]);

  return (
    <StageCanvas
      viewportClassName={s["fm-viewport"]}
      className={cx(s["screen"], s["fm-stage"], landingId && s["is-vt-enter"])}
    >
      {/* 画布 = 固定 1920×1080, 整体等比缩放适配窗口 ⇒ 构图永不随分辨率变。
          ⚠ 背景(.fm-bg / .fm-veil)刻意**不挂 view-transition-name**: 两页用的是同一张
            冬眠仓.png ⇒ 它们落进 root 快照, 而 root 那片区域两页像素一致, 默认交叉淡化
            因此完全看不见。"底图不动、只有元素重组"就是这么来的。 */}
        {/* 背景: 冬眠仓那张 16:9 场景图, 与画布同比例 ⇒ cover 只等比缩小, 无裁切无变形。 */}
        <img className={s["fm-bg"]} src={CRYO_BG_ART} alt="" draggable={false} />
        {/* 提亮层: 背景本身是浅色紫粉白, 这里再往白里推一档, 给玻璃卡挣出对比度。
            ⚠ 不是压暗层 —— 压暗会毁掉这张图的气质(与 CryoScene 同一条取舍)。 */}
        <div className={s["fm-veil"]} />

        {/* ---- 左上: 面包屑与标题 ---- */}
        <header className={s["fm-header"]} style={{ left: "72px", top: "48px" }}>
          <nav className={s["fm-crumb"]} aria-label="编队路径">
            <button className={s["fm-back"]} type="button" onClick={() => enterTown()}>
              ← 据点
            </button>
            <span className={s["fm-crumb-separator"]} aria-hidden="true">▸</span>
            <span className={s["fm-crumb-current"]}>编队</span>
          </nav>
          <h2 className={s["fm-title"]}>编队</h2>
          <p className={s["fm-sub"]}>出战编成 · 队员一览 · 点卡面看详情与数值 · 点卡底动作条上阵 / 下阵 · 至少留 1 人上阵</p>
        </header>

        <SquadBondBar
          className={s["fm-bonds"]}
          characters={characters}
          party={party}
          style={{ right: "72px", top: "48px" }}
        />

        {/* ---- 卡片阵列 ----
            ★ 位置/尺寸旋钮全在下面的内联 style(设计 px), CSS 只负责机制(网格与卡片外观)。
              卡片是 260×714 的高楼型, auto-fill 下 1776px 宽正好排 6 列;
              阵列自己滚, 人再多也不会顶破版面。 */}
        <div
          className={s["fm-grid"]}
          style={{
            left: "72px", // ← 距画布左边(设计 px)
            top: "216px", // ← 落在标题与右上羁绊条下方
            width: "1776px", // ← 两侧各留 72px
            height: "786px", // ← 到画布底部前留出余量
            gap: "20px",
          }}
        >
          {roster.length === 0 ? (
            <p className={s["fm-empty"]}>
              还没有醒着的队员 —— 去冬眠仓解封几具休眠体。
            </p>
          ) : (
            roster.map((id, i) => (
              <CrewCard
                key={id}
                cs={characters[id]}
                index={i}
                onField={party.includes(id)}
                lastOne={party.length <= 1}
                full={full}
                size={size}
                shared={sharedId === id}
                onOpen={() => openDetail(id)}
                onToggle={() => toggleParty(id)}
              />
            ))
          )}
        </div>

    </StageCanvas>
  );
}

// ===================== 角色卡 =====================
// ⚠⚠ 外壳是 div 而**不是 button**: 卡面本身要能点(进详情), 底部的动作条也要能点,
//   而 button 里嵌 button 是非法 HTML(浏览器会把内层拆出去, 点击行为随之乱掉)。
//   故做成「div 外壳 + 两个同级 button」: .fm-card-main 铺满整卡, .fm-toggle-slot 绝对定位压在它底部。
function CrewCard({
  cs,
  index,
  onField,
  lastOne,
  full,
  size,
  shared,
  onOpen,
  onToggle,
}: {
  cs: CharacterState;
  index: number;
  onField: boolean;
  lastOne: boolean;
  full: boolean;
  size: number;
  shared: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const def = getCharacter(cs.charId);
  const glow = characterGlow(def.color);
  const blocked = onField ? lastOne : full;
  const reason = onField ? "至少要保留 1 名队员上阵" : `上阵人数已达上限 ${size} 人`;
  const { point, bind } = useHoverTooltip();

  const panelName = shared
    ? "vt-card-panel"
    : index < VT_CARD_SLOTS
      ? `vt-fm-card-${index}`
      : "none";
  const partName = (name: string) => ({ viewTransitionName: shared ? name : "none" }) as CSSProperties;

  return (
    <BorderGlow
      className={cx(s["fm-card"], onField && s["is-on"])}
      style={{ ...stagger(index), viewTransitionName: panelName, "--gc-color": def.color } as CSSProperties}
      persistent={onField}
      followPointer={!onField}
      animated={false}
      fillOpacity={onField ? 0.3 : 0.2}
      {...CHARACTER_CARD_GLOW}
      {...glow}
      backgroundColor={
        onField ? "color-mix(in srgb, var(--gc-color) 24%, #091318)" : CHARACTER_CARD_GLOW.backgroundColor
      }
    >
      <div className={s["fm-card-body"]} style={partName("vt-portrait")}>
        <button className={s["fm-card-main"]} type="button" onClick={onOpen}>
          <CharacterPortrait
            characterId={def.id}
            emoji={def.emoji}
            alt={def.name}
            className={s["fm-bust"]}
          />
          <span className={s["fm-card-scrim"]} aria-hidden="true" />
          <span className={s["fm-card-name"]} style={partName("vt-char-name")}>
            {def.name}
          </span>
        </button>

        {onField && (
          <span className={s["fm-card-flag"]} style={partName("vt-fm-flag")} role="img" aria-label="出战中">
            上阵
          </span>
        )}

        <span className={s["fm-toggle-slot"]} style={partName("vt-fm-toggle")} {...bind}>
          <button className={s["fm-toggle"]} type="button" disabled={blocked} onClick={onToggle}>
            {onField ? "下阵" : "上阵"}
          </button>
          {blocked && point && (
            <HoverTooltip point={point}>
              <strong>{onField ? "无法下阵" : "无法上阵"}</strong>
              <p>{reason}</p>
            </HoverTooltip>
          )}
        </span>
      </div>
    </BorderGlow>
  );
}
