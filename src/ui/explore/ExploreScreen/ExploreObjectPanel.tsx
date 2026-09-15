import { useEffect, type CSSProperties, type ReactNode } from "react";
import { playSfx } from "@/ui/audio";
import {
  EventPanelFrame,
  type EventPanelScene,
} from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { useDialogFocus } from "./useDialogFocus";
import s from "./ExploreObjectPanel.module.css";

interface ExploreObjectPanelProps {
  accent: string;
  kicker: string;
  title: ReactNode;
  status?: ReactNode;
  scene: EventPanelScene;
  contentKey: string;
  active: boolean;
  onEscape: () => void;
  children: ReactNode;
}

/** 房间物件事件的统一浮层外壳，内容场景由 EventPanel 负责。 */
export function ExploreObjectPanel({
  accent,
  kicker,
  title,
  status,
  scene,
  contentKey,
  active,
  onEscape,
  children,
}: ExploreObjectPanelProps) {
  const { panel, onKeyDown } = useDialogFocus({ active, onEscape });

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
        aria-label={typeof title === "string" ? title : kicker}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <span className={s["panel-bar"]} aria-hidden="true" />
        <span className={s["panel-scan"]} aria-hidden="true" />
        <EventPanelFrame
          accent={accent}
          kicker={kicker}
          title={title}
          status={status !== undefined ? <span className={s.status}>{status}</span> : undefined}
          scene={scene}
          contentKey={contentKey}
        >
          {children}
        </EventPanelFrame>
      </section>
    </div>
  );
}
