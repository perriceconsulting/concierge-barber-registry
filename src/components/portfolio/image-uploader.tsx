'use client';

import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (dataUrl: string) => Promise<void>;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function ImageUploader({ onUpload, maxSizeMB = 5, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      setIsUploading(true);

      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          await onUpload(dataUrl);
          setIsUploading(false);
        };
        reader.onerror = () => {
          setError('Failed to read file');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setError('Failed to upload image');
        setIsUploading(false);
      }
    },
    [onUpload, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          {
            'border-primary bg-primary/5': isDragging,
            'border-border hover:border-primary/50': !isDragging && !disabled,
            'opacity-50 cursor-not-allowed': disabled || isUploading,
          }
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Upload className={cn('w-12 h-12', isDragging ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className="font-medium">
              {isUploading ? 'Uploading...' : 'Drop your image here, or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPEG, PNG, or WebP • Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
