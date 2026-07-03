import React, { useState, useCallback } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ImageUploadProps {
  maxImages?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
  className?: string;
}

interface UploadingImage {
  id: string;
  previewUrl: string;
  progress: 'uploading' | 'done' | 'error';
  cloudUrl?: string;
  errorMsg?: string;
}

export function ImageUpload({ maxImages = 5, value = [], onChange, className }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(value);
  const [uploading, setUploading] = useState<UploadingImage[]>([]);

  const uploadSingleFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/api/v1/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data.url;
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    const slotsAvailable = maxImages - images.length - uploading.length;
    const filesToUpload = newFiles.slice(0, Math.max(0, slotsAvailable));

    if (filesToUpload.length === 0) return;

    // Create uploading placeholders
    const newUploading: UploadingImage[] = filesToUpload.map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      previewUrl: URL.createObjectURL(file),
      progress: 'uploading' as const,
    }));

    setUploading((prev) => [...prev, ...newUploading]);

    // Upload each file
    const results = await Promise.allSettled(
      filesToUpload.map(async (file, i) => {
        const cloudUrl = await uploadSingleFile(file);
        // Mark as done
        setUploading((prev) =>
          prev.map((u) =>
            u.id === newUploading[i].id
              ? { ...u, progress: 'done' as const, cloudUrl }
              : u
          )
        );
        return { id: newUploading[i].id, cloudUrl };
      })
    );

    // Gather successful URLs
    const successUrls: string[] = [];
    const failedIds: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successUrls.push(result.value.cloudUrl);
      }
    }

    // Mark failed ones
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        failedIds.push(newUploading[i].id);
        setUploading((prev) =>
          prev.map((u) =>
            u.id === newUploading[i].id
              ? { ...u, progress: 'error' as const, errorMsg: 'Upload failed' }
              : u
          )
        );
      }
    });

    // Remove completed uploads from the uploading state
    setUploading((prev) => prev.filter((u) => failedIds.includes(u.id)));

    // Add successful URLs to images
    const updatedImages = [...images, ...successUrls].slice(0, maxImages);
    setImages(updatedImages);
    onChange?.(updatedImages);

    // Reset file input
    e.target.value = '';
  }, [images, uploading, maxImages, onChange, uploadSingleFile]);

  const handleRemove = useCallback((indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);
    onChange?.(updatedImages);
  }, [images, onChange]);

  const handleRemoveUploading = useCallback((id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const totalSlots = images.length + uploading.length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Already uploaded images */}
        {images.map((url, index) => (
          <div key={`img-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 group bg-muted">
            <img 
              src={url} 
              alt={`Upload preview ${index + 1}`} 
              className="object-cover w-full h-full"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Currently uploading images */}
        {uploading.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted flex items-center justify-center">
            <img 
              src={item.previewUrl} 
              alt="Uploading..." 
              className="object-cover w-full h-full opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              {item.progress === 'uploading' && (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <span className="text-xs text-white font-medium">Uploading...</span>
                </div>
              )}
              {item.progress === 'error' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-red-300 font-medium">Failed</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUploading(item.id)}
                    className="text-xs text-white underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Upload trigger */}
        {totalSlots < maxImages && (
          <label className="relative aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-background">
            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-medium text-center px-2">
              Upload Image
            </span>
            <input 
              type="file" 
              accept="image/*"
              multiple 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. PNG, JPG, JPEG up to 5MB each.
      </p>
    </div>
  );
}
