# 横向探索美术

通过内置 imagegen 生成，原图直接纳入项目，保留透明通道；没有调用外部图片 API。

- `corridor.png`：废弃研究楼层的侧视走廊背景。
- `sprites.png`：三行三列的透明图集。第一行是玩家、物资箱、医疗柜；第二行是终端、售货机、净化罐；第三行是零件堆、投递柜、营地。
- 图集由 `CorridorSprite.tsx` 用背景定位读取，黑影与破地动画由 `ShadowEncounter` 独立绘制。

## 最终生成提示词

### 走廊

Use case: stylized-concept. Asset type: original 2D side-scrolling exploration game background, wide 16:9 image. An abandoned underground research-floor corridor in a neon dystopian city. Side elevation camera, looking straight at the long back wall, almost orthographic; broad empty walkable foreground floor occupies bottom 35%, wall-floor seam at 65% image height. Weathered concrete, repeating industrial pillars, broken cables, sealed laboratory doors, faint turquoise emergency light and amber lantern pools. Hand-painted graphic novel art, bold ink silhouettes, expressive brushwork, rich charcoal shadows and restrained teal/amber. Readable midtones, detailed but spacious, no characters, no monsters, no interactable chests, no text, no lettering, no logos, no interface. Designed for horizontally repeating corridor scenery with low visual discontinuity at edges. Wide atmospheric playable stage, not a perspective tunnel vanishing into center.

### 图集

Use case: stylized-concept. Asset type: transparent PNG sprite atlas for original 2D side-scrolling dystopian dungeon exploration game. One square image with exactly 3 columns and 3 rows of equally sized cells, generous transparent gutters, no grid lines. All sprites isolated on genuinely transparent background, no white or checkerboard painted background, full object within its own cell, consistent ground baseline near bottom of cell. Graphic-novel hand-painted ink style, chunky readable silhouettes, charcoal steel, worn ochre, small cyan emissive details. Top row left: full-body anonymous hooded scout facing right in three-quarter side view, long weathered ochre cloak, boots, backpack, holding small amber lantern, face in shadow; top row middle: closed reinforced salvage chest; top row right: standing emergency medical cabinet with turquoise cross. Middle row left: broken computer terminal on pedestal; middle row middle: rusty vending machine with dim amber window; middle row right: small floor-standing purification canister with cyan glowing core. Bottom row left: pile of salvage metal and cut cables; bottom row middle: secure tall postal dispatch locker with cyan slot; bottom row right: compact portable camp lantern with bedroll and supplies. No weapons or decorative elements outside cells. No letters, words, numbers, logos, UI or watermarks. Each of the nine sprites centered individually and separated, side-view game props, no environment or ground plane.
