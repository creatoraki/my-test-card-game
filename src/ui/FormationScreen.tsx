// 编队页 —— 据点的**一级全屏页**(runStore 的 screen === "formation"), 入口是大厅 bento 右上那块
// 「编队」砖。⚠ 它不是设施内场景: 不走 TownScreen 的进设施运镜, 也不挂在据点画布里,
//   而是与 explore / battle 平级的顶层界面, 切换由 ui/ScreenTransition 的默认淡出淡入负责。
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

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { RULES } from "../engine";
import { getCharacter } from "../data";
import { useRunStore } from "../store/runStore";
import { deriveStats, useTownStore, type CharacterState } from "../store/townStore";
import { CharacterPortrait } from "./CharacterPortrait";
import { useStageScale } from "./stage";
import fmBg from "../assets/场景/冬眠仓.png";
import "./FormationScreen.css";

// 错峰入场的序号。CSS 用 --i 算 animation-delay(见 .fm-card 那条), 这里只负责把序号递给样式层。
const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

export function FormationScreen() {
  const characters = useTownStore((s) => s.characters);
  const awakened = useTownStore((s) => s.awakened);
  const party = useTownStore((s) => s.party);
  const toggleParty = useTownStore((s) => s.toggleParty);
  const enterTown = useRunStore((s) => s.enterTown);
  const openCharDetail = useRunStore((s) => s.openCharDetail);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageScale = useStageScale(viewportRef);

  const size = RULES.progression.partySize;
  const full = party.length >= size;

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
    // letterbox 容器: 铺满窗口, 画布之外的部分是黑边(见 .fm-viewport)
    <div
      className="fm-viewport"
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      {/* 画布 = 固定 1920×1080, 整体等比缩放适配窗口 ⇒ 构图永不随分辨率变。 */}
      <div className="screen fm-stage">
        {/* 背景: 冬眠仓那张 16:9 场景图, 与画布同比例 ⇒ cover 只等比缩小, 无裁切无变形。 */}
        <img className="fm-bg" src={fmBg} alt="" draggable={false} />
        {/* 提亮层: 背景本身是浅色紫粉白, 这里再往白里推一档, 给玻璃卡挣出对比度。
            ⚠ 不是压暗层 —— 压暗会毁掉这张图的气质(与 CryoScene 同一条取舍)。 */}
        <div className="fm-veil" />

        {/* ---- 左上: 标题 ---- */}
        <header className="fm-header" style={{ left: "72px", top: "48px" }}>
          <span className="fm-kicker">SQUAD FORMATION</span>
          <h2 className="fm-title">编队</h2>
          <p className="fm-sub">出战编成 · 队员一览</p>
        </header>

        {/* ---- 右上: 读数 chip ---- */}
        <div className="fm-readout" style={{ right: "72px", top: "48px" }}>
          <div className="fm-chip">
            <span className="fm-chip-label">上阵</span>
            <strong className="fm-chip-value">
              {party.length} / {size}
            </strong>
          </div>
          <div className="fm-chip">
            <span className="fm-chip-label">待命</span>
            <strong className="fm-chip-value">{awakened.length - party.length}</strong>
          </div>
          <div className="fm-chip">
            <span className="fm-chip-label">已唤醒</span>
            <strong className="fm-chip-value">{awakened.length}</strong>
          </div>
        </div>

        {/* ---- 卡片阵列 ----
            ★ 位置/尺寸旋钮全在下面的内联 style(设计 px), CSS 只负责机制(网格与卡片外观)。
              卡片是 260×650 的高楼型(≈1:2.5), auto-fill 下 1776px 宽正好排 6 列;
              阵列自己滚, 人再多也不会顶破版面。 */}
        <div
          className="fm-grid"
          style={{
            left: "72px", // ← 距画布左边(设计 px)
            top: "184px", // ← 落在标题/读数下方
            width: "1776px", // ← 两侧各留 72px
            height: "770px", // ← 到底部说明栏上方
            gap: "20px",
          }}
        >
          {roster.length === 0 ? (
            <p className="fm-empty">
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
                onOpen={() => openCharDetail(id)}
                onToggle={() => toggleParty(id)}
              />
            ))
          )}
        </div>

        {/* ---- 左下: 返回 ---- */}
        <button
          className="fm-back"
          style={{ left: "72px", bottom: "48px" }}
          type="button"
          onClick={() => enterTown()}
        >
          ← 返回据点
        </button>

        {/* ---- 右下: 规则说明 ---- */}
        <p className="fm-note" style={{ right: "72px", bottom: "56px" }}>
          点卡面查看队员详情 · 点右上角开关上阵 / 下阵 · 至少保留 1 名队员上阵
        </p>
      </div>
    </div>
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
  onOpen,
  onToggle,
}: {
  cs: CharacterState;
  index: number;
  onField: boolean; // 是否已上阵 → 异色边框
  lastOne: boolean; // 场上只剩这一个人了(下阵会被 store 拒绝)
  full: boolean; // 上阵人数已满
  size: number;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const def = getCharacter(cs.charId);
  const stats = deriveStats(cs);

  // 禁用口径与 townStore.toggleParty 的兜底规则一一对应 —— 那边会静默 return,
  // 这里把原因用 title 说出来, 免得点了没反应像是界面坏了。
  const blocked = onField ? lastOne : full;
  const reason = onField ? "至少要保留 1 名队员上阵" : `上阵人数已达上限 ${size} 人`;

  return (
    <div className={`fm-card${onField ? " is-on" : ""}`} style={stagger(index)}>
      <button className="fm-card-main" type="button" onClick={onOpen}>
        {/* 立绘取景窗: 顶满卡宽的一扇窗, 立绘放大后顶对齐 ⇒ 只露上半身(尺寸在 CSS 的 --fm-bust-zoom)。 */}
        <span className="fm-card-figure">
          <CharacterPortrait
            characterId={def.id}
            emoji={def.emoji}
            alt={def.name}
            className="fm-bust"
          />
        </span>
        <span className="fm-card-name">{def.name}</span>
        <span className="fm-card-meta">
          {Math.round(stats.maxHp)} HP · 攻 {Math.round(stats.attack)} · 卡组 Lv.{cs.deckLevel}
        </span>
        <span className="fm-card-go">查看详情 ▸</span>
      </button>

      {/* 上阵状态标: 纯展示, 不接受点击(pointer-events 在 CSS 里关掉), 免得挡住卡面。 */}
      {onField && <span className="fm-card-flag">出战中</span>}

      <button
        className={`fm-toggle${onField ? " is-on" : ""}`}
        type="button"
        disabled={blocked}
        title={blocked ? reason : undefined}
        onClick={onToggle}
      >
        {onField ? "下阵" : "上阵"}
      </button>
    </div>
  );
}
