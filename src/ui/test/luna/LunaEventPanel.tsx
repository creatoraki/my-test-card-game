import { useState, type CSSProperties } from "react";
import { useTypewriter } from "@/ui/hooks/useTypewriter";
import s from "./LunaEventPanel.module.css";

type EventType = "risk" | "growth" | "survival";
type Scene = "briefing" | "choice" | "result";

type EventOption = {
  name: string;
  description: string;
  cost: string;
  costTone: "amber" | "cyan" | "red";
  result: string;
  summary: string;
  disabled?: boolean;
  disabledReason?: string;
};

type EventContent = {
  label: string;
  title: string;
  subtitle: string;
  body: string;
  accent: string;
  icon: string;
  sceneName: string;
  options: EventOption[];
};

const EVENT_CONTENT: Record<EventType, EventContent> = {
  risk: {
    label: "RISK EVENT / 07",
    title: "失控的回收塔",
    subtitle: "某种声音正在废弃楼层深处循环播放。",
    body: "一座旧型能源回收塔仍在运转，破碎的指示灯将雾气染成橙红色。塔心藏着可观的物资，但每一次靠近，警报的频率都会更快。",
    accent: "#ff9d4d",
    icon: "!",
    sceneName: "RECLAIM TOWER",
    options: [
      {
        name: "切断主电源",
        description: "让塔安静下来，再从冷却仓中取走物资。",
        cost: "消耗 1 机械零件",
        costTone: "amber",
        result: "你在最后一声警报前切断了主电源。",
        summary: "获得 2 个冷凝芯片，队伍污染 -4",
      },
      {
        name: "强行拆解塔心",
        description: "用暴力换取更高收益，但动静会惊动楼层。",
        cost: "消耗 8 体力",
        costTone: "red",
        result: "塔心在你的手中裂开，滚烫的能量喷涌而出。",
        summary: "获得稀有模块，队伍污染 +6",
      },
      {
        name: "接入旧终端",
        description: "读取回收塔的最后一条维护记录。",
        cost: "缺少 1 个解码芯片",
        costTone: "cyan",
        result: "终端拒绝了你的请求，屏幕上只留下一个坐标。",
        summary: "暂时无法执行，未获得奖励",
        disabled: true,
        disabledReason: "资源不足",
      },
    ],
  },
  growth: {
    label: "GROWTH EVENT / 03",
    title: "温室里的微光",
    subtitle: "在钢铁与尘埃之间，有一株植物活了下来。",
    body: "透明穹顶下的培育舱还留有微弱的暖光。那株陌生植物的根系缠住了供能管线，像是在等待一个愿意伸手的人。",
    accent: "#b9df54",
    icon: "+",
    sceneName: "GLASSHOUSE 03",
    options: [
      {
        name: "收集成熟果实",
        description: "保留根系，为队伍带回一份稳定的补给。",
        cost: "无消耗",
        costTone: "cyan",
        result: "你小心摘下果实，温暖的香气驱散了疲惫。",
        summary: "获得 1 个净化果实，队伍士气 +2",
      },
      {
        name: "移植整株植物",
        description: "带走培育舱，也许它能在据点继续生长。",
        cost: "消耗 1 个空置容器",
        costTone: "amber",
        result: "根系被完整保存，微光在你的手臂旁重新亮起。",
        summary: "获得据点种植素材，后续事件已解锁",
      },
      {
        name: "焚烧培育舱",
        description: "用火焰清理潜伏的孢子污染。",
        cost: "需要火焰模块",
        costTone: "red",
        result: "火焰吞没温室，灰烬里露出一枚旧徽章。",
        summary: "获得未知徽章，但当前装备栏已满",
        disabled: true,
        disabledReason: "装备栏已满",
      },
    ],
  },
  survival: {
    label: "SURVIVAL EVENT / 11",
    title: "无人值守的医疗站",
    subtitle: "自动门半开着，里面还有一盏绿色的灯。",
    body: "医疗站的备用电池即将耗尽。扫描仪发出低沉的嗡鸣，药柜上贴着褪色的警告：请勿同时唤醒两台治疗单元。",
    accent: "#63d6d1",
    icon: "✚",
    sceneName: "MEDICAL UNIT",
    options: [
      {
        name: "启动急救单元",
        description: "为一名队员恢复状态，消耗最后的电力。",
        cost: "消耗 1 能量灯",
        costTone: "cyan",
        result: "急救单元缓慢启动，冷光覆盖了伤口。",
        summary: "随机一名队员恢复 18 HP",
      },
      {
        name: "搜刮药品柜",
        description: "跳过扫描，快速带走可以找到的药品。",
        cost: "无消耗",
        costTone: "amber",
        result: "你在抽屉夹层找到了一支未过期的注射剂。",
        summary: "获得 1 个应急注射剂",
      },
      {
        name: "净化污染源",
        description: "深入地下管线，彻底处理医疗站的异常。",
        cost: "需要净化权限",
        costTone: "red",
        result: "权限不足，管线深处的黑色液体仍在流动。",
        summary: "暂时无法执行，未获得奖励",
        disabled: true,
        disabledReason: "权限不足",
      },
    ],
  },
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  risk: "风险事件",
  growth: "成长事件",
  survival: "生存事件",
};

export function LunaEventPanel() {
  const [eventType, setEventType] = useState<EventType>("risk");
  const [scene, setScene] = useState<Scene>("briefing");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const event = EVENT_CONTENT[eventType];
  const chosenOption = selectedOption === null ? null : event.options[selectedOption];
  const subtitle = useTypewriter(event.subtitle, 220, 38);
  const body = useTypewriter(event.body, 420, 28);
  const result = useTypewriter(chosenOption?.result ?? "", 180, 34);

  function switchEvent(type: EventType) {
    setEventType(type);
    setScene("briefing");
    setSelectedOption(null);
  }

  function resetEvent() {
    setScene("briefing");
    setSelectedOption(null);
  }

  function chooseOption(index: number) {
    if (event.options[index].disabled) return;
    setSelectedOption(index);
    setScene("result");
  }

  return (
    <div className={s.lunaFrame}>
      <div className={s.typeRail} role="tablist" aria-label="事件类型">
        <div className={s.typeRailTitle}>EVENT SELECT</div>
        {(Object.keys(EVENT_CONTENT) as EventType[]).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={eventType === type}
            className={eventType === type ? s.typeActive : undefined}
            onClick={() => switchEvent(type)}
            style={{ "--type-accent": EVENT_CONTENT[type].accent } as CSSProperties}
          >
            <span className={s.typeDot} />
            <span>{EVENT_TYPE_LABELS[type]}</span>
            <small>{EVENT_CONTENT[type].label.split(" / ")[1]}</small>
          </button>
        ))}
      </div>

      <div className={s.eventDemo} style={{ "--event-accent": event.accent } as CSSProperties}>
        <header className={s.demoHeader}>
          <div>
            <span className={s.demoKicker}>SCENARIO LAB / 事件面板原型</span>
            <h1>探索事件</h1>
          </div>
          <div className={s.headerActions}>
            <span className={s.sceneProgress} aria-label={`当前分镜 ${scene === "briefing" ? 1 : scene === "choice" ? 2 : 3} / 3`}>
              <i className={scene === "briefing" ? s.progressActive : ""} />
              <i className={scene === "choice" ? s.progressActive : ""} />
              <i className={scene === "result" ? s.progressActive : ""} />
              <span>{scene === "briefing" ? "情报" : scene === "choice" ? "行动" : "结算"}</span>
            </span>
            <button type="button" className={s.resetButton} onClick={resetEvent}>
              <span aria-hidden="true">↺</span> 重置事件
            </button>
          </div>
        </header>

        <main className={s.sceneViewport} data-scene={scene} key={`${eventType}-${scene}`}>
          {scene === "briefing" && (
            <section className={s.briefingScene} aria-label="事件情报">
              <div className={s.scenePlaceholder} aria-label="事件插图占位区域">
                <div className={s.sceneGrid} />
                <div className={s.sceneOrb} />
                <div className={s.sceneFrame}>
                  <span>01</span>
                  <span>VISUAL<br />PLACEHOLDER</span>
                </div>
                <div className={s.sceneCaption}>
                  <span>ARCHIVE IMAGE</span>
                  <strong>{event.sceneName}</strong>
                </div>
                <div className={s.sceneGlyph} aria-hidden="true">{event.icon}</div>
              </div>
              <div className={s.briefingCopy}>
                <div className={s.eventLabel}><span /> {event.label}</div>
                <h2>{event.title}</h2>
                <p className={`${s.storySubtitle} ${!subtitle.done ? s.typingText : ""}`}>{subtitle.shown}</p>
                <p className={`${s.storyBody} ${!body.done ? s.typingText : ""}`}>{body.shown}</p>
                <div className={s.storyMeta}>
                  <span><b>⌁</b> 当前区域 · 废弃楼层</span>
                  <span><b>◷</b> 节点剩余 02</span>
                </div>
                <button type="button" className={s.advanceButton} onClick={() => setScene("choice")}>
                  查看可用行动 <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          )}

          {scene === "choice" && (
            <section className={s.choiceScene} aria-label="事件行动选择">
              <div className={s.choiceIntro}>
                <span className={s.sceneEyebrow}>02 / ACTION PHASE</span>
                <h2>你要怎么做？</h2>
                <p>选择一条行动路径。点击后立即结算事件结果。</p>
                <div className={s.choiceSignal}><span /> 可用路径 {event.options.filter((option) => !option.disabled).length} / {event.options.length}</div>
              </div>
              <div className={s.optionsList}>
                {event.options.map((option, index) => {
                  const costClass = `cost${option.costTone[0].toUpperCase()}${option.costTone.slice(1)}` as keyof typeof s;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      className={s.option}
                      disabled={option.disabled}
                      onClick={() => chooseOption(index)}
                    >
                      <span className={s.optionNumber}>{String(index + 1).padStart(2, "0")}</span>
                      <span className={s.optionMain}>
                        <strong>{option.name}</strong>
                        <span>{option.description}</span>
                        <em className={s[costClass]}><i /> {option.cost}</em>
                      </span>
                      <span className={s.optionArrow} aria-hidden="true">↗</span>
                      {option.disabled && <small className={s.disabledTag}>{option.disabledReason}</small>}
                    </button>
                  );
                })}
              </div>
              <button type="button" className={s.backButton} onClick={() => setScene("briefing")}>
                <span aria-hidden="true">←</span> 返回情报
              </button>
            </section>
          )}

          {scene === "result" && chosenOption && (
            <section className={s.resultScene} aria-label="事件结算结果" aria-live="polite">
              <div className={s.resultSeal}>✓</div>
              <span className={s.sceneEyebrow}>03 / RESOLVED</span>
              <h2>事件已结算</h2>
              <p className={`${s.resultStory} ${!result.done ? s.typingText : ""}`}>{result.shown}</p>
              <div className={s.summaryRow}>
                <span>结算摘要</span>
                <strong>{chosenOption.summary}</strong>
              </div>
              <div className={s.rewardNotice}>
                <span className={s.rewardPulse} />
                <div><strong>奖励待处理</strong><span>已加入远征奖励队列</span></div>
                <span className={s.rewardArrow}>→</span>
              </div>
              <button type="button" className={s.advanceButton} onClick={resetEvent}>
                查看事件概览 <span aria-hidden="true">↺</span>
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
