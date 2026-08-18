import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";

export function BondIcon({
  bondId,
  title,
  className,
}: {
  bondId: string;
  title?: string;
  className?: string;
}) {
  return (
    <ArcanaIcon
      id={bondId}
      bare
      accent={getArcanaAccent(bondId)}
      className={className}
      ariaLabel={title}
    />
  );
}