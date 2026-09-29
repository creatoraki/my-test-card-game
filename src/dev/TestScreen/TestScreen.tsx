import { useState, type CSSProperties } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { NEAR_MAP_GEOMETRY } from "@/explore/dungeon/nearMapGeometry";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { CorridorAbyss, CorridorFar, CorridorNear } from "@/ui/explore/CorridorScene/parts/CorridorBackdrop";
import { CorridorPlayer } from "@/ui/explore/CorridorScene/parts/CorridorPlayer";
import { CORRIDOR_LAYOUT } from "@/ui/explore/CorridorScene/corridorLayout";
import { ShowcaseProp } from "./propShowcase/ShowcaseProp";
import { SHOWCASE_PLAYER_X, SHOWCASE_PROPS } from "./propShowcase/showcaseProps";
import { SfxShowcase } from "./sfxShowcase/SfxShowcase";
import s from "./TestScreen.module.css";

const NEAR_VARIANT = "neonCity1";
/** 近景取中段一屏作为演示背景。 */
const NEAR_CAMERA_X = 1100;
const FLOOR_Y = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;

type DemoPage = "props" | "sfx";
const PAGES: readonly { page: DemoPage; name: string }[] = [
  { page: "props", name: "交互物美术" },
  { page: "sfx", name: "攻击音效" },
];

/** 调试演示页: 右上角切换「交互物美术」与「攻击音效试听」。 */
export function TestScreen() {
  const [page, setPage] = useState<DemoPage>("props");

  return <main className={s.root}>
    <StageCanvas className={s.canvas}>
      {page === "props" ? <PropShowcase /> : <SfxShowcase />}
      <nav className={s.tabs}>
        {PAGES.map((item) => <button
          key={item.page}
          type="button"
          className={`${s.toggle} ${page === item.page ? s.on : ""}`}
          onClick={() => setPage(item.page)}
        >
          {item.name}
        </button>)}
      </nav>
    </StageCanvas>
  </main>;
}

/** 交互物美术演示：废弃楼层真实背景上并排摆放 5 件 SVG 交互物，附角色作身高参照。 */
function PropShowcase() {
  const [outlined, setOutlined] = useState(false);
  const [showName, setShowName] = useState(true);

  return <>
    <CorridorFar />
    <CorridorAbyss variant={NEAR_VARIANT} />
    <div className={s.haze} aria-hidden />
    <div className={s.world} style={{ transform: `translateX(${-NEAR_CAMERA_X}px)` }}>
      <CorridorNear width={NEAR_MAP_GEOMETRY[NEAR_VARIANT].width} variant={NEAR_VARIANT} />
    </div>
    <div className={s.entities}>
      {SHOWCASE_PROPS.map((prop) => <ShowcaseProp key={prop.id} prop={prop} floorY={FLOOR_Y} outlined={outlined} showName={showName} />)}
      <div className={s.playerAnchor} style={{ left: SHOWCASE_PLAYER_X, top: FLOOR_Y } as CSSProperties}>
        <div className={s.player}><CorridorPlayer walking={false} facing={1} /></div>
      </div>
    </div>
    <div className={s.vignette} aria-hidden />
    <div className={s.controls}>
      <span className={s.title}>交互物美术演示</span>
      <button type="button" className={`${s.toggle} ${outlined ? s.on : ""}`} onClick={() => setOutlined((value) => !value)}>
        靠近高亮：{outlined ? "开" : "关"}
      </button>
      <button type="button" className={`${s.toggle} ${showName ? s.on : ""}`} onClick={() => setShowName((value) => !value)}>
        名称牌：{showName ? "显示" : "隐藏"}
      </button>
    </div>
  </>;
}
