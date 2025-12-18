import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { MainCanvas } from './components/MainCanvas';
import { GenerationRequest, TaskHistoryItem } from './types';
import { generateImage, getTaskStatus } from './services/api';

const DEFAULT_REQUEST: GenerationRequest = {
  model: 'doubao-seedance-4-5',
  prompt: '',
  size: '1:1',
  resolution: '4K',
  n: 1,
  image_urls: [],
  sequential_image_generation: 'disabled',
  watermark: false,
  enable_safety_checker: false
};

const POLLING_INTERVAL = 3000;

const extractImages = (obj: any): string[] => {
  if (!obj) return [];
  const foundUrls: string[] = [];
  const seen = new Set<string>();

  const isImageUrl = (url: string) => {
    return typeof url === 'string' && url.startsWith('http') && (
      url.match(/\.(jpeg|jpg|png|webp|gif|bmp)/i) ||
      url.includes('signature=') ||
      url.includes('token=') ||
      url.includes('api.apimart.ai') ||
      url.includes('upload.apimart.ai') ||
      url.includes('tos-preview.byteimg.com') ||
      url.includes('byteimg.com/tos-')
    );
  };

  const walk = (item: any, path: string = 'root') => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (isImageUrl(trimmed) && !seen.has(trimmed)) {
        console.log(`[extractImages] Found URL at ${path}:`, trimmed);
        foundUrls.push(trimmed);
        seen.add(trimmed);
      }
    } else if (Array.isArray(item)) {
      item.forEach((el, idx) => walk(el, `${path}[${idx}]`));
    } else if (typeof item === 'object') {
      // Prioritize original_url which contains the 4K master
      const priorityKeys = ['original_url', 'full_res_url', 'high_res_url', 'full_url', 'large_url', 'url', 'image_url'];
      priorityKeys.forEach(key => { if (item[key]) walk(item[key], `${path}.${key}`); });
      Object.entries(item).forEach(([key, value]) => { if (!priorityKeys.includes(key)) walk(value, `${path}.${key}`); });
    }
  };

  walk(obj);

  // TODO: APIMart API limitation - when multi-image generation is requested,
  // the status endpoint only returns 1 of N images, even though all images
  // are generated (visible in dashboard). Each image has a different random
  // prefix in the URL, so we cannot derive URLs from pattern matching.
  // Need to report to APIMart or wait for API fix.

  // Strict scoring for 4K quality to prevent downloading 1024px thumbnails
  return foundUrls.sort((a, b) => {
    const score = (url: string) => {
      const u = url.toLowerCase();
      let s = 0;
      // High-priority resolution indicators
      if (u.includes('original')) s += 5000;
      if (u.includes('high_res')) s += 4000;
      if (u.includes('full')) s += 3000;
      if (u.includes('4096')) s += 6000; // Best match for 4K
      if (u.includes('3840')) s += 5500;
      if (u.includes('large')) s += 1000;

      // Low-priority indicators
      if (u.includes('preview')) s -= 2000;
      if (u.includes('thumb')) s -= 3000;
      if (u.includes('1024')) s -= 1000;
      if (u.includes('512')) s -= 2000;
      return s;
    };
    return score(b) - score(a);
  });
};

export default function App() {
  const [request, setRequest] = useState<GenerationRequest>(DEFAULT_REQUEST);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const isPollingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (!request.prompt) return;
    setIsGenerating(true);

    // Prepare base payload
    const basePayload = { ...request };
    if (basePayload.image_urls && basePayload.image_urls.length === 0) {
      delete basePayload.image_urls;
    }

    // WORKAROUND: Client-Side Batching with Unified History
    // API has a bug where n>1 tasks only return 1 image in status.
    // We send N parallel requests but present them as 1 "Batch Task" in UI.
    const count = basePayload.n || 1;
    const requests = [];

    // Force n=1 for the actual API call
    const singlePayload = { ...basePayload, n: 1 };

    for (let i = 0; i < count; i++) {
      requests.push(generateImage(singlePayload));
    }

    try {
      // Execute all requests in parallel
      const responses = await Promise.all(requests);

      const subTaskIds: string[] = [];
      const successfulResponses: any[] = [];
      let firstError: string | null = null;

      responses.forEach((response, index) => {
        if (response.code === 200 && response.data && response.data.length > 0) {
          const result = response.data[0];
          subTaskIds.push(result.task_id);
          successfulResponses.push(result);
        } else {
          // Handle individual failure
          const errorMsg = response.error?.message || "Unknown error from API";
          if (!firstError) firstError = errorMsg;
          console.error(`Sub-task ${index} failed:`, errorMsg);
        }
      });

      if (subTaskIds.length > 0) {
        // Create ONE unified history item for the batch
        const mainId = subTaskIds[0];

        const newItem: TaskHistoryItem = {
          id: mainId,
          timestamp: Date.now(),
          prompt: request.prompt,
          status: 'submitted',
          response: successfulResponses[0], // Store primary response info
          params: { ...request },
          subTaskIds: subTaskIds,
          subTaskStatuses: {} // Will be populated by polling
        };

        setHistory(prev => [newItem, ...prev]);
        setSelectedTaskId(mainId);

        if (firstError) {
          console.warn(`Batch started but some sub-tasks failed: ${firstError}`);
        }
      } else {
        // All failed
        const newItem: TaskHistoryItem = {
          id: `err-${Date.now()}`,
          timestamp: Date.now(),
          prompt: request.prompt,
          status: 'failed',
          error: firstError || "All tasks failed to start",
          params: { ...request }
        };
        setHistory(prev => [newItem, ...prev]);
        setSelectedTaskId(newItem.id);
      }

    } catch (error) {
      const newItem: TaskHistoryItem = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        prompt: request.prompt,
        status: 'failed',
        error: "System Exception",
        errorDetails: { code: 500, type: 'client_error', message: error instanceof Error ? error.message : "Unknown error" },
        params: { ...request }
      };
      setHistory(prev => [newItem, ...prev]);
      setSelectedTaskId(newItem.id);
    } finally {
      setIsGenerating(false);
    }
  }, [request]);

  const handleReuseParams = (params: GenerationRequest) => {
    setRequest({ ...params });
  };

  useEffect(() => {
    const pollTasks = async () => {
      if (isPollingRef.current) return;
      const activeTasks = history.filter(t => t.status === 'submitted' || t.status === 'processing');
      if (activeTasks.length === 0) return;
      isPollingRef.current = true;
      const updatedHistory = [...history];
      let hasUpdates = false;

      for (const task of activeTasks) {
        try {
          if (task.subTaskIds && task.subTaskIds.length > 0) {
            // --- BATCH TASK POLLING ---
            const subStatuses = { ...task.subTaskStatuses };
            const subImages: string[] = [];
            let allCompleted = true;
            let anyFailed = false;
            let batchHasUpdates = false;

            // Poll sub-tasks
            await Promise.all(task.subTaskIds.map(async (subId) => {
              // Skip if already completed/failed (optional optimization, but polling all ensures we get images)
              // Actually we should poll until each sub-task is done
              const currentSubStatus = subStatuses[subId]?.status;
              if (currentSubStatus === 'succeeded' || currentSubStatus === 'failed' || currentSubStatus === 'completed') {
                // Already done, just grab images if succeeded
                if (subStatuses[subId]?.result) {
                  const imgs = extractImages(subStatuses[subId]);
                  subImages.push(...imgs);
                }
                return;
              }

              const apiData = await getTaskStatus(subId);
              if (apiData) {
                subStatuses[subId] = apiData;
                batchHasUpdates = true;

                const statusText = (apiData.status || '').toLowerCase();
                const isSuccess = ['succeeded', 'success', 'completed', 'done'].includes(statusText);
                const isFailed = ['failed', 'cancelled', 'error'].includes(statusText);

                if (isSuccess) {
                  const imgs = extractImages(apiData);
                  subImages.push(...imgs);
                } else if (isFailed) {
                  anyFailed = true;
                } else {
                  allCompleted = false;
                }
              } else {
                allCompleted = false; // Could not reach API
              }
            }));

            if (batchHasUpdates) {
              const taskIndex = updatedHistory.findIndex(h => h.id === task.id);
              if (taskIndex !== -1) {
                hasUpdates = true;
                const newStatus = allCompleted ? (anyFailed ? 'succeeded' : 'succeeded') : 'processing';
                // Note: We mark as succeeded if at least one finished, to show partial results. 
                // Or if all completed, even if some failed. 
                // Simplify: if all sub-tasks are terminal state, then batch is done.

                updatedHistory[taskIndex] = {
                  ...updatedHistory[taskIndex],
                  status: (allCompleted) ? 'succeeded' : 'processing',
                  subTaskStatuses: subStatuses,
                  result: {
                    images: subImages.length > 0 ? subImages : (task.result?.images || []),
                    has_nsfw_concepts: [] // Aggregate NSFW if needed
                  }
                };

                if (allCompleted) {
                  console.log(`[App] Batch Task ${task.id} finished. Aggregated ${subImages.length} images.`);
                }
              }
            }

          } else {
            // --- SINGLE TASK POLLING (Legacy) ---
            const apiData = await getTaskStatus(task.id);
            if (apiData) {
              const taskIndex = updatedHistory.findIndex(h => h.id === task.id);
              if (taskIndex === -1) continue;
              const statusText = (apiData.status || '').toLowerCase();
              const isSuccess = ['succeeded', 'success', 'completed', 'done'].includes(statusText);
              const isFailed = ['failed', 'cancelled', 'error'].includes(statusText);

              if (isSuccess) {
                hasUpdates = true;
                updatedHistory[taskIndex] = {
                  ...updatedHistory[taskIndex],
                  status: 'succeeded',
                  taskStatus: apiData,
                  result: { images: extractImages(apiData), has_nsfw_concepts: apiData.result?.has_nsfw_concepts || [] }
                };
                console.log(`[App] Task ${task.id} succeeded. Extracted ${extractImages(apiData).length} images:`, extractImages(apiData));
              } else if (isFailed) {
                hasUpdates = true;
                updatedHistory[taskIndex] = {
                  ...updatedHistory[taskIndex],
                  status: 'failed',
                  taskStatus: apiData,
                  error: apiData.error?.message || "Task failure",
                  errorDetails: apiData.error
                };
              } else if (updatedHistory[taskIndex].status !== 'processing') {
                updatedHistory[taskIndex].status = 'processing';
                hasUpdates = true;
              }
            }
          }
        } catch (e) { console.error(e); }
      }
      if (hasUpdates) setHistory(updatedHistory);
      isPollingRef.current = false;
    };
    const intervalId = setInterval(pollTasks, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [history]);

  const activeTask = history.find(h => h.id === selectedTaskId) || null;

  return (
    <div className="flex h-screen w-screen bg-background text-slate-100 overflow-hidden font-sans">
      <div className="flex w-full flex-col lg:flex-row h-full overflow-hidden">
        <div className="lg:h-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800/50 flex-shrink-0">
          <LeftSidebar request={request} onRequestChange={setRequest} onSubmit={handleSubmit} isGenerating={isGenerating} />
        </div>
        <div className="flex-1 h-[60vh] lg:h-full relative flex flex-col min-w-0">
          <MainCanvas activeTask={activeTask} isGenerating={isGenerating} onClear={() => setSelectedTaskId(null)} />
        </div>
        <div className="lg:h-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-800/50 flex-shrink-0 bg-surface">
          <RightSidebar history={history} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} onReuseParams={handleReuseParams} />
        </div>
      </div>
    </div>
  );
}