"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Youtube, Image as ImageIcon, Video, HardDrive, Globe, FileText, Play } from 'lucide-react';
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
        return <ImageIcon className="size-4" />;
      case 'youtube':
        return <Youtube className="size-4" />;
      case 'video':
        return <Video className="size-4" />;
      case 'gdrive':
        return <HardDrive className="size-4" />;
      case 'iframe':
        return <Globe className="size-4" />;
      case 'pdf':
        return <FileText className="size-4" />;
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
                    <Play className="text-white" fill="white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">YouTube</div>
              </>
            ) : (
              <div className="text-center">
                <Youtube className="size-12 mx-auto" />
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
              <Video className="size-12 mx-auto" />
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
              <HardDrive className="size-12 mx-auto" />
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
              <Globe className="size-12 mx-auto" />
              <div className="text-sm font-medium truncate px-4 mt-2">{hostname}</div>
              <div className="text-xs text-muted-foreground mt-1">Embedded website</div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">HTML</div>
          </div>
        );
      }
      /*
      case 'pdf': {
        // Check if it's a Google Drive URL and convert it to preview format
        const fileIdMatch = item.url.match(/\/d\/([^/]+)/);
        const idMatch = item.url.match(/id=([^/&]+)/);
        const fileId = fileIdMatch?.[1] || idMatch?.[1];

        let pdfUrl: string;
        if (fileId) {
          // Google Drive PDF - use preview URL
          pdfUrl = `https://drive.google.com/file/d/${fileId}/preview?embedded=true`;
        } else {
          // Direct PDF URL - use as is
          pdfUrl = item.url;
        }

        return (
          <div className={previewClass + " p-0 bg-background"}>
            <iframe
              src={pdfUrl}
              title="PDF preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">PDF</div>
          </div>
        );
      }
      */
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Detail Banner</DialogTitle>
          <DialogDescription>Informasi lengkap tentang banner ini</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          {renderPreview()}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Judul</label>
              <p className="text-base">{item.title || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipe</label>
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
              <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
              <p className="text-sm mt-1">{item.description}</p>
            </div>
          )}

          <Separator />

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Mulai</label>
              <p className="text-base">{formatDate(item.start_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Selesai</label>
              <p className="text-base">{formatDate(item.end_date)}</p>
            </div>
          </div>

          {/* Duration */}
          {item.type !== 'youtube' && item.type !== 'video' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Durasi</label>
              <p className="text-base">{item.duration} detik</p>
            </div>
          )}

          {/* Image Source */}
          {item.type === 'image' && item.imageSource && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sumber Gambar</label>
              <p className="text-base capitalize">{item.imageSource}</p>
            </div>
          )}

          {/* Locations */}
          {item.locations && item.locations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lokasi Terassign</label>
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
