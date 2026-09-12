import { describe, expect, it } from "vitest";
import {
  ENCOUNTERS,
  SLOT_PITCH,
  slotDefId,
  slotPlacement,
} from "@/data/encounters";
import { enemyArt } from "@/ui/art/enemyArt";

// 与 src/styles/tokens.css 的 --foe-figure-h 保持一致。
const FOE_FIGURE_HEIGHT = 256;
const MIN_BODY_GAP = 60;

interface BodyBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

describe("遭遇战敌人站位", () => {
  it("所有垂直方向相交的主体框之间至少留有 60px", () => {
    for (const encounter of ENCOUNTERS) {
      const count = encounter.enemies.length;
      const boxes = encounter.enemies.map((slot, index): BodyBox => {
        const defId = slotDefId(slot);
        const art = enemyArt(defId);
        if (!art) throw new Error(`遭遇战「${encounter.name}」缺少敌人立绘几何: ${defId}`);

        const placement = slotPlacement(slot);
        const scale = placement?.scale ?? 1;
        const view = art.view ?? {
          x: 0,
          y: 0,
          w: art.sheet.w / art.frames,
          h: art.sheet.h,
        };
        const body = art.body;
        const k = (FOE_FIGURE_HEIGHT * scale) / body.h;
        const bodyWidth = body.w * k;
        const bodyCenterOffset =
          (body.x + body.w / 2 - (view.x + view.w / 2)) * (placement?.flip ? -1 : 1) * k;
        const centerX =
          (index - (count - 1) / 2) * SLOT_PITCH +
          (placement?.dx ?? 0) +
          bodyCenterOffset;
        const dy = placement?.dy ?? 0;
        const bodyHeight = FOE_FIGURE_HEIGHT * scale;

        return {
          left: centerX - bodyWidth / 2,
          right: centerX + bodyWidth / 2,
          top: dy - bodyHeight,
          bottom: dy,
        };
      });

      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlapsVertically = a.top < b.bottom && b.top < a.bottom;
          if (!overlapsVertically) continue;

          const horizontalGap = Math.max(a.left - b.right, b.left - a.right);
          expect(
            horizontalGap,
            `遭遇战「${encounter.name}」第 ${i + 1}、${j + 1} 只敌人的主体间距不足`,
          ).toBeGreaterThanOrEqual(MIN_BODY_GAP);
        }
      }
    }
  });
});
