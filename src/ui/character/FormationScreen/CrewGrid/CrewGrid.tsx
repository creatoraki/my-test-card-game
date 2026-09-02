// 队伍列表 —— 一整片角色卡阵(不是「上阵槽 + 待命区」两段式)。
//
// ★ 全屏的面积足够把所有已唤醒的队员一次铺开, 是否出战靠**角色色描边 + 左上角三角徽标 +
//   底部动作条**表达, 比两个容器之间来回搬运更直观; 人数涨上去也只是多滚两行。
//   ⚠ 上阵人数上限仍是 RULES.progression.partySize —— 槽位没画出来, 规则由卡片开关与
//     disabled 状态表达。
// ★ 卡片站位由使用方(FormationScreen 的 baseOrder)定死, 上阵/下阵只换外观不换位置。
//
// ★ 飞散原点: 传进来的 anchorId 就是被点的那张卡, 每张卡按与它的**列距/行距**拿到方向量,
//   于是整片阵列以它为中心炸开(去程)或收拢(回程)。

import type { CharacterState } from "@/store/townStore";
import type { CSSProperties } from "react";
import { CrewCard } from "../CrewCard";
import s from "./CrewGrid.module.css";

// 卡阵一行的列数。⚠ 与 CrewGrid.module.css 的 grid-template-columns 是同一个事实:
// 1776px 宽 / (276 + 20) ⇒ 正好 6 列。改列宽要一并改这里, 否则飞散方向会算歪。
const COLS = 6;

interface Props {
  roster: string[];
  characters: Record<string, CharacterState>;
  party: string[];
  /** 上阵人数上限。 */
  size: number;
  /** 过场期间由飞行层代演的那一位。 */
  hiddenId: string | null;
  /** 飞散/收拢的原点; null = 静息态。 */
  anchorId: string | null;
  scatter: "out" | "in" | null;
  /** 卡片是否播自己的入场动画 —— 只有本页首次铺开卡阵时为 true(理由见 CrewCard 的同名 prop)。 */
  entrance: boolean;
  onOpen: (charId: string, el: HTMLElement) => void;
  onToggle: (charId: string) => void;
  /** 版面坐标(设计 px)由使用方给 —— 与 .town-bento 同款分工: TSX 管构图, CSS 管机制。 */
  style?: CSSProperties;
}

export function CrewGrid({
  roster,
  characters,
  party,
  size,
  hiddenId,
  anchorId,
  scatter,
  entrance,
  onOpen,
  onToggle,
  style,
}: Props) {
  const full = party.length >= size;
  const anchorIndex = anchorId ? roster.indexOf(anchorId) : -1;

  if (roster.length === 0) {
    return (
      <div className={s.grid} style={style}>
        <p className={s.empty}>还没有醒着的队员 —— 去冬眠仓解封几具休眠体。</p>
      </div>
    );
  }

  return (
    <div className={s.grid} style={style}>
      {roster.map((id, i) => {
        const cs = characters[id];
        if (!cs) return null;
        const offset =
          anchorIndex >= 0
            ? {
                dx: (i % COLS) - (anchorIndex % COLS),
                dy: Math.floor(i / COLS) - Math.floor(anchorIndex / COLS),
              }
            : null;
        // 被点的那张卡不参与飞散: 它此刻正被飞行层接管。
        const isAnchor = id === anchorId;
        return (
          <CrewCard
            key={id}
            cs={cs}
            index={i}
            onField={party.includes(id)}
            lastOne={party.length <= 1}
            full={full}
            size={size}
            hidden={id === hiddenId}
            offset={offset}
            scatter={isAnchor ? null : scatter}
            entrance={entrance}
            onOpen={(el) => onOpen(id, el)}
            onToggle={() => onToggle(id)}
          />
        );
      })}
    </div>
  );
}
