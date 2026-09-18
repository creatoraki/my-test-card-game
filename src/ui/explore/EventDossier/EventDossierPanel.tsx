import { useEffect, type CSSProperties, type ReactNode } from "react";
import { playSfx } from "@/ui/audio";
import { cx } from "@/ui/common/cx";
import { useDialogFocus } from "@/ui/explore/ExploreScreen/useDialogFocus";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { DossierDecor } from "./DossierDecor";
import { DossierHeader } from "./DossierHeader";
import { CloseGlyph } from "./DossierIcons";
import { DOSSIER_DEFAULT_ART } from "./dossierArt";
import s from "./EventDossierPanel.module.css";

export const DOSSIER_ACCENT = "#0ff0f4";

interface EventDossierPanelProps {
  accent?: string;
  /** 页眉位置文字，例如"训练装备柜 · 1号房间"。 */
  kicker: string;
  title: string;
  enTitle: string;
  art?: string;
  /** 场景切换时换 key，触发内容区入场动画。 */
  contentKey: string;
  active: boolean;
  /** 关闭(✕ / Esc)。不传则 ✕ 置灰、Esc 无效。 */
  onClose?: () => void;
  children: ReactNode;
}

/** 探索物件事件的"事件档案"浮层：折角外框 + 右侧插图 + 左栏标题，场景内容由 children 提供。 */
export function EventDossierPanel({
  accent = DOSSIER_ACCENT,
  kicker,
  title,
  enTitle,
  art = DOSSIER_DEFAULT_ART,
  contentKey,
  active,
  onClose,
  children,
}: EventDossierPanelProps) {
  const { panel, onKeyDown } = useDialogFocus({ active, onEscape: () => onClose?.() });

  useEffect(() => {
    playSfx("panel");
  }, []);

  return (
    <div className={s.layer}>
      <section
        ref={panel}
        className={cx(s.panel, s["panel-reveal"])}
        style={{ "--k": accent, ...panelRevealVars() } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <img className={s.art} src={art} alt="" draggable={false} />
        <i className={s.shade} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <DossierDecor />
        <DossierHeader kicker={kicker} title={title} enTitle={enTitle} />
        <button
          type="button"
          className={s.close}
          aria-label="关闭"
          data-sfx="back"
          disabled={!onClose}
          onClick={onClose}
        >
          <CloseGlyph />
        </button>
        <div className={s.scene} key={contentKey}>{children}</div>
        <span className={s["panel-bar"]} aria-hidden />
      </section>
    </div>
  );
}
