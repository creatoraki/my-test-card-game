// 路线图组件的**样式验收页** —— 只在 TestScreen 里预览, 不进产线。
// 控制条负责把组件的几种画面切出来: 生成演出 / 桥接遮蔽 / 桥接显形 / 选入口后的推进。
// ⚠ 重播演出与换图都靠 key 重挂: 组件内部的推进状态因此一并清空, 不需要额外的复位接口。

import { useCallback, useEffect, useState } from "react";
import { OpusRouteBoard, OPUS_GENERATE_MS, OPUS_PANEL_W, OPUS_PANEL_H } from "./OpusRouteBoard";
import { makeMockBoard } from "./opusRouteMock";
import s from "./OpusRoutePanel.module.css";

export function OpusRoutePanel() {
  const [seed, setSeed] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const [showBridges, setShowBridges] = useState(false);
  const [generating, setGenerating] = useState(true);

  // ⚠ 用 state 缓存当前这张图: 直接在渲染里调 makeMockBoard 会让每次重渲染都换一套构图。
  const [current, setCurrent] = useState(() => makeMockBoard(1));
  useEffect(() => {
    setCurrent(makeMockBoard(seed));
  }, [seed]);

  const replay = useCallback(() => {
    setShowBridges(false);
    setRunKey((k) => k + 1);
    setGenerating(true);
  }, []);

  // 生成演出播完自动解锁交互。
  useEffect(() => {
    if (!generating) return;
    const id = window.setTimeout(() => setGenerating(false), OPUS_GENERATE_MS);
    return () => window.clearTimeout(id);
  }, [generating, runKey]);

  return (
    <div className={s.root}>
      <header className={s.head}>
        <div>
          <span className={s.kicker}>ROUTE BOARD / ISOMETRIC</span>
          <h2 className={s.title}>区域路线图 · 格子重制</h2>
        </div>
        <div className={s.actions}>
          <button type="button" onClick={replay}>
            重播生成演出
          </button>
          <button
            type="button"
            onClick={() => {
              setSeed((v) => v + 1);
              replay();
            }}
          >
            换一张图
          </button>
          <button
            type="button"
            className={showBridges ? s.on : undefined}
            onClick={() => setShowBridges((v) => !v)}
          >
            {showBridges ? "隐藏桥接" : "显示桥接"}
          </button>
        </div>
      </header>

      <p className={s.hint}>
        悬停节点看详情卡 · 悬停入口点亮整条通道 · 点入口后沿路线连播 4 段推进
      </p>

      <div className={s.stage} style={{ width: OPUS_PANEL_W, height: OPUS_PANEL_H }}>
        <OpusRouteBoard
          key={`${seed}-${runKey}`}
          board={current}
          showBridges={showBridges}
          generating={generating}
        />
      </div>
    </div>
  );
}
