import { useState, type SyntheticEvent } from "react";
import s from "./FlatMaterialScene.module.css";

export function GroundedMaterial({ src, name, x, height, floor }: {
  src: string; name: string; x: number; height: number; floor: number;
}) {
  const [bounds, setBounds] = useState<{ width: number; height: number; left: number; top: number; right: number; bottom: number } | null>(null);
  const measure = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const width = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = sourceHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, width, sourceHeight);
    let left = width, top = sourceHeight, right = -1, bottom = -1;
    for (let y = 0; y < sourceHeight; y++) {
      for (let px = 0; px < width; px++) {
        if (data[(y * width + px) * 4 + 3] < 24) continue;
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    if (bottom >= top) setBounds({ width, height: sourceHeight, left, top, right, bottom });
  };
  const scale = bounds ? height / (bounds.bottom - bounds.top + 1) : 1;
  return <div className={s.material} style={{ left: x, top: floor }}>
    <img src={src} alt={name} draggable={false} onLoad={measure} style={bounds ? {
      width: bounds.width * scale,
      height: bounds.height * scale,
      left: -(bounds.left + bounds.right + 1) / 2 * scale,
      top: -(bounds.bottom + 1) * scale,
    } : { visibility: "hidden" }} />
    <span className={s.label}>{name}</span>
  </div>;
}
