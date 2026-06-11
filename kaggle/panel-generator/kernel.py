import json
import subprocess
import sys
from pathlib import Path


MAX_PROMPT_WORDS = 42
MODEL_ID = "Meina/MeinaMix_V11"
STYLE_SUFFIX = (
    "masterpiece, best quality, anime comic panel, webtoon, clean line art, "
    "expressive face, dynamic composition, cinematic lighting"
)
NEGATIVE_PROMPT = (
    "low quality, worst quality, blurry, bad anatomy, bad hands, extra fingers, "
    "missing fingers, deformed face, duplicate character, cropped, watermark, "
    "signature, text, speech bubble"
)


def compact_prompt(value):
    text = " ".join(str(value or "").replace("\n", " ").split())
    text = (
        text.replace("A high-quality comic panel illustration", "")
        .replace("Visual Scene:", "")
        .replace("Story Dialogue Context:", "")
        .replace("Strict Quality:", "")
        .replace("Rendering Seed:", "seed")
        .replace("Scene:", "")
        .replace("Dialogue mood/context:", "")
        .replace("Quality:", "")
        .replace("Seed:", "seed")
    )
    words = text.split(" ")
    return " ".join(words[:MAX_PROMPT_WORDS])


def ensure_dependencies():
    try:
        import diffusers  # noqa: F401
        import transformers  # noqa: F401
        import accelerate  # noqa: F401
        import safetensors  # noqa: F401
    except Exception:
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "-q",
                "diffusers",
                "transformers",
                "accelerate",
                "safetensors",
            ]
        )


def load_pipeline(device, dtype):
    from diffusers import DiffusionPipeline

    pipe = DiffusionPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe = pipe.to(device)
    if hasattr(pipe, "enable_attention_slicing"):
        pipe.enable_attention_slicing()
    return pipe


def main():
    input_root = Path("/kaggle/input")
    prompt_files = list(input_root.glob("**/prompt.json"))
    if prompt_files:
        data = json.loads(prompt_files[0].read_text(encoding="utf-8"))
    else:
        data = {
            "prompt": (
                "A young Vietnamese swordsman on a snowy mountain bridge at "
                "dawn, dramatic fantasy comic panel"
            ),
            "outputFile": "output.png",
        }
    prompt = compact_prompt(data.get("prompt"))
    output_file = data.get("outputFile") or "output.png"

    try:
        import torch
    except Exception as error:
        raise RuntimeError(
            "PyTorch is missing. Please enable Kaggle GPU runtime."
        ) from error
    ensure_dependencies()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    pipe = load_pipeline(device, dtype)

    comic_prompt = f"{prompt}, {STYLE_SUFFIX}"
    try:
        image = pipe(
            prompt=comic_prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=30,
            guidance_scale=7.5,
            width=512,
            height=768,
        ).images[0]
    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        print("CUDA out of memory, retrying with smaller image settings.")
        image = pipe(
            prompt=comic_prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=22,
            guidance_scale=7.5,
            width=384,
            height=576,
        ).images[0]
    except Exception as error:
        if device != "cuda" or "no kernel image" not in str(error).lower():
            raise
        print(f"CUDA is incompatible with this Kaggle GPU, retrying on CPU: {error}")
        del pipe
        torch.cuda.empty_cache()
        pipe = load_pipeline("cpu", torch.float32)
        image = pipe(
            prompt=comic_prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=12,
            guidance_scale=7.5,
            width=256,
            height=384,
        ).images[0]
    output_path = Path("/kaggle/working") / output_file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)


if __name__ == "__main__":
    main()
