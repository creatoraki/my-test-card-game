import { getBondDef } from "@/data";
import { ArcanaIcon } from "@/ui/common/icon/ArcanaIcon";

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
      accent={getBondDef(bondId)?.color}
      className={className}
      ariaLabel={title}
    />
  );
}