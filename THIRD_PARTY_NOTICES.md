# AsterMargin source and license notices

AsterMargin is distributed under GNU AGPL version 3 or later. The license text accompanies this file. AsterMargin artwork and modifications use the same license.

The Zotero client, PDF/EPUB/snapshot processing, Zotero writing tools, research tables and export code derive from Beaver by J. Legewie and contributors. The source baseline is jlegewie/beaver-zotero at bfe64743c7cbb58b812881176707fe480e89ed11 (v0.27.0-beta.4). The agent-local package and local-mode integration derive from Beaver Local by chgwan and contributors at 84b648c908259349e41d54258a20fe0538185697. Both upstream projects use AGPL-3.0-or-later. Package repository metadata records the upstream source required by the scaffold. This local distribution has no public update feed.

- https://github.com/jlegewie/beaver-zotero
- https://github.com/chgwan/beaver-zotero-local
- MuPDF by Artifex and contributors, AGPL. The distributed WASM binary, fork, build instructions and license are described in content/lib/mupdf-README.md of the XPI.
- Sentence segmentation includes sentencex. Its notices accompany the binary in content/lib/sentencex.
- Tesseract.js, Tesseract.js-core, Tesseract and the optional tessdata_fast language files use Apache-2.0. The browser worker, engine and notices are bundled. The language files come from tesseract-ocr/tessdata_fast at 87416418657359cb625c412a48b6e1d6d41c29bd.
- Transformers.js by Hugging Face/Xenova, Apache-2.0. The optional multilingual-e5-small model originates from intfloat/multilingual-e5-small (MIT) and uses Xenova's quantized ONNX conversion. ONNX Runtime by Microsoft is MIT-licensed. Runtime files and notices accompany the plugin. The npm lockfile identifies other JavaScript dependencies.
