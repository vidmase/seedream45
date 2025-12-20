import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface Variable {
    id: string;
    label: string;
    value: string;
    type: string;
    preview?: string | null;
    // allow other props
    [key: string]: any;
}

interface SmartPromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onAction?: (variable: Variable) => void;
    variables: Variable[];
    className?: string; // Add className prop
    placeholder?: string; // Add placeholder prop
}

export const SmartPromptInput: React.FC<SmartPromptInputProps> = ({
    value,
    onChange,
    onAction,
    variables,
    className = '',
    placeholder = ''
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);

    // Sync value to innerHTML (controlled component pattern for contentEditable is tricky)
    // We only update if the text content actually differs significantly or on mount
    useEffect(() => {
        if (!editorRef.current) return;

        // 1. Check if the current DOM's text equivalent matches the new value.
        // If it matches, we assume the DOM structure roughly corresponds to what we want
        // or is a transition state (user typing) where we should NOT touch innerHTML to preserve cursor.
        const currentDOMText = htmlToText(editorRef.current);
        if (currentDOMText === value && document.activeElement === editorRef.current) {
            return;
        }

        const generatedHTML = textToHtml(value, variables);
        if (editorRef.current.innerHTML !== generatedHTML) {
            editorRef.current.innerHTML = generatedHTML;
        }
    }, [value, variables]);

    const textToHtml = (text: string, vars: Variable[]) => {
        let ht = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Replace known image variables with chips
        vars.filter(v => v.type === 'image').forEach(v => {
            // Regex to match exact word @id
            const regex = new RegExp(`@${v.id}\\b`, 'g');
            // Render visual chip
            const chip = `
        <span contenteditable="false" data-var="${v.id}" class="inline-flex items-center align-middle bg-surface/80 border border-white/10 rounded-md px-1.5 py-0.5 mx-0.5 select-none group vertical-mid">
          <span class="w-4 h-4 rounded-sm bg-slate-700 overflow-hidden mr-1.5 border border-white/20 relative flex-shrink-0 block">
             <img src="${v.preview}" class="w-full h-full object-cover block" />
          </span>
          <span class="text-[10px] font-bold text-blue-200 font-mono">@${v.id}</span>
        </span>
      `;
            // We wrap in spaces to ensure separation? No, replace exact.
            ht = ht.replace(regex, chip);
        });

        return ht;
    };

    const htmlToText = (element: HTMLElement) => {
        // We want to extract text but respect our data-var chips
        // Clone to not mess up DOM
        const clone = element.cloneNode(true) as HTMLElement;
        const chips = clone.querySelectorAll('[data-var]');
        chips.forEach(chip => {
            const id = chip.getAttribute('data-var');
            chip.replaceWith(`@${id}`);
        });
        // Replace <br> with newline? contentEditable usually puts <div> or <br>
        // For this simple input, converting innertext is usually enough if we handled chips
        return clone.innerText; // innerText preserves newlines usually
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const text = htmlToText(el);
        onChange(text);

        // Trigger detection
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const textNode = range.startContainer;
            // We look at text before caret
            if (textNode.nodeType === Node.TEXT_NODE) {
                const str = textNode.textContent || '';
                const cursor = range.startOffset;
                const textBefore = str.slice(0, cursor);
                const lastAt = textBefore.lastIndexOf('@');

                if (lastAt !== -1) {
                    const query = textBefore.slice(lastAt + 1);
                    if (!query.includes(' ')) {
                        // Found trigger
                        const rect = range.getBoundingClientRect();
                        // Parent relative logic? just use fixed or absolute page coords
                        setCursorPosition({ top: rect.bottom, left: rect.left });
                        setSuggestionQuery(query);
                        setShowSuggestions(true);
                        setActiveSuggestionIndex(0);
                        return;
                    }
                }
            }
        }
        setShowSuggestions(false);
    };

    const filtered = useMemo(() => {
        const q = suggestionQuery.toLowerCase();
        const list = variables.filter(v =>
            v.id.toLowerCase().includes(q) ||
            v.label.toLowerCase().includes(q)
        );
        // Grouping Logic
        // Grouping Logic
        const grouped = list.reduce((acc, curr) => {
            let type = curr.type;
            if (type === 'image') type = 'Reference Images';
            else if (type === 'Custom') type = 'My Saved Prompts';
            else if (!type) type = 'Other';

            if (!acc[type]) acc[type] = [];
            acc[type].push(curr);
            return acc;
        }, {} as Record<string, Variable[]>);

        const groupOrder = ['Reference Images', 'My Saved Prompts', 'Action', 'Style', 'Quality', 'Lighting', 'Camera'];
        const sortedGroups = [...groupOrder, ...Object.keys(grouped).filter(g => !groupOrder.includes(g))].filter(g => grouped[g]?.length > 0);

        const flat: Variable[] = [];
        sortedGroups.forEach(g => flat.push(...grouped[g]));
        return { flat, grouped, sortedGroups };
    }, [suggestionQuery, variables]);

    const insertVariable = (variable: Variable) => {
        if (!editorRef.current) return;

        if (variable.type === 'Action') {
            if (onAction) onAction(variable);
            // Just close menu, parent should clear the text using onChange/value prop
            setShowSuggestions(false); // Optimistically close
            // Note: Parent updates value -> useEffect updates innerHTML -> Trigger removed
            return;
        }

        // Check for content insertion
        // We need to replace the @query with the variable content
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            const str = textNode.textContent || '';
            const cursor = range.startOffset;
            const textBefore = str.slice(0, cursor);
            const lastAt = textBefore.lastIndexOf('@');
            if (lastAt !== -1) {
                // Delete the trigger text
                range.setStart(textNode, lastAt);
                range.setEnd(textNode, cursor);
                range.deleteContents();

                if (variable.type === 'image') {
                    // Insert CHIP
                    // Creating the chip DOM
                    const span = document.createElement('span');
                    span.contentEditable = "false";
                    span.dataset.var = variable.id;
                    span.className = "inline-flex items-center align-middle bg-surface/80 border border-white/10 rounded-md px-1.5 py-0.5 mx-0.5 select-none align-middle group cursor-default";
                    span.innerHTML = `
                    <span class="w-4 h-4 rounded-sm bg-slate-700 overflow-hidden mr-1.5 border border-white/20 relative flex-shrink-0 block">
                        <img src="${variable.preview}" class="w-full h-full object-cover block" />
                    </span>
                    <span class="text-[10px] font-bold text-blue-200 font-mono">@${variable.id}</span>
                  `;
                    // Insert a space after?
                    range.insertNode(span);
                    range.collapse(false); // move to end
                    // Range often stuck inside the span or weirdly placed, insert a spacer text
                    const spacer = document.createTextNode('\u00A0');
                    range.insertNode(spacer);
                    range.collapse(false);
                } else {
                    // Text Variable
                    const text = document.createTextNode(variable.value + ' ');
                    range.insertNode(text);
                    range.collapse(false);
                }

                sel.removeAllRanges();
                sel.addRange(range);

                // Trigger update
                const newText = htmlToText(editorRef.current);
                onChange(newText);
                setShowSuggestions(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % filtered.flat.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev - 1 + filtered.flat.length) % filtered.flat.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (filtered.flat[activeSuggestionIndex]) {
                insertVariable(filtered.flat[activeSuggestionIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none focus:outline-none text-sm text-white leading-relaxed p-3 overflow-y-auto"
                style={{ minHeight: '120px' }} // Ensure min height
                data-placeholder={placeholder}
            />
            {/* Placeholder - only show if empty */}
            {!value && (
                <div className="absolute top-3 left-3 text-slate-600 pointer-events-none text-sm leading-relaxed">
                    {placeholder}
                </div>
            )}

            {/* Suggestions Menu */}
            {showSuggestions && filtered.flat.length > 0 && cursorPosition && (
                <div
                    className="fixed bg-[#0f172a] border border-slate-700/50 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col ring-1 ring-white/10 w-72 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: cursorPosition.top + 10, left: cursorPosition.left }}
                >
                    <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-900/90 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Smart Variables</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">@{suggestionQuery || 'All'}</span>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600/50">
                        {filtered.sortedGroups.map((group) => (
                            <div key={group}>
                                <div className={`sticky top-0 z-10 px-4 py-1.5 bg-slate-900/95 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider border-y border-white/5 shadow-sm flex items-center ${group === 'Action' ? 'text-green-400' : 'text-orange-400'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 opacity-70 ${group === 'Action' ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                                    {group === 'Action' ? 'Commands' : group}
                                </div>
                                <div className="p-1.5 grid gap-0.5">
                                    {filtered.grouped[group].map((variable) => {
                                        const Icon = variable.icon || Sparkles;
                                        const globalIdx = filtered.flat.indexOf(variable);
                                        const isActive = globalIdx === activeSuggestionIndex;

                                        return (
                                            <button
                                                key={variable.id}
                                                onClick={() => insertVariable(variable)}
                                                onMouseEnter={() => setActiveSuggestionIndex(globalIdx)}
                                                className={`w-full flex items-center space-x-3 p-2.5 rounded-lg transition-all text-left ${isActive
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                                                    : 'hover:bg-slate-800/50 text-slate-300'
                                                    }`}
                                            >
                                                {variable.type === 'image' ? (
                                                    <div className={`w-9 h-9 rounded-md bg-black/50 overflow-hidden border flex-shrink-0 ${isActive ? 'border-white/30' : 'border-white/10'}`}>
                                                        <img src={variable.preview!} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-9 h-9 rounded-md flex items-center justify-center border flex-shrink-0 transition-colors ${isActive
                                                        ? 'bg-white/20 border-white/30 text-white'
                                                        : 'bg-slate-800 border-white/5 text-slate-400'
                                                        }`}>
                                                        <Icon size={16} />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>{variable.label}</span>
                                                        {isActive && <span className="text-[9px] opacity-70 font-mono tracking-tighter">@{variable.id}</span>}
                                                    </div>
                                                    <div className={`text-[10px] truncate leading-tight mt-0.5 ${isActive ? 'text-blue-100/70' : 'text-slate-500'}`}>
                                                        {variable.type === 'image' ? 'Reference Image Source' : (
                                                            variable.type === 'Action' ? 'Action / Command' : (variable as any).value
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
