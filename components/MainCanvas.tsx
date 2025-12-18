import React, { useState, useEffect } from 'react';
import { Layers, Loader2, Download, ExternalLink, ShieldAlert, Sparkles, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="flex-1 bg-[#050810] relative overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex space-x-2 pointer-events-auto">
          <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-xl rounded-full text-[10px] font-bold text-slate-400 border border-slate-800 uppercase tracking-widest flex items-center shadow-2xl">
            <Layers className="w-3 h-3 mr-2 text-blue-500" />
            Active Canvas
          </div>
        </div>
        {activeTask && (
          <div className="pointer-events-auto">
            <button onClick={onClear} className="p-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-full text-slate-500 hover:text-white hover:bg-red-500/20 transition-all shadow-2xl">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 z-10 w-full overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-4 border-slate-900/50"></div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-blue-500 w-6 h-6 animate-pulse" /></div>
            </div>
            <h3 className="text-lg font-bold text-white tracking-widest uppercase italic">Masterpiece Processing</h3>
            <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">Seedream Engine 4.5 4K Active</p>
          </div>
        ) : activeTask && activeTask.status === 'succeeded' && images.length ? (
          <div className="relative w-full h-full flex items-center justify-center flex-col animate-in fade-in duration-1000">
            {isSafetyViolation ? (
              <div className="flex flex-col items-center gap-4 text-amber-500 bg-amber-500/5 p-12 rounded-3xl border border-amber-500/20 backdrop-blur-3xl shadow-2xl">
                <ShieldAlert size={64} className="opacity-50" />
                <p className="font-bold tracking-widest uppercase text-sm">Content Filter Triggered</p>
              </div>
            ) : (
              <>
                <div className="relative group max-w-full max-h-[70vh] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-slate-800/50 bg-slate-900/20">
                  <img
                    src={currentImageUrl}
                    alt="Output"
                    className={`max-w-full max-h-[70vh] object-contain transition-all duration-1000 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                    onLoad={() => setImgLoaded(true)}
                  />
                  {!imgLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50"><Loader2 className="animate-spin text-blue-500" /></div>}
                  {images.length > 1 && imgLoaded && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 flex justify-between pointer-events-none">
                      <button onClick={prevImage} className="p-3 rounded-full bg-black/60 text-white hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 pointer-events-auto backdrop-blur-md border border-white/10"><ChevronLeft size={24} /></button>
                      <button onClick={nextImage} className="p-3 rounded-full bg-black/60 text-white hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 pointer-events-auto backdrop-blur-md border border-white/10"><ChevronRight size={24} /></button>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col items-center gap-4">
                  <Button variant="primary" size="lg" onClick={() => handleDownload(currentImageUrl)} disabled={isDownloading || !imgLoaded} className="px-12 rounded-full h-14 font-black tracking-widest shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-white/10 hover:scale-105 transform transition-all active:scale-95">
                    {isDownloading ? <Loader2 className="animate-spin mr-3" /> : <Download className="mr-3 w-5 h-5" />}
                    {isDownloading ? 'Downloading Asset...' : 'Acquire 4K Masterpiece'}
                  </Button>
                  {images.length > 1 && (
                    <div className="flex gap-2 mt-4 px-4 py-2 bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-xl">
                      {images.map((img, idx) => (
                        <button key={idx} onClick={() => { setImgLoaded(false); setActiveImageIndex(idx); }} className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}>
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
          <div className="max-w-md w-full bg-red-500/5 border border-red-500/20 rounded-3xl p-12 text-center backdrop-blur-3xl animate-in zoom-in-95 duration-500 shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
            <h3 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Generation Fault</h3>
            <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest leading-loose">{activeTask.error || "System logic failure."}</p>
            <Button variant="secondary" onClick={onClear} className="rounded-full px-10 border-red-500/20">Acknowledge</Button>
          </div>
        ) : (
          <div className="text-center opacity-20 pointer-events-none select-none flex flex-col items-center">
            <div className="w-48 h-48 rounded-full border border-slate-800 flex items-center justify-center mb-10 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
              <Layers size={64} className="text-slate-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-500 tracking-[0.5em] uppercase italic">Studio Idle</h3>
            <p className="text-slate-600 text-xs mt-4 tracking-[0.3em] uppercase">Ready for instruction</p>
          </div>
        )}
      </div>
    </div>
  );
};