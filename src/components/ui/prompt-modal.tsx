'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description: string;
  placeholder?: string;
  expectedValue?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = '',
  expectedValue,
  defaultValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (expectedValue && value !== expectedValue) {
      setError(`Please type "${expectedValue}" to confirm`);
      return;
    }
    onConfirm(value);
    setValue('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-input">
              {expectedValue ? `Type "${expectedValue}" to confirm` : 'Enter value'}
            </Label>
            <Input
              id="prompt-input"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder={placeholder}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {cancelText}
            </Button>
            <Button variant={variant} onClick={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
