import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Copy, FileJson, AlertTriangle, Loader2, ExternalLink, RotateCcw, ShieldAlert } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-surface border-l border-slate-700/50 w-full lg:w-72 flex-shrink-0">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="font-semibold text-slate-200 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-blue-400" />
          Task History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="text-sm">No tasks yet.</p>
            <p className="text-xs mt-1">Generate an image to see history.</p>
          </div>
        ) : (
          history.map((item) => {
            const isSelected = selectedTaskId === item.id;
            const isSafetyViolation = item.result?.has_nsfw_concepts?.some(Boolean);
            
            let borderColor = 'border-slate-700/50';
            let hoverColor = 'hover:border-blue-500/30';
            
            if (item.status === 'failed') {
              borderColor = isSelected ? 'border-red-500 ring-1 ring-red-500' : 'border-red-500/20';
              hoverColor = 'hover:border-red-500/40';
            } else if (item.status === 'succeeded') {
              if (isSafetyViolation) {
                borderColor = isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-amber-500/20';
                hoverColor = 'hover:border-amber-500/40';
              } else {
                borderColor = isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-green-500/20';
                hoverColor = 'hover:border-green-500/40';
              }
            } else if (isSelected) {
               borderColor = 'border-blue-500 ring-1 ring-blue-500';
            }

            return (
              <div 
                key={item.id} 
                onClick={() => onSelectTask(item.id)}
                className={`bg-slate-900/50 border rounded-lg p-3 transition-all cursor-pointer ${borderColor} ${hoverColor}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-mono truncate max-w-[120px] ${isSelected ? 'text-blue-300' : 'text-slate-500'}`} title={item.id}>
                    {item.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 line-clamp-2 mb-3 italic font-medium">
                  "{item.prompt}"
                </p>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {item.status === 'submitted' || item.status === 'processing' ? (
                      <span className="flex items-center text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                      </span>
                    ) : item.status === 'succeeded' ? (
                      isSafetyViolation ? (
                        <span className="flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <ShieldAlert className="w-3 h-3 mr-1" /> NSFW
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                        </span>
                      )
                    ) : (
                       <span className="flex items-center text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" /> Failed
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => onReuseParams(item.params)}
                      className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Reuse Parameters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {item.result?.images?.[0] && !isSafetyViolation && (
                      <button 
                        onClick={() => window.open(item.result!.images[0], '_blank')}
                        className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                        title="Open Image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {item.status === 'failed' && item.errorDetails && (
                   <div className="mt-2 pt-2 border-t border-red-500/10 text-[10px]">
                      <div className="text-red-300 font-semibold flex items-center mb-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Error {item.errorDetails.code}
                      </div>
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-3 border-t border-slate-700/50 text-[10px] text-slate-500 text-center">
         Task ID provided by Seedream API.<br/>
         Links expire in 24 hours.
      </div>
    </div>
  );
};