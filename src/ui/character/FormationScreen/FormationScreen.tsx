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
//   全屏的面积足够把所有已唤醒的队员一次铺开, 是否出战靠**异色边框 + 右上角开关**表达,
//   比两个容器之间来回搬运更直观, 人数涨上去也只是多滚两行。
//   ⚠ 上阵人数上限仍然是 RULES.progression.partySize —— 槽位没画出来了, 故必须靠右上角的
//     「上阵 n / N」读数与满员时置灰的开关把这条规则说清楚。
//
// ★ 与冬眠仓同一套**亮玻璃**视觉(背景就是冬眠仓.png 那张紫粉白场景): 深紫墨文字 + 白玻璃卡,
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
import { deriveStats, useTownStore, type CharacterState } from "@/store/townStore";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { takeSharedPortrait } from "@/ui/character/sharedPortrait";
import { CRYO_BG_ART } from "@/ui/art/sceneArt";
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

  // 展示顺序: 上阵的按 party 次序排在最前, 其余待命者按唤醒先后接在后面。
  // ⚠ 上阵/下阵会让卡片换位置 —— 这是刻意的: 阵容永远聚在左上角, 一眼看得到"现在带谁出门"。
  const roster = useMemo(
    () => [...party, ...awakened.filter((id) => !party.includes(id))],
    [party, awakened],
  );

  // Esc 返回据点。与左下角那颗按钮同一个出口。
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

        {/* ---- 左上: 标题 ---- */}
        <header className={s["fm-header"]} style={{ left: "72px", top: "48px" }}>
          <span className={s["fm-kicker"]}>SQUAD FORMATION</span>
          <h2 className={s["fm-title"]}>编队</h2>
          <p className={s["fm-sub"]}>出战编成 · 队员一览</p>
        </header>

        {/* ---- 右上: 读数 chip ---- */}
        <div className={s["fm-readout"]} style={{ right: "72px", top: "48px" }}>
          <div className={s["fm-chip"]}>
            <span className={s["fm-chip-label"]}>上阵</span>
            <strong className={s["fm-chip-value"]}>
              {party.length} / {size}
            </strong>
          </div>
          <div className={s["fm-chip"]}>
            <span className={s["fm-chip-label"]}>待命</span>
            <strong className={s["fm-chip-value"]}>{awakened.length - party.length}</strong>
          </div>
          <div className={s["fm-chip"]}>
            <span className={s["fm-chip-label"]}>已唤醒</span>
            <strong className={s["fm-chip-value"]}>{awakened.length}</strong>
          </div>
        </div>

        {/* ---- 卡片阵列 ----
            ★ 位置/尺寸旋钮全在下面的内联 style(设计 px), CSS 只负责机制(网格与卡片外观)。
              卡片是 260×650 的高楼型(≈1:2.5), auto-fill 下 1776px 宽正好排 6 列;
              阵列自己滚, 人再多也不会顶破版面。 */}
        <div
          className={s["fm-grid"]}
          style={{
            left: "72px", // ← 距画布左边(设计 px)
            top: "184px", // ← 落在标题/读数下方
            width: "1776px", // ← 两侧各留 72px
            height: "770px", // ← 到底部说明栏上方
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

        {/* ---- 左下: 返回 ---- */}
        <button
          className={s["fm-back"]}
          style={{ left: "72px", bottom: "48px" }}
          type="button"
          onClick={() => enterTown()}
        >
          ← 返回据点
        </button>

        {/* ---- 右下: 规则说明 ---- */}
        <p className={s["fm-note"]} style={{ right: "72px", bottom: "56px" }}>
          点卡面查看队员详情 · 点右上角开关上阵 / 下阵 · 至少保留 1 名队员上阵
        </p>
    </StageCanvas>
  );
}

// ===================== 角色卡 =====================
// ⚠⚠ 外壳是 div 而**不是 button**: 卡面本身要能点(进详情), 右上角还有一个开关也要能点,
//   而 button 里嵌 button 是非法 HTML(浏览器会把内层拆出去, 点击行为随之乱掉)。
//   故做成「div 外壳 + 两个同级 button」: .fm-card-main 铺满整卡, .fm-toggle 绝对定位压在它上面。
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
  onField: boolean; // 是否已上阵 → 异色边框
  lastOne: boolean; // 场上只剩这一个人了(下阵会被 store 拒绝)
  full: boolean; // 上阵人数已满
  size: number;
  shared: boolean; // 本次过场里与详情页配对的就是这张卡 → 挂共享的 view-transition-name
  onOpen: () => void;
  onToggle: () => void;
}) {
  const def = getCharacter(cs.charId);
  const stats = deriveStats(cs);

  // 禁用口径与 townStore.toggleParty 的兜底规则一一对应 —— 那边会静默 return,
  // 这里把原因用 title 说出来, 免得点了没反应像是界面坏了。
  const blocked = onField ? lastOne : full;
  const reason = onField ? "至少要保留 1 名队员上阵" : `上阵人数已达上限 ${size} 人`;

  // ---- 共享元素过场的命名(规则见 app/viewTransition.global.css) ----
  // ★ 配对的那张卡: 面板/立绘窗/角色名分别与详情页的立绘栏/展示柜/大标题**同名** ⇒ 形变;
  //   卡上那些详情页没有对应物的零件(数值、"查看详情"、角标、开关)各自单独命名 ⇒ 干脆淡掉。
  //   ⚠ 单独命名不是可选项: 不给名字它们会被烘进卡面板那张位图, 跟着一起被拉伸成
  //     立绘栏的形状, 文字会糊成一条。
  // ★ 其余的卡: 按索引各拿一个名, 好让 CSS 那张延迟表做出依次错位的退场。
  //   ⚠ 超出 VT_CARD_SLOTS 的给 "none" 而不是回绕取模 —— 撞名会让浏览器放弃整次过场。
  const panelName = shared
    ? "vt-card-panel"
    : index < VT_CARD_SLOTS
      ? `vt-fm-card-${index}`
      : "none";
  const partName = (name: string) => ({ viewTransitionName: shared ? name : "none" }) as CSSProperties;

  return (
    <div
      className={cx(s["fm-card"], onField && s["is-on"])}
      style={{ ...stagger(index), viewTransitionName: panelName }}
    >
      <button className={s["fm-card-main"]} type="button" onClick={onOpen}>
        {/* 立绘取景窗: 顶满卡宽的一扇窗, 立绘放大后顶对齐 ⇒ 只露上半身(尺寸在 CSS 的 --fm-bust-zoom)。 */}
        <span className={s["fm-card-figure"]} style={partName("vt-portrait")}>
          <CharacterPortrait
            characterId={def.id}
            emoji={def.emoji}
            alt={def.name}
            className={s["fm-bust"]}
          />
        </span>
        <span className={s["fm-card-name"]} style={partName("vt-char-name")}>
          {def.name}
        </span>
        <span className={s["fm-card-meta"]} style={partName("vt-fm-meta")}>
          {Math.round(stats.maxHp)} HP · 攻 {Math.round(stats.attack)} · 卡组 Lv.{cs.deckLevel}
        </span>
        <span className={s["fm-card-go"]} style={partName("vt-fm-go")}>
          查看详情 ▸
        </span>
      </button>

      {/* 上阵状态标: 纯展示, 不接受点击(pointer-events 在 CSS 里关掉), 免得挡住卡面。 */}
      {onField && (
        <span className={s["fm-card-flag"]} style={partName("vt-fm-flag")}>
          出战中
        </span>
      )}

      <button
        className={cx(s["fm-toggle"], onField && s["is-on"])}
        type="button"
        disabled={blocked}
        title={blocked ? reason : undefined}
        style={partName("vt-fm-toggle")}
        onClick={onToggle}
      >
        {onField ? "下阵" : "上阵"}
      </button>
    </div>
  );
}
