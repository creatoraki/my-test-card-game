/** 编队、详情和重组过场共用的立绘构图；正偏移向下移动。 */
export function portraitFraming(characterId: string) {
  return characterId === "hexer" ? { offsetY: -12, scale: 1 } : undefined;
}
