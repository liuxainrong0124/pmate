"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let toastListeners: ((toast: ToastMessage) => void)[] = [];
let toastRemovers: ((id: string) => void)[] = [];

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const toast: ToastMessage = { id, message, type };
  toastListeners.forEach((fn) => fn(toast));
  setTimeout(() => {
    toastRemovers.forEach((fn) => fn(id));
  }, 2500);
}

// Global access
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).showToast = showToast;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: ToastMessage) => {
    setToasts((prev) => [...prev.slice(-4), toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    toastRemovers.push(removeToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
      toastRemovers = toastRemovers.filter((fn) => fn !== removeToast);
    };
  }, [addToast, removeToast]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl text-sm shadow-lg backdrop-blur-md animate-slide-in-right border"
          style={{
            background: "rgba(30,30,40,0.85)",
            color: "#E5E5E5",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
