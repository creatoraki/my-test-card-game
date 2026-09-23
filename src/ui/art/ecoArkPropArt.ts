import type { CorridorPropArt } from "./corridorArt";
import seedVault from "@/assets/explore-corridor/生态方舟/可交互物体/休眠种子库.png";
import dewCollector from "@/assets/explore-corridor/生态方舟/可交互物体/凝露净化器.png";
import composter from "@/assets/explore-corridor/生态方舟/可交互物体/生质循环釜.png";
import geneConsole from "@/assets/explore-corridor/生态方舟/可交互物体/枝序档案台.png";
import sporeVent from "@/assets/explore-corridor/生态方舟/可交互物体/失控孢子风阀.png";

/** 保留高清透明原画，显示尺寸换算为现有 512px 道具规格。 */
function prop(src: string, bottomBlank: number, size = 1): CorridorPropArt {
  return { src, width: 1254, height: 1254, scale: 512 / 1254 * size, groundTrim: bottomBlank / 1254 };
}

export const ECO_ARK_PROP_ART = {
  arkSeedVault: prop(seedVault, 0),
  arkDewCollector: prop(dewCollector, 0, 1.1),
  arkComposter: prop(composter, 22, 1.2),
  arkGeneConsole: prop(geneConsole, 0),
  arkSporeVent: prop(sporeVent, 0, 1.2),
};
