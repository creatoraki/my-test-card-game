import { useEffect, type CSSProperties, type ReactNode } from "react";
import { playSfx } from "@/ui/audio";
import { cx } from "@/ui/common/cx";
import { useDialogFocus } from "@/ui/explore/ExploreScreen/useDialogFocus";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { DossierDecor } from "./DossierDecor";
import { DossierHeader } from "./DossierHeader";
import { DOSSIER_DEFAULT_ART } from "./dossierArt";
import s from "./EventDossierPanel.module.css";

export const DOSSIER_ACCENT = "#0ff0f4";

/** 换场节奏: 与 EventDossierPanel.module.css 的 dossierSceneOut / dossierSceneIn 时长一致。 */
const SCENE_LEAVE_MS = 280;
const SCENE_ENTER_MS = 460;

interface EventDossierPanelProps {
  accent?: string;
  /** 页眉位置文字，例如"训练装备柜 · 1号房间"。 */
  kicker: string;
  title: string;
  enTitle: string;
  art?: string;
  /** 场景切换时换 key：旧内容向上滚出，新内容从下方滚入。 */
  contentKey: string;
  active: boolean;
  /** Esc 关闭。不传则 Esc 无效。面板不设关闭按钮, 离开走按钮网格里的选项。 */
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
  // 退场期间冻结旧内容的快照, 退场结束后换成新内容再入场。
  const scene = useSwapTransition(children, contentKey, SCENE_LEAVE_MS, SCENE_ENTER_MS);

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
        <div className={s.scene} data-phase={scene.phase}>{scene.value}</div>
        <span className={s["panel-bar"]} aria-hidden />
      </section>
    </div>
  );
}
