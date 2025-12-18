import React, { useState, useEffect, useRef } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { MainCanvas } from './components/MainCanvas';
import { GenerationRequest, TaskHistoryItem } from './types';
import { generateImage, getTaskStatus } from './services/api';
import { PlusCircle, Image as ImageIcon, History, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Terminal } from 'lucide-react';

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

  // Strict scoring for 4K quality
  return foundUrls.sort((a, b) => {
    const score = (url: string) => {
      const u = url.toLowerCase();
      let s = 0;
      if (u.includes('original')) s += 5000;
      if (u.includes('high_res')) s += 4000;
      if (u.includes('full')) s += 3000;
      if (u.includes('4096')) s += 6000;
      if (u.includes('3840')) s += 5500;
      if (u.includes('large')) s += 1000;
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
  const [activeTab, setActiveTab] = useState<'create' | 'studio' | 'history'>('create');

  // Desktop Sidebar State
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const isPollingRef = useRef(false);

  // Internal submit logic encapsulated to be reused or called directly
  const internalSubmit = async () => {
    if (!request.prompt) return;
    setIsGenerating(true);

    const basePayload = { ...request };
    if (basePayload.image_urls && basePayload.image_urls.length === 0) {
      delete basePayload.image_urls;
    }

    // Unified Batch Logic
    const count = basePayload.n || 1;
    const requests = [];
    const singlePayload = { ...basePayload, n: 1 };

    for (let i = 0; i < count; i++) {
      requests.push(generateImage(singlePayload));
    }

    try {
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
          const errorMsg = response.error?.message || "Unknown error from API";
          if (!firstError) firstError = errorMsg;
          console.error(`Sub-task ${index} failed:`, errorMsg);
        }
      });

      if (subTaskIds.length > 0) {
        const mainId = subTaskIds[0];
        const newItem: TaskHistoryItem = {
          id: mainId,
          timestamp: Date.now(),
          prompt: request.prompt,
          status: 'submitted',
          response: successfulResponses[0],
          params: { ...request },
          subTaskIds: subTaskIds,
          subTaskStatuses: {}
        };

        setHistory(prev => [newItem, ...prev]);
        setSelectedTaskId(mainId);

        if (firstError) {
          console.warn(`Batch started but sub-tasks failed: ${firstError}`);
        }
      } else {
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
  };

  const onGenerateClick = async () => {
    setActiveTab('studio'); // Auto-switch to studio view on mobile
    await internalSubmit();
  };

  const handleReuseParams = (params: GenerationRequest) => {
    setRequest({ ...params });
    setActiveTab('create'); // Auto-switch to create view on mobile
    if (!isLeftSidebarOpen) setIsLeftSidebarOpen(true); // Open sidebar on desktop
  };

  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id);
    setActiveTab('studio'); // Auto-switch to studio view on mobile
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

            await Promise.all(task.subTaskIds.map(async (subId) => {
              const currentSubStatus = subStatuses[subId]?.status;
              if (currentSubStatus === 'succeeded' || currentSubStatus === 'failed' || currentSubStatus === 'completed') {
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
                if (['succeeded', 'success', 'completed', 'done'].includes(statusText)) {
                  const imgs = extractImages(apiData);
                  subImages.push(...imgs);
                } else if (['failed', 'cancelled', 'error'].includes(statusText)) {
                  anyFailed = true;
                } else {
                  allCompleted = false;
                }
              } else {
                allCompleted = false;
              }
            }));

            if (batchHasUpdates) {
              const taskIndex = updatedHistory.findIndex(h => h.id === task.id);
              if (taskIndex !== -1) {
                hasUpdates = true;
                updatedHistory[taskIndex] = {
                  ...updatedHistory[taskIndex],
                  status: (allCompleted) ? 'succeeded' : 'processing',
                  subTaskStatuses: subStatuses,
                  result: {
                    images: subImages.length > 0 ? subImages : (task.result?.images || []),
                    has_nsfw_concepts: []
                  }
                };
              }
            }

          } else {
            // --- SINGLE TASK POLLING (Legacy) ---
            const apiData = await getTaskStatus(task.id);
            if (apiData) {
              const taskIndex = updatedHistory.findIndex(h => h.id === task.id);
              if (taskIndex !== -1) {
                const statusText = (apiData.status || '').toLowerCase();
                if (['succeeded', 'success', 'completed', 'done'].includes(statusText)) {
                  hasUpdates = true;
                  updatedHistory[taskIndex] = {
                    ...updatedHistory[taskIndex],
                    status: 'succeeded',
                    taskStatus: apiData,
                    result: { images: extractImages(apiData), has_nsfw_concepts: apiData.result?.has_nsfw_concepts || [] }
                  };
                  console.log(`[App] Task ${task.id} succeeded. Extracted ${extractImages(apiData).length} images:`, extractImages(apiData));
                } else if (['failed', 'cancelled', 'error'].includes(statusText)) {
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
    <div className="flex h-screen w-screen bg-background text-slate-100 overflow-hidden font-sans flex-col lg:flex-row relative selection:bg-primary/30 selection:text-white">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-fast" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-fast" style={{ animationDelay: '1s' }} />

      {/* Mobile Content Area - Uses flex-1 to fill space above nav */}
      <div className="flex-1 w-full flex overflow-hidden lg:flex-row flex-col relative h-full z-10 backdrop-blur-[1px]">

        {/* Left Sidebar (Create) */}
        {/* Mobile: Full Screen if Active */}
        {/* Desktop: Collapsible Floating Panel */}
        {/* Left Sidebar (Create) */}
        {/* Mobile: Full Screen if Active */}
        {/* Desktop: Collapsible Floating Panel */}
        <div
          className={`
            flex-shrink-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-40
            ${activeTab === 'create' ? 'flex flex-1 h-full w-full' : 'hidden lg:flex'}
            lg:flex-none
          `}
          style={{ width: isLeftSidebarOpen ? '380px' : '0px' }}
        >
          <div className="w-full h-full overflow-hidden border-r border-white/5 glass-panel relative z-10">
            <LeftSidebar request={request} onRequestChange={setRequest} onSubmit={onGenerateClick} isGenerating={isGenerating} />
          </div>

          {/* Desktop Toggle Button - Attached to Sidebar */}
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className={`
              hidden lg:flex absolute top-1/2 left-full -translate-y-1/2 z-[100]
              w-6 h-12 rounded-r-xl bg-surface border border-l-0 border-white/10 text-slate-400 
              hover:text-white hover:bg-primary hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] 
              transition-all duration-300 backdrop-blur-md shadow-lg items-center justify-center
              ${!isLeftSidebarOpen ? 'bg-surface/80 opacity-70 hover:opacity-100' : ''}
              cursor-pointer pointer-events-auto
            `}
          >
            {isLeftSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>


        {/* Main Canvas (Studio) */}
        <div className={`flex-1 relative flex flex-col min-w-0 bg-transparent z-10
          ${activeTab === 'studio' ? 'flex h-full w-full' : 'hidden lg:flex lg:h-full'}
        `}>
          <MainCanvas activeTask={activeTask} isGenerating={isGenerating} onClear={() => setSelectedTaskId(null)} />
        </div>


        {/* Right Sidebar (History) */}
        <div
          className={`
            flex-shrink-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-40
            ${activeTab === 'history' ? 'flex flex-1 h-full w-full' : 'hidden lg:flex'}
            lg:flex-none
          `}
          style={{ width: isRightSidebarOpen ? '320px' : '0px' }}
        >
          <div className="w-full h-full overflow-hidden border-l border-white/5 glass-panel relative z-10">
            <RightSidebar history={history} selectedTaskId={selectedTaskId} onSelectTask={handleSelectTask} onReuseParams={handleReuseParams} />
          </div>

          {/* Desktop Toggle Button - Attached to Sidebar */}
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`
              hidden lg:flex absolute top-1/2 right-full -translate-y-1/2 z-50
              w-6 h-12 rounded-l-xl bg-surface border border-r-0 border-white/10 text-slate-400 
              hover:text-white hover:bg-primary hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]
              transition-all duration-300 backdrop-blur-md shadow-lg items-center justify-center
              ${!isRightSidebarOpen ? 'bg-surface/80 opacity-70 hover:opacity-100' : ''}
              cursor-pointer pointer-events-auto
            `}
          >
            {isRightSidebarOpen ? <PanelRightClose size={14} /> : <PanelLeftOpen size={14} className="rotate-180" />}
          </button>
        </div>

      </div>

      {/* Mobile Bottom Navigation - Glassmorphism */}
      <div className="lg:hidden h-20 bg-surface/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around flex-shrink-0 z-50 pb-safe shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <button
          onClick={() => setActiveTab('create')}
          className={`group flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${activeTab === 'create' ? 'text-primary' : 'text-slate-500'}`}
        >
          <div className={`p-2 rounded-full transition-all ${activeTab === 'create' ? 'bg-primary/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'group-hover:bg-white/5'}`}>
            <PlusCircle size={22} strokeWidth={activeTab === 'create' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">CREATE</span>
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`group flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${activeTab === 'studio' ? 'text-primary' : 'text-slate-500'}`}
        >
          <div className={`p-2 rounded-full transition-all ${activeTab === 'studio' ? 'bg-primary/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'group-hover:bg-white/5'}`}>
            <ImageIcon size={22} strokeWidth={activeTab === 'studio' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">STUDIO</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`group flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${activeTab === 'history' ? 'text-primary' : 'text-slate-500'}`}
        >
          <div className={`p-2 rounded-full transition-all ${activeTab === 'history' ? 'bg-primary/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'group-hover:bg-white/5'}`}>
            <History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">HISTORY</span>
        </button>
      </div>
    </div>
  );
}