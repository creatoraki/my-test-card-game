import { getRoom } from "../../data";
import s from "./RoomBanner.module.css";

const FLOOR_NAME = "废弃楼层";

const CONTROLS: { keys: string[]; label: string }[] = [
  { keys: ["W", "A", "S", "D"], label: "移动" },
  { keys: ["⇧"], label: "奔跑" },
  { keys: ["␣"], label: "跳跃" },
  { keys: ["E"], label: "调查" },
  { keys: ["F2"], label: "校准叠层" },
];

export interface BannerNotice {
  key: number;
  text: string;
}

/**
 * 顶部居中的房间铭牌(常驻, 附操作提示)、每次进房时展开的大标题(房名 + 一句描述),
 * 以及铭牌下方短暂出现的状态提示。大标题与提示都以 key 重新挂载, 借 CSS 动画播放一次。
 */
export function RoomBanner({ roomId, notice }: { roomId: string; notice: BannerNotice | null }) {
  const room = getRoom(roomId);
  return <>
    <div className={s.plate}>
      <span className={s.floor}>{FLOOR_NAME}</span>
      <span className={s.divider} aria-hidden />
      <span className={s.room}>{room.name}</span>
      <span className={s.controls}>
        {CONTROLS.map((c) => <span key={c.label} className={s.control}>
          {c.keys.map((k) => <kbd key={k} className={s.key} aria-hidden>{k}</kbd>)}
          <span>{c.label}</span>
        </span>)}
      </span>
    </div>
    {notice && <div key={notice.key} className={s.notice} role="status">{notice.text}</div>}
    <div key={roomId} className={s.banner} aria-hidden>
      <span className={s.bannerFloor}>{FLOOR_NAME}</span>
      <span className={s.bannerName}>{room.name}</span>
      <span className={s.bannerRule} />
      <span className={s.bannerSub}>{room.subtitle}</span>
    </div>
  </>;
}
