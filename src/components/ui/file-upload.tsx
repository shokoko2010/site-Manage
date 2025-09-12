"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (fileUrl: string, fileInfo: any) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
  currentImage?: string;
  onRemove?: () => void;
}

interface FileInfo {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize = 10,
  className = "",
  currentImage,
  onRemove
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: FileInfo = await response.json();
      
      if (result.success) {
        onFileSelect(result.fileUrl, result);
      } else {
        throw new Error('Upload failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [acceptedTypes, maxSize, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {currentImage ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative group">
              <img
                src={currentImage}
                alt="Current upload"
                className="w-full h-48 object-cover rounded-lg"
              />
              {onRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : uploading 
                ? 'border-gray-300' 
                : 'border-gray-200 hover:border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-6">
            {uploading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Upload a file</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: {acceptedTypes.join(', ')} (Max {maxSize}MB)
                  </p>
                </div>

                <div className="flex justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept={acceptedTypes.join(',')}
                      onChange={handleFileInput}
                      disabled={uploading}
                    />
                    <Button variant="outline" disabled={uploading}>
                      Choose File
                    </Button>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}