import React, { useState, useEffect } from 'react';
import { Layers, Loader2, Download, ShieldAlert, Sparkles, X, AlertTriangle, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { TaskHistoryItem } from '../types';
import { Button } from './ui/Button';

interface MainCanvasProps {
  activeTask: TaskHistoryItem | null;
  isGenerating: boolean;
  onClear: () => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({ activeTask, isGenerating, onClear }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setActiveImageIndex(0);
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
  const currentImageUrl = images[activeImageIndex];
  const isSafetyViolation = activeTask?.result?.has_nsfw_concepts?.[activeImageIndex];
  const isLoading = isGenerating || (activeTask && (activeTask.status === 'submitted' || activeTask.status === 'processing'));

  const nextImage = () => { if (images.length > 1) { setImgLoaded(false); setActiveImageIndex((prev) => (prev + 1) % images.length); } };
  const prevImage = () => { if (images.length > 1) { setImgLoaded(false); setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length); } };

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
          // Loading State
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
          </div>

        ) : activeTask && activeTask.status === 'succeeded' && images.length ? (
          // Result State
          <div className="relative w-full h-full flex items-center justify-center flex-col animate-in fade-in zoom-in-95 duration-700 group">
            {isSafetyViolation ? (
              <div className="flex flex-col items-center gap-6 text-amber-500 bg-amber-500/5 p-16 rounded-[2rem] border border-amber-500/20 backdrop-blur-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                <ShieldAlert size={80} className="opacity-50 animate-pulse" />
                <div className="text-center space-y-2">
                  <h3 className="font-black tracking-widest uppercase text-lg">Safety Guard Triggered</h3>
                  <p className="text-amber-500/60 text-xs tracking-wide max-w-xs mx-auto">The generated content was flagged by our safety systems.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group w-full h-full flex items-center justify-center">
                  {/* Image Container */}
                  <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface/40 backdrop-blur-sm transition-transform duration-500">
                    <img
                      src={currentImageUrl}
                      alt="Output"
                      className={`max-w-full max-h-[70vh] lg:max-h-[80vh] object-contain transition-all duration-700 ease-out ${imgLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}`}
                      onLoad={() => setImgLoaded(true)}
                    />

                    {!imgLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-md">
                        <Loader2 className="animate-spin text-primary w-10 h-10" />
                      </div>
                    )}

                    {/* Navigation Buttons for Gallery */}
                    {images.length > 1 && imgLoaded && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={prevImage} className="p-4 rounded-full bg-black/40 text-white hover:bg-primary hover:scale-110 transition-all pointer-events-auto backdrop-blur-md border border-white/10 shadow-lg">
                          <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextImage} className="p-4 rounded-full bg-black/40 text-white hover:bg-primary hover:scale-110 transition-all pointer-events-auto backdrop-blur-md border border-white/10 shadow-lg">
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="absolute bottom-8 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleDownload(currentImageUrl)}
                    disabled={isDownloading || !imgLoaded}
                    className="px-10 h-14 rounded-2xl font-black tracking-widest shadow-[0_0_40px_rgba(59,130,246,0.4)] border border-primary/20 hover:scale-105 transform transition-all active:scale-95 bg-surface/80 backdrop-blur-md hover:bg-primary group"
                  >
                    {isDownloading ? <Loader2 className="animate-spin mr-3" /> : <Download className="mr-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                    {isDownloading ? 'Acquiring...' : 'Download'}
                  </Button>

                  {images.length > 1 && (
                    <div className="flex gap-3 px-4 py-3 bg-surface/60 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setImgLoaded(false); setActiveImageIndex(idx); }}
                          className={`
                            w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-300 
                            ${activeImageIndex === idx
                              ? 'border-primary scale-110 shadow-lg ring-2 ring-primary/20'
                              : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                            }
                          `}
                        >
                          <img src={img} className="w-full h-full object-cover" alt="thumb" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
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
    </div>
  );
};