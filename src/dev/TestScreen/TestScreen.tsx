import { NearSceneDemo } from "@/dev/NearSceneDemo";
import s from "./TestScreen.module.css";

// 测试页: 仅开发环境通过 ?page=test 进入。当前挂载程序化近景(建筑 + 地面 Canvas2D 烘焙)演示。
export function TestScreen() {
  return (
    <main className={s.root}>
      <NearSceneDemo />
    </main>
  );
}
