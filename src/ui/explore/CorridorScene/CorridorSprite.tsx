import type { CSSProperties } from "react";
import atlas from "@/assets/explore-corridor/sprites.png";
import s from "./CorridorScene.module.css";

/** 直接读取透明图集的九宫格，保留原始 alpha，不复制切片文件。 */
export function CorridorSprite({ index, size, className = "" }: { index: number; size: number; className?: string }) {
  return <span aria-hidden className={`${s.sprite} ${className}`} style={{
    width: size, height: size, backgroundImage: `url(${atlas})`,
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  } as CSSProperties} />;
}
