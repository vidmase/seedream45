import React, { useState, useEffect } from 'react';
import { Layers, Loader2, Download, ShieldAlert, Sparkles, X, AlertTriangle, Wand2 } from 'lucide-react';
import { TaskHistoryItem } from '../types';
import { Button } from './ui/Button';

interface MainCanvasProps {
  activeTask: TaskHistoryItem | null;
  isGenerating: boolean;
  onClear: () => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({ activeTask, isGenerating, onClear }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setImgLoaded(false);
    setPreviewUrl(null);
  }, [activeTask?.id]);

  const handleDownload = async (url: string) => {
    if (isDownloading) return;
    setIsDownloading(true);

    const PROXY = "https://corsproxy.io/?";

    const fetchBlob = async (targetUrl: string) => {
      try {
        const response = await fetch(targetUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Direct fetch failed');
        return await response.blob();
      } catch (err) {
        const proxyResponse = await fetch(`${PROXY}${encodeURIComponent(targetUrl)}`, { cache: 'no-store' });
        return await proxyResponse.blob();
      }
    };

    try {
      const blob = await fetchBlob(url);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `seedream-4k-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const images = activeTask?.result?.images || [];
  const isSafetyViolation = activeTask?.result?.has_nsfw_concepts?.some(v => v);
  const isLoading = isGenerating || (activeTask && (activeTask.status === 'submitted' || activeTask.status === 'processing'));

  // Batch progress calculation
  const totalSubTasks = activeTask?.subTaskIds?.length || 0;
  const completedSubTasks = totalSubTasks > 0
    ? Object.values(activeTask?.subTaskStatuses || {}).filter((s: any) => {
      const status = (s?.status || '').toLowerCase();
      return ['succeeded', 'success', 'completed', 'done', 'failed'].includes(status);
    }).length
    : 0;
  const isBatchJob = totalSubTasks > 1;
  const progressPercent = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  return (
    <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col h-full items-center justify-center">

      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex space-x-2 pointer-events-auto">

        </div>
        {activeTask && (
          <div className="pointer-events-auto animate-in fade-in slide-in-from-top-4">
            <button
              onClick={onClear}
              className="p-2.5 bg-surface/50 backdrop-blur-md border border-white/5 rounded-full text-slate-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all shadow-lg group"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center w-full h-full relative z-10 p-4 lg:p-10">

        {isLoading ? (
          // Loading State with Batch Progress
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-fast pointer-events-none scale-150" />
            <div className="relative">
              {/* Diffused Outer Glow */}
              <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />

              {/* Outer Ring */}
              <div className="w-40 h-40 rounded-full border border-white/5 shadow-[0_0_80px_rgba(59,130,246,0.3)] animate-spin-slow duration-[3s]" />

              {/* Middle Ring Reverse */}
              <div className="absolute inset-4 rounded-full border border-primary/20 border-t-primary/50 border-r-transparent animate-spin duration-[4s] direction-reverse" />

              {/* Inner Spinner */}
              <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent animate-spin shadow-[0_0_30px_rgba(59,130,246,0.4)]" />

              {/* Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-surface/30 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]">
                  <Sparkles className="text-primary w-10 h-10 animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </div>
              </div>
            </div>

            {/* Batch Progress Indicator */}
            {isBatchJob && (
              <div className="mt-8 flex flex-col items-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Progress Text */}
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-black text-white tabular-nums">{completedSubTasks}</span>
                  <span className="text-slate-500 text-lg font-bold">/</span>
                  <span className="text-xl font-bold text-slate-400 tabular-nums">{totalSubTasks}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-2">completed</span>
                </div>

                {/* Progress Bar */}
                <div className="w-48 h-2 bg-surface/50 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Status Hint */}
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
                  {completedSubTasks === totalSubTasks ? 'Finalizing...' : 'Generating batch...'}
                </p>
              </div>
            )}
          </div>


        ) : activeTask && activeTask.status === 'succeeded' && images.length ? (
          // Result State
          <div className="relative w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
            {isSafetyViolation ? (
              <div className="flex flex-col items-center gap-6 text-amber-500 bg-amber-500/5 p-16 rounded-[2rem] border border-amber-500/20 backdrop-blur-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                <ShieldAlert size={80} className="opacity-50 animate-pulse" />
                <div className="text-center space-y-2">
                  <h3 className="font-black tracking-widest uppercase text-lg">Safety Guard Triggered</h3>
                  <p className="text-amber-500/60 text-xs tracking-wide max-w-xs mx-auto">The generated content was flagged by our safety systems.</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-y-auto px-2 lg:px-4 py-8 custom-scrollbar">
                {images.length > 1 ? (
                  /* 2x2 Grid Layout - Optimized for Screen Fit */
                  <div className="grid grid-cols-2 gap-3 lg:gap-6 w-full max-w-4xl max-h-[75vh] items-center justify-center mx-auto">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 bg-surface/40 backdrop-blur-md transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] shadow-2xl h-full w-full"
                      >
                        <img
                          src={img}
                          alt={`Output ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />

                        {/* Improved Download & Preview Overlay for Grid */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 lg:gap-3 bg-black/0 group-hover:bg-black/40 transition-all duration-500 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setPreviewUrl(img)}
                            className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-bold text-[9px] lg:text-[10px] uppercase tracking-wider border border-white/20 transition-all hover:scale-105 active:scale-95"
                          >
                            See Bigger
                          </button>
                          <button
                            onClick={() => handleDownload(img)}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all"
                          >
                            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Download
                          </button>
                        </div>

                        {/* Index Badge */}
                        <div className="absolute top-3 left-3 lg:top-4 lg:left-4 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg lg:rounded-xl bg-black/60 backdrop-blur-md text-[8px] lg:text-[10px] font-black text-white/90 border border-white/10 uppercase tracking-widest">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Single Image Layout with Improved Download */
                  <div className="relative group max-w-3xl w-full flex flex-col items-center gap-8">
                    <div
                      className="relative w-full aspect-square lg:aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-surface/40 backdrop-blur-sm transition-all duration-700 hover:border-primary/40 cursor-zoom-in"
                      onClick={() => setPreviewUrl(images[0])}
                    >
                      <img
                        src={images[0]}
                        alt="Output"
                        className={`w-full h-full object-contain transition-all duration-1000 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                        onLoad={() => setImgLoaded(true)}
                      />
                      {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleDownload(images[0])}
                      disabled={isDownloading || !imgLoaded}
                      className="px-12 h-16 rounded-[2rem] font-black tracking-[0.2em] uppercase text-sm shadow-[0_20px_50px_rgba(59,130,246,0.4)] border border-primary/20 hover:scale-105 transform transition-all active:scale-95 bg-primary relative overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                      {isDownloading ? <Loader2 className="animate-spin mr-3" /> : <Download className="mr-3 w-6 h-6 group-hover/btn:-translate-y-1 transition-transform" />}
                      {isDownloading ? 'Processing...' : 'Download High Res'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTask && activeTask.status === 'failed' ? (
          // Failed State
          <div className="max-w-md w-full bg-red-500/5 border border-red-500/20 rounded-[2rem] p-12 text-center backdrop-blur-3xl animate-in zoom-in-95 duration-500 shadow-[0_0_60px_rgba(239,68,68,0.1)]">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Generation Fault</h3>
            <p className="text-slate-400 text-xs mb-8 uppercase tracking-widest leading-loose font-mono">{activeTask.error || "Unknown system error"}</p>
            <Button variant="secondary" onClick={onClear} className="rounded-xl px-10 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-200">Dismiss</Button>
          </div>
        ) : (
          // Idle Hero State
          <div className="text-center opacity-40 pointer-events-none select-none flex flex-col items-center animate-in fade-in duration-1000">
            <div className="relative mb-12 group">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full mix-blend-screen animate-pulse-slow" />
              <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center bg-gradient-to-br from-surface/50 to-transparent backdrop-blur-sm shadow-2xl">
                <Wand2 size={80} className="text-slate-600 group-hover:text-primary/50 transition-colors duration-700" strokeWidth={1} />
              </div>

              {/* Decorative Orbits */}
              <div className="absolute inset-0 rounded-full border border-dashed border-white/5 animate-spin-slow opacity-30" style={{ animationDuration: '20s' }} />
              <div className="absolute -inset-8 rounded-full border border-white/5 animate-spin opacity-20" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
            </div>
            <h3 className="text-5xl font-black text-slate-700 tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-slate-600 to-slate-800">
              Vidma Studio
            </h3>
            <p className="text-slate-600 text-xs mt-6 tracking-[0.4em] uppercase font-bold flex items-center gap-3">
              <span className="w-8 h-[1px] bg-slate-700" />
              Ready for Creation
              <span className="w-8 h-[1px] bg-slate-700" />
            </p>
          </div>
        )}
      </div>

      {/* Simple Inline Preview Modal (Friendly for Mobile) */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[110]"
            onClick={() => setPreviewUrl(null)}
          >
            <X size={24} />
          </button>

          <div
            className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <img
                src={previewUrl}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
                alt="Preview"
              />
            </div>

            <button
              onClick={() => handleDownload(previewUrl)}
              disabled={isDownloading}
              className="flex items-center gap-4 px-12 py-4 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all"
            >
              {isDownloading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
              {isDownloading ? 'Acquiring...' : 'Download This Image'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};