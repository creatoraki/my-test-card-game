// 全景上的常驻 HUD: 左上一条终端状态带 + 左下一组开关。
//
// ★ 两组各自是一个「飞出单元」: 进设施演出里由 TownScreen 下发 className/style,
//   本组件只管长什么样, 不管动多久动多远(时长与位移的真相在 ui/town/facilityScenes.ts)。

import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import { confirm } from "@/ui/common/ConfirmDialog";
import s from "./StationHud.module.css";

function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 35V12l22-5v23" strokeWidth={1.8} />
      <circle cx="11" cy="36" r="6" strokeWidth={1.8} />
      <circle cx="33" cy="31" r="6" strokeWidth={1.8} />
      {muted && <path d="m7 9 34 31" strokeWidth={2.4} />}
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20h8l10-8v24l-10-8H8z" strokeWidth={1.8} />
      {!muted && <path d="M31 18c3 3 3 9 0 12M35 13c6 6 6 16 0 22" strokeWidth={1.5} opacity={0.72} />}
      {muted && <path d="m8 9 33 31" strokeWidth={2.4} />}
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 18a15 15 0 1 1-1 13M11 8v10h10" />
      <path d="M24 15v10l6 4" opacity={0.65} />
    </svg>
  );
}

export interface StationHudProps {
  day: number;
  credits: number;
  facilityCount: number;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  onToggleBgm: () => void;
  onToggleSfx: () => void;
  onResetProfile: () => void;
  /** 测试奖励按钮: 只在测试构建里给。 */
  onTestReward?: () => void;
  /** 飞出动画的类名与两组各自的 CSS 变量, 由 TownScreen 在演出期间下发。 */
  flyingClassName?: string;
  statusStyle?: CSSProperties;
  cornerStyle?: CSSProperties;
}

export function StationHud({
  day,
  credits,
  facilityCount,
  bgmEnabled,
  sfxEnabled,
  onToggleBgm,
  onToggleSfx,
  onResetProfile,
  onTestReward,
  flyingClassName,
  statusStyle,
  cornerStyle,
}: StationHudProps) {
  return (
    <>
      <section className={cx(s.status, flyingClassName)} style={statusStyle} aria-label="据点终端状态">
        <span className={s.rim} aria-hidden />
        <div className={s.item}>
          <span className={s.label}>生存时间</span>
          <strong className={s.value}>第 {day} 日</strong>
        </div>
        <div className={s.item}>
          <span className={s.label}>终端积分</span>
          <strong className={s.value}>{credits.toLocaleString()}</strong>
        </div>
        <div className={s.item}>
          <span className={s.label}>启用设施</span>
          <strong className={s.value}>
            {facilityCount} / {facilityCount}
          </strong>
        </div>
      </section>

      <div className={cx(s.corner, flyingClassName)} style={cornerStyle}>
        {onTestReward && (
          <button className={cx(s.chip, s.testReward)} type="button" onClick={onTestReward}>
            测试奖励
          </button>
        )}

        <button
          className={s.chip}
          type="button"
          aria-label={sfxEnabled ? "关闭音效" : "开启音效"}
          aria-pressed={sfxEnabled}
          data-muted={!sfxEnabled}
          onClick={onToggleSfx}
        >
          <span className={s.chipIcon} aria-hidden="true"><SoundIcon muted={!sfxEnabled} /></span>
          <span>{sfxEnabled ? "音效开启" : "音效关闭"}</span>
          <span className={s.indicator} aria-hidden="true" />
        </button>

        <button
          className={s.chip}
          type="button"
          aria-label={bgmEnabled ? "关闭音乐" : "播放音乐"}
          aria-pressed={bgmEnabled}
          data-muted={!bgmEnabled}
          onClick={onToggleBgm}
        >
          <span className={s.chipIcon} aria-hidden="true"><MusicIcon muted={!bgmEnabled} /></span>
          <span>{bgmEnabled ? "音乐播放中" : "音乐已关闭"}</span>
          <span className={s.indicator} aria-hidden="true" />
        </button>

        <button
          className={cx(s.chip, s.reset)}
          type="button"
          onClick={() =>
            confirm({
              title: "重置存档",
              text: "据点档案、队员、库存与训练进度将全部清空，回到第 1 日。",
              detail: "该操作不可撤销。",
              confirmLabel: "确认重置",
              cancelLabel: "再想想",
              danger: true,
              onConfirm: onResetProfile,
            })
          }
        >
          <span className={s.chipIcon} aria-hidden="true"><ResetIcon /></span>
          <span>重置存档</span>
        </button>
      </div>
    </>
  );
}
