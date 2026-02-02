"use client";

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BannerItem, BannerItemType } from '../_hooks/use-banner-setting';

interface BannerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BannerItem | null;
}

export function BannerDetailDialog({ open, onOpenChange, item }: BannerDetailDialogProps) {
  const getIconForType = (type: BannerItemType) => {
    switch (type) {
      case 'image':
        return <span className="size-4">🖼️</span>;
      case 'youtube':
        return <span className="size-4">▶️</span>;
      case 'video':
        return <span className="size-4">🎬</span>;
      case 'gdrive':
        return <span className="size-4">💾</span>;
      case 'iframe':
        return <span className="size-4">🌐</span>;
    }
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderPreview = () => {
    if (!item) return null;

    const previewClass = "w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative";

    switch (item.type) {
      case 'image':
        return (
          <div className={previewClass}>
            <img src={item.url} alt="Preview" className="max-w-full max-h-full object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3EFailed to load%3C/text%3E%3C/svg%3E';
            }} />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Image</div>
          </div>
        );
      case 'youtube': {
        const videoId = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^/?&]+)/)?.[1];
        return (
          <div className={previewClass}>
            {videoId ? (
              <>
                <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="YouTube thumbnail" className="max-w-full max-h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-3 shadow-lg">
                    <span className="text-white text-2xl">▶️</span>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">YouTube</div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-4xl">▶️</span>
                <span className="text-sm text-muted-foreground block mt-2">Invalid YouTube URL</span>
              </div>
            )}
          </div>
        );
      }
      case 'video':
        return (
          <div className={previewClass}>
            <div className="text-center">
              <span className="text-4xl">🎬</span>
              <div className="text-sm font-medium mt-2">Video File</div>
              <div className="text-xs text-muted-foreground mt-1 truncate px-4">{item.url}</div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Video</div>
          </div>
        );
      case 'gdrive': {
        const fileId = item.url.match(/\/d\/([^/]+)/)?.[1] || item.url.match(/id=([^/&]+)/)?.[1];
        if (fileId) {
          const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          return (
            <div className={previewClass + " p-0 bg-background"}>
              <iframe
                src={previewUrl}
                title="Google Drive preview"
                className="w-full h-full border-0"
                allow="autoplay"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">GDrive</div>
            </div>
          );
        }
        return (
          <div className={previewClass}>
            <div className="text-center">
              <span className="text-4xl">💾</span>
              <div className="text-sm font-medium">Google Drive</div>
              <div className="text-xs text-muted-foreground mt-1">Invalid URL</div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">GDrive</div>
          </div>
        );
      }
      case 'iframe': {
        const hostname = item.url ? new URL(item.url).hostname.replace('www.', '') : 'HTML Content';
        return (
          <div className={previewClass}>
            <div className="text-center">
              <span className="text-4xl">🌐</span>
              <div className="text-sm font-medium truncate px-4 mt-2">{hostname}</div>
              <div className="text-xs text-muted-foreground mt-1">Embedded website</div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">HTML</div>
          </div>
        );
      }
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Banner Details</DialogTitle>
          <DialogDescription>Complete information about this banner</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          {renderPreview()}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="text-base">{item.title || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="flex items-center gap-2">
                {getIconForType(item.type)}
                <span className="capitalize">{item.type}</span>
              </div>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">URL</label>
            <p className="text-sm font-mono break-all bg-muted p-2 rounded mt-1">{item.url}</p>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{item.description}</p>
            </div>
          )}

          <Separator />

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <p className="text-base">{formatDate(item.start_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <p className="text-base">{formatDate(item.end_date)}</p>
            </div>
          </div>

          {/* Duration */}
          {item.type !== 'youtube' && item.type !== 'video' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="text-base">{item.duration} seconds</p>
            </div>
          )}

          {/* Image Source */}
          {item.type === 'image' && item.imageSource && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Image Source</label>
              <p className="text-base capitalize">{item.imageSource}</p>
            </div>
          )}

          {/* Locations */}
          {item.locations && item.locations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Assigned Locations</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.locations.map((location) => (
                  <Badge key={location.id} variant="secondary">
                    {location.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <label className="font-medium">ID</label>
              <p>{item.id}</p>
            </div>
            <div>
              <label className="font-medium">Position</label>
              <p>{item.position ?? '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
