import { NavigationRail } from "@/ui/town/shop/ShopNavigation";
import { ReforgeIcon, UpgradeIcon } from "./icons";

export type AssemblyPage = "upgrade" | "reforge";

const entries = [
  { id: "upgrade", label: "装备升阶", icon: <UpgradeIcon /> },
  { id: "reforge", label: "羁绊重铸", icon: <ReforgeIcon /> },
] as const;

export function AssemblyNavigation({
  page,
  onChange,
}: {
  page: AssemblyPage;
  onChange: (page: AssemblyPage) => void;
}) {
  return <NavigationRail entries={entries} value={page} onChange={onChange} ariaLabel="工房功能" />;
}
