import s from "./HurtVignette.module.css";

interface Props {
  seq: number;
}

export function HurtVignette({ seq }: Props) {
  return <div className={s["hurt-vignette"]} data-seq={seq} aria-hidden="true" />;
}