import { SHOWCASE_PROPS, showcaseSize } from "./showcaseProps";
import { DEMO_NEAR_BASE_SCALE, demoBackdropGeometry } from "./DemoNearLayer";
import { isPropEnabled, type PreviewTuning } from "./previewTuning";
import { findNearLayer } from "./demoNearLayers";

const round = (value: number) => Math.round(value * 1000) / 1000;

/** 打印已启用交互物的缩放与背景近景的缩放、偏移；跨页统计，未启用的物件不输出。 */
export function printScales(tuning: PreviewTuning) {
  const { multipliers, backdrop } = tuning;
  const props = SHOWCASE_PROPS.filter((prop) => isPropEnabled(tuning, prop.id));
  console.log(`交互物缩放倍率（已启用 ${props.length} / ${SHOWCASE_PROPS.length}）`);
  if (props.length) console.table(props.map((prop) => {
    const multiplier = multipliers[prop.id] ?? 1;
    const { width, height } = showcaseSize(prop.art, multiplier);
    return {
      名称: prop.name,
      基础展示缩放: round(prop.art.scale),
      旋钮倍率: round(multiplier),
      最终缩放: round(prop.art.scale * multiplier),
      显示宽度: Math.round(width),
      显示高度: Math.round(height),
    };
  }));
  const layer = findNearLayer(tuning.nearLayerId);
  const geometry = demoBackdropGeometry(backdrop, layer.width);
  console.log("背景近景缩放与偏移");
  console.table([{
    名称: layer.name,
    基础显示倍率: round(DEMO_NEAR_BASE_SCALE),
    旋钮倍率: round(backdrop.scale),
    最终倍率: round(geometry.finalScale),
    单块宽度: geometry.tileWidth,
    房间宽度: geometry.width,
    显示高度: geometry.height,
    上下偏移: backdrop.offsetY,
    图层顶端: geometry.top,
  }]);
}
