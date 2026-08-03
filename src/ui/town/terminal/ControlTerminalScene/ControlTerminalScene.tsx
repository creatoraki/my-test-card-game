// 控制终端(据点设施 worklog)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 设定依据: 游戏设定.md 第四节据点设施表「控制终端 | 接取任务、选择地下城、结算城市居民积分」。
//
// 两个功能入口(右侧的**抽屉**: 常态半隐在画布右缘外, 悬浮哪条哪条向左弹出):
//   ① 下降舱 —— 出击。浮层里选一张地下城地图 → startExpedition(mapId) → 探索牌局。
//   ② 委托   —— 接取城市维护工单。**本次只做 UI 骨架**: 三条示例工单全部灰化标「未接入」。
//
// 与据点大厅同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照着 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。
//
// ★ 配色刻意**不复用大厅的 .bento-glass**: 控制终端.png 是一张纯白高亮的洁净控制室, 大厅那套
//   「暗色毛玻璃 + 亮青霓虹」压在白底上文字会糊。这里是一套亮玻璃(白雾底 + 深墨字 + 深青描边),
//   变量集中在 ControlTerminalScene.css 顶部的 --term-* 里。
//
// ⚠ 本组件的根节点 .term-scene **永远不能挂 animation / opacity / transform**: 一旦祖先成为
//   backdrop root, 底下亮玻璃砖的 backdrop-filter 就取不到设施背景, 会糊成一块死板。
//   故入场/退场动画一律挂在叶子元素身上(见 CSS 里 termRise / termFade 的挂法)。

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { RULES } from "@/engine";
import { MAPS, getCharacter } from "@/data";
import { useRunStore } from "@/store/runStore";
import { deriveStats, useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { mapArt, warmMapArt } from "@/ui/art/mapArt";
import { cx } from "@/ui/common/cx";
import s from "./ControlTerminalScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

// 浮层滑出的时长。⚠ 这个数与 ControlTerminalScene.css 里 termPanelOut 的 duration 是**同一个值**,
// 改一处必须改两处 —— JS 靠它决定什么时候真正卸载面板, CSS 靠它播完滑出。
const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180; // 「减少动态效果」下退化成一次短促淡出(见 CSS 末尾的降级块)

// 两块浮层各自的尺寸(设计 px)。⚠ 除了给面板本体当 width/height, 还要以 CSS 变量的形式传给外层
// .term-modal —— 顶上那两根吊绳是 .term-modal 的伪元素, 靠这两个数算出「该垂到面板顶边的哪两点」
// (见 CSS 的 .term-modal::before / ::after)。改尺寸只改这里一处, 绳子会自己跟上。
const PANEL_SIZE: Record<PanelId, { w: number; h: number }> = {
  descent: { w: 1240, h: 660 },
  commission: { w: 900, h: 540 },
};

// ===================== 图标 =====================
// 画法与大厅设施图标统一(见 TownScreen.tsx 顶部): 48×48 视框、stroke="currentColor"、
// 外轮廓 strokeWidth 1.2 + opacity .38 当陪衬、主体 1.6。刻意不用 emoji。

// 下降舱: 电梯井外框 + 舱厢 + 三段递减的向下箭头(读作「往下走」)。
function DescentIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* 井道: 压低透明度当陪衬 */}
      <path d="M8 4h32v40H8z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      {/* 舱厢 + 中缝(双开门) */}
      <path d="M14 9h20v20H14z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M24 9v20" strokeWidth={1.2} opacity={0.6} />
      {/* 下行指示: 三段递减的 V, 越往下越窄 */}
      <path d="M18 34.5l6 5 6-5" strokeWidth={1.6} />
      <path d="M20 40.5l4 3.5 4-3.5" strokeWidth={1.4} opacity={0.66} />
    </svg>
  );
}

// 委托: 工单纸(右上折角) + 长短错落三行 + 一枚受理印章圆。
function CommissionIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* 纸张 + 折角: 折角靠两段路径拼, 比整块矩形更像「一张单子」 */}
      <path
        d="M10 4h20l8 8v32H10z"
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.38}
      />
      <path d="M30 4v8h8" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      {/* 长短错落的三行 = 一份委托条款 */}
      <path d="M16 18h12M16 24h16M16 30h9" strokeWidth={1.6} />
      {/* 右下角的受理印章 */}
      <circle cx="30" cy="35" r="5.5" strokeWidth={1.6} />
      <path d="M27.4 35l2 2 3.4-3.6" strokeWidth={1.4} />
    </svg>
  );
}

// ===================== 委托占位数据 =====================
// ⚠ **不进 data/ 层**: 工单系统还没有任何规则, 这三条只是给 UI 骨架填的字, 一旦真做了委托系统
//   就整段删掉换成真数据源。措辞照 游戏设定.md:35-44 的三类城市维护任务。
// 常量在模块级算一次即可, 不需要 useMemo(与 MenuStartButton.tsx 的粒子参数同款约定)。
const COMMISSIONS = [
  {
    kind: "回收",
    name: "回收失控机器人",
    desc: "清运区 B7 有一台失控的清扫机械正在破坏过滤管线。",
  },
  {
    kind: "维修",
    name: "维修城市装置",
    desc: "第 14 区的粒子过滤节点连续三日读数异常。",
  },
  {
    kind: "运送",
    name: "运送物资",
    desc: "量子配给终端请求补充耗材, 路线经由下水管道。",
  },
] as const;

// 当前打开的浮层; null = 没开, 只看得到场景与两个入口。
type PanelId = "descent" | "commission";

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

export function ControlTerminalScene({ leaving = false }: Props) {
  const loot = useTownStore((s) => s.loot);
  const party = useTownStore((s) => s.party);
  const characters = useTownStore((s) => s.characters);
  const startExpedition = useRunStore((s) => s.startExpedition);

  const [panel, setPanel] = useState<PanelId | null>(null);
  // 关窗**不能**直接卸载: 那样滑出动画根本没机会播(元素当场消失)。故先进 closing 态让 CSS 播滑出,
  // 播完再真的把 panel 置空 —— 与 TownScreen 的 leaving 阶段是同一套「留到演出走完才卸载」的做法。
  const [closing, setClosing] = useState(false);
  const [mapId, setMapId] = useState(MAPS[0].id);

  // 预览图 3.4MB, 一进设施就先拉 —— 等点开下降舱才发请求会先闪一片空底色。
  useEffect(warmMapArt, []);

  // 所有关窗路径(✕ / 点面板外空白 / Esc)都走这里, 保证一定播完滑出。
  // 滑出途中重复调用是安全的: 置同一个 true 不会触发重渲染, 上面的计时器也就不会被重置。
  const closePanel = useCallback(() => setClosing(true), []);

  // 滑出播完 → 真正卸载。⚠ 计时器挂在 effect 里而不是裸 setTimeout: 返回据点时本组件会被卸载,
  // 清理函数顺手把它清掉, 不会有卸载后 setState。
  useEffect(() => {
    if (!closing) return;
    const ms = prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS;
    const id = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
    }, ms);
    return () => clearTimeout(id);
  }, [closing]);

  // Esc 关浮层。只在浮层开着时挂监听, 免得白占一个全局键位。
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  const selected = MAPS.find((m) => m.id === mapId) ?? MAPS[0];

  return (
    <div className={cn("term-scene", leaving && "is-leaving")}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className={cn("term-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("term-kicker")}>CONTROL TERMINAL</span>
        <h2 className={cn("term-title")}>控制终端</h2>
        <p className={cn("term-sub")}>城市工单接入 · 下降通道授权</p>
      </header>

      {/* ---- 右上: 两枚读数 chip ---- */}
      <div className={cn("term-readout")} style={{ right: "56px", top: "42px" }}>
        <div className={cn("term-chip")}>
          <span className={cn("term-chip-label")}>终端积分</span>
          <strong className={cn("term-chip-value")}>{loot.toLocaleString()}</strong>
        </div>
        <div className={cn("term-chip")}>
          <span className={cn("term-chip-label")}>上阵</span>
          <strong className={cn("term-chip-value")}>
            {party.length} / {RULES.progression.partySize}
          </strong>
        </div>
      </div>

      {/* ---- 右侧抽屉: 功能入口 ----
          ★ 位置/尺寸旋钮全在下面的内联 style(设计 px), 直接改数值即可 —— CSS 只负责定位与滑动机制。
          ★ 贴画布右缘(right:0)、落在右上读数 chip 下方: 常态两条砖大部分被推出画布, 超出的部分由
            .town-splash 的 overflow:hidden 裁掉; 鼠标悬浮哪一条, 哪一条向左弹出完整宽度。
            这样场景本身(电梯 / 全息球 / 墙面数据屏 / 服务器机柜)一个都不遮。 */}
      <div
        className={cn("term-entries")}
        style={
          {
            right: "0px", // ← 贴画布右缘: 抽屉收起时超出的部分被画布裁掉
            top: "138px", // ← 落在右上 .term-readout(top:42, 实高约 72)下方, 留 24px 呼吸
            width: "460px", // ← 完全弹出时的条宽
            gap: "10px", // ← 两条砖之间的缝
            gridTemplateRows: "88px 88px", // ← 每条砖的高
            // ★ 本次唯一需要手调的旋钮: 收起时露在画布内的宽度。
            //   248px = 图标 + 名称 + 「未接入」小标读全之后还留一截余白, 收起态一眼能认出是可点的入口
            //   (只够卡着读完文字会显得像被切坏的边框)。嫌露太多就调小, 嫌找不到入口就调大。
            "--peek": "248px",
          } as CSSProperties
        }
      >
        <button className={cn("term-entry")} type="button" onClick={() => setPanel("descent")}>
          <span className={cn("term-rim")} aria-hidden />
          <span className={cn("term-entry-icon")}>
            <DescentIcon />
          </span>
          <span className={cn("term-entry-text")}>
            <span className={cn("term-entry-head")}>
              <span className={cn("term-entry-name")}>下降舱</span>
            </span>
            <span className={cn("term-entry-desc")}>出击 · 选定下降层</span>
          </span>
          <span className={cn("term-entry-go")} aria-hidden>
            ▸
          </span>
        </button>

        <button className={cn("term-entry")} type="button" onClick={() => setPanel("commission")}>
          <span className={cn("term-rim")} aria-hidden />
          <span className={cn("term-entry-icon")}>
            <CommissionIcon />
          </span>
          <span className={cn("term-entry-text")}>
            {/* 「未接入」小标必须与名称同行: 收起态右上角在画布外, 绝对定位的角标读不到。 */}
            <span className={cn("term-entry-head")}>
              <span className={cn("term-entry-name")}>委托</span>
              <span className={cn("term-flag")}>未接入</span>
            </span>
            <span className={cn("term-entry-desc")}>接取城市维护工单</span>
          </span>
          <span className={cn("term-entry-go")} aria-hidden>
            ▸
          </span>
        </button>
      </div>

      {/* ---- 浮层 ----
          ★ **没有全局遮罩**: 控制终端.png 是一张纯白洁净控制室, 压暗它换对比度会毁掉这张图的气质。
            面板本体改成白色毛玻璃, 靠模糊 + 重投影从场景里托起来(见 CSS 的 .term-panel)。
          外层 .term-modal 仍是一整层(只是完全透明): 点它关窗, 同时天然挡住底下的「返回据点」
          与两条抽屉 —— 不需要额外的禁用逻辑。⚠ 代价是那个按钮不再变暗, 看起来仍可点。
          ★ 开合都是**从画布上方滑入 / 滑回上方**(见 CSS 的 termPanelIn / termPanelOut)。
            is-closing 只挂在 .term-modal 上当选择器用 —— ⚠ 这一层自己绝不能挂动画, 它是面板的
            父元素, 一旦成为 backdrop root, 面板的 backdrop-filter 就取不到场景了。 */}
      {panel && (
        <div
          className={cn("term-modal", closing && "is-closing")}
          onClick={closePanel}
          style={
            {
              // 只是把面板尺寸转成变量给两根吊绳定位用, 本层自己**不因此产生任何视觉**
              // —— 尤其没有 transform/opacity/filter, 那会让它变成 backdrop root。
              "--panel-w": `${PANEL_SIZE[panel].w}px`,
              "--panel-h": `${PANEL_SIZE[panel].h}px`,
            } as CSSProperties
          }
        >
          {/* 点面板本体不该关窗, 故在这里截断冒泡 */}
          <section
            className={cn("term-panel")}
            onClick={(e) => e.stopPropagation()}
            style={{
              // 面板只给宽高(设计 px), 居中交给 .term-modal 的 flex —— 换尺寸不用回头算坐标。
              width: `${PANEL_SIZE[panel].w}px`,
              height: `${PANEL_SIZE[panel].h}px`,
            }}
          >
            {panel === "descent" ? (
              <>
                <div className={cn("term-panel-head")}>
                  <span className={cn("term-kicker")}>DESCENT POD / SECTOR SELECT</span>
                  <h3 className={cn("term-panel-title")}>下降舱 · 目标层选定</h3>
                  <button
                    className={cn("term-close")}
                    type="button"
                    onClick={closePanel}
                    aria-label="关闭"
                  >
                    ✕
                  </button>
                </div>

                <div className={cn("term-descent-body")} style={{ gridTemplateColumns: "420px 1fr" }}>
                  <div className={cn("term-map-list")}>
                    {MAPS.map((m, i) => (
                      <button
                        key={m.id}
                        className={cn("term-map-row", m.id === mapId && "is-active")}
                        type="button"
                        onClick={() => setMapId(m.id)}
                      >
                        <span className={cn("term-map-no")}>SECTOR-{String(i + 1).padStart(2, "0")}</span>
                        <span className={cn("term-map-name")}>{m.name}</span>
                        <span className={cn("term-map-stars")} title={`难度 ${m.difficulty} / 5`}>
                          {"★".repeat(m.difficulty)}
                          <span className={cn("term-dim")}>{"★".repeat(5 - m.difficulty)}</span>
                        </span>
                        <span className={cn("term-map-line")}>
                          {m.roundCount} 轮区域推进 · 第 {m.roundCount} 轮 BOSS 战
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className={cn("term-map-detail")}>
                    <div className={cn("term-map-shot")}>
                      <img src={mapArt(selected.id)} alt="" draggable={false} />
                      <span className={cn("term-map-shot-name")}>{selected.name}</span>
                    </div>
                    <p className={cn("term-map-desc")}>{selected.desc}</p>
                    <div className={cn("term-stat-row")}>
                      <div className={cn("term-stat")}>
                        <span className={cn("term-stat-label")}>难度</span>
                        <strong className={cn("term-stat-value")}>{selected.difficulty} / 5</strong>
                      </div>
                      <div className={cn("term-stat")}>
                        <span className={cn("term-stat-label")}>区域轮数</span>
                        <strong className={cn("term-stat-value")}>{selected.roundCount} 轮</strong>
                      </div>
                      <div className={cn("term-stat")}>
                        <span className={cn("term-stat-label")}>净化粒子</span>
                        <strong className={cn("term-stat-value")}>{selected.startingEnergy}</strong>
                      </div>
                    </div>
                    <div className={cn("term-party")}>
                      <span className={cn("term-stat-label")}>下降小队</span>
                      <div className={cn("term-party-row")}>
                        {party.map((id) => {
                          const c = getCharacter(id);
                          const cs = characters[id];
                          const s = deriveStats(cs);
                          return (
                            <span key={id} className={cn("term-party-chip")}>
                              <span className={cn("term-party-emoji")}>{c.emoji}</span>
                              <span className={cn("term-party-name")}>{c.name}</span>
                              <span className={cn("term-party-meta")}>
                                {Math.round(s.maxHp)} HP · 卡组 Lv.{cs.deckLevel}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn("term-panel-foot")}>
                  <p className={cn("term-note")}>
                    净化粒子只降不升 —— 掉得越低, 战斗越难、产出倍率也越高。
                  </p>
                  <button
                    className={cn("term-primary")}
                    type="button"
                    disabled={party.length === 0}
                    onClick={() => startExpedition(selected.id)}
                  >
                    确认下降 ▸
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={cn("term-panel-head")}>
                  <span className={cn("term-kicker")}>COMMISSION BOARD</span>
                  <h3 className={cn("term-panel-title")}>委托 · 城市维护工单</h3>
                  <button
                    className={cn("term-close")}
                    type="button"
                    onClick={closePanel}
                    aria-label="关闭"
                  >
                    ✕
                  </button>
                </div>

                <div className={cn("term-commission-body")}>
                  {COMMISSIONS.map((c) => (
                    <div key={c.name} className={cn("term-commission", "is-pending")}>
                      <span className={cn("term-commission-kind")}>{c.kind}</span>
                      <span className={cn("term-commission-text")}>
                        <span className={cn("term-commission-name")}>{c.name}</span>
                        <span className={cn("term-commission-desc")}>{c.desc}</span>
                      </span>
                      <span className={cn("term-commission-pay")}>城市居民积分 ×?</span>
                      <span className={cn("term-commission-state")}>未接入</span>
                    </div>
                  ))}
                </div>

                <div className={cn("term-panel-foot")}>
                  <p className={cn("term-note")}>
                    工单系统尚未接入 —— 委托的发布、验收与积分结算将在后续实现。
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
