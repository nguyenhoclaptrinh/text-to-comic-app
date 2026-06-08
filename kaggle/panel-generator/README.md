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

The included script creates a placeholder image from the prompt. Replace the
body of `kernel.py` with your real image model while preserving the input and
output file contract.
