import swordsmanPortrait from "../assets/人物立绘/剑士-透明.png";

interface Props {
  characterId?: string;
  emoji: string;
  alt: string;
  className?: string;
}

export function CharacterPortrait({ characterId, emoji, alt, className }: Props) {
  if (characterId === "swordsman") {
    return <img className={`portrait-image ${className ?? ""}`} src={swordsmanPortrait} alt={alt} />;
  }

  return <span className={`portrait ${className ?? ""}`}>{emoji}</span>;
}