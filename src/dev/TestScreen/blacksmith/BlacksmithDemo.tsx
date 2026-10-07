import { useEffect, useState } from "react";
import type { BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { useExploreStore } from "@/store/explore/exploreStore";
import { BlacksmithPanel } from "@/ui/explore/Blacksmith/BlacksmithPanel";
import { beginBlacksmithDemo } from "./blacksmithDemoSession";
import s from "./BlacksmithDemo.module.css";

function ActiveDemo({ services, scale, onClose }: {
  services: [BlacksmithService, BlacksmithService]; scale: number; onClose: () => void;
}) {
  const session = useExploreStore(state => state.session);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const restore = beginBlacksmithDemo(services);
    setReady(true);
    return restore;
  }, [services]);
  useEffect(() => {
    if (ready && session?.corridor?.activeObjectId !== "演示锻造师") onClose();
  }, [ready, session, onClose]);
  if (!ready || session?.corridor?.activeObjectId !== "演示锻造师") return null;
  return <div className={s.overlay}>
    <div className={s.canvas} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      <BlacksmithPanel session={session} />
    </div>
  </div>;
}

export function BlacksmithDemo({ scale }: { scale: number }) {
  const [services, setServices] = useState<[BlacksmithService, BlacksmithService] | null>(null);
  return <>
    <div className={s.controls}>
      <span>锻造师事件演示</span>
      <button type="button" disabled={Boolean(services)} onClick={() => setServices(["draw", "replace"])}>抽牌 / 换牌</button>
      <button type="button" disabled={Boolean(services)} onClick={() => setServices(["remove", "copy"])}>删牌 / 复制</button>
    </div>
    {services && <ActiveDemo services={services} scale={scale} onClose={() => setServices(null)} />}
  </>;
}
