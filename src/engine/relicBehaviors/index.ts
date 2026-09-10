import type { RelicBehavior } from "./types";
import { TUTORIAL_RELIC_BEHAVIORS } from "./tutorial";
import { BASIC_RELIC_BEHAVIORS } from "./basic";
import { UNCOMMON_RELIC_BEHAVIORS } from "./uncommon";

export const RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  ...TUTORIAL_RELIC_BEHAVIORS,
  ...BASIC_RELIC_BEHAVIORS,
  ...UNCOMMON_RELIC_BEHAVIORS,
};

export type { RelicBehavior, RelicBehaviorContext } from "./types";
export { runRelicHook } from "./types";
