'use client';

import * as React from 'react';
import { ConfirmModal } from './confirm-modal';
import { PromptModal } from './prompt-modal';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

interface PromptOptions {
  title: string;
  description: string;
  placeholder?: string;
  expectedValue?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: (value: string) => void | Promise<void>;
}

interface ModalContextValue {
  showConfirm: (options: ConfirmOptions) => void;
  showPrompt: (options: PromptOptions) => void;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmModal, setConfirmModal] = React.useState<ConfirmOptions | null>(null);
  const [promptModal, setPromptModal] = React.useState<PromptOptions | null>(null);

  const showConfirm = React.useCallback((options: ConfirmOptions) => {
    setConfirmModal(options);
  }, []);

  const showPrompt = React.useCallback((options: PromptOptions) => {
    setPromptModal(options);
  }, []);

  const handleConfirmClose = () => {
    setConfirmModal(null);
  };

  const handleConfirmConfirm = async () => {
    if (confirmModal?.onConfirm) {
      await confirmModal.onConfirm();
    }
    setConfirmModal(null);
  };

  const handlePromptClose = () => {
    setPromptModal(null);
  };

  const handlePromptConfirm = async (value: string) => {
    if (promptModal?.onConfirm) {
      await promptModal.onConfirm(value);
    }
    setPromptModal(null);
  };

  return (
    <ModalContext.Provider value={{ showConfirm, showPrompt }}>
      {children}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
        />
      )}

      {promptModal && (
        <PromptModal
          isOpen={true}
          onClose={handlePromptClose}
          onConfirm={handlePromptConfirm}
          title={promptModal.title}
          description={promptModal.description}
          placeholder={promptModal.placeholder}
          expectedValue={promptModal.expectedValue}
          defaultValue={promptModal.defaultValue}
          confirmText={promptModal.confirmText}
          cancelText={promptModal.cancelText}
          variant={promptModal.variant}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
