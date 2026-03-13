'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  onClose?: () => void;
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-md rounded-lg border p-6 shadow-xl animate-in zoom-in-95 duration-200',
            {
              'bg-background border-border': variant === 'default',
              'bg-green-50 border-green-200 text-green-900': variant === 'success',
              'bg-red-50 border-red-200 text-red-900': variant === 'error',
              'bg-yellow-50 border-yellow-200 text-yellow-900': variant === 'warning',
            }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {title && <div className="text-lg font-semibold mb-2">{title}</div>}
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-black/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* OK Button */}
          {onClose && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-md font-medium transition-colors',
                  {
                    'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
                    'bg-green-600 text-white hover:bg-green-700': variant === 'success',
                    'bg-red-600 text-white hover:bg-red-700': variant === 'error',
                    'bg-yellow-600 text-white hover:bg-yellow-700': variant === 'warning',
                  }
                )}
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ToastContextValue {
  showToast: (props: Omit<ToastProps, 'onClose'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastProps | null>(null);

  const showToast = React.useCallback((props: Omit<ToastProps, 'onClose'>) => {
    setToast(props);
    // Auto-close after 5 seconds
    setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
