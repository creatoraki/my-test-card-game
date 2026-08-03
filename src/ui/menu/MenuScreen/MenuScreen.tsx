import { useRef, type CSSProperties } from "react";
import { useRunStore } from "@/store/runStore";
import { useStageScale } from "@/ui/hooks/stage";
import { useGameAssetPreload } from "@/ui/hooks/useGameAssetPreload";
import { cx } from "@/ui/common/cx";
import { MenuStartButton } from "@/ui/menu/MenuStartButton";
import { MENU_BG_VIDEO, MENU_TITLE_ART } from "@/ui/art/sceneArt";
import s from "./MenuScreen.module.css";

export function MenuScreen() {
  const enterTown = useRunStore((s) => s.enterTown);
  const preload = useGameAssetPreload();
  const viewportRef = useRef<HTMLDivElement>(null);
  // 复用战斗那套设计画布: k = min(容器宽/1920, 容器高/1080, 2560/1920)。见 ui/stage.ts
  const stageScale = useStageScale(viewportRef);
  const ready = preload.status === "ready";
  const loadLabel =
    preload.status === "ready"
      ? preload.failed > 0
        ? `资源准备完成，${preload.failed} 项加载失败`
        : ""
      : `正在准备美术资源 ${preload.completed} / ${preload.total}`;

  return (
    // letterbox 容器: 铺满窗口, 画布之外的部分是黑边(背景色 #000, 见 .menu-viewport)
    <div
      className={s["menu-viewport"]}
      ref={viewportRef}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      {/* 封面画布 = 固定 1920×1080, 整体等比缩放适配窗口 ⇒ 画面恒为 16:9、构图永不随分辨率变。
          ★ 下面所有坐标/尺寸都是「设计 px」(1920×1080 基准), 直接照着 1920×1080 的设计稿填数就行。 */}
      <div
        className={cx(s["screen"], s["menu-splash"])}
        aria-busy={!ready}
      >
        {/* 背景层: 16:9 视频铺满画布(cover 裁切), 与战斗背景 .battle-bg-video 同款做法。 */}
        <video
          className={s["menu-bg-video"]}
          src={MENU_BG_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* 游戏标题(512×512 方形, 仅文字): 叠在视频背景之上。
            位置/大小的微调旋钮全在下面 style 内联(left / top / width), 直接改数值即可。 */}
        <div
          className={s["menu-title"]}
          style={{
            left: "280px", // ← 水平位置(中心锚点, 设计 px: 960 = 画布正中, 调小往左, 调大往右)
            top: "100px", // ← 距画布顶部距离(设计 px, 0~1080, 越大越靠下)
          }}
        >
          <img
            src={MENU_TITLE_ART}
            alt="霓虹都市"
            draggable={false}
            style={{
              width: "250px", // ← 显示宽度(设计 px; 原图 512×512, 高度等比自适应)
            }}
          />
        </div>

        {/* 「开始游戏」图片按钮: 叠在视频背景之上, 右侧偏下。
            图 + 轮廓跑光/内部光尘/外溢火星三层特效封装在 ui/MenuStartButton.tsx 里,
            这里只管「摆在哪、多大」—— 位置/大小的微调旋钮全在下面, 直接改数值即可。 */}
        <MenuStartButton
          onClick={enterTown}
          disabled={!ready}
          right="220px" // ← 距画布右边距离(设计 px, 0~1920, 越大越靠左)
          bottom="320px" // ← 距画布底部距离(设计 px, 0~1080, 越大越靠上)
          width="220px" // ← 显示宽度(设计 px; 原图 256×256, 等比缩放)
        />
        {loadLabel && (
          <p className={s["menu-load-status"]} role="status" aria-live="polite">
            {loadLabel}
          </p>
        )}
      </div>
    </div>
  );
}
