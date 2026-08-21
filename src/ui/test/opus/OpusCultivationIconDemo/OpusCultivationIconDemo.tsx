// opus tab 的 demo: 「培育植物 / 培育完成」两枚 BUFF 图标的陈列台。
//
// 这个文件只做「陈列 + 控制台」, 图标本体在 ../CultivationSigil(线稿版) 与 common/BuffIcon(厚涂版),
// 三者互不知道对方的存在 —— 图标可以直接被正式 UI 引用, 不会把 demo 的 state 带过去。
//
// 陈列台刻意做了四件事, 都是判断一枚 BUFF 图标能不能上线的硬指标:
//   1. 版本比选: 线稿 v1 与厚涂 v2 两套方案同条件对比, 换版本三个区块一起跟着换;
//   2. 尺寸阶梯: 缩到 20px 还能不能认出来(状态条里就是这个量级);
//   3. 主色切换: 验证 v1 的颜色确实靠 currentColor 继承, 而不是写死在组件里
//      (v2 配色内建, 这组开关对它无效, 选中 v2 时整组置灰);
//   4. 情境小样: 塞进模拟状态条看观感, 大图好看不代表小图能用。
import { useState, type ReactElement } from "react";
import sceneBackground from "@/assets/占位场景素材.png";
import { cx } from "@/ui/common/cx";
import { InsightEmblem, KeenEmblem, WardEmblem } from "../CombatEmblem";
import { CultivatedEmblem, CultivatingEmblem } from "@/ui/common/BuffIcon";
import { CultivatedSigil, CultivatingSigil } from "../CultivationSigil";
import s from "./OpusCultivationIconDemo.module.css";

/** 尺寸阶梯: 从展示图一路缩到状态条里的实际用量。 */
const SIZES = [256, 128, 64, 32, 20] as const;

/** 可切的主色。图标本身不认这些值, 只认继承下来的 color。 */
const TONES = [
  { key: "duo", label: "双色（默认）", growing: "#4fd8c8", done: "#d8f329" },
  { key: "cyan", label: "冷青", growing: "#4fd8c8", done: "#4fd8c8" },
  { key: "lime", label: "荧光黄绿", growing: "#d8f329", done: "#d8f329" },
  { key: "accent", label: "继承 --accent", growing: "var(--accent)", done: "var(--accent)" },
] as const;

/** 「场景图」这一档是硬指标: 图标最终就是摆在偏暗的场景图上, 外框在这里立不住就是没做完。 */
const BACKDROPS = [
  { key: "scene", label: "场景图" },
  { key: "dark", label: "暗底" },
  { key: "panel", label: "面板" },
  { key: "light", label: "亮底" },
] as const;

/** 两套并行方案。v2 是后出的厚涂版, 默认先看它。 */
const VERSIONS = [
  { key: "v2", label: "厚涂 v2" },
  { key: "v1", label: "线稿 v1" },
] as const;

type ToneKey = (typeof TONES)[number]["key"];
type BackdropKey = (typeof BACKDROPS)[number]["key"];
type VersionKey = (typeof VERSIONS)[number]["key"];

type IconKey = "growing" | "done";

/** 一版画法的说明文案。 */
type VersionNote = { desc: string; beats: string[] };

/** 两版的构图与动效说明分开写: 同一枚 BUFF, 两套画法的卖点不是一回事。 */
const SPECS: { key: IconKey; name: string; sub: string; notes: Record<VersionKey, VersionNote> }[] = [
  {
    key: "growing",
    name: "培育植物",
    sub: "CULTIVATING",
    notes: {
      v1: {
        desc: "土壤剖面视角：闭合的种荚、探下的须根、未展开的芽尖。外圈进度弧停在 2/3 且断口朝下，是「还在长」的定量表达。",
        beats: ["种荚 3s 呼吸", "须根 5.2s 微摆", "进度弧断口 + 游标"],
      },
      v2: {
        desc: "一条地平线把画面切成两半：上面是左右严格对称的双叶芽，下面是悬空的实心土台，胚珠隔着土层透出唯一的亮点。全冷调、只留三件形，且不带环——有环 / 无环本身就是两态最快的区分。",
        beats: ["低亮度 · 弱发光", "无环 · 地平线横分割", "对称双叶（镜像同一条路径）", "胚珠 2.6s 明灭"],
      },
    },
  },
  {
    key: "done",
    name: "培育完成",
    sub: "CULTIVATED",
    notes: {
      v1: {
        desc: "正面纹章视角：六瓣花冠双层错开 30°、花心同心双环、外圈完成环满圈闭合，底部托带压一枚结算勾记。",
        beats: ["光环 2.4s 双圈外推", "花冠 4.4s 极缓轮转", "完成环满圈闭合"],
      },
      v2: {
        desc: "深赭底盘 + 金橙花瓣 + 黄绿瓣尖，托带一抹品红做冷暖对冲。整体推亮一档并放大外发光——并排时亮度差比形状更快被读到。",
        beats: ["高亮度 · 强发光", "瓣尖亮边 + 瓣根暗面", "花心暖白爆点", "完成环满圈闭合"],
      },
    },
  },
];

/**
 * 战斗三态。与培育两态**同规格不同族**: 外框、viewBox、内沿裁切完全一致(可互换槽位),
 * 但配色内建、没有线稿版, 而且**是静态图标** —— 所以它们只跟「背景」这一组开关联动,
 * 「版本」「主色」「动画」三组都不吃。render 因此不收参数。
 */
const COMBAT_SPECS: {
  key: string;
  name: string;
  sub: string;
  render: () => ReactElement;
  desc: string;
  beats: string[];
}[] = [
  {
    key: "keen",
    name: "锋利",
    sub: "KEEN",
    render: () => <KeenEmblem />,
    desc: "剪影从竖直改成斜置 40° 的对角。刃面上原本摞着「血槽 + 受光斜面 + 中脊」三条形，这一版并成一刀两面——沿中轴切开的背光左半与受光右半，交界自己就是中脊。四道锋芒线、四角寒芒、四道缠绳、第二滴血珠全部砍掉，换成一道贯穿画面的斜弧光。血从三处减到两处（刃身下段一抹 + 一滴垂血珠），亮点只剩右刃口那一条白。",
    beats: [
      "构成线 · 对角（整刀 rotate 40° + 一道贯穿弧光）",
      "一刀两面 · 交界自成中脊，不再单画线",
      "件数 12 → 4：刀 / 柄 / 弧光 / 血",
      "血珠不跟着转 · 受的是重力不是刀的倾角",
    ],
  },
  {
    key: "ward",
    name: "护盾",
    sub: "WARD",
    render: () => <WardEmblem />,
    desc: "剪影不动，里面全部重来。三层同心套娃换成两刀分面：一条横腰线压在盾最宽处切上下（上段打磨受光、下段沉），盾脊切左右（右受光、左背光），交叉出四个明度块——金属的体积是这么来的，不是在盾上画阴影。配件从「六铆钉 + 两侧光弧 + 三条交叉脉 + 五边形套五边形」砍到两件：双肩两枚铆钉 + 菱心四向刻线。",
    beats: [
      "构成线 · 横腰线（对位培育中那条地平线）",
      "两刀交叉分面 · 四个明度块，全是半透叠加",
      "菱心正压腰线上 · 把上下两段缝住",
      "件数 14 → 5，铆钉 6 → 2",
    ],
  },
  {
    key: "insight",
    name: "心眼",
    sub: "INSIGHT",
    render: () => <InsightEmblem />,
    desc: "剪影不动，周边重来。上一版拿额冠 + 四角睫线 + 上下轴线 + 虹膜内环 + 十二条纤维把「第三只眼」解释了五遍；这一版并成上下两道大弧（眉弧 / 承光弧），一件形同时干三件事——吃掉上下空白、给这枚自己的构成线、暗示这不是普通眼睛。厚涂只留大块的那几件：上睑投影、主副双高光、下眶反光；纤维减到 8 条并压沉，纹理不该被读成放射线。",
    beats: [
      "构成线 · 上下双弧夹一横眼",
      "配件 5 件 → 2 道弧",
      "厚涂只留大块 · 上睑投影 / 双高光 / 下眶反光",
      "虹膜纤维 12 → 8 条，且更沉",
    ],
  },
];

export function OpusCultivationIconDemo() {
  const [animated, setAnimated] = useState(true);
  const [tone, setTone] = useState<ToneKey>("duo");
  const [backdrop, setBackdrop] = useState<BackdropKey>("scene");
  const [version, setVersion] = useState<VersionKey>("v2");

  const palette = TONES.find((item) => item.key === tone) ?? TONES[0];
  /** 场景图这一档的图路径只有 JS 侧拿得到(靠打包器解析), 所以走行内样式而不是 CSS 类。 */
  const backdropStyle =
    backdrop === "scene" ? { backgroundImage: `url(${sceneBackground})` } : undefined;
  /** 厚涂版配色内建, 不吃外层的 color; 只有线稿版需要注入主色。 */
  const toneAware = version === "v1";

  const renderSigil = (key: IconKey, withAnim = animated) => {
    if (version === "v2") {
      return key === "growing" ? (
        <CultivatingEmblem animated={withAnim} />
      ) : (
        <CultivatedEmblem animated={withAnim} />
      );
    }
    return key === "growing" ? (
      <CultivatingSigil animated={withAnim} />
    ) : (
      <CultivatedSigil animated={withAnim} />
    );
  };

  /** 只有线稿版才把主色写进槽位; 厚涂版给 undefined, 免得留下无效的继承色。 */
  const slotColor = (key: IconKey) =>
    toneAware ? (key === "growing" ? palette.growing : palette.done) : undefined;

  return (
    <div className={s.root}>
      <header className={s.head}>
        <h1>培育植物 · BUFF 图标</h1>
        <p>
          {version === "v2"
            ? "厚涂拟物：满幅 1:1 圆角方框自带边界，内容全部裁在内沿以内、零外溢，可以直接压在场景图上。"
            : "纯 SVG 线稿，切角八边外框，只靠剪影区分两态，颜色全部继承 currentColor。"}
          {" 两版同为 viewBox 128×128 的 1:1 图形，可直接互换槽位。"}
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.group}>
          <span className={s.groupLabel}>版本</span>
          {VERSIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cx(s.chip, version === item.key && s.chipOn)}
              onClick={() => setVersion(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={s.group}>
          <span className={s.groupLabel}>动画</span>
          <button
            type="button"
            className={cx(s.chip, animated && s.chipOn)}
            onClick={() => setAnimated((v) => !v)}
          >
            {animated ? "开" : "关"}
          </button>
        </div>

        {/* 厚涂版配色内建, 这组开关对它无效 —— 整组置灰并写明原因, 而不是偷偷不生效。 */}
        <div className={cx(s.group, !toneAware && s.groupMuted)}>
          <span className={s.groupLabel}>主色</span>
          {TONES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cx(s.chip, toneAware && tone === item.key && s.chipOn)}
              disabled={!toneAware}
              onClick={() => setTone(item.key)}
            >
              {item.label}
            </button>
          ))}
          {toneAware ? null : <span className={s.groupNote}>厚涂版配色内建，不吃外层 color</span>}
        </div>

        <div className={s.group}>
          <span className={s.groupLabel}>背景</span>
          {BACKDROPS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cx(s.chip, backdrop === item.key && s.chipOn)}
              onClick={() => setBackdrop(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 大图并排: 两枚外框同规格, 核心构图完全不同。 */}
      <section className={cx(s.stage, s[`bg-${backdrop}`])} style={backdropStyle}>
        {SPECS.map((spec) => {
          const note = spec.notes[version];
          return (
            <article key={spec.key} className={s.card}>
              <div className={s.hero} style={{ color: slotColor(spec.key) }}>
                {renderSigil(spec.key)}
              </div>
              <h2 className={s.name}>
                {spec.name}
                <em>{spec.sub}</em>
              </h2>
              <p className={s.desc}>{note.desc}</p>
              <ul className={s.beats}>
                {note.beats.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* 尺寸阶梯: 判断图形在小尺寸下会不会糊 —— 厚涂版的暗面尤其容易在这里塌成一坨。 */}
      <section className={cx(s.scaleBar, s[`bg-${backdrop}`])} style={backdropStyle}>
        {SPECS.map((spec) => (
          <div key={spec.key} className={s.scaleRow}>
            <span className={s.rowLabel}>{spec.name}</span>
            <div className={s.scaleItems}>
              {SIZES.map((size) => (
                <div key={size} className={s.scaleItem}>
                  <div
                    className={s.scaleBox}
                    style={{ inlineSize: size, color: slotColor(spec.key) }}
                  >
                    {renderSigil(spec.key)}
                  </div>
                  <small>{size}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 情境小样: 塞进模拟状态条, 看它和其它 pip 摆在一起是什么观感。 */}
      <section className={s.context}>
        <span className={s.rowLabel}>状态条情境</span>
        <div className={s.pips}>
          {/* 厚涂版自带外框, 槽位不再叠一层边; 线稿版没有实底, 仍需要槽位背景托着。 */}
          <span className={cx(s.pip, version === "v2" && s.pipFramed)}>
            <span className={s.pipIcon} style={{ color: slotColor("growing") }}>
              {renderSigil("growing")}
            </span>
            <b>2</b>
          </span>
          <span className={cx(s.pip, version === "v2" && s.pipFramed)}>
            <span className={s.pipIcon} style={{ color: slotColor("done") }}>
              {renderSigil("done")}
            </span>
          </span>
          <span className={cx(s.pip, s.pipPlain)}>🔥</span>
          <span className={cx(s.pip, s.pipPlain)}>
            🛡<b>8</b>
          </span>
          <span className={cx(s.pip, s.pipPlain)}>⚡</span>
        </div>
      </section>

      {/* ── 战斗三态 ─────────────────────────────────────────
          单独起一段而不是并进上面的 stage: 这三枚是另一族 BUFF, 没有线稿版、配色也内建,
          混进"版本 / 主色"那套对比里只会让人以为它们也该跟着切。 */}
      <header className={s.head}>
        <h2 className={s.sectionTitle}>战斗 BUFF 图标 · 锋利 / 护盾 / 心眼</h2>
        <p>
          与培育两态同规格（viewBox 128×128、同一套三圈外框、内容全部裁在内沿以内），可直接互换槽位。
          <b>本轮按培育两态的美学整体重画</b>：上一版的病不在画得糙，在画得多——锋芒线、寒芒、缠绳、
          铆钉、光弧、交叉脉、虹膜纤维、额冠、睫线，每件单看都有道理，堆在 128 见方里就是一地碎屑，
          缩到 32px 全糊。抄培育版的四条：<b>构图只留三件形</b>、<b>明暗靠「面」不靠「线」</b>
          （每个主体切成明暗两面，交界自成脊）、<b>一条贯穿画面的构成线</b>
          （锋利＝对角／护盾＝横腰线／心眼＝上下双弧，与培育中的地平线、培育完成的中心放射互不重复）、
          <b>全枚只留一个亮点</b>（刃口一条白／菱心爆点／瞳心一粒）。
          区分仍压在剪影（斜刃／宽盾／横眼）与主题色（钢青带血／全蓝／金白）两条线上，
          任意一条单独拿掉都还能认。主题色是指定的，配色内建，不吃外层 color；
          <b>这三枚是静态图标，上面的「动画」开关对它们无效。</b>
        </p>
      </header>

      <section className={cx(s.stage, s.stageTriple, s[`bg-${backdrop}`])} style={backdropStyle}>
        {COMBAT_SPECS.map((spec) => (
          <article key={spec.key} className={s.card}>
            <div className={s.hero}>{spec.render()}</div>
            <h2 className={s.name}>
              {spec.name}
              <em>{spec.sub}</em>
            </h2>
            <p className={s.desc}>{spec.desc}</p>
            <ul className={s.beats}>
              {spec.beats.map((beat) => (
                <li key={beat}>{beat}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* 尺寸阶梯: 厚涂的暗面在小尺寸下最容易塌成一坨, 这一栏就是用来看它塌没塌。 */}
      <section className={cx(s.scaleBar, s[`bg-${backdrop}`])} style={backdropStyle}>
        {COMBAT_SPECS.map((spec) => (
          <div key={spec.key} className={s.scaleRow}>
            <span className={s.rowLabel}>{spec.name}</span>
            <div className={s.scaleItems}>
              {SIZES.map((size) => (
                <div key={size} className={s.scaleItem}>
                  <div className={s.scaleBox} style={{ inlineSize: size }}>
                    {spec.render()}
                  </div>
                  <small>{size}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 情境小样: 三枚自带外框, 直接铺满槽位, 不再叠一层边。 */}
      <section className={s.context}>
        <span className={s.rowLabel}>状态条情境</span>
        <div className={s.pips}>
          {COMBAT_SPECS.map((spec, i) => (
            <span key={spec.key} className={cx(s.pip, s.pipFramed)}>
              <span className={s.pipIcon}>{spec.render()}</span>
              {i === 1 ? <b>12</b> : null}
            </span>
          ))}
          <span className={cx(s.pip, s.pipPlain)}>🔥</span>
          <span className={cx(s.pip, s.pipPlain)}>⚡</span>
        </div>
      </section>
    </div>
  );
}
