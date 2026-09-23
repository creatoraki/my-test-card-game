import type { CraftCheck } from "@/data";

/** 配方的制造状态文案: 制造清单卡片与制造详情标签共用同一口径。 */
export function craftStatusLabel(check: CraftCheck | null | undefined): string {
  if (!check) return "先选择模组";
  if (!check.expOk) return "经验不足";
  return check.ok ? "可制造" : "材料不足";
}
