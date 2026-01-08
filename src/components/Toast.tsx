import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styles = {
    success: "bg-slate-800 border-l-4 border-green-500",
    error: "bg-slate-800 border-l-4 border-red-500",
    info: "bg-slate-800 border-l-4 border-orange-500"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-orange-500" />
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg shadow-2xl mb-3 w-80 animate-slideIn border border-slate-700 ${styles[toast.type]}`}>
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
          <p className="text-sm text-white font-medium leading-tight">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="text-slate-500 hover:text-white transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};