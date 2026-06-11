# Kaggle Panel Generator

This sample kernel is the contract used by the Next.js Kaggle job adapter.

Expected input dataset file:

```json
{
  "prompt": "A comic panel prompt...",
  "outputFile": "output.png"
}
```

Expected output:

```text
/kaggle/working/output.png
```

The included script uses `Meina/MeinaMix_V11` through Hugging Face Diffusers
because it produces cleaner anime/comic panels than the older Waifu Diffusion
default while still fitting Kaggle's regular GPU memory better than SDXL models.
It requires internet access on the Kaggle kernel for dependency and model
downloads unless you attach the model/dependencies as Kaggle inputs.
