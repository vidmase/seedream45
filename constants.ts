export const API_KEY = import.meta.env.VITE_API_KEY || "";
export const API_URL = "https://api.apimart.ai/v1/images/generations";
export const API_TASK_URL = "https://api.apimart.ai/v1/tasks";
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

export const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square' },
  { value: '4:3', label: 'Standard' },
  { value: '3:4', label: 'Portrait' },
  { value: '16:9', label: 'Widescreen' },
  { value: '9:16', label: 'Vertical' },
  { value: '3:2', label: 'Photo' },
];

export const RESOLUTIONS = [
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const getExplicitDimensions = (ratio: string, res: string): { width: number; height: number } => {
  const is4K = res === '4K';

  if (is4K) {
    const mapping: Record<string, { width: number; height: number }> = {
      '1:1': { width: 4096, height: 4096 },
      '4:3': { width: 4096, height: 3072 },
      '3:4': { width: 3072, height: 4096 },
      '16:9': { width: 4096, height: 2304 },
      '9:16': { width: 2304, height: 4096 },
      '3:2': { width: 3840, height: 2560 },
    };
    return mapping[ratio] || { width: 4096, height: 4096 };
  } else {
    const mapping: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
      '3:2': { width: 1080, height: 720 },
    };
    return mapping[ratio] || { width: 1024, height: 1024 };
  }
};