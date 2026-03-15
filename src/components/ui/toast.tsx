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

      {/* Modal - Consistent styling with ConfirmModal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-lg border bg-background shadow-xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {title && (
                  <div className={cn(
                    "text-lg font-semibold mb-2",
                    {
                      'text-foreground': variant === 'default',
                      'text-green-600': variant === 'success',
                      'text-destructive': variant === 'error',
                      'text-yellow-600': variant === 'warning',
                    }
                  )}>
                    {title}
                  </div>
                )}
                {description && <div className="text-sm text-muted-foreground">{description}</div>}
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-md p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* OK Button */}
            {onClose && (
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className={cn(
                    'px-4 py-2 rounded-md font-medium transition-colors',
                    {
                      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
                      'bg-green-600 text-white hover:bg-green-700': variant === 'success',
                      'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'error',
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
