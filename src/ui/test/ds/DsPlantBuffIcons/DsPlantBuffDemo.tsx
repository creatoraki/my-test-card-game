// ds tab 的 demo: BUFF 图标陈列台(培育 · 植物 / 锋利 / 心眼 / 护盾)。
//
// 这里只做「陈列 + 说明」, 图标本体在 ../DsPlantBuffIcons(五个 1:1 自包含 SVG,
// viewBox 0 0 128 128, 满幅圆角方框, 无文字无外部图片):
//   · 培育植物(进行中) ——「萌发」: 裂壳种子, 嫩芽从裂缝探出, 2/3 进度弧 + 游标;
//   · 培育植物(完成)   ——「绽放」: 八瓣花冠 + 满圈完成环 + 8 根环外指针 + 托带;
//   · 锋利             ——「直刃」: 一把竖直太刀 + 剑尖金星;
//   · 心眼             ——「洞悉」: 金属义眼(紫铜环带 + 虹膜 + 发光瞳孔) + 洞察棱光;
//   · 护盾             ——「壁垒」: 一块青蓝圆盾 + 中央菱形核心。
//
// ★ v6 设计语言: 厚涂方框 + 光池内影 + 少元素剪影 ★
//   外框: 五个图标共用同一套**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 /
//   三道描边), 内容一律裁进内沿 —— 压在任何背景上都不漏角、零外溢;
//   厚涂: 主体都是「底色 / 暗面 / 亮边」三层叠在同一块形上(半边高光路径);
//   光亮: 外发光滤镜按配色控制强度(培育中弱 / 完成态强) + 框内光池 + 四边内投影;
//   颜色: 五套独立复合配色(深靛褐绿 / 深赭金橙 / 深钢蓝银 / 深紫品红 / 深青青蓝);
//   构图: 每枚只留两到三件形(种子+芽 / 花冠 / 刀 / 眼 / 盾) —— 元素越少剪影越硬,
//   缩到 20px 依然可读。
//
// 语义对齐卡牌设定: 「培育 N」计数归零后卡面效果升级; 锋利(sharp)使攻击伤害 ×1.1;
// 心眼是卡牌实例标记; 护盾吸收伤害。
//
// 动效为克制的 CSS 呼吸/摆动/缓转(全部挂在 .animated 作用域下),
// animated=false 与 prefers-reduced-motion 两条关停路径都能生效。
import {
  CultivatingPlantBuffIcon,
  CultivatedPlantBuffIcon,
  SharpBuffIcon,
  MindEyeBuffIcon,
  ShieldBuffIcon,
} from "./DsPlantBuffIcons";
import { cx } from "@/ui/common/cx";
import s from "./DsPlantBuffDemo.module.css";

export function DsPlantBuffDemo() {
  return (
    <div className={s.root}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>DS ARCHIVE / BUFF ICONS v6 · THICK-PAINT FRAME</span>
          <h2>BUFF 图标陈列台</h2>
        </div>
        <p className={s.headerNote}>
          五个 1:1 正方形 BUFF 图标, <b>共用同一套满幅圆角方框</b>(外沿暗环 / 底板 /
          光池 / 内投影 / 三道描边, 内容裁进内沿、零外溢); 每个主体用<b>厚涂三层</b>
          (底色 / 暗面 / 亮边)立起体积, <b>外发光</b>按状态强弱分级; 辨识度来自 ——{" "}
          <b>颜色</b>(褐绿 / 金橙 / 银白 / 品红紫 / 青蓝)、<b>光亮</b>(弱内敛 / 强外放 /
          锐聚焦 / 聚光 / 沉冷光)、<b>形状</b>(裂壳芽 / 花冠 / 直刃 / 义眼 / 圆盾)。
        </p>
      </header>

      <div className={s.gallery}>
        <figure className={cx(s.card, s.growingCard)}>
          <div className={s.iconSlot}>
            <CultivatingPlantBuffIcon className={s.icon} />
          </div>
          <figcaption>
            <span className={s.badge}>培育 · 进行中</span>
            <h3>培育植物</h3>
            <p>
              「萌发」: 暖褐种子壳中央一道裂缝, 青绿嫩芽从缝里探出, 壳底须根下探。
              2/3 进度弧 + 游标缓行, 整体压暗只留芽尖一个亮点 —— 过程还没完。
            </p>
          </figcaption>
        </figure>

        <figure className={cx(s.card, s.doneCard)}>
          <div className={s.iconSlot}>
            <CultivatedPlantBuffIcon className={s.icon} />
          </div>
          <figcaption>
            <span className={s.badge}>培育 · 完成</span>
            <h3>培育植物 · 完成</h3>
            <p>
              「绽放」: 八瓣花冠(外层实瓣 + 内层错开 22.5° 小瓣), 瓣根金橙瓣尖黄绿,
              满圈完成环 + 8 根环外指针, 光环外推、品红托带 —— 亮度整体推高一档。
            </p>
          </figcaption>
        </figure>

        <figure className={cx(s.card, s.sharpCard)}>
          <div className={s.iconSlot}>
            <SharpBuffIcon className={s.icon} />
          </div>
          <figcaption>
            <span className={s.badge}>攻击强化</span>
            <h3>锋利</h3>
            <p>
              「直刃」: 一把竖直太刀, 刀身左亮右暗银白渐变, 刃口亮边 + 剑脊分面,
              剑尖金星聚焦。磨石、火星、放射光全部去掉 —— 一把刀, 剪影最硬。
            </p>
          </figcaption>
        </figure>

        <figure className={cx(s.card, s.mindCard)}>
          <div className={s.iconSlot}>
            <MindEyeBuffIcon className={s.icon} />
          </div>
          <figcaption>
            <span className={s.badge}>卡牌标记</span>
            <h3>心眼</h3>
            <p>
              「洞悉」: 一只金属义眼 —— 紫铜环带(外圆 + 内圆合成厚度) + 品红紫虹膜,
              发光瞳孔聚焦脉动, 眼顶一道金白洞察棱光向上放射。
            </p>
          </figcaption>
        </figure>

        <figure className={cx(s.card, s.shieldCard)}>
          <div className={s.iconSlot}>
            <ShieldBuffIcon className={s.icon} />
          </div>
          <figcaption>
            <span className={s.badge}>防御</span>
            <h3>护盾</h3>
            <p>
              「壁垒」: 一块青蓝圆盾, 面渐变 + 左上受光高光, 中央菱形核心呼吸发光。
              六边形线、能量弧、投影、漂浮泡全部去掉 —— 一块盾 + 一颗核心。
            </p>
          </figcaption>
        </figure>
      </div>

      <aside className={s.notes} aria-label="设计说明">
        <span className={s.notesTitle}>设计要点</span>
        <ul>
          <li>
            <b>满幅圆角方框</b> — 五个图标共用同一套外框: 外沿暗环 / 底板 / 光池 /
            内投影 / 三道描边, 内容裁进内沿、零外溢
          </li>
          <li>
            <b>厚涂三层</b> — 每个主体都是底色 / 暗面 / 亮边叠在同一块形上(半边高光路径)
          </li>
          <li>
            <b>颜色区分</b> — 褐绿 / 金橙 / 银白 / 品红紫 / 青蓝, 五套独立复合配色
          </li>
          <li>
            <b>光亮分级</b> — 外发光滤镜按状态强弱: 培育中弱内敛 / 完成态强外放
          </li>
          <li>
            <b>形状区分</b> — 裂壳芽 / 花冠 / 直刃 / 义眼 / 圆盾, 每枚只留两到三件形,
            剪影互不混淆
          </li>
          <li>
            <b>动效克制</b> — 呼吸/摆动/缓转均 2.4~9s 慢速, 两条关停路径生效
          </li>
        </ul>
      </aside>
    </div>
  );
}
