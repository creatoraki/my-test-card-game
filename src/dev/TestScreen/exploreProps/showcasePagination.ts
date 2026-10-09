import type { ShowcasePageDef } from "./showcaseTypes";

export interface ShowcasePreviewPage extends ShowcasePageDef {
  sourceId: string;
}

/** 小屏进一步拆页，物件坐标只在当前可视区域内排列。 */
export function paginateShowcasePages(pages: readonly ShowcasePageDef[], itemsPerPage: number): ShowcasePreviewPage[] {
  const count = Math.max(1, Math.min(4, Math.floor(itemsPerPage)));
  return pages.flatMap((page) => {
    const pageCount = Math.ceil(page.props.length / count);
    return Array.from({ length: pageCount }, (_, index) => {
      const props = page.props.slice(index * count, (index + 1) * count);
      return {
        ...page,
        id: index === 0 ? page.id : `${page.id}-part-${index + 1}`,
        sourceId: page.id,
        name: pageCount > 1 ? `${page.name} · 第${index + 1}页` : page.name,
        props: props.map((prop, slot) => ({ ...prop, x: 250 + (slot + 0.5) * 1600 / props.length })),
      };
    });
  });
}
