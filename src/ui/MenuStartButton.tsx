import type { CSSProperties } from "react";
import startGameImg from "../assets/场景/开始游戏.png";
import "./MenuStartButton.css";

/**
 * 主菜单「开始游戏」按钮:一张青绿霓虹牌匾 PNG + 三层特效。
 *
 * ★ 核心手法 —— 用**同一张 PNG 的 alpha** 当 mask:
 *   特效层叠在 <img> 之上并 `mask-image: var(--start-mask)`, 于是光和粒子被裁进牌匾的真实
 *   剪影里 ⇒ 观感是「图片内部在发光」, 而不是外面套了个矩形光框。素材路径不写进 MenuStartButton.css
 *   (Vite 里 CSS 的相对 url() 易错), 而是这里 import 后经内联 style 下发成 --start-mask。
 *
 * 三层(z 由 DOM 顺序给, 见 MenuStartButton.css):
 *   .menu-start-motes   内部光尘 —— 单层 mask, 粒子只在牌匾内部上浮
 *   .menu-start-rim     轮廓跑光 —— 双 mask 相减出一条贴轮廓的环带, 里面转一道 conic 亮楔
 *                       空闲 3.6s/圈; 悬停直接提到 **0.05s/圈 = 20 圈/秒**(--rim-spin)
 *   .menu-start-sparks  外溢火星 —— **不加 mask**, 沿轮廓一圈被"甩"向外侧, 仅悬停时出现
 *
 * 强度总开关是 .menu-start 上的 --fx(空闲 0.35 / 悬停 1), 三层的透明度与辉光都乘它 ⇒
 * 「常驻弱效, 悬停增强」只有一个旋钮。**全程没有任何缩放**(悬停放大是这次要去掉的东西)。
 */

const MOTE_COUNT = 14; // 内部光尘颗数
const SPARK_COUNT = 24; // 外溢火星颗数(悬停才可见, 是"跑光甩火花"的主体, 所以给得比光尘还密)

// 确定性伪随机: 同一颗粒子每次渲染都拿到同一组数, 重渲染不会让它中途跳位。
// 与 ui/HpBar.tsx 的迸溅火花同一个 sin-hash(那边多一个 seq 维度, 这里粒子是常驻的, 不需要)。
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 78.233 + salt * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

// 粒子参数在模块级算一次: 它们是常量, 没必要每次渲染重算, 也就不需要 useMemo。
const MOTES: CSSProperties[] = Array.from({ length: MOTE_COUNT }, (_, i) => {
  const dur = 2.6 + rand(i, 1) * 1.6; // 2.6~4.2s 一个来回
  return {
    "--mx": `${8 + rand(i, 2) * 84}%`, // 起始横向位置(牌匾框内)
    "--my": `${20 + rand(i, 3) * 74}%`, // 起始纵向位置
    "--ms": `${2 + rand(i, 4) * 2}px`, // 点径 2~4px
    "--msway": `${(rand(i, 5) - 0.5) * 16}px`, // 横向摆幅(可正可负)
    "--mdur": `${dur}s`,
    // 负延迟: 挂载瞬间粒子就已经散在各自的相位上, 否则一层 14 颗会齐步同时冒出来像闪灯。
    // 同 .hc-edge::after 的 animation-delay: calc(var(--deal-i) * -0.9s)。
    "--mdel": `${-rand(i, 6) * dur}s`,
  } as CSSProperties;
});

// 火星: 沿牌匾外沿**绕一圈**铺开, 每颗沿"离开中心"的方向被甩出去 ⇒ 观感是高速跑光从轮廓上
// 蹭下来的火花, 而不是从图片中间往上冒的烟。仅悬停时可见。
//
// ★ 起点用**内接椭圆**而不是盒子的矩形周长: 牌匾是斜的, 外接盒的四角基本是空的,
//   从角上冒火星会明显脱离图形、像凭空出现。椭圆虽然也只是近似, 但永远落在实体附近。
// ★ 位移方向 = 起点方向(纯径向), 所以火星一定是"向外"而不是乱飘;
//   拖尾靠 --srot 转到同一方向, 头朝外、尾朝内(见 MenuStartButton.css 的渐变方向)。
const SPARKS: CSSProperties[] = Array.from({ length: SPARK_COUNT }, (_, i) => {
  // 均匀铺满一圈 + 一点抖动 —— 纯等分会排得像齿轮, 一眼看出是"摆"上去的。
  const ang = ((i + rand(i, 11) * 0.8) / SPARK_COUNT) * Math.PI * 2;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const dist = 26 + rand(i, 12) * 44; // 甩出距离 26~70px(飞得远才看得出是"被甩出去"的)
  // 短促才像火花, 但太短会来不及看清 —— 半秒到一秒之间是"够快又读得到"的窗口。
  const dur = 0.5 + rand(i, 13) * 0.4;
  return {
    "--sx0": `${50 + ux * 44}%`, // 起点贴着轮廓(44%/38% 是椭圆半径, 略小于外接盒)
    "--sy0": `${50 + uy * 38}%`,
    "--sx": `${ux * dist}px`,
    "--sy": `${uy * dist - 12}px`, // 径向位移再叠一点上飘, 火花才有"热"的感觉
    "--srot": `${ang}rad`, // 拖尾朝向 = 甩出方向
    "--sw": `${12 + rand(i, 14) * 14}px`, // 拖尾长度 12~26px
    "--sh": `${2 + rand(i, 16) * 2}px`, // 拖尾粗细 2~4px(粗细也随机, 免得 24 条像一套复制品)
    "--sdur": `${dur}s`,
    // 负延迟: 同 MOTES, 让 20 颗一挂载就散在各自相位上, 否则悬停瞬间会齐步炸开一次。
    "--sdel": `${-rand(i, 15) * dur}s`,
  } as CSSProperties;
});

interface Props {
  onClick: () => void;
  /** 距画布右边距离(设计 px)。位置/大小旋钮由 MenuScreen 内联下发, 与 .menu-title 同款分工。 */
  right: string;
  /** 距画布底部距离(设计 px) */
  bottom: string;
  /** 显示宽度(设计 px; 原图等比缩放) */
  width: string;
}

export function MenuStartButton({ onClick, right, bottom, width }: Props) {
  return (
    // 用 <button> 而不是过去的 <img onClick>: 顺带拿到键盘可达性(Tab 聚焦 / 回车触发)。
    // --start-mask 同时供 .menu-start-motes 与 .menu-start-rim 使用。
    <button
      className="menu-start"
      onClick={onClick}
      aria-label="开始游戏"
      style={
        {
          right,
          bottom,
          width,
          // ⚠ url() 里必须带引号: 素材路径含中文, Vite 打包后会变成 % 转义的形式,
          //   不加引号的 url() token 对这些字符的容错很差。
          "--start-mask": `url("${startGameImg}")`,
        } as CSSProperties
      }
    >
      <img className="menu-start-img" src={startGameImg} alt="" draggable={false} />

      {/* 1) 内部光尘: 被牌匾形状裁死, 粒子只在图片内部活动 */}
      <span className="menu-start-motes" aria-hidden>
        {MOTES.map((style, i) => (
          <i key={i} className="menu-start-mote" style={style} />
        ))}
      </span>

      {/* 2) 轮廓跑光: 三层套娃, 每层只干一件事 —— 外层辉光 / 中层环带形状(双 mask 相减) /
             内层转那道 conic 亮楔。⚠ 辉光与 mask 必须分开两个元素(filter 先于 mask 生效,
             同层写会把溢出的光裁掉), mask 与旋转也必须分开(挂反了环带会跟着转散)。详见 MenuStartButton.css。 */}
      <span className="menu-start-rim" aria-hidden>
        <span className="menu-start-rim-band">
          <i className="menu-start-rim-run" />
        </span>
      </span>

      {/* 3) 外溢火星: 无 mask, 可以飞出牌匾轮廓; 空闲态整层 opacity:0, 悬停才出现 */}
      <span className="menu-start-sparks" aria-hidden>
        {SPARKS.map((style, i) => (
          <i key={i} className="menu-start-spark" style={style} />
        ))}
      </span>
    </button>
  );
}
