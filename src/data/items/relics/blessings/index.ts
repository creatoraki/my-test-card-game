import { withRelicSellValue } from "../../rules/pricing";
import { TUTORIAL_BLESSING_RELIC_DEFS } from "./tutorial";
import { BASIC_BLESSING_RELIC_DEFS } from "./basic";
import { UNCOMMON_BLESSING_RELIC_DEFS } from "./uncommon";

// 祝福遗物统一在这里挂回收价，回收台据此收购。
export const BLESSING_RELIC_DEFS = withRelicSellValue([
  ...TUTORIAL_BLESSING_RELIC_DEFS,
  ...BASIC_BLESSING_RELIC_DEFS,
  ...UNCOMMON_BLESSING_RELIC_DEFS,
]);

export { TUTORIAL_BLESSING_RELIC_DEFS, BASIC_BLESSING_RELIC_DEFS, UNCOMMON_BLESSING_RELIC_DEFS };
