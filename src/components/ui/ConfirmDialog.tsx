"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirm dialog — drop-in replacement for window.confirm().
 *   const confirm = useConfirm();
 *   if (await confirm({ message: "Delete this?", danger: true })) { ... }
 */
export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
    return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((options) => {
        setOpts(options);
        return new Promise<boolean>((resolve) => { resolver.current = resolve; });
    }, []);

    const close = (result: boolean) => {
        resolver.current?.(result);
        resolver.current = null;
        setOpts(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {opts && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => close(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            {opts.danger && <span className="grid place-items-center w-10 h-10 rounded-full bg-red-50 text-red-500 shrink-0"><AlertTriangle size={20} /></span>}
                            <h3 className="font-black text-xl">{opts.title ?? "Are you sure?"}</h3>
                        </div>
                        <p className="text-gray-500 text-sm mb-6">{opts.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => close(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                {opts.cancelText ?? "Cancel"}
                            </button>
                            <button onClick={() => close(true)} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-[#D4AF37] hover:text-black"}`}>
                                {opts.confirmText ?? "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
