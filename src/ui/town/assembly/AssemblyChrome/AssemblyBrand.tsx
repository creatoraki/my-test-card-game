import { ShopBrand } from "@/ui/town/shop/ShopScene/ShopBrand";
export function AssemblyBrand({ label = "工房" }: { label?: string }) {
  return <ShopBrand label={label} subLabel="WORKSHOP" />;
}
