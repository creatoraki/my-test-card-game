/** 探索角色逐帧立绘按原始帧号索引，缺失帧保持空位以兼容动作帧裁剪。 */
const frameModules = import.meta.glob<string>(
  "../../assets/人物立绘/站立右移动作帧_透明背景/帧_*.png",
  { eager: true, import: "default" },
);

const sources: Array<string | undefined> = [];
for (const [path, src] of Object.entries(frameModules)) {
  const frame = Number(/帧_(\d+)\.png$/.exec(path)?.[1]);
  if (Number.isInteger(frame)) sources[frame] = src;
}

export const CORRIDOR_PLAYER_ART_SOURCES: readonly (string | undefined)[] = sources;
