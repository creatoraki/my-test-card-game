import { EventPanelButton } from "@/ui/common/widget/EventPanel";
import s from "./SettingsPanel.module.css";

export interface SettingsToggleRowProps {
  name: string;
  /** 行内说明: 开关打开后会发生什么。 */
  note: string;
  on: boolean;
  onToggle: () => void;
}

/** 单个开关行: 名称 + 说明 + 开关按钮, 外观与音频行同一条带。 */
export function SettingsToggleRow({ name, note, on, onToggle }: SettingsToggleRowProps) {
  return (
    <div className={s.row}>
      <span className={`${s.rowName} ${s.rowNameAuto}`}>{name}</span>
      <span className={s.rowNote}>{note}</span>
      <EventPanelButton
        className={s.toggle}
        tone={on ? "primary" : "ghost"}
        aria-pressed={on}
        data-sfx={undefined}
        onClick={onToggle}
      >
        {on ? "已开启" : "已关闭"}
      </EventPanelButton>
    </div>
  );
}
