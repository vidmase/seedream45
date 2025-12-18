import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Plus, Trash2, Sliders, Upload, ShieldCheck, Loader2, Maximize2, Monitor, Tablet, Smartphone, Square, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { TextArea } from './ui/Input';
import { ASPECT_RATIOS, RESOLUTIONS, getExplicitDimensions } from '../constants';
import { GenerationRequest, AspectRatio, Resolution } from '../types';

interface LeftSidebarProps {
  onRequestChange: (req: GenerationRequest) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  request: GenerationRequest;
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  '1:1': <Square className="w-5 h-5 mb-1 opacity-70" />,
  '4:3': <Tablet className="w-5 h-5 mb-1 opacity-70" />,
  '3:4': <Maximize2 className="w-5 h-5 mb-1 opacity-70 rotate-45" />,
  '16:9': <Monitor className="w-5 h-5 mb-1 opacity-70" />,
  '9:16': <Smartphone className="w-5 h-5 mb-1 opacity-70" />,
  '3:2': <Maximize2 className="w-5 h-5 mb-1 opacity-70" />,
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  request,
  onRequestChange,
  onSubmit,
  isGenerating
}) => {
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleChange = (field: keyof GenerationRequest, value: any) => {
    onRequestChange({ ...request, [field]: value });
  };

  const currentDimensions = getExplicitDimensions(request.size, request.resolution);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const currentUrls = request.image_urls || [];
    const remainingSlots = 10 - currentUrls.length;
    if (remainingSlots <= 0) return;
    let selectedFiles = Array.from(files).slice(0, remainingSlots);
    setIsProcessingFile(true);
    try {
      const newUrls = await Promise.all(selectedFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }));
      handleChange('image_urls', [...currentUrls, ...newUrls]);
    } finally {
      setIsProcessingFile(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent w-full overflow-y-auto scrollbar-hide relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="p-6 pb-2 flex items-center space-x-3 sticky top-0 bg-surface/80 backdrop-blur-md z-30 border-b border-white/5">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner border border-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-white tracking-tight leading-none">
            Vidma Studio <span className="text-primary font-black">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Generative Suite v4.5</p>
        </div>
      </div>

      <div className="p-5 space-y-8 relative z-10 pb-24">
        {/* Prompt Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <Zap className="w-3 h-3 mr-1 text-yellow-400" />
              Creative Prompt
            </label>
            <span className="text-[10px] text-slate-500">{request.prompt.length}/2000</span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-100 transition-all duration-500 blur" />
            <TextArea
              placeholder="Describe your vision in detail..."
              value={request.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              className="h-32 text-sm bg-surface/50 border-white/10 focus:border-transparent relative z-10 placeholder:text-slate-600 rounded-lg p-3 leading-relaxed"
            />
          </div>
        </div>

        {/* Image Size Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Canvas Config</label>
            <div className="flex bg-surface/50 p-1 rounded-lg border border-white/5 backdrop-blur-sm">
              {RESOLUTIONS.map(res => (
                <button
                  key={res.value}
                  onClick={() => handleChange('resolution', res.value)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${request.resolution === res.value
                    ? 'bg-primary text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                >
                  {res.value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => handleChange('size', ratio.value)}
                className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 aspect-square overflow-hidden ${request.size === ratio.value
                  ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-surface/30 border-white/5 hover:border-white/10 hover:bg-surface/50'
                  }`}
              >
                <div className={`transition-all duration-300 ${request.size === ratio.value ? 'scale-110 text-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {PRESET_ICONS[ratio.value]}
                </div>
                <span className={`text-[10px] font-bold mt-2 transition-colors ${request.size === ratio.value ? 'text-white' : 'text-slate-500'}`}>{ratio.label}</span>
                <span className="text-[8px] opacity-30 font-mono tracking-widest mt-0.5">{ratio.value}</span>

                {request.size === ratio.value && (
                  <div className="absolute inset-0 bg-primary/10 animate-pulse-fast pointer-events-none" />
                )}
              </button>
            ))}
          </div>

          {/* Dimension readout box */}
          <div className="bg-surface/40 rounded-xl p-4 border border-white/5 mt-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-white/5 text-slate-400 group-hover:text-primary transition-colors">
                <Monitor size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Output Size</div>
                <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  {currentDimensions.width} <span className="text-slate-600">×</span> {currentDimensions.height}
                  <span className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-blue-300 rounded ml-2">PX</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Number of Images Selector */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Batch Size</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handleChange('n', n)}
                className={`relative py-2.5 rounded-xl text-sm font-bold transition-all overflow-hidden ${request.n === n
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-lg border border-blue-400/20'
                  : 'bg-surface/30 text-slate-500 border border-white/5 hover:border-white/10 hover:bg-surface/50'
                  }`}
              >
                {n}
                {request.n === n && <div className="absolute inset-0 bg-white/10 animate-pulse-fast" />}
              </button>
            ))}
          </div>
          {request.n > 1 && (!request.image_urls || request.image_urls.length === 0) && (
            <div className="text-[10px] text-amber-300 bg-amber-500/10 px-3 py-2.5 rounded-lg border border-amber-500/20 flex items-center animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-3 h-3 mr-2 text-amber-400" />
              Reference asset required for batch generation
            </div>
          )}
        </div>

        {/* Reference Assets */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
            Reference Assets <span className="text-slate-600 font-mono bg-surface/50 px-2 rounded">{request.image_urls?.length || 0}/10</span>
          </label>
          <div className="relative group perspective-1000">
            <input type="file" id="image-upload" className="hidden" accept="image/*" multiple onChange={handleFileUpload} disabled={isProcessingFile} />
            <label htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer 
              group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
              {isProcessingFile ? (
                <Loader2 className="animate-spin text-primary" />
              ) : (
                <>
                  <div className="p-3 bg-surface rounded-full mb-2 group-hover:scale-110 transition-transform shadow-lg border border-white/5 group-hover:border-primary/30">
                    <Upload size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Drop Assets or Click</span>
                </>
              )}
            </label>
          </div>

          {request.image_urls && request.image_urls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {request.image_urls.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 flex-shrink-0 snap-start rounded-xl overflow-hidden border border-white/10 group shadow-lg">
                  <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Ref" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button onClick={() => handleChange('image_urls', request.image_urls?.filter((_, i) => i !== idx))} className="text-white hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button Panel */}
      <div className="p-4 pt-4 border-t border-white/10 bg-surface/90 backdrop-blur-xl sticky bottom-0 z-50">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onSubmit}
          disabled={!request.prompt || isGenerating}
          className="h-14 rounded-xl text-sm font-black uppercase tracking-[0.2em] relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all duration-300 border border-primary/20"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="animate-spin text-white" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative z-10">
              <Sparkles className="mr-3 w-5 h-5 animate-pulse" />
              <span>Generate 4K</span>
            </div>
          )}
          {!isGenerating && !(!request.prompt) && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
          )}
        </Button>
      </div>
    </div>
  );
};