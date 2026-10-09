// 卡组面板(换牌 / 删牌 / 复制)的美术引用。
// 全部是可选素材: 用 glob 加载, 文件未放入时对应部件退回 CSS 兜底外观, 不影响构建; 放入后自动生效。
// 素材规格与提示词见 docs/换卡面板还原方案.md「美术素材清单」。

const modules = import.meta.glob<string>(
  "../../../assets/换卡面板/*.webp",
  { eager: true, import: "default" },
);

function pick(name: string): string | undefined {
  return Object.entries(modules).find(([path]) => path.endsWith(`/${name}.webp`))?.[1];
}

export const DECK_SERVICE_ART = {
  /** 1920×1080 整面板外壳, 按画布 1:1 贴。 */
  shell: pick("面板外壳"),
  /** 培养舱舱体(舱内空置)。 */
  chamber: pick("重换舱"),
  /** 培养舱前景件(上环下沿、底座前唇), 压在卡面上方。 */
  chamberFront: pick("重换舱_前层"),
  tab: pick("页签_常态"),
  tabActive: pick("页签_激活"),
  buttonAbandon: pick("按钮_放弃"),
  buttonConfirm: pick("按钮_确认"),
} as const;

export const DECK_SERVICE_ART_SOURCES: readonly string[] = Object.values(DECK_SERVICE_ART)
  .filter((src): src is string => Boolean(src));
