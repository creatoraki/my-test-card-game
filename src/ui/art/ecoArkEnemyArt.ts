import type { EnemySpriteDef } from "./enemyArt";
import crab from "@/assets/敌人立绘/生态方舟/苔甲搬运蟹.png";
import moth from "@/assets/敌人立绘/生态方舟/孢灯浮蛾.png";
import mantis from "@/assets/敌人立绘/生态方舟/棘刃园丁.png";
import snail from "@/assets/敌人立绘/生态方舟/灌流蜗牛.png";
import seed from "@/assets/敌人立绘/生态方舟/种荚哨兵.png";
import stag from "@/assets/敌人立绘/生态方舟/冠层巡猎鹿.png";
import keeper from "@/assets/敌人立绘/生态方舟/温室监护者.png";
import mother from "@/assets/敌人立绘/生态方舟/母树中枢.png";

function sprite(src: string, body: EnemySpriteDef["body"], idle: EnemySpriteDef["idle"]): EnemySpriteDef {
  return { src, frames: 1, frameMs: 1000, sheet: { w: 1254, h: 1254 }, body, idle };
}

/** 主体框来自实际透明通道，整张原画保持完整。 */
export const ECO_ARK_ENEMY_ART: Record<string, EnemySpriteDef> = {
  "ark-moss-crab": sprite(crab, { x: 37, y: 85, w: 1179, h: 1049 }, { bob: 2, sway: 1, dur: 3100 }),
  "ark-spore-moth": sprite(moth, { x: 154, y: 24, w: 1049, h: 1213 }, { bob: 9, sway: 4, tilt: 2, dur: 3600, delay: -700 }),
  "ark-thorn-mantis": sprite(mantis, { x: 192, y: 10, w: 930, h: 1234 }, { bob: 2, tilt: 0.8, dur: 2600, delay: -400 }),
  "ark-irrigation-snail": sprite(snail, { x: 46, y: 40, w: 1164, h: 1156 }, { bob: 1, sway: 2, dur: 4000, delay: -1300 }),
  "ark-seed-sentry": sprite(seed, { x: 39, y: 22, w: 1183, h: 1214 }, { bob: 2, tilt: 1, dur: 2800, delay: -1100 }),
  "ark-canopy-stag": sprite(stag, { x: 33, y: 27, w: 1198, h: 1201 }, { bob: 2, tilt: 0.5, dur: 3500, delay: -600 }),
  "ark-nursery-keeper": sprite(keeper, { x: 17, y: 9, w: 1226, h: 1224 }, { bob: 2, sway: 1, dur: 3300, delay: -1600 }),
  "ark-mother-core": sprite(mother, { x: 3, y: 8, w: 1251, h: 1228 }, { bob: 3, tilt: 0.4, dur: 4800 }),
};
