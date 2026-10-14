"""按已确认的四宫格顺序切分透明遗物图集，并生成素材整理脚本使用的清单。"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")


def save_new_or_identical(path, content):
    if path.exists():
        if path.read_bytes() != content:
            raise ValueError(f"已有不同内容的原图，请使用新版本名称：{path}")
    else:
        path.write_bytes(content)


def split_sheet(sheet, output_directory, archive_directory):
    source = Path(sheet["source"])
    with Image.open(source) as original:
        if "A" not in original.getbands():
            raise ValueError("图集没有透明通道，请重新生成。")
        image = original.convert("RGBA")
    if image.getchannel("A").getextrema()[0] == 255:
        raise ValueError("图集背景不透明，请重新生成。")
    save_new_or_identical(archive_directory / f'{sheet["name"]}原图.png', source.read_bytes())
    midpoint_x, midpoint_y = image.width // 2, image.height // 2
    x_edges = [0, midpoint_x, image.width]
    # 双物件图集使用整列，保留长书签和流苏超出上半区的完整边缘。
    y_edges = [0, image.height] if sheet.get("rows") == 1 else [0, midpoint_y, image.height]
    entries = []
    for item in sheet["items"]:
        column, row = item["slot"]
        tile = image.crop((x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]))
        visible_alpha = tile.getchannel("A").point(lambda value: 255 if value >= 8 else 0)
        bounds = visible_alpha.getbbox()
        if bounds is None:
            raise ValueError(f'{item["name"]} 所在象限没有物件。')
        left, top, right, bottom = bounds
        if left == 0 or top == 0 or right == tile.width or bottom == tile.height:
            raise ValueError(f'{item["name"]} 接触切割边界，请检查是否跨格或被裁切。')
        destination = output_directory / f'{item["name"]}.png'
        tile.save(destination)
        entries.append({
            "name": item["name"],
            "source": str(destination.resolve()),
            "prompt": sheet["prompt"],
            "sheetSource": str(source.resolve()),
            "slot": item["slot"],
        })
        print(f'已切分：{item["name"]}，保留原始透明通道。')
    return entries


def main():
    if len(sys.argv) != 2:
        raise ValueError("请提供包含图集路径、提示词和象限顺序的清单路径。")
    sheets = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    output_directory = Path("tmp/imagegen/机制联动遗物切图")
    archive_directory = Path("处理后的WebP素材/机制联动遗物")
    output_directory.mkdir(parents=True, exist_ok=True)
    archive_directory.mkdir(parents=True, exist_ok=True)
    entries = []
    for sheet in sheets:
        entries.extend(split_sheet(sheet, output_directory, archive_directory))
    archived_sheets = [
        {**sheet, "source": str((archive_directory / f'{sheet["name"]}原图.png').resolve())}
        for sheet in sheets
    ]
    (archive_directory / "图集清单.json").write_text(
        json.dumps(archived_sheets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
    )
    (output_directory / "切图清单.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
    )


if __name__ == "__main__":
    main()
