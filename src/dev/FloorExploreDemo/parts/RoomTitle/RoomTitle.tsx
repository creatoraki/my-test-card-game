import { FLOOR_NAME, getRoom } from "../../data";
import s from "./RoomTitle.module.css";

/**
 * 顶部居中的房间铭牌(常驻, 附操作提示), 以及每次进房时淡入淡出的大标题。
 * 大标题以 roomId 为 key 重新挂载, 借 CSS 动画自然播放一次。
 */
export function RoomTitle({ roomId }: { roomId: string }) {
  const name = getRoom(roomId).name;
  return <>
    <div className={s.plate}>
      <span className={s.floor}>{FLOOR_NAME}</span>
      <span className={s.divider} aria-hidden />
      <span className={s.room}>{name}</span>
      <span className={s.controls}>键盘或鼠标点击移动 · 走进门口前往相邻房间</span>
    </div>
    <div key={roomId} className={s.banner} aria-hidden>
      <span className={s.bannerFloor}>{FLOOR_NAME}</span>
      <span className={s.bannerName}>{name}</span>
      <span className={s.bannerRule} />
    </div>
  </>;
}
