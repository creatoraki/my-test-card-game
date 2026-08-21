// ds tab 的 demo: BUFF 图标陈列台(培育 · 植物 / 锋利 / 心眼 / 护盾)。
//
// 这里只做「陈列 + 说明」, 图标本体在 ../DsPlantBuffIcons(五个 1:1 自包含 SVG,
// viewBox 0 0 128 128, 满幅圆角方框, 无文字无外部图片):
//   · 培育植物(进行中) ——「萌发」: 裂壳种子, 嫩芽从裂缝探出, 2/3 进度弧 + 游标;
//   · 培育植物(完成)   ——「绽放」: 八瓣花冠 + 满圈完成环 + 8 根环外指针 + 托带;
//   · 锋利             ——「霓虹破甲箭镞」: 多面切割钢镞, 左右双面 + 中央脊线,
//     血槽霓虹红线 + 尖端见血, 赤红收口宝石 + 套筒能量槽, 漂浮能量碎片;
//   · 心眼             ——「圣辉全视之眼」: 三层三角嵌套 + 双层虹膜 + 旋转菱形双瞳,
//     顶点宝石 + 缎带托带, 七道长芒;
//   · 护盾             ——「辉光能量圆盾」: 四层同心 + 外环刻线 + 能量导管,
//     菱形盾心宝石 + 辉光环 + 双线力场弧 + 能量节点。
//
// ★ v9 设计语言: 霓虹宝石徽章 ★
//   外框: 五个图标共用同一套**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 /
//   三道描边), 内容一律裁进内沿 —— 压在任何背景上都不漏角、零外溢;
//   厚涂: 主体都是「底色 / 暗面 / 亮边」三层叠在同一块形上(半边高光路径);
//   宝石核心: 战斗三态各有一颗「宝石」收口 —— 白心爆点 + 内菱高光, 各枚的亮度峰值;
//   霓虹能量: 血槽红线 / 虹膜放射纹 / 盾面导管与刻线 —— 每枚一处点缀, 不抢主体;
//   光亮: 外发光滤镜按配色控制强度(战斗三态比 v8 推高一档) + 框内光池 +
//   中央微热点 + 四边内投影;
//   颜色: 五套独立复合配色(深靛褐绿 / 深赭金橙 / 冰蓝·霓虹红 / 深紫·金白 / 深蓝·霓虹青);
//   构图: 战斗三态是**多层同心 + 双面切光 + 宝石核心 + 能量点缀**的厚涂拟物 ——
//   主体一律顶到框边, 剪影(竖镞 / 尖三角 / 圆)与色相是两条区分线,
//   缩到 20px 依然可读。
//
// ★ v9 起战斗三态仍为**静态图标**: 锋利 / 心眼 / 护盾 不收 animated 开关, 形靠层次
//   立住, 不靠动效撑; 只有培育两枚保留克制的呼吸 / 摆动 / 轮转(全部挂在
//   .animated 作用域下, animated=false 与 prefers-reduced-motion 两条关停路径都生效)。
//
// 语义对齐卡牌设定: 「培育 N」计数归零后卡面效果升级; 锋利(sharp)使攻击伤害 ×1.1;
// 心眼是卡牌实例标记; 护盾吸收伤害。
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
          <span className={s.kicker}>DS ARCHIVE / BUFF ICONS v9 · NEON GEM</span>
          <h2>BUFF 图标陈列台</h2>
        </div>
        <p className={s.headerNote}>
          五个 1:1 正方形 BUFF 图标, <b>共用同一套满幅圆角方框</b>(外沿暗环 / 底板 /
          光池 / 中央微热点 / 内投影 / 三道描边, 内容裁进内沿、零外溢); 每个主体用
          <b>厚涂三层</b>(底色 / 暗面 / 亮边)立起体积; 战斗三态在 v9 升级为
          <b>霓虹宝石徽章</b> —— 多面切割 + 宝石核心 + 霓虹能量线, 辨识度来自 ——{" "}
          <b>颜色</b>(褐绿 / 金橙 / 冰蓝带血 / 金白 / 全蓝)、<b>形状</b>(裂壳芽 /
          花冠 / 箭镞 / 三角眼 / 圆盾); 培育两枚按状态强弱分级<b>外发光</b>与
          <b>克制动画</b>, 战斗三态为<b>静态图标</b> —— 层次靠多层同心 + 双面切光,
          不靠动效撑。
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
              「霓虹破甲箭镞」: 多面切割钢镞占满画面 —— 外廓剪影 + 左右双面
              (右受光 / 左背光) + 内芯 + 中央脊线高光, 五层内缩;
              血槽内一道霓虹红线, 尖端见血沿血槽下淌, 赤红菱形宝石收口,
              套筒带能量槽线, 两侧漂浮能量碎片。
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
              「圣辉全视之眼」: 三层三角嵌套(暗底外三角 + 金白中三角)托一枚
              双层虹膜正圆 —— 外金环 + 内白环 + 8 条放射纹, 旋转嵌套双菱瞳孔
              透光, 顶点大菱形宝石, 缎带托带中央小菱, 七道长短放射光芒。
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
              「辉光能量圆盾」: 满幅圆盾四层同心 —— 外环(12 段刻线 + 霓虹细环) /
              盾面 / 内盘 / 菱形盾心宝石(白心 + 辉光环), 四根能量导管贯通盾面,
              上缘受光 + 左半背光切面, 双线力场光弧, 六枚能量节点。
            </p>
          </figcaption>
        </figure>
      </div>

      <aside className={s.notes} aria-label="设计说明">
        <span className={s.notesTitle}>设计要点</span>
        <ul>
          <li>
            <b>满幅圆角方框</b> — 五个图标共用同一套外框: 外沿暗环 / 底板 / 光池 /
            中央微热点 / 内投影 / 三道描边, 内容裁进内沿、零外溢
          </li>
          <li>
            <b>厚涂三层</b> — 每个主体都是底色 / 暗面 / 亮边叠在同一块形上(半边高光路径)
          </li>
          <li>
            <b>宝石核心</b> — 战斗三态各有一颗宝石收口: 白心爆点 + 内菱高光,
            是各枚的亮度峰值
          </li>
          <li>
            <b>霓虹能量线</b> — 血槽红线 / 虹膜放射纹 / 盾面导管与刻线,
            每枚只给一处点缀, 不抢主体
          </li>
          <li>
            <b>颜色区分</b> — 褐绿 / 金橙 / 冰蓝带血 / 金白 / 全蓝, 五套独立复合配色
          </li>
          <li>
            <b>战斗三态静态</b> — 锋利 / 心眼 / 护盾为静态图标: 形靠多层同心 +
            双面切光立住, 不靠动效撑; 培育两枚保留克制呼吸 / 摆动 / 轮转
          </li>
        </ul>
      </aside>
    </div>
  );
}
