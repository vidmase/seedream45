import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Copy, FileJson, AlertTriangle, Loader2, ExternalLink, RotateCcw, ShieldAlert, Image, Calendar } from 'lucide-react';
import { TaskHistoryItem, GenerationRequest } from '../types';

interface RightSidebarProps {
  history: TaskHistoryItem[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onReuseParams: (params: GenerationRequest) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  history,
  selectedTaskId,
  onSelectTask,
  onReuseParams
}) => {
  return (
    <div className="flex flex-col h-full bg-transparent w-full lg:w-full flex-shrink-0 relative">
      {/* Background Ambience */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="p-6 pb-2 border-b border-white/5 bg-surface/80 backdrop-blur-md z-30 sticky top-0">
        <h2 className="font-heading font-bold text-lg text-white flex items-center tracking-tight">
          <Clock className="w-5 h-5 mr-3 text-accent" />
          Creation History
        </h2>
        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1 pl-8">Archives & Logs</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Calendar size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest">No Archives</p>
              <p className="text-[10px] mt-1">Generate your first masterpiece</p>
            </div>
          </div>
        ) : (
          history.map((item, index) => {
            const isSelected = selectedTaskId === item.id;
            const isSafetyViolation = item.result?.has_nsfw_concepts?.some(Boolean);
            const thumbUrl = item.result?.images?.[0];

            let statusColor = 'text-slate-500';
            let statusBorder = 'border-white/5';
            let statusBg = 'bg-surface/50';

            if (item.status === 'failed') {
              statusColor = 'text-red-400';
              statusBorder = isSelected ? 'border-red-500' : 'border-red-500/20';
              statusBg = 'bg-red-500/5';
            } else if (item.status === 'succeeded') {
              if (isSafetyViolation) {
                statusColor = 'text-amber-400';
                statusBorder = isSelected ? 'border-amber-500' : 'border-amber-500/20';
                statusBg = 'bg-amber-500/5';
              } else {
                statusColor = 'text-green-400';
                statusBorder = isSelected ? 'border-primary' : 'border-green-500/20';
                statusBg = 'bg-green-500/5';
              }
            } else if (isSelected) {
              statusBorder = 'border-primary';
              statusBg = 'bg-primary/5';
            }

            return (
              <div
                key={item.id}
                onClick={() => onSelectTask(item.id)}
                className={`
                  group relative rounded-xl p-3 cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden
                  ${statusBorder} ${statusBg} ${isSelected ? 'shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-white/10' : 'hover:border-white/20 hover:bg-surface/80'}
                  animate-in fade-in slide-in-from-bottom-2
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

                <div className="flex gap-3">
                  {/* Thumbnail / Status Icon */}
                  <div className={`
                    w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden border border-white/10 relative 
                    ${!thumbUrl ? 'flex items-center justify-center bg-black/40' : 'bg-black'}
                  `}>
                    {thumbUrl && !isSafetyViolation ? (
                      <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : item.status === 'processing' || item.status === 'submitted' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    ) : item.status === 'failed' ? (
                      <AlertTriangle className="w-6 h-6 text-red-400 opacity-80" />
                    ) : isSafetyViolation ? (
                      <ShieldAlert className="w-6 h-6 text-amber-500 opacity-80" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-mono tracking-wider ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Status Badge */}
                      <div className="flex items-center">
                        {item.status === 'submitted' || item.status === 'processing' ? (
                          <span className="flex items-center text-[9px] font-bold uppercase tracking-wider text-blue-400">
                            Creating...
                          </span>
                        ) : item.status === 'succeeded' ? (
                          isSafetyViolation ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center"><ShieldAlert size={10} className="mr-1" /> Flagged</span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 flex items-center"><CheckCircle2 size={10} className="mr-1" /> Ready</span>
                          )
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Error</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium group-hover:text-white transition-colors">
                      {item.prompt}
                    </p>
                  </div>
                </div>

                {/* Footer Actions (Visible on Hover/Selected) */}
                <div className={`mt-3 pt-2 border-t border-white/5 flex items-center justify-between transition-all duration-300 ${isSelected || 'opacity-50 group-hover:opacity-100'}`}>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]" title={item.id}>
                    #{item.id.slice(-6)}
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onReuseParams(item.params)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                      title="Remix Parameters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {item.result?.images?.[0] && !isSafetyViolation && (
                      <button
                        onClick={() => window.open(item.result!.images[0], '_blank')}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                        title="Open Original"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {item.status === 'failed' && item.errorDetails && (
                  <div className="mt-2 px-2 py-1.5 bg-red-500/10 rounded border border-red-500/10 text-[10px] text-red-300 break-words">
                    {item.errorDetails.code ? `Error Code: ${item.errorDetails.code}` : "Unknown Error"}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-surface/80 backdrop-blur border-t border-white/5 text-[9px] text-slate-600 text-center uppercase tracking-widest font-bold">
        SECURED BY SEEDREAM KERNEL
      </div>
    </div>
  );
};