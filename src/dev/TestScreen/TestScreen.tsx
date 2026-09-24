import { FloorExploreDemo } from "@/dev/FloorExploreDemo";
import s from "./TestScreen.module.css";

// 测试页: 仅开发环境通过 ?page=test 进入。当前挂载《废弃楼层》Three.js 等轴房间探索演示。
export function TestScreen() {
  return (
    <main className={s.root}>
      <FloorExploreDemo />
    </main>
  );
}
