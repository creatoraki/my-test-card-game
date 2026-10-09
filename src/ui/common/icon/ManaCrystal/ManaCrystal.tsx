import { memo } from "react";
import { cx } from "@/ui/common/shared/cx";
import { OrnateGem } from "./OrnateGem";
import s from "./ManaCrystal.module.css";

interface Props {
  /** 调用方的取景/尺寸类。基础外观由组件自己挂，这里只叠加。 */
  className?: string;
  /** empty 已耗/未获得 · normal 常态 · active 高亮。默认 normal。 */
  state?: "empty" | "normal" | "active";
  /** 关掉 normal 态的循环呼吸，只留静态辉光。卡面费用球用。 */
  still?: boolean;
  /** 色调。mana 常规法力蓝（默认）· haste 速攻卡的红绿混合。 */
  tone?: "mana" | "haste";
  /** 华丽外观(SVG 宝石: 纵向渐变本体 + 亮边 + 外柔光, 见 OrnateGem), 新皮肤卡面费用与战斗左侧法力条用。默认关闭。 */
  ornate?: boolean;
}

export const ManaCrystal = memo(function ManaCrystal({ className, state = "normal", still, tone = "mana", ornate }: Props) {
  return (
    <span
      className={cx(
        s.crystal,
        s[`is-${state}`],
        tone === "haste" && s["is-haste"],
        still && s["is-still"],
        ornate && s["is-ornate"],
        className,
      )}
      aria-hidden="true"
    >
      {ornate ? <OrnateGem tone={tone} /> : <span className={s.shape} />}
    </span>
  );
});