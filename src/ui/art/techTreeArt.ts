import reference from "@/assets/场景/测试/科技树升级.png";

/** 只取参考图圆盘内部的金属图案；外框、文字、背景与状态均由公共组件绘制。 */
export const TECH_TREE_ART = {
  source: reference,
  width: 1672,
  height: 941,
  regions: {
    foundation: { x: 82, y: 375, size: 112 },
    supply: { x: 326, y: 240, size: 94 },
    capacity: { x: 327, y: 525, size: 94 },
  },
} as const;
