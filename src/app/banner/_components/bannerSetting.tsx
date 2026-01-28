"use client";

import { useState, useEffect, useRef } from 'react';
import { BannerForm } from './BannerForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, MoveUp, MoveDown, Youtube, Globe, Image as ImageIcon, HardDrive, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type BannerItemType = 'image' | 'youtube' | 'iframe' | 'gdrive';
export type ImageSourceType = 'url' | 'gdrive' | 'upload';
export type ContentCategory = 'image' | 'video' | 'html';

export interface BannerItem {
  id: number;
  type: BannerItemType;
  url: string;
  duration: number;
  title?: string;
  imageSource?: ImageSourceType;
  position?:number;
}

const BannerSetting = () => {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [contentCategory, setContentCategory] = useState<ContentCategory>('image');
  const [imageSource, setImageSource] = useState<ImageSourceType>('url');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [editHtmlFile, setEditHtmlFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState<Partial<BannerItem>>({
    type: 'image',
    url: '',
    duration: 10,
    title: '',
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editContentCategory, setEditContentCategory] = useState<ContentCategory>('image');
  const [editImageSource, setEditImageSource] = useState<ImageSourceType>('url');
  const [editingItem, setEditingItem] = useState<Partial<BannerItem>>({
    type: 'image',
    url: '',
    duration: 10,
    title: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Fetch banners from API
  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      if (response.ok) {
        setBannerItems(data.banners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAddItem = async () => {
    if (contentCategory === 'html' && !htmlFile && !newItem.url) {
      alert('Silakan pilih file HTML atau masukkan URL');
      return;
    }

    if (contentCategory !== 'html' && !newItem.url) {
      alert('Silakan masukkan URL');
      return;
    }

    let itemType: BannerItemType;
    const finalUrl = newItem.url!;

    if (contentCategory === 'video') {
      itemType = 'youtube';
    } else if (contentCategory === 'html') {
      itemType = 'iframe';
      if (htmlFile) {
        // For HTML files, we'd need to upload them first
        // For now, we'll skip this or you could convert to base64
        alert('HTML file upload not implemented yet. Please use URL.');
        return;
      }
    } else {
      if (imageSource === 'gdrive') {
        itemType = 'gdrive';
      } else if (imageSource === 'upload') {
        itemType = 'image';
        // Image upload would need to be implemented
        alert('Image upload not implemented yet. Please use URL.');
        return;
      } else {
        itemType = 'image';
      }
    }

    try {
      const response = await fetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          url: finalUrl,
          duration: contentCategory === 'video' ? 0 : (newItem.duration || 10),
          title: newItem.title || `${contentCategory}${contentCategory === 'image' && imageSource ? ` (${imageSource})` : ''}` || null,
          image_source: contentCategory === 'image' ? imageSource : null,
        }),
      });

      if (response.ok) {
        await fetchBanners();
        setNewItem({ type: 'image', url: '', duration: 10, title: '' });
        setContentCategory('image');
        setImageSource('url');
        setHtmlFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating banner:', error);
      alert('Failed to create banner');
    }
  };

  const handleDeleteItem = async (id: number) => {
    console.log('Deleting banner with ID:', id, 'Type:', typeof id);
    try {
      const response = await fetch(`/api/banner/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBanners();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        alert(errorData.error || 'Failed to delete banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const item = bannerItems[index];

    try {
      await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          position: index - 1,
        }),
      });
      await fetchBanners();
    } catch (error) {
      console.error('Error moving banner:', error);
      alert('Failed to move banner');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === bannerItems.length - 1) return;
    const item = bannerItems[index];

    try {
      await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          position: index + 1,
        }),
      });
      await fetchBanners();
    } catch (error) {
      console.error('Error moving banner:', error);
      alert('Failed to move banner');
    }
  };

  const handleEditItem = (index: number) => {
    const item = bannerItems[index];
    setEditingIndex(index);
    setEditingItem(item);
    setEditHtmlFile(null);

    if (item.type === 'youtube') {
      setEditContentCategory('video');
    } else if (item.type === 'iframe') {
      setEditContentCategory('html');
    } else {
      setEditContentCategory('image');
      if (item.type === 'gdrive') {
        setEditImageSource('gdrive');
      } else if (item.imageSource === 'upload') {
        setEditImageSource('upload');
      } else {
        setEditImageSource('url');
      }
    }

    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editContentCategory === 'html' && !editHtmlFile && !editingItem.url) {
      alert('Silakan pilih file HTML atau masukkan URL');
      return;
    }

    if (editContentCategory !== 'html' && !editingItem.url) {
      alert('Silakan masukkan URL');
      return;
    }

    let itemType: BannerItemType;
    const finalUrl = editingItem.url!;

    if (editContentCategory === 'video') {
      itemType = 'youtube';
    } else if (editContentCategory === 'html') {
      itemType = 'iframe';
      if (editHtmlFile) {
        alert('HTML file upload not implemented yet. Please use URL.');
        return;
      }
    } else {
      if (editImageSource === 'gdrive') {
        itemType = 'gdrive';
      } else if (editImageSource === 'upload') {
        itemType = 'image';
        alert('Image upload not implemented yet. Please use URL.');
        return;
      } else {
        itemType = 'image';
      }
    }

    const item = bannerItems[editingIndex!];

    try {
      const response = await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          url: finalUrl,
          duration: editContentCategory === 'video' ? 0 : (editingItem.duration || 10),
          title: editingItem.title || `${editContentCategory}${editContentCategory === 'image' && editImageSource ? ` (${editImageSource})` : ''}` || null,
          image_source: editContentCategory === 'image' ? editImageSource : null,
          position: item.position, // Keep same position
        }),
      });

      if (response.ok) {
        await fetchBanners();
        setIsEditDialogOpen(false);
        setEditingIndex(null);
        setEditHtmlFile(null);
        if (editFileInputRef.current) {
          editFileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      alert('Failed to update banner');
    }
  };

  const getIconForType = (type: BannerItemType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="size-4" />;
      case 'youtube':
        return <Youtube className="size-4" />;
      case 'gdrive':
        return <HardDrive className="size-4" />;
      case 'iframe':
        return <Globe className="size-4" />;
    }
  };

  const renderPreview = (item: BannerItem) => {
    const previewClass = "w-full h-40 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative";

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
                    <Youtube className="size-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">YouTube</div>
              </>
            ) : (
              <div className="text-center">
                <Youtube className="size-8 text-muted-foreground mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">Invalid YouTube URL</span>
              </div>
            )}
          </div>
        );
      }
      case 'gdrive': {
        const fileId = item.url.match(/\/d\/([^/]+)/)?.[1] || item.url.match(/id=([^/&]+)/)?.[1];
        if (fileId) {
          const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          return (
            <div className={previewClass + " p-0 bg-background"}>
              <iframe
                key={`gdrive-${item.id}`}
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
              <HardDrive className="size-12 text-blue-500 mx-auto mb-2" />
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
              <Globe className="size-12 text-green-500 mx-auto mb-2" />
              <div className="text-sm font-medium truncate px-4">{hostname}</div>
              <div className="text-xs text-muted-foreground mt-1">Embedded website</div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">HTML</div>
          </div>
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 h-full overflow-y-auto">
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Loading banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold">Banner Setting</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Tambah Konten
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Konten Banner</DialogTitle>
              <DialogDescription>
                Tambah item baru ke rotasi tampilan banner
              </DialogDescription>
            </DialogHeader>
            <BannerForm
              mode="add"
              data={newItem}
              category={contentCategory}
              imageSource={imageSource}
              htmlFile={htmlFile}
              onDataChange={setNewItem}
              onCategoryChange={setContentCategory}
              onImageSourceChange={setImageSource}
              onHtmlFileChange={setHtmlFile}
              onSubmit={handleAddItem}
              onCancel={() => setIsAddDialogOpen(false)}
              fileInputRef={fileInputRef}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Konten Banner</DialogTitle>
              <DialogDescription>
                Edit item banner yang dipilih
              </DialogDescription>
            </DialogHeader>
            <BannerForm
              mode="edit"
              data={editingItem}
              category={editContentCategory}
              imageSource={editImageSource}
              htmlFile={editHtmlFile}
              onDataChange={setEditingItem}
              onCategoryChange={setEditContentCategory}
              onImageSourceChange={setEditImageSource}
              onHtmlFileChange={setEditHtmlFile}
              onSubmit={handleSaveEdit}
              onCancel={() => setIsEditDialogOpen(false)}
              fileInputRef={editFileInputRef}
            />
          </DialogContent>
        </Dialog>
      </div>

      {bannerItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground text-lg mb-2">Belum ada item banner</p>
          <p className="text-muted-foreground text-sm">Klik Tambah Konten untuk memulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bannerItems.map((item, index) => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
              {/* Preview Area */}
              <div className="relative">
                {renderPreview(item)}
                {/* Position Badge */}
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  #{index + 1}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getIconForType(item.type)}
                    <h3 className="font-semibold truncate">{item.title || item.type}</h3>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-mono truncate" title={item.url}>
                  {item.url}
                </p>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {item.type !== 'youtube' && (
                      <Badge variant="outline" className="text-xs">
                        {item.duration}s
                      </Badge>
                    )}
                    {item.imageSource && (
                      <Badge variant="outline" className="text-xs">
                        {item.imageSource}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <MoveUp className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === bannerItems.length - 1}
                    >
                      <MoveDown className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => handleEditItem(index)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSetting;
