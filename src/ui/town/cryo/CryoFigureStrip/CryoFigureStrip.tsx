import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from "react";
import { cx } from "@/ui/common/cx";
import s from "./CryoFigureStrip.module.css";

interface Props {
  children: ReactNode;
  className?: string;
}

export function CryoFigureStrip({ children, className }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; x: number; scrollLeft: number } | null>(null);
  const draggedRef = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    setAtStart(viewport.scrollLeft <= 1);
    setAtEnd(maxScroll <= 1 || viewport.scrollLeft >= maxScroll - 1);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(viewport);
    resizeObserver.observe(viewport.firstElementChild ?? viewport);
    updateEdges();
    return () => resizeObserver.disconnect();
  }, [children]);

  const scrollByPage = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * Math.max(viewport.clientWidth * 0.78, 180), behavior: "smooth" });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollLeft += event.deltaY;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, scrollLeft: viewport.scrollLeft };
    draggedRef.current = false;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    const viewport = viewportRef.current;
    if (!pointer || pointer.id !== event.pointerId || !viewport) return;
    const distance = event.clientX - pointer.x;
    if (Math.abs(distance) > 4) {
      draggedRef.current = true;
      if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
    }
    viewport.scrollLeft = pointer.scrollLeft - distance;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    pointerRef.current = null;
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    draggedRef.current = false;
  };

  return (
    <div className={cx(s.strip, className)}>
      <div
        className={s.viewport}
        ref={viewportRef}
        onScroll={updateEdges}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
      >
        <div className={s.track}>{children}</div>
      </div>
      {!atStart && <button className={`${s.arrow} ${s.previous}`} type="button" onClick={() => scrollByPage(-1)} aria-label="向左查看更多">←</button>}
      {!atEnd && <button className={`${s.arrow} ${s.next}`} type="button" onClick={() => scrollByPage(1)} aria-label="向右查看更多">→</button>}
      {!atStart && <span className={`${s.edge} ${s.edgeStart}`} aria-hidden />}
      {!atEnd && <span className={`${s.edge} ${s.edgeEnd}`} aria-hidden />}
    </div>
  );
}