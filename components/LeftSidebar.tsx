import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Plus, Trash2, Sliders, Upload, ShieldCheck, Loader2, Maximize2, Monitor, Tablet, Smartphone, Square, Zap, Bookmark } from 'lucide-react';
import { Button } from './ui/Button';
import { SmartPromptInput } from './SmartPromptInput';
import { InputModal } from './ui/InputModal';
import { ASPECT_RATIOS, RESOLUTIONS, getExplicitDimensions, MAX_FILE_SIZE } from '../constants';
import { GenerationRequest, AspectRatio, Resolution } from '../types';
import { PROMPT_PRESETS, PromptPreset } from './prompt_presets';
import { enhancePrompt } from '../services/gemini';

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
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<PromptPreset[]>(() => {
    const saved = localStorage.getItem('custom_prompt_presets');
    return saved ? JSON.parse(saved) : [];
  });

  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    localStorage.setItem('custom_prompt_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  const handleChange = (field: keyof GenerationRequest, value: any) => {
    onRequestChange({ ...request, [field]: value });
  };

  const currentDimensions = getExplicitDimensions(request.size, request.resolution);

  // Helper: Get available variables
  const getVariables = () => {
    const images = (request.image_urls || []).map((_, idx) => ({
      id: `image${idx + 1}`,
      label: `Image ${idx + 1}`,
      value: `@image${idx + 1}`, // Keep as variable reference
      type: 'image' as const,
      preview: request.image_urls![idx]
    }));

    // Map presets to compatible format
    const presets = PROMPT_PRESETS.map(p => ({
      ...p,
      // For ID matching, we keep the ID from preset
      // value is what gets inserted
      preview: null // No image preview for presets
    }));

    // Map custom presets
    const custom = customPresets.map(p => ({
      ...p,
      icon: Bookmark, // Ensure icon is present after loading from LS
      preview: null
    }));

    return [...images, ...custom, ...presets];
  };

  const handleAction = (variable: any) => {
    try {
      const payload = JSON.parse(variable.value);
      if (payload.key && payload.val) {
        handleChange(payload.key as keyof GenerationRequest, payload.val);
      }
    } catch (e) {
      console.error("Failed to parse action", e);
    }
  };

  const handlePromptChange = (val: string) => {
    handleChange('prompt', val);
  };

  const handleSavePreset = () => {
    if (!request.prompt.trim()) return;
    setIsSaveModalOpen(true);
  };



  const handleEnhance = async () => {
    if (!request.prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(request.prompt);
      handleChange('prompt', enhanced);
    } catch (error) {
      console.error("Enhancement failed", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleConfirmSave = (name: string) => {
    if (name) {
      // Remove @ if user typed it
      const cleanName = name.replace(/^@/, '');

      const newPreset: PromptPreset = {
        id: cleanName,
        label: cleanName,
        value: request.prompt,
        type: 'Custom' as any, // Cast to any to avoid strict type checks against the preset const file
        icon: Bookmark
      };

      setCustomPresets(prev => [...prev, newPreset]);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    // Server limit is 10MB
    const SERVER_LIMIT_BYTES = 10 * 1024 * 1024;

    return new Promise((resolve, reject) => {
      // If file is already small enough, just return it
      if (file.size <= SERVER_LIMIT_BYTES) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Compress large images
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension cap (e.g. 4096px) to prevent memory issues and massive data
        const MAX_DIM = 4096;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        ctx.fillStyle = '#FFFFFF'; // Prevent transparent pngs turning black if converted to jpeg
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Start high, reduce if needed
        let quality = 0.85;
        // Base64 overhead is approx 1.37x. So 10MB bytes ~= 13.7M chars.
        // We target safer 9.5MB limit
        const CHAR_LIMIT = 9.5 * 1024 * 1024 * 1.37;

        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Simple reduction loop
        while (dataUrl.length > CHAR_LIMIT && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const currentUrls = request.image_urls || [];
    const remainingSlots = 10 - currentUrls.length;
    if (remainingSlots <= 0) return;
    let selectedFiles = Array.from(files).slice(0, remainingSlots) as File[];

    // Validate file size for App Limit (20MB)
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum allowed size is 20MB. \n\nOversized files: ${oversizedFiles.map(f => f.name).join(', ')}`);
      selectedFiles = selectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
    }

    if (selectedFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setIsProcessingFile(true);
    try {
      const newUrls = await Promise.all(selectedFiles.map(file => compressImage(file)));
      handleChange('image_urls', [...currentUrls, ...newUrls]);
    } catch (err) {
      console.error("Image processing failed", err);
      // Optional: alert user
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
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !request.prompt.trim()}
                className={`text-[10px] flex items-center transition-colors mr-2 ${isEnhancing ? 'text-primary' : 'text-slate-400 hover:text-primary'
                  }`}
                title="Enhance prompt with AI"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </button>
              <div className="w-px h-3 bg-white/10 mx-1" />
              <button
                onClick={handleSavePreset}
                className="text-[10px] flex items-center text-slate-400 hover:text-primary transition-colors"
                title="Save current prompt as variable"
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save as Variable
              </button>
              <span className="text-[10px] text-slate-500">{request.prompt.length}/2000</span>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-100 transition-all duration-500 blur" />
            <SmartPromptInput
              placeholder="Describe your vision in detail... Use @ to reference uploaded images (e.g. @image1)"
              value={request.prompt}
              onChange={handlePromptChange}
              onAction={handleAction}
              variables={getVariables()}
              className="h-32 bg-surface/50 border border-white/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 rounded-lg overflow-y-auto"
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
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
                  <div className="absolute top-0.5 left-0.5 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold z-20 pointer-events-none font-mono">
                    #{idx + 1}
                  </div>
                  <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Ref ${idx + 1}`} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
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
      <InputModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Save Variable"
        placeholder="Enter variable name (e.g. 1255)"
      />
    </div>
  );
};