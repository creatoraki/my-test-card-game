import s from "./ConfirmDialog.module.css";

export function ConfirmDecor() {
  return (
    <div className={s.decor} aria-hidden="true">
      <i className={`${s.notch} ${s.notchTl}`} />
      <i className={`${s.notch} ${s.notchTr}`} />
      <i className={`${s.notch} ${s.notchBl}`} />
      <i className={`${s.notch} ${s.notchBr}`} />
      <span className={s.code}>系统确认 // 0x1A</span>
      <span className={s.warning}>危险操作</span>
      <span className={s.scan} />
      <span className={s.ruler} />
    </div>
  );
}