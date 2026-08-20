// ★ ds · 塔罗羁绊 1:1 素材图标 demo ★
//
// 6 张已实装羁绊(力量/战车/审判/女祭司/高塔/愚者)的素材图标展示页:
// 图案画风统一复刻 EventPanel 事件插图占位区 —— 深底 + 主色光晕 + 透视网格
// + 切角内框 + 扫光 + 左上编号框 + 右下档案标签, 每张牌的中央徽记各不相同。
// 数据(编号/牌名/主题色/主题语)全部来自 @/data/bonds 的 BOND_DEFS, 不重复定义。
// 这套图标就是这几个题材的 1:1 美术素材占位: 替换正式立绘时只动 DsTarotArt 的 MOTIFS。
import type { CSSProperties } from "react";
import { getBondDef, type BondDef } from "@/data/bonds";
import { DsTarotArt } from "../DsTarotArt";
import artS from "../DsTarotArt/DsTarotArt.module.css";
import s from "./DsTarotArtDemo.module.css";

const SHEET_ORDER = ["strength", "chariot", "judgement", "priestess", "tower", "fool"];

function tierLine(def: BondDef): string {
  const { tiers } = def;
  if (tiers.length === 0) return "";
  const low = tiers[0];
  const high = tiers[tiers.length - 1];
  if (low === high) return `${low.count} 点触发`;
  return `${low.count} / ${high.count} 点触发`;
}

export function DsTarotArtDemo() {
  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={s.headerTitle}>
          <span className={s.kicker}>DS ARCHIVE / BOND ART SHEET</span>
          <h1>塔罗羁绊 · 素材图标</h1>
          <p className={s.subtitle}>
            事件插图占位区画风的 1:1 题材图标 —— 六张已实装羁绊各一枚徽记, 正式立绘替换前以此为准。
          </p>
        </div>
        <div className={s.headerStatus}>
          <span className={s.statusStamp}>ASSET SHEET 01</span>
          <span className={s.statusCount}>{SHEET_ORDER.length} / 6 ARCHIVED</span>
        </div>
      </header>

      <main className={s.sheet} aria-label="塔罗羁绊素材图标表">
        {SHEET_ORDER.map((id) => {
          const def = getBondDef(id);
          if (!def) return null;
          return (
            <figure
              key={def.id}
              className={s.card}
              style={{ "--bond-accent": def.color } as CSSProperties}
            >
              <DsTarotArt bondId={def.id} className={artS.iconShell} />
              <figcaption className={s.cardMeta}>
                <span className={s.cardArcana}>{def.arcana} · MAJOR ARCANA</span>
                <strong className={s.cardName}>{def.name}</strong>
                <span className={s.cardDesc}>{def.desc}</span>
                <span className={s.cardTier}>{tierLine(def)}</span>
              </figcaption>
            </figure>
          );
        })}
      </main>

      <footer className={s.footer}>
        <span className={s.footerNote}>ARCHIVE STATUS</span>
        <strong className={s.footerText}>
          6 枚徽记已归档 · 等待正式美术立绘替换
        </strong>
        <span className={s.footerGlyph} aria-hidden="true">◈</span>
      </footer>
    </div>
  );
}
