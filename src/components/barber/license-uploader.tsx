'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { secureFetch } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LICENSE');

interface LicenseUploaderProps {
  currentDocumentUrl?: string;
  verificationStatus?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  allowWhenSuspended?: boolean;
}

export function LicenseUploader({
  currentDocumentUrl,
  verificationStatus,
  onUploadSuccess,
  onUploadError,
  allowWhenSuspended = false,
}: LicenseUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDocumentUrl || null);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  // Only lock 'pending' if a document is already uploaded — otherwise a fresh
  // profile (status defaults to 'pending') would be permanently blocked from
  // its first upload. Approval and suspension always lock.
  const hasDocument = Boolean(currentDocumentUrl);
  const isLocked =
    verificationStatus === 'approved' ||
    (verificationStatus === 'pending' && hasDocument) ||
    (verificationStatus === 'suspended' && !allowWhenSuspended);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or PDF file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError?.(error);
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null); // PDF - no preview
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await secureFetch('/api/barbers/license-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess?.(data.data.documentUrl);
      } else {
        onUploadError?.(data.message || 'Upload failed');
        setPreviewUrl(currentDocumentUrl || null);
      }
    } catch (err) {
      logger.error('Upload error:', err);
      onUploadError?.('Failed to upload file. Please try again.');
      setPreviewUrl(currentDocumentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label>License Document</Label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        } ${uploading || isLocked ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          disabled={uploading || isLocked}
        />

        {previewUrl ? (
          <div className="space-y-4">
            {/* Image Preview */}
            {fileName && fileName.match(/\.(jpg|jpeg|png)$/i) ? (
              <div className="relative mx-auto max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element -- local
                    blob/data URL from the file picker; nothing for the image
                    optimizer to fetch, and the file never leaves the browser
                    until upload. */}
                <img
                  src={previewUrl}
                  alt="License preview"
                  className="rounded-lg border border-border max-h-64 mx-auto"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="font-medium">PDF Document Uploaded</p>
                  <p className="text-sm">{fileName || 'license.pdf'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                disabled={uploading || isLocked}
              >
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">
                {uploading ? 'Uploading...' : 'Drag & drop your license here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                JPG, PNG, or PDF (max 5MB)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                disabled={uploading}
              >
                Choose File
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Upload a clear photo or scan of your professional barber license. This document will be reviewed by our admin team.
      </p>
    </div>
  );
}
