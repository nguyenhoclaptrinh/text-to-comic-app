import json
from pathlib import Path

from PIL import Image, ImageDraw


def main():
    input_root = Path("/kaggle/input")
    prompt_file = next(input_root.glob("*/prompt.json"))
    data = json.loads(prompt_file.read_text(encoding="utf-8"))
    prompt = data.get("prompt", "")[:900]
    output_file = data.get("outputFile", "output.png")

    image = Image.new("RGB", (1024, 1536), (24, 24, 27))
    draw = ImageDraw.Draw(image)
    draw.rectangle((48, 48, 976, 1488), outline=(139, 92, 246), width=8)
    draw.multiline_text((96, 120), prompt, fill=(244, 244, 245), spacing=8)
    image.save(Path("/kaggle/working") / output_file)


if __name__ == "__main__":
    main()
