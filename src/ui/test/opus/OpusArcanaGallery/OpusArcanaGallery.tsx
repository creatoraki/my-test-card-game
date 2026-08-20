// opus tab 的 demo: 把六张塔罗题材图标陈列出来, 顺带验三件事 ——
//   1) 六张图的笔触密度 / 亮度层级是否一致(横向摆一排最容易看出谁太重谁太空);
//   2) 从 256 素材尺寸缩到 40 的 UI 尺寸后, 图案是否还认得出;
//   3) 关掉断角框与角标后, 图案本体能不能独立成立。
// 这个文件只是陈列台, 不含任何图标造型逻辑。
import { useState, type CSSProperties } from "react";
import { BOND_DEFS, nextTier } from "@/data/bonds";
import { cx } from "@/ui/common/cx";
import { ArcanaIcon } from "@/ui/common/ArcanaIcon";
import { BondSlot } from "@/ui/common/BondSlot";
import { ARCANA, ARCANA_BY_ID, type ArcanaId } from "@/ui/common/ArcanaIcon";
import s from "./OpusArcanaGallery.module.css";

const SIZES = [256, 160, 96, 64] as const;
const STRIP_SIZE = 40;
/** 检视区里图标的固定边长 —— 与主网格的尺寸档位解耦, 换档位时对照关系不跑。 */
const INSPECT_SIZE = 96;
/** demo 用的当前等级, 展示容器右上角的等级角标。 */
const DEMO_COUNT = 5;

export function OpusArcanaGallery() {
  const [size, setSize] = useState<number>(160);
  const [chrome, setChrome] = useState(true);
  const [selectedId, setSelectedId] = useState<ArcanaId>(ARCANA[0].id);
  const selected = ARCANA_BY_ID[selectedId];
  const selectedDef = BOND_DEFS[selectedId];

  return (
    <div className={s.root} style={{ "--card-min": `${Math.max(size + 60, 200)}px` } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>OPUS / ARCANA ICON SET</span>
          <h2>塔罗题材图标</h2>
        </div>
        <p className={s.headerNote}>
          纯 SVG 线稿 + CSS 氛围层, 严格 1:1。画风取自事件面板插图占位区:
          深青底、内缩断角框、透视网格、主色光晕与档案角标。
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.controlGroup}>
          <span className={s.controlLabel}>尺寸</span>
          {SIZES.map((option) => (
            <button
              key={option}
              type="button"
              className={cx(size === option && s.on)}
              aria-pressed={size === option}
              onClick={() => setSize(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className={s.controlGroup}>
          <span className={s.controlLabel}>角标与内框</span>
          <button
            type="button"
            className={cx(chrome && s.on)}
            aria-pressed={chrome}
            onClick={() => setChrome((value) => !value)}
          >
            {chrome ? "显示" : "隐藏"}
          </button>
        </div>
      </div>

      {/* 选中检视 —— 点网格里的任意一张图标, 这里同排对照三种呈现:
          原样(激活) / 未激活 / 装进图标容器后的激活态(带名称与等级角标)。 */}
      <section className={s.inspect} style={{ "--card-accent": selected.accent } as CSSProperties}>
        <div className={s.inspectHead}>
          <span className={s.controlLabel}>选中检视</span>
          <strong className={s.inspectName}>{selected.name}</strong>
          <span className={s.inspectLatin}>{selected.code} · {selected.latin}</span>
        </div>
        <div className={s.inspectRow}>
          <div className={s.inspectSlot}>
            <ArcanaIcon id={selectedId} size={INSPECT_SIZE} chrome={false} />
            <span>激活 · 原样</span>
          </div>
          <div className={s.inspectSlot}>
            <ArcanaIcon id={selectedId} size={INSPECT_SIZE} chrome={false} inactive />
            <span>未激活</span>
          </div>
          <div className={s.inspectDivider} />
          <div className={s.inspectSlot}>
            <BondSlot
              def={selectedDef}
              count={DEMO_COUNT}
              tierIndex={selectedDef.tiers.findIndex((tier) => DEMO_COUNT >= tier.count)}
              next={nextTier(selectedDef, DEMO_COUNT)}
              iconSize={INSPECT_SIZE}
            />
            <span>激活 · 羁绊槽位(名称 + 点数 + 门槛)</span>
          </div>
          <div className={s.inspectSlot}>
            <BondSlot
              def={selectedDef}
              count={DEMO_COUNT}
              tierIndex={-1}
              next={nextTier(selectedDef, DEMO_COUNT)}
              iconSize={INSPECT_SIZE}
            />
            <span>未激活 · 羁绊槽位</span>
          </div>
        </div>
      </section>

      <div className={s.grid}>
        {ARCANA.map((item) => (
          <figure
            key={item.id}
            className={cx(s.card, item.id === selectedId && s.cardOn)}
            style={{ "--card-accent": item.accent } as CSSProperties}
          >
            <button
              type="button"
              className={s.selectButton}
              aria-label={`选择${item.name}`}
              aria-pressed={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
            >
              <ArcanaIcon id={item.id} size={size} chrome={chrome} />
            </button>
            <figcaption>
              <span className={s.cardName}>{item.name}</span>
              <span className={s.cardLatin}>{item.code} · {item.latin}</span>
              <span className={s.cardMood}>{item.mood}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className={s.strip}>
        <span className={s.stripTitle}>UI 尺寸检视 · {STRIP_SIZE}px · 无角标</span>
        {ARCANA.map((item) => (
          <div key={item.id} className={s.stripSlot}>
            <ArcanaIcon id={item.id} size={STRIP_SIZE} chrome={false} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
