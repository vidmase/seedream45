import React, { useState } from 'react';
import { Settings, Sparkles, Image as ImageIcon, Plus, Trash2, Sliders, Upload, ShieldCheck, Loader2, Maximize2, Monitor, Tablet, Smartphone, Square } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    <div className="flex flex-col h-full bg-[#1e293b] border-r border-slate-800/50 w-full overflow-y-auto scrollbar-hide">
      <div className="p-4 border-b border-slate-800/50 flex items-center space-x-3 sticky top-0 bg-[#1e293b] z-10 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-bold text-lg text-white tracking-tight">Vidma Studio <span className="text-blue-500">AI</span></h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Prompt Section */}
        <div className="space-y-2">
          <TextArea
            label="Creative Prompt"
            placeholder="Describe your vision..."
            value={request.prompt}
            onChange={(e) => handleChange('prompt', e.target.value)}
            className="h-28 text-sm bg-[#0f172a] border-slate-700/50 focus:border-blue-500"
          />
        </div>

        {/* Image Size Selection Tool - Matched to Screenshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resolution & Format</label>
            <div className="flex bg-[#0f172a] p-1 rounded-lg border border-slate-700/50">
              {RESOLUTIONS.map(res => (
                <button
                  key={res.value}
                  onClick={() => handleChange('resolution', res.value)}
                  className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all ${request.resolution === res.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
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
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all aspect-square ${request.size === ratio.value
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-[#0f172a]/40 border-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
              >
                {PRESET_ICONS[ratio.value]}
                <span className="text-[11px] font-bold mb-0.5">{ratio.label}</span>
                <span className="text-[9px] opacity-40 font-mono tracking-widest">{ratio.value}</span>
              </button>
            ))}
          </div>

          {/* Dimension readout box - Matched to Screenshot */}
          <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800/50 mt-6 shadow-inner">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Output Pixels</div>
                <div className="text-xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
                  {currentDimensions.width} <span className="text-slate-600 text-sm">×</span> {currentDimensions.height}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MP Count</div>
                <div className="text-base font-bold text-slate-400">
                  {((currentDimensions.width * currentDimensions.height) / 1000000).toFixed(1)} <span className="text-[10px] text-slate-500 uppercase ml-1">MP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Number of Images Selector */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Images to Generate</label>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handleChange('n', n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${request.n === n
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-[#0f172a] text-slate-500 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
          {request.n > 1 && (!request.image_urls || request.image_urls.length === 0) && (
            <div className="text-[10px] text-amber-400/80 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
              ⚠️ Multiple images require at least 1 reference asset
            </div>
          )}
        </div>

        {/* Reference Assets */}
        <div className="space-y-4 pt-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
            Reference Assets <span className="text-slate-600 font-mono">{request.image_urls?.length || 0}/10</span>
          </label>
          <div className="relative group">
            <input type="file" id="image-upload" className="hidden" accept="image/*" multiple onChange={handleFileUpload} disabled={isProcessingFile} />
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-800/50 rounded-2xl cursor-pointer hover:bg-[#0f172a]/50 hover:border-blue-500/30 transition-all text-slate-500 hover:text-blue-400 group">
              {isProcessingFile ? <Loader2 className="animate-spin" /> : <Upload size={24} className="mb-3 opacity-50 group-hover:opacity-100" />}
              <span className="text-[11px] font-bold uppercase tracking-widest">Add High-Res Source</span>
            </label>
          </div>

          {request.image_urls && request.image_urls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {request.image_urls.map((url, idx) => (
                <div key={idx} className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-[#0f172a] shadow-lg">
                  <img src={url} className="w-full h-full object-cover" alt="Ref" />
                  <button onClick={() => handleChange('image_urls', request.image_urls?.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-600/0 hover:bg-red-600/80 transition-all flex items-center justify-center opacity-0 hover:opacity-100 text-white">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="pt-6">
          <Button variant="primary" fullWidth size="lg" onClick={onSubmit} disabled={!request.prompt || isGenerating} className="h-14 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-blue-500/20 shadow-xl border border-white/5">
            {isGenerating ? <Loader2 className="animate-spin mr-3" /> : <Sparkles className="mr-3 w-5 h-5" />}
            {isGenerating ? 'Rendering...' : 'Generate 4K Output'}
          </Button>
        </div>
      </div>
    </div>
  );
};