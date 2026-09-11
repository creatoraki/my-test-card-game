// 商店详情共用展示壳。商品数据由调用方组装，玻璃层与展示台在此统一维护。

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./ShopDetailCard.module.css";

export interface ShopDetailRow {
  label: string;
  value: string;
  good: boolean;
}

interface Props {
  animKey: string;
  tone?: string;
  stage?: ReactNode;
  title?: ReactNode;
  titleMeta?: ReactNode;
  tags?: ReactNode;
  desc?: ReactNode;
  rows?: ShopDetailRow[];
  extra?: ReactNode;
  foot?: ReactNode;
  placeholder?: string;
}

export function ShopDetailCard({
  animKey,
  tone,
  stage,
  title,
  titleMeta,
  tags,
  desc,
  rows,
  extra,
  foot,
  placeholder,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasContent = Boolean(stage || title || titleMeta || tags || desc || rows?.length || extra || foot);

  useLayoutEffect(() => {
    const element = bodyRef.current;
    if (!element) return;

    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(16px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 0.86, 0.24, 1)",
        fill: "both",
      },
    );

    return () => animation.cancel();
  }, [animKey]);

  if (!hasContent) {
    return (
      <div className={cx(s["sx-card"], s["is-idle"])}>
        <p className={s["sx-card-idle"]}>{placeholder ?? "选择一件商品查看详情"}</p>
      </div>
    );
  }

  return (
    <div className={cx(s["sx-card"], tone && s[`sx-r-${tone}`])}>
      <div className={s["sx-card-body"]} ref={bodyRef}>
        {stage && (
          <div className={s["sx-card-stage"]}>
            <span className={s["sx-card-icon"]}>{stage}</span>
          </div>
        )}

        {title && (
          <div className={s["sx-card-title-row"]}>
            <h4 className={s["sx-card-name"]}>{title}</h4>
            {titleMeta && <div className={s["sx-card-title-meta"]}>{titleMeta}</div>}
          </div>
        )}

        {tags && <p className={s["sx-card-tags"]}>{tags}</p>}
        {desc && <p className={s["sx-card-desc"]}>{desc}</p>}

        {(rows?.length || extra) ? (
          <div className={s["sx-card-details"]}>
            {rows && rows.length > 0 && (
              <dl className={s["sx-card-stats"]}>
                {rows.map((row) => (
                  <div key={`${row.label}${row.value}`}>
                    <dt>{row.label}</dt>
                    <dd className={row.good ? s["is-good"] : s["is-bad"]}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {extra && <div className={s["sx-card-extra"]}>{extra}</div>}
          </div>
        ) : null}

        {foot && <div className={s["sx-card-foot"]}>{foot}</div>}
      </div>
    </div>
  );
}
