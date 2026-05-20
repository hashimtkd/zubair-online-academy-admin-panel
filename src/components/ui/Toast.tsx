import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-slide-up glass-panel ${
              t.type === 'success' ? 'border-green-200/50 bg-green-50/90 dark:border-green-900/50 dark:bg-green-950/90 text-green-800 dark:text-green-200' :
              t.type === 'error' ? 'border-red-200/50 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/90 text-red-800 dark:text-red-200' :
              t.type === 'warning' ? 'border-yellow-200/50 bg-yellow-50/90 dark:border-yellow-900/50 dark:bg-yellow-950/90 text-yellow-800 dark:text-yellow-200' :
              'border-blue-200/50 bg-blue-50/90 dark:border-blue-900/50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200'
            }`}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            
            <div className="flex-1 text-sm font-medium pr-2 whitespace-pre-line leading-relaxed">
              {t.message}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-current opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
