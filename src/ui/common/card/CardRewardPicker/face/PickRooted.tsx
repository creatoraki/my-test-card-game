// 新皮肤的缠根覆层(354×483 设计 px): 整卡罩一层苔绿暗雾 + 居中的解缠按钮(可选)。
// 老卡面(HandCard/parts/RootedCard)是整卡平铺斜纹 + 小方框; 新皮肤的藤蔓改由 PickRimDecor 缠在钢框上,
// 「缠根」标识与释义随其它战斗标记排在卡外左上(face/PickFaceMarks), 这里只负责「不能打出」的读法与解缠操作。
import s from "./PickRooted.module.css";

interface Props {
  uid: string;
  onRelease?: (uid: string) => void;
  disabled?: boolean;
}

export function PickRooted({ uid, onRelease, disabled }: Props) {
  return (
    <div className={s.rooted} onClick={(event) => event.stopPropagation()}>
      <span className={s.mist} aria-hidden="true" />
      {onRelease && (
        <button
          type="button"
          className={s.release}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onRelease(uid);
          }}
        >
          解缠 · 1 水晶
        </button>
      )}
    </div>
  );
}
