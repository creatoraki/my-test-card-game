import { RoomCrawlDemo } from "@/dev/RoomCrawlDemo";
import s from "./TestScreen.module.css";

// 测试页: 仅开发环境通过 ?page=test 进入。当前挂载《废弃楼层》2.5D 横版房间探索演示。
export function TestScreen() {
  return (
    <main className={s.root}>
      <RoomCrawlDemo />
    </main>
  );
}
