export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | '21:9' | '9:21';
export type Resolution = '2K' | '4K';
export type SequentialMode = 'disabled' | 'auto';

export interface GenerationRequest {
  model: string;
  prompt: string;
  size: AspectRatio;
  resolution: Resolution;
  n: number;
  image_urls?: string[];
  sequential_image_generation?: SequentialMode;
  sequential_image_generation_options?: {
    max_images: number;
  };
  watermark: boolean;
  enable_safety_checker?: boolean;
}

export interface GenerationResponseData {
  status: 'submitted' | 'succeeded' | 'failed' | 'processing';
  task_id: string;
  image_url?: string; // Single image
  image_urls?: string[]; // Multiple images
  reason?: string; // Failure reason from backend
}

export interface GenerationResponse {
  code: number;
  data?: GenerationResponseData[];
  error?: {
    code: number;
    message: string;
    type: string;
  };
}

// More permissive type for the task status to handle API variations
export interface TaskStatusResponse {
  id: string;
  // Allow string to catch 'SUCCEEDED', 'SUCCESS', 'Done' etc before normalization
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'succeeded' | string;
  progress: number;
  // Flexible result structure
  result?: {
    images?: Array<{ url: string } | string>;
    has_nsfw_concepts?: boolean[];
  };
  // Alternative locations for results
  results?: Array<{ url: string } | string> | string[];
  data?: any;
  output?: any;
  image_url?: string;

  created?: number;
  completed?: number;
  error?: {
    code: number;
    message: string;
    type: string;
  };
}

export interface TaskHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  status: 'submitted' | 'processing' | 'succeeded' | 'failed';
  result?: {
    images: string[];
    has_nsfw_concepts?: boolean[];
  };
  response?: GenerationResponseData;
  taskStatus?: TaskStatusResponse;
  error?: string;
  errorDetails?: {
    code: number;
    message: string;
    type: string;
  };
  params: GenerationRequest;
  // For client-side batching of multi-image requests
  subTaskIds?: string[];
  subTaskStatuses?: Record<string, TaskStatusResponse>;
}