import { API_KEY, API_URL, API_TASK_URL } from '../constants';
import { GenerationRequest, GenerationResponse, TaskStatusResponse } from '../types';

const PROXY_PREFIX = "https://corsproxy.io/?";

const fetchWithFallback = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (response.status >= 502 && response.status <= 504) {
      throw new Error(`Direct fetch status: ${response.status}`);
    }
    return response;
  } catch (directError) {
    try {
      const proxyUrl = `${PROXY_PREFIX}${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, options);
    } catch (proxyError) {
      throw directError;
    }
  }
};

const parseErrorResponse = (status: number, text: string) => {
  let errorJson: any = null;
  try {
    errorJson = JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{.*\}/);
    if (jsonMatch && jsonMatch[0]) {
      try { errorJson = JSON.parse(jsonMatch[0]); } catch (e2) { }
    }
  }
  const innerError = errorJson?.error || errorJson;
  return {
    code: innerError?.code || status,
    message: innerError?.message || text || "Unknown API error",
    type: innerError?.type || "api_error"
  };
};

export const generateImage = async (payload: GenerationRequest): Promise<GenerationResponse> => {
  try {
    // Official APIMart Seedream 4.5 API documentation:
    // - size: aspect ratio (e.g., "1:1", "4:3", "16:9")
    // - resolution: "2K" (default) or "4K" (high definition)
    // - n: number of images (plain number)

    const finalPayload: any = {
      model: payload.model,
      prompt: payload.prompt,
      size: payload.size,
      resolution: payload.resolution,
      n: payload.n || 1,
      enable_safety_checker: payload.enable_safety_checker ?? true,
      sync_mode: false,
      watermark: payload.watermark
    };

    // Add reference images if provided
    if (payload.image_urls && payload.image_urls.length > 0) {
      finalPayload.image_urls = payload.image_urls;
    }

    // Log the payload for debugging
    console.log('[Seedream API] Request payload:', JSON.stringify(finalPayload, null, 2));
    console.log(`[Seedream API] size: "${payload.size}", resolution: "${payload.resolution}"`);

    const response = await fetchWithFallback(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(finalPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { code: response.status, error: parseErrorResponse(response.status, errorText) };
    }

    return await response.json();
  } catch (error) {
    return {
      code: 500,
      error: {
        code: 500,
        message: error instanceof Error ? error.message : "Network failure",
        type: "network_error"
      }
    };
  }
};

export const getTaskStatus = async (taskId: string): Promise<TaskStatusResponse | null> => {
  try {
    const url = `${API_TASK_URL}/${taskId}`;
    const response = await fetchWithFallback(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
      }
    });

    if (!response.ok) return null;

    const json = await response.json();

    // Debug: Log the full response to understand multi-image structure
    console.log('[Seedream API] Task status response:', JSON.stringify(json, null, 2));

    if (json.data && !json.status) {
      const result = Array.isArray(json.data) ? json.data[0] : json.data;
      console.log('[Seedream API] Extracted result from data:', result);
      return result as TaskStatusResponse;
    }

    return json as TaskStatusResponse;
  } catch (error) {
    console.error("Status check failed:", error);
    return null;
  }
};