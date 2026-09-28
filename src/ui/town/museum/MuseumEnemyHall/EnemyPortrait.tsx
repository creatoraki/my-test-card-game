// 图鉴里的敌人立绘取景框：按主体框(body)等比缩放并居中，任何尺寸的容器都能完整展示立绘。
// 缩放系数用容器查询单位(cqw/cqh)在 CSS 里算出，容器尺寸变化无需 JS 测量。

import type { CSSProperties } from "react";
import type { EnemyDef } from "@/data";
import { enemyArt } from "@/ui/art/battle/enemyArt";
import { EnemySprite } from "@/ui/common/unit/EnemySprite";
import { cx } from "@/ui/common/shared/cx";
import s from "./EnemyPortrait.module.css";

interface Props {
  enemy: EnemyDef;
  className?: string;
}

export function EnemyPortrait({ enemy, className }: Props) {
  const art = enemyArt(enemy.id);
  if (!art) {
    return (
      <span className={cx(s["portrait"], className)}>
        <span className={s["emoji"]}>{enemy.emoji}</span>
      </span>
    );
  }

  const view = art.view ?? { x: 0, y: 0, w: art.sheet.w / art.frames, h: art.sheet.h };
  const { body } = art;
  // 主体中心在展示框内的源图坐标。
  const centerX = body.x - view.x + body.w / 2;
  const centerY = body.y - view.y + body.h / 2;
  const style = {
    // --sprite-k 为「每个源图像素对应的屏幕长度」，EnemySprite 的背景尺寸与逐帧位移都乘以它。
    "--sprite-k": `calc(min(var(--portrait-fill) * 100cqw / ${body.w}, var(--portrait-fill) * 100cqh / ${body.h}))`,
    "--fig-w": `calc(var(--sprite-k) * ${view.w})`,
    "--fig-h": `calc(var(--sprite-k) * ${view.h})`,
    left: `calc(50cqw - var(--sprite-k) * ${centerX})`,
    top: `calc(50cqh - var(--sprite-k) * ${centerY})`,
  } as CSSProperties;

  return (
    <span className={cx(s["portrait"], className)}>
      <span className={s["figure"]} style={style}>
        <EnemySprite id={enemy.id} sprite={art} alt={enemy.name} />
      </span>
    </span>
  );
}
