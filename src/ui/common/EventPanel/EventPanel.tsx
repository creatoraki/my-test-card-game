import { type CSSProperties, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { neonFrameClass } from "./NeonFrame";
import frame from "./styles/eventPanelFrame.module.css";

export type EventPanelScene = "briefing" | "choice" | "result";

export interface EventPanelOption {
  id: string;
  name: string;
  description?: ReactNode;
  cost?: ReactNode;
  costTone?: "amber" | "cyan" | "red";
  disabled?: boolean;
  disabledReason?: string;
  state?: "chosen" | "dimmed";
  leading?: ReactNode;
  index?: number;
}

interface EventPanelFrameProps {
  accent: string;
  kicker?: string;
  title: ReactNode;
  status?: ReactNode;
  headerExtra?: ReactNode;
  contentKey?: string;
  scene?: EventPanelScene;
  children: ReactNode;
  className?: string;
  variant?: "rest";
}

export function EventPanelFrame({
  accent,
  kicker,
  title,
  status,
  headerExtra,
  contentKey,
  scene,
  children,
  className,
  variant,
}: EventPanelFrameProps) {
  const style = { "--event-accent": accent } as CSSProperties;
  return (
    <div className={cx(frame.eventDemo, neonFrameClass, className)} data-variant={variant} style={style}>
      <header className={frame.demoHeader}>
        <div className={frame.headerTitle}>
          {kicker && <span className={frame.demoKicker}>{kicker}</span>}
          <h1>{title}</h1>
        </div>
        <div className={frame.headerActions}>
          {status}
          {headerExtra}
        </div>
      </header>
      <main className={frame.sceneViewport} data-scene={scene} key={contentKey}>
        {children}
      </main>
    </div>
  );
}

interface EventPanelProps {
  accent: string;
  kicker: string;
  title: string;
  scene: EventPanelScene;
  sceneKey: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "rest";
}

export function EventPanel({
  accent,
  kicker,
  title,
  scene,
  sceneKey,
  headerExtra,
  children,
  className,
  variant,
}: EventPanelProps) {
  const sceneLabel = scene === "briefing" ? "情报" : scene === "choice" ? "行动" : "结算";
  const sceneIndex = scene === "briefing" ? 1 : scene === "choice" ? 2 : 3;
  return (
    <EventPanelFrame
      accent={accent}
      kicker={kicker}
      title={title}
      scene={scene}
      contentKey={`${sceneKey}-${scene}`}
      headerExtra={headerExtra}
      className={className}
      variant={variant}
      status={
        <span className={frame.sceneProgress} aria-label={`当前分镜 ${sceneIndex} / 3`}>
          <i className={scene === "briefing" ? frame.progressActive : ""} />
          <i className={scene === "choice" ? frame.progressActive : ""} />
          <i className={scene === "result" ? frame.progressActive : ""} />
          <span>{sceneLabel}</span>
        </span>
      }
    >
      {children}
    </EventPanelFrame>
  );
}
