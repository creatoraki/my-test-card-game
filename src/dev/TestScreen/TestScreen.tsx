import { ChallengePixelShowcase } from "./challengePixel/ChallengePixelShowcase";
import s from "./TestScreen.module.css";

export function TestScreen() {
  return (
    <div className={s.root}>
      <ChallengePixelShowcase />
    </div>
  );
}
