import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';

interface Variable {
    id: string;
    label: string;
    value: string;
    type: string;
    preview?: string | null;
    [key: string]: any;
}

interface SmartPromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onAction?: (variable: Variable) => void;
    variables: Variable[];
    className?: string;
    placeholder?: string;
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
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;
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

        vars.filter(v => v.type === 'image').forEach(v => {
            const regex = new RegExp(`@${v.id}\\b`, 'g');
            const chip = `
        <span contenteditable="false" data-var="${v.id}" class="inline-flex items-center align-middle bg-slate-800 border border-white/20 rounded-md px-1.5 py-0.5 mx-0.5 select-none align-baseline shadow-sm my-0.5">
          <span class="w-4 h-4 rounded-sm bg-black overflow-hidden mr-1.5 border border-white/20 flex-shrink-0 block">
             <img src="${v.preview}" class="w-full h-full object-cover block" />
          </span>
          <span class="text-[11px] font-bold text-white tracking-tight shadow-black drop-shadow-sm font-sans">@${v.id}</span>
        </span>
      `;
            ht = ht.replace(regex, chip);
        });
        return ht;
    };

    const htmlToText = (element: HTMLElement) => {
        const clone = element.cloneNode(true) as HTMLElement;
        const chips = clone.querySelectorAll('[data-var]');
        chips.forEach(chip => {
            const id = chip.getAttribute('data-var');
            chip.replaceWith(`@${id}`);
        });
        return clone.innerText;
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const text = htmlToText(el);
        onChange(text);

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const str = textNode.textContent || '';
                const cursor = range.startOffset;
                const textBefore = str.slice(0, cursor);
                const lastAt = textBefore.lastIndexOf('@');

                if (lastAt !== -1) {
                    const query = textBefore.slice(lastAt + 1);
                    if (!query.includes(' ')) {
                        if (editorRef.current) {
                            setContainerRect(editorRef.current.getBoundingClientRect());
                        }
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

    useEffect(() => {
        if (!showSuggestions) return;
        const updateRect = () => {
            if (editorRef.current) {
                setContainerRect(editorRef.current.getBoundingClientRect());
            }
        };
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [showSuggestions]);

    const filtered = useMemo(() => {
        const q = suggestionQuery.toLowerCase();
        const list = variables.filter(v =>
            v.id.toLowerCase().includes(q) ||
            v.label.toLowerCase().includes(q)
        );
        const grouped = list.reduce((acc, curr) => {
            let type = curr.type;
            if (curr.type === 'image') type = 'Reference Images';
            if (curr.type === 'Custom') type = 'My Saved Prompts';
            if (!acc[type]) acc[type] = [];
            acc[type].push(curr);
            return acc;
        }, {} as Record<string, Variable[]>);

        const sortOrder = ['My Saved Prompts', 'Reference Images', 'Style', 'Lighting', 'Camera', 'Quality', 'Action'];
        const sortedGroups = Object.keys(grouped).sort((a, b) => {
            const idxA = sortOrder.indexOf(a);
            const idxB = sortOrder.indexOf(b);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });

        const flat: Variable[] = [];
        sortedGroups.forEach(g => flat.push(...grouped[g]));

        return { grouped, sortedGroups, flat };
    }, [variables, suggestionQuery]);

    const insertVariable = (variable: Variable) => {
        const el = editorRef.current;
        if (!el) return;
        const rawText = value;
        const lastIndex = rawText.lastIndexOf(`@${suggestionQuery}`);
        if (lastIndex !== -1) {
            if (variable.type === 'Action' && onAction) {
                onAction(variable);
                const before = rawText.substring(0, lastIndex);
                const after = rawText.substring(lastIndex + 1 + suggestionQuery.length);
                onChange(before + after);
            } else if (variable.type === 'image') {
                // Keep image variables as references
                const before = rawText.substring(0, lastIndex);
                const after = rawText.substring(lastIndex + 1 + suggestionQuery.length);
                const newValue = `${before}@${variable.id} ${after}`;
                onChange(newValue);
            } else {
                // Expand other variables (Style, Custom, etc.) to their text value
                const before = rawText.substring(0, lastIndex);
                const after = rawText.substring(lastIndex + 1 + suggestionQuery.length);
                const valToInsert = variable.value;
                const newValue = `${before}${valToInsert} ${after}`;
                onChange(newValue);
            }
        }
        setShowSuggestions(false);
        editorRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
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

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleCopy = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        // data-placeholder is on the main div, checking if selection is inside editor
        if (editorRef.current && !editorRef.current.contains(range.commonAncestorContainer)) {
            return;
        }

        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        // Use existing htmlToText to convert chips back to @id
        const text = htmlToText(container);
        e.clipboardData.setData('text/plain', text);
    };

    return (
        <div className={`relative group ${className}`}>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onCopy={handleCopy}
                onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full h-full bg-transparent border-none focus:outline-none text-sm text-white leading-relaxed p-3 overflow-y-auto"
                style={{ minHeight: '120px' }}
                data-placeholder={placeholder}
            />
            {!value && (
                <div className="absolute top-3 left-3 text-slate-600 pointer-events-none text-sm leading-relaxed">
                    {placeholder}
                </div>
            )}

            {showSuggestions && filtered.flat.length > 0 && containerRect && createPortal(
                <div
                    className="fixed bg-[#0f172a] border border-slate-700/50 rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col ring-1 ring-white/10 w-72 animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: containerRect.bottom + 8,
                        left: containerRect.left,
                    }}
                    onMouseDown={(e) => e.preventDefault()}
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
                </div>,
                document.body
            )}
        </div>
    );
};
