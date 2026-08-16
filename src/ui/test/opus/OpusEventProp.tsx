// ★ 站在地块上的**等距立体小物件** —— 八种事件各一件「摆在场地里的东西」。
//
// 这一版换了一整批题材(上一版是货箱/医疗舱/售货机/滤芯罐/分配器/警示牌/哨戒环/货梯):
//   loot     浮空缴获舱  气垫环托着的扁舱, 盖掀开, 舱里堆着晶簇
//   heal     培养穹顶    底盘 + 玻璃半球罩 + 罩内一株发光植株
//   energy   粒子核心塔  细柱顶着一颗悬浮核心球 + 一横一竖两道轨道环
//   merchant 顶棚货摊    四柱撑起全场最宽的一块斜顶棚 + 台面上摆的货
//   route    导航方尖碑  收分的瘦高碑身 + 碑顶托着的悬浮棱镜(全场最高点)
//   retreat  撤离信标    三脚架 + 向上张开的光锥与顶口环
//   hazard   泄漏储罐    矮胖圆罐 + 顶盖破口 + 涌出的粒子(全场唯一的圆柱与「坏掉」的东西)
//   battle   交叉尖刺    三把插进地里、刃尖向中心倾斜的刀刃 + 中央警戒核心
//
// ★★ 区分靠**剪影**, 不靠颜色 ★★
//   八件的外轮廓被刻意拉开成八种「基本形」, 远看不辨色也能认出来:
//     loot 极宽扁且底下透空 / heal 唯一的球冠曲面 / energy 细腰顶球 / merchant 最宽的伞盖
//     route 最瘦最高且顶端带尖 / retreat 唯一**上宽下窄** / hazard 唯一的圆柱 / battle 唯一的放射尖锐形
//   ⚠ 改任何一件的尺寸前先问: 它的剪影还能不能与其余七件区分? 高度与宽度都要错开一档。
//
// ★ 上色走**五色梯**(定义在 OpusRouteBoard.module.css 的 .k-* 上, 每种事件一条同色相的梯):
//     --k  主色  灯 / 核心 / 环 / 晶簇 这类小面积发光零件
//     --k1 高光  受光棱、必须一眼看到的标识线
//     --k2 中调  物件顶面(受光面)
//     --k3 暗调  物件右下受光侧面
//     --k4 深调  物件左下背光侧面、凹槽与破口
//   ⚠ 五档同色相 ⇒ 一件物件整体读作「一种材质的一个东西」, 而不是拼色玩具;
//     真正抢眼的高饱和只留给 --k 的那一两个零件, 面积占比压在 10% 上下。
//
// 局部坐标: **原点在脚底**(0,0), 物件朝 −y 长出去 ⇒ 摆放时只需把原点对到地块顶面中心。
// ⚠ 任何贴地的斜边都要走 isoPt/isoBox/isoDisc, 不要手写屏幕 px 的斜线(斜率一旦不是 2:1 就成了贴纸)。
//   例外只有**回转体的外轮廓**(圆锥/圆柱的两条母线)与宝石的棱面: 它们本来就不落在地平面上。

import type { ReactNode } from "react";
import type { NodeEventKind } from "@/explore/types";
import { isoBox, isoDisc, isoPt, poly, type P2 } from "./opusIso";
import s from "./OpusEventProp.module.css";

// 一个长方体的三个可见面。z 序天然正确: 先画两个侧面, 顶面压在上面。
function Box({
  wu,
  ws,
  h,
  y0 = 0,
  cu = 0,
  cs = 0,
  tone = "solid",
}: {
  wu: number;
  ws: number;
  h: number;
  y0?: number;
  cu?: number;
  cs?: number;
  /** solid = 普通实体(走 k2/k3/k4); glow = 整块发光零件(走 k1/k/k3 并带辉光) */
  tone?: "solid" | "glow";
}) {
  const b = isoBox(wu, ws, h, y0, cu, cs);
  if (tone === "glow") {
    return (
      <g className={s["pr-glow"]}>
        <polygon className={s["pr-glow-left"]} points={b.left} />
        <polygon className={s["pr-glow-right"]} points={b.right} />
        <polygon className={s["pr-glow-top"]} points={b.top} />
      </g>
    );
  }
  return (
    <>
      <polygon className={s["pr-left"]} points={b.left} />
      <polygon className={s["pr-right"]} points={b.right} />
      <polygon className={s["pr-top"]} points={b.top} />
    </>
  );
}

// 收分的四棱台(方尖碑碑身): 底半宽 wb 收到顶半宽 wt。
// ⚠ 四个角一律经 isoPt 求, 不要把顶面按比例缩一下了事 —— 那样收分的斜率不是等距的。
function Taper({ wb, wt, h, y0 = 0 }: { wb: number; wt: number; h: number; y0?: number }) {
  const at = (w: number, hh: number) => ({
    N: isoPt(w, -w, hh),
    E: isoPt(w, w, hh),
    S: isoPt(-w, w, hh),
    W: isoPt(-w, -w, hh),
  });
  const b = at(wb, y0);
  const t = at(wt, y0 + h);
  return (
    <>
      <polygon className={s["pr-left"]} points={poly([t.W, t.S, b.S, b.W])} />
      <polygon className={s["pr-right"]} points={poly([t.S, t.E, b.E, b.S])} />
      <polygon className={s["pr-top"]} points={poly([t.N, t.E, t.S, t.W])} />
    </>
  );
}

// 圆柱(泄漏储罐): 上下两个等距圆之间的一段筒壁。
// ⚠ 筒壁的左右两条边是**回转体的母线**, 是竖直的屏幕线而不是等距斜线 —— 这里必须手写。
//   底/顶的弧线仍然走 isoDisc, 圆才与地面同透视。
function Cylinder({ r, h, y0 = 0 }: { r: number; h: number; y0?: number }) {
  const base = isoDisc(r, y0);
  const cap = isoDisc(r, y0 + h);
  const f = (n: number) => n.toFixed(2);
  // 筒壁 = 底圆的前半弧 → 上提到顶圆的前半弧。sweep 0 = 经过下方, sweep 1 = 折回。
  const wall =
    `M ${f(-base.rx)} ${f(base.cy)} A ${f(base.rx)} ${f(base.ry)} 0 0 0 ${f(base.rx)} ${f(base.cy)}` +
    ` L ${f(cap.rx)} ${f(cap.cy)} A ${f(cap.rx)} ${f(cap.ry)} 0 0 1 ${f(-cap.rx)} ${f(cap.cy)} Z`;
  // 背光的左半: 从最左母线到正下方那条母线, 压暗一档 ⇒ 圆柱才有转折
  const dark =
    `M ${f(-base.rx)} ${f(base.cy)} A ${f(base.rx)} ${f(base.ry)} 0 0 0 0 ${f(base.cy + base.ry)}` +
    ` L 0 ${f(cap.cy + cap.ry)} A ${f(cap.rx)} ${f(cap.ry)} 0 0 1 ${f(-cap.rx)} ${f(cap.cy)} Z`;
  return (
    <>
      <path className={s["pr-cyl"]} d={wall} />
      <path className={s["pr-cyl-dark"]} d={dark} />
      <ellipse className={s["pr-cyl-top"]} cx={cap.cx} cy={cap.cy} rx={cap.rx} ry={cap.ry} />
    </>
  );
}

// 悬浮棱镜(方尖碑顶): 腰部四点 + 上下两个顶点的八面体。只画朝观者那几面。
function Gem({ y, r, up, dn }: { y: number; r: number; up: number; dn: number }) {
  const A = isoPt(r, 0, y); // 后右
  const B = isoPt(0, r, y); // 前右
  const C = isoPt(-r, 0, y); // 前(屏幕最下)
  const D = isoPt(0, -r, y); // 前左
  const P = isoPt(0, 0, y + up);
  const Q = isoPt(0, 0, y - dn);
  return (
    <g className={s["pr-gem"]}>
      <polygon className={s["pr-gem-mid"]} points={poly([D, A, P])} />
      <polygon className={s["pr-gem-dark"]} points={poly([C, D, Q])} />
      <polygon className={s["pr-gem-dark"]} points={poly([B, C, Q])} />
      {/* 朝左上那一面最亮: 全场光源方向 */}
      <polygon className={s["pr-gem-lit"]} points={poly([C, D, P])} />
      <polygon className={s["pr-gem-mid"]} points={poly([B, C, P])} />
    </g>
  );
}

// 插进地里的刀刃(battle): 底边沿两条世界轴张开, 刃尖朝中心倾斜。
function Blade({ au, as, h, w = 1.9 }: { au: number; as: number; h: number; w?: number }) {
  const a = isoPt(au - w, as - w, 0);
  const b = isoPt(au + w, as + w, 0);
  const mid = isoPt(au, as, 0);
  const tip = isoPt(au * 0.35, as * 0.35, h);
  return (
    <>
      <polygon className={s["pr-blade-dark"]} points={poly([a, mid, tip])} />
      <polygon className={s["pr-blade-lit"]} points={poly([mid, b, tip])} />
      <polyline className={s["pr-edge"]} points={poly([mid, tip])} />
    </>
  );
}

const line = (a: [number, number], b: [number, number]) => poly([a, b]);

// 半球罩(heal): 上半是拉高的弧, 下半是底圆的前半弧 ⇒ 一个坐在底盘上的球冠。
const DOME_R = isoDisc(9, 0);
const DOME_Y = -2.6;
const DOME_H = 15;
const domePath =
  `M ${(-DOME_R.rx).toFixed(2)} ${DOME_Y} A ${DOME_R.rx.toFixed(2)} ${DOME_H} 0 0 1 ${DOME_R.rx.toFixed(2)} ${DOME_Y}` +
  ` A ${DOME_R.rx.toFixed(2)} ${DOME_R.ry.toFixed(2)} 0 0 1 ${(-DOME_R.rx).toFixed(2)} ${DOME_Y} Z`;

// 撤离光锥(retreat): 回转体的两条母线 —— 下小口(r=3.4,h=19) → 上大口(r=10.5,h=33)。
const BEAM_LO = isoDisc(3.4, 19);
const BEAM_HI = isoDisc(10.5, 33);
const beamPoly = poly([
  [-BEAM_LO.rx, BEAM_LO.cy] as P2,
  [BEAM_LO.rx, BEAM_LO.cy] as P2,
  [BEAM_HI.rx, BEAM_HI.cy] as P2,
  [-BEAM_HI.rx, BEAM_HI.cy] as P2,
]);

// ===================== 八种物件 =====================
// 括号里标的是**剪影特征** —— 每件的高度与宽度都与其余七件错开至少一档。
const PROPS: Record<NodeEventKind, ReactNode> = {
  // 【极宽扁 + 底下透空】浮空缴获舱: 气垫环托着一只掀开盖的扁舱, 舱里堆着晶簇
  loot: (
    <>
      {/* 气垫环: 舱体离地 3, 缝隙里透出一圈主色的光 ⇒ 「它是浮着的」, 全场唯一不落地的物件 */}
      <ellipse className={s["pr-ring"]} {...isoDisc(12, 1.4)} />
      <ellipse className={s["pr-ring-in"]} {...isoDisc(8.5, 1.4)} />
      <Box wu={12} ws={12} h={10} y0={3} />
      {/* 箱箍: 两个可见面各压一道暗缝 */}
      <polyline className={s["pr-seam"]} points={line(isoPt(-12, -12, 7), isoPt(-12, 12, 7))} />
      <polyline className={s["pr-seam"]} points={line(isoPt(-12, 12, 7), isoPt(12, 12, 7))} />
      {/* 掀开的盖: 绕西南那条棱抬起、向画面深处倒 ⇒ 舱内的晶簇不会被它挡住 */}
      <polygon
        className={s["pr-lid"]}
        points={poly([isoPt(-12, -12, 13), isoPt(-12, 12, 13), isoPt(10, 12, 24), isoPt(10, -12, 24)])}
      />
      <polyline className={s["pr-edge"]} points={line(isoPt(10, -12, 24), isoPt(10, 12, 24))} />
      {/* 晶簇: 整件里唯一的主色发光体, 三根高度参差 ⇒ 「装满了东西」 */}
      <Box wu={2.4} ws={2.4} h={6} y0={13} cu={-5} cs={-4.5} tone="glow" />
      <Box wu={2} ws={2} h={3.6} y0={13} cu={-6.5} cs={4} tone="glow" />
      <Box wu={1.8} ws={1.8} h={7.6} y0={13} cu={-1} cs={0.5} tone="glow" />
    </>
  ),

  // 【唯一的球冠曲面】培养穹顶: 底盘 + 玻璃半球罩 + 罩内一株发光植株
  heal: (
    <>
      <Box wu={11} ws={11} h={2.6} />
      {/* 植株先画: 半透明的罩压在它上面, 才读作「隔着玻璃看」 */}
      <polyline className={s["pr-lamp"]} points={line(isoPt(0, 0, 3), isoPt(0, 0, 15))} />
      <polygon
        className={s["pr-leaf"]}
        points={poly([isoPt(0, 0, 8.5), isoPt(0, -7.5, 13), isoPt(0, -0.6, 12.5)])}
      />
      <polygon
        className={s["pr-leaf"]}
        points={poly([isoPt(0, 0, 10.5), isoPt(0, 7.5, 15.5), isoPt(0, 0.6, 14.5)])}
      />
      <circle className={s["pr-node"]} cx={0} cy={-16.6} r={2.4} />
      {/* 穹罩 + 左上一道弧形高光: 全场唯一的曲面剪影 */}
      <path className={s["pr-dome"]} d={domePath} />
      <path className={s["pr-dome-gloss"]} d="M -8.4 -6.2 A 10 13 0 0 1 -1.6 -17" />
      <ellipse className={s["pr-hoop"]} {...isoDisc(9, 2.6)} />
    </>
  ),

  // 【细腰顶球】粒子核心塔: 细柱顶着一颗悬浮核心 + 一横一竖两道轨道环
  energy: (
    <>
      <Box wu={8} ws={8} h={2.4} />
      <Box wu={3.2} ws={3.2} h={12} y0={2.4} />
      <Box wu={5} ws={5} h={1.8} y0={14.4} />
      {/* 托座 → 核心的能量束: 中间这一段空隙就是「悬浮」 */}
      <polyline className={s["pr-lamp"]} points={line(isoPt(0, 0, 16.2), isoPt(0, 0, 20.4))} />
      <circle className={s["pr-core"]} cx={0} cy={-26} r={5.6} />
      <circle className={s["pr-core-hi"]} cx={-1.9} cy={-27.9} r={1.7} />
      {/* 两道轨道环: 一道贴地平面(等距椭圆), 一道竖着 ⇒ 球被「箍」在中间 */}
      <ellipse className={s["pr-ring"]} {...isoDisc(9, 26)} />
      <ellipse className={s["pr-ring-in"]} cx={0} cy={-26} rx={4.4} ry={9.8} />
    </>
  ),

  // 【最宽的伞盖】顶棚货摊: 四柱撑起一块最宽的斜顶棚, 台面上摆着货
  merchant: (
    <>
      <Box wu={10} ws={11} h={2} />
      {/* 后两根立柱先画 */}
      <Box wu={1.3} ws={1.3} h={21} y0={2} cu={8} cs={-9} />
      <Box wu={1.3} ws={1.3} h={21} y0={2} cu={8} cs={9} />
      {/* 台面 + 摆着的两件货(其中一件是发光的样品) */}
      <Box wu={8.6} ws={9.6} h={1.6} y0={9} />
      <Box wu={2.6} ws={3} h={4} y0={10.6} cu={-1} cs={-4.5} />
      <Box wu={2} ws={2.2} h={5.6} y0={10.6} cu={-1.5} cs={4} tone="glow" />
      {/* 前两根立柱压在货前面 */}
      <Box wu={1.3} ws={1.3} h={21} y0={2} cu={-8} cs={-9} />
      <Box wu={1.3} ws={1.3} h={21} y0={2} cu={-8} cs={9} />
      {/* 顶棚: 沿推进轴向后抬高的一块斜板, 张到 ±15 ⇒ 全场最宽的剪影 */}
      <polygon
        className={s["pr-canopy"]}
        points={poly([isoPt(-13, -15, 23), isoPt(-13, 15, 23), isoPt(13, 15, 28), isoPt(13, -15, 28)])}
      />
      <polyline className={s["pr-canopy-lip"]} points={line(isoPt(-13, -15, 23), isoPt(-13, 15, 23))} />
      <polyline className={s["pr-lamp"]} points={line(isoPt(-12.6, -13.6, 22.2), isoPt(-12.6, 13.6, 22.2))} />
    </>
  ),

  // 【最瘦最高 + 顶端带尖】导航方尖碑: 收分碑身 + 碑顶托着的悬浮棱镜
  route: (
    <>
      <Box wu={7} ws={7} h={2.2} />
      <Box wu={5} ws={5} h={1.8} y0={2.2} />
      <Taper wb={3.6} wt={1.9} h={26} y0={4} />
      {/* 碑身刻纹: 两条随收分一起收窄的发光槽 */}
      <polyline className={s["pr-lamp"]} points={line(isoPt(-3.3, 3.3, 7), isoPt(-1.9, 1.9, 28))} />
      <polyline className={s["pr-lamp"]} points={line(isoPt(3.3, 3.3, 7), isoPt(1.9, 1.9, 28))} />
      <Gem y={34} r={3.6} up={5.5} dn={4} />
    </>
  ),

  // 【唯一上宽下窄】撤离信标: 三脚架 + 向上张开的光锥与顶口环
  retreat: (
    <>
      <polyline className={s["pr-strut"]} points={line(isoPt(9, 0, 0), isoPt(0, 0, 14))} />
      <polyline className={s["pr-strut"]} points={line(isoPt(-5, 8.5, 0), isoPt(0, 0, 14))} />
      <polyline className={s["pr-strut"]} points={line(isoPt(-5, -8.5, 0), isoPt(0, 0, 14))} />
      <Box wu={3.4} ws={3.4} h={5} y0={14} />
      {/* 光锥: 下小口 → 上大口。其余七件全是「上窄下宽」, 这一件反过来 ⇒ 剪影独一份 */}
      <polygon className={s["pr-beam"]} points={beamPoly} />
      <ellipse className={s["pr-ring"]} {...isoDisc(10.5, 33)} />
      <ellipse className={s["pr-ring-in"]} {...isoDisc(6.5, 26)} />
      {/* 锥内朝上的两枚人字标 ——「从这里撤出去」 */}
      <polyline
        className={s["pr-lamp-hi"]}
        points={poly([isoPt(0, -6, 22), isoPt(0, 0, 27), isoPt(0, 6, 22)])}
      />
      <polyline
        className={s["pr-lamp-hi"]}
        points={poly([isoPt(0, -6, 27), isoPt(0, 0, 32), isoPt(0, 6, 27)])}
      />
    </>
  ),

  // 【唯一的圆柱 + 唯一「坏掉」的东西】泄漏储罐: 矮胖圆罐 + 顶盖破口 + 涌出的粒子
  hazard: (
    <>
      <Box wu={10} ws={10} h={1.8} />
      <Cylinder r={8} h={13} y0={1.8} />
      {/* 罐箍两道 */}
      <ellipse className={s["pr-hoop"]} {...isoDisc(8, 6.5)} />
      <ellipse className={s["pr-hoop"]} {...isoDisc(8, 11)} />
      {/* 顶盖破口: 一块啃掉的暗面, 边缘不规则 ⇒ 「裂开的」而不是「开着的」 */}
      <polygon
        className={s["pr-breach"]}
        points={poly([isoPt(-4, -2, 14.9), isoPt(1, -5, 14.9), isoPt(5.5, 1, 14.9), isoPt(0, 5, 14.9)])}
      />
      {/* 涌出的粒子: 一缕上升的折线 + 三颗越飘越小的粒子 */}
      <polyline
        className={s["pr-lamp-hi"]}
        points={poly([isoPt(0, 0, 15.4), isoPt(2, 2, 20), isoPt(-1.5, -1.5, 24)])}
      />
      <circle className={s["pr-mote"]} cx={isoPt(-1.5, -1.5, 26.5)[0]} cy={isoPt(-1.5, -1.5, 26.5)[1]} r={2} />
      <circle className={s["pr-mote"]} cx={isoPt(3, 2, 24)[0]} cy={isoPt(3, 2, 24)[1]} r={1.4} />
      <circle className={s["pr-mote"]} cx={isoPt(-4, 2.5, 21)[0]} cy={isoPt(-4, 2.5, 21)[1]} r={1} />
    </>
  ),

  // 【唯一的放射尖锐形】交叉尖刺: 三把插进地里、刃尖朝中心倾斜的刀刃 + 中央警戒核心
  battle: (
    <>
      <Box wu={9} ws={9} h={1.8} />
      {/* ⚠ 三把刀按等距深度从远到近画(键 = 通道向 − 推进向), 否则近处那把会被远处那把压住 */}
      <Blade au={8} as={2} h={25} />
      <Blade au={-5} as={-8} h={20} />
      <Blade au={-4} as={8} h={17} />
      <circle className={s["pr-core"]} cx={0} cy={-11} r={3.6} />
      <ellipse className={s["pr-ring"]} {...isoDisc(7, 11)} />
    </>
  ),

  // 【全场最矮 + 什么都没有】空节点: 一块光秃秃的台座 + 台面上一圈浮尘 —— 「走到了, 但什么也没有」
  empty: (
    <>
      <Box wu={9} ws={9} h={2} />
      <ellipse className={s["pr-ring"]} {...isoDisc(5, 2)} />
      <circle className={s["pr-mote"]} cx={isoPt(-3, 2, 8)[0]} cy={isoPt(-3, 2, 8)[1]} r={1.2} />
      <circle className={s["pr-mote"]} cx={isoPt(3, -3, 6)[0]} cy={isoPt(3, -3, 6)[1]} r={0.9} />
      <circle className={s["pr-mote"]} cx={isoPt(0, 3.5, 5)[0]} cy={isoPt(0, 3.5, 5)[1]} r={0.7} />
    </>
  ),
};

/** 站在地块顶面中心的立体物件。viewBox 的 y=0 就是脚底, 下方多留 8 给落地投影。 */
export function OpusEventProp({ kind }: { kind: NodeEventKind }) {
  return (
    <svg className={s["pr-root"]} viewBox="-34 -60 68 68" fill="none" aria-hidden>
      {/* 物件自己的落地影子: 让它「压」在台面上, 而不是浮着 */}
      <ellipse className={s["pr-shadow"]} cx={0} cy={0} rx={15} ry={6} />
      {PROPS[kind]}
    </svg>
  );
}
