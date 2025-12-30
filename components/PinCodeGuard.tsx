import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface PinCodeGuardProps {
    onSuccess: () => void;
    correctPin: string;
}

export const PinCodeGuard: React.FC<PinCodeGuardProps> = ({ onSuccess, correctPin }) => {
    const [pin, setPin] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (pin.length < 4) return;

        setIsLoading(true);
        setIsError(false);

        // Simulate a small delay for premium feel
        setTimeout(() => {
            if (pin === correctPin) {
                setIsLoading(false);
                setIsSuccess(true);
                // Final success callback after animation
                setTimeout(() => {
                    onSuccess();
                }, 1200);
            } else {
                setIsError(true);
                setPin('');
                setIsLoading(false);
            }
        }, 800);
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(val);
        if (isError) setIsError(false);

        if (val.length === 4 && val === correctPin) {
            // Optional auto-submit
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020617] p-4 overflow-hidden">
            {/* Flash Effect */}
            <div className={`fixed inset-0 z-[1100] bg-white transition-opacity duration-700 pointer-events-none ${isSuccess ? 'opacity-100' : 'opacity-0'}`} />

            <div className={`fixed inset-0 z-[1101] bg-primary/20 transition-opacity duration-1000 pointer-events-none ${isSuccess ? 'opacity-100' : 'opacity-0'}`} />

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.1] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-fast" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-fast" style={{ animationDelay: '1s' }} />

            <div className={`
                relative z-10 w-full max-w-md glass-panel p-10 rounded-3xl border-white/5 shadow-2xl transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
                ${isError ? 'ring-2 ring-red-500/30' : 'ring-1 ring-white/10'}
                ${isSuccess ? 'scale-110 opacity-0 blur-xl translate-z-10' : 'scale-100 opacity-100 blur-0'}
            `}>
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Header Icon */}
                    <div className="relative group">
                        <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${isError ? 'bg-red-500/40 opacity-100' : 'bg-primary/40 opacity-50 group-hover:opacity-100'}`} />
                        <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isError ? 'bg-red-950/50 border-red-500/50 text-red-400 shake' : (isSuccess ? 'bg-emerald-500 border-white/40 text-white' : 'bg-surface/50 border-white/10 text-primary group-hover:scale-110')}`}>
                            {isError ? <AlertCircle size={36} /> : (isSuccess ? <ShieldCheck size={36} className="animate-bounce" /> : <Lock size={36} />)}
                        </div>
                    </div>

                    {/* Text content */}
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Vidma Studio <span className="text-primary italic">AI</span></h1>
                        <p className="text-slate-400 text-sm font-medium tracking-wide uppercase transition-colors duration-300">
                            {isSuccess ? <span className="text-emerald-400 font-black tracking-[0.2em] animate-pulse">Access Granted</span> : 'Protected Session Access'}
                        </p>
                    </div>

                    {/* PIN Input Area */}
                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={pin}
                                onChange={handlePinChange}
                                maxLength={4}
                                placeholder="ENTER PIN"
                                className={`
                                    w-full bg-black/40 border-2 rounded-2xl py-6 text-center text-4xl tracking-[0.5em] font-black text-white
                                    focus:outline-none transition-all duration-300 placeholder:tracking-normal placeholder:text-sm placeholder:font-bold placeholder:text-slate-600
                                    ${isError ? 'border-red-500/50 focus:border-red-500 ring-4 ring-red-500/10' : (isSuccess ? 'border-emerald-500/50 scale-95 opacity-50' : 'border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10')}
                                `}
                                autoComplete="off"
                                disabled={isSuccess || isLoading}
                            />
                            {pin.length === 4 && !isLoading && !isSuccess && (
                                <button
                                    type="submit"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all animate-in fade-in zoom-in"
                                >
                                    <ArrowRight size={24} />
                                </button>
                            )}
                            {(isLoading || isSuccess) && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
                                    {isLoading ? <Loader2 className="animate-spin text-primary" size={24} /> : <ShieldCheck className="text-emerald-400 animate-in zoom-in duration-300" size={32} />}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${pin.length >= i
                                            ? (isError ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : (isSuccess ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] scale-125' : 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]'))
                                            : 'bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                    </form>

                    {/* Footer Info */}
                    <div className="pt-4 flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {isSuccess ? (
                            <div className="flex items-center space-x-2 animate-in slide-in-from-bottom-2 duration-700">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-emerald-500">System Authorized</span>
                            </div>
                        ) : (
                            <>
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span>Encrypted Environment</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .translate-z-10 {
                    transform: perspective(1000px) translateZ(100px);
                }
            `}</style>
        </div>
    );
};
