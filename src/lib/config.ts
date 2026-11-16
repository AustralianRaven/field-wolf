/** Where the app lives: "/field-wolf/" on GitHub Pages and in dev. Always ends with a slash. */
export const BASE = import.meta.env.BASE_URL;

/** The source code, linked from the header. */
export const REPO_URL = 'https://github.com/AustralianRaven/field-wolf';

/** BioCLIP 2's INT8 image encoder (MIT), served by Hugging Face. About 290 MB. */
export const MODEL_URL = 'https://huggingface.co/mahan-ym/bioclip-2-quantized/resolve/main/onnx/bioclip2_model_int8.onnx';
export const MODEL_CACHE = 'fieldwolf-model-v1';
export const DATA_CACHE = 'fieldwolf-data-v1';
export const DIM = 768;

export type Kingdom = 'flora' | 'fauna';
export const KINGDOMS: Record<Kingdom, { title: string; noun: string; plural: string }> = {
  flora: { title: 'Flora', noun: 'plant', plural: 'plants' },
  fauna: { title: 'Fauna', noun: 'animal', plural: 'animals' },
};

export const dataUrl = (kingdom: Kingdom, file: string, version?: string) =>
  `${BASE}data/${kingdom}/${file}${version ? `?v=${version}` : ''}`;
