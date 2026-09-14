import { useCallback, useEffect, useRef, useState } from "react";

export type PortalTravelPhase = "idle" | "fade-out" | "fade-in";
type PortalTravelAction = () => boolean;

/** 房间切换先盖黑场，执行传送后再揭开新房间。 */
export function usePortalTravelTransition(roomId: string) {
  const [phase, setPhase] = useState<PortalTravelPhase>("idle");
  const phaseRef = useRef(phase);
  const previousRoomId = useRef(roomId);
  const pendingTravel = useRef<PortalTravelAction | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    if (previousRoomId.current === roomId) return;
    previousRoomId.current = roomId;
    if (phaseRef.current === "fade-out") {
      phaseRef.current = "fade-in";
      setPhase("fade-in");
    }
  }, [roomId]);

  const start = useCallback((travel: PortalTravelAction) => {
    if (phaseRef.current !== "idle") return;
    pendingTravel.current = travel;
    phaseRef.current = "fade-out";
    setPhase("fade-out");
  }, []);

  const finishAnimation = useCallback(() => {
    if (phaseRef.current === "fade-out") {
      const travel = pendingTravel.current;
      pendingTravel.current = null;
      if (!travel?.()) {
        phaseRef.current = "fade-in";
        setPhase("fade-in");
      }
      return;
    }

    if (phaseRef.current === "fade-in") {
      phaseRef.current = "idle";
      setPhase("idle");
    }
  }, []);

  return { phase, start, finishAnimation };
}
