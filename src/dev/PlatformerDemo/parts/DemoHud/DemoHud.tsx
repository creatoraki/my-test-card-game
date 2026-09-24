import { memo } from "react";
import s from "./DemoHud.module.css";

const KEYS: readonly [string[], string][] = [
  [["←", "→"], "左右移动"],
  [["空格"], "跳跃（长按跳得更高）"],
  [["点击"], "拾取身边发光的物件"],
];

interface Props {
  shadowsLeft: number;
  shadowsTotal: number;
  alerted: number;
  onReset: () => void;
}

/** 演示界面 HUD：左上标题与操作说明，右上黑影计数与重置按钮。 */
export const DemoHud = memo(function DemoHud({ shadowsLeft, shadowsTotal, alerted, onReset }: Props) {
  return (
    <>
      <section className={s.intro} aria-label="操作说明">
        <h1 className={s.title}>生态方舟 · 横版演示</h1>
        <ul className={s.keys}>
          {KEYS.map(([keys, text]) => (
            <li key={text}>
              {keys.map((key) => <kbd key={key}>{key}</kbd>)}
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className={s.alt}>也可用 A、D 移动，W 或 ↑ 跳跃</p>
      </section>

      <section className={s.status} aria-label="场景状态">
        <div className={s.counter} data-alert={alerted > 0}>
          <span className={s.dot} aria-hidden />
          <span>剩余黑影</span>
          <strong>{shadowsLeft}</strong>
          <span className={s.of}>/ {shadowsTotal}</span>
        </div>
        {alerted > 0 && <div className={s.warning} role="status">黑影正在追击！</div>}
        <button
          type="button"
          className={s.reset}
          onClick={(event) => {
            event.currentTarget.blur();
            onReset();
          }}
        >
          重置场景
        </button>
      </section>
    </>
  );
});
