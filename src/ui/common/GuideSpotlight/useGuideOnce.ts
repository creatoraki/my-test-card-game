import { useEffect } from "react";
import { useTownStore } from "@/store/townStore";
import { pushGuide, type GuideStep } from "./guideStore";

export function useGuideOnce(step: GuideStep, when: boolean): void {
  const seenGuides = useTownStore((state) => state.seenGuides);
  const markGuideSeen = useTownStore((state) => state.markGuideSeen);

  useEffect(() => {
    if (!when || seenGuides.includes(step.id)) return;
    pushGuide(step);
    markGuideSeen(step.id);
  }, [markGuideSeen, seenGuides, step, when]);
}
