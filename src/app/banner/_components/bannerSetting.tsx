"use client";

import { Youtube, Globe, Image as ImageIcon, HardDrive, Trash2, Pencil, Plus, Video, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { BannerForm } from './BannerForm';
import { useBannerSetting, type BannerItem, type BannerItemType } from '../_hooks/use-banner-setting';

const BannerSetting = () => {
  const {
    bannerItems,
    loading,
    isAddDialogOpen,
    setIsAddDialogOpen,
    contentCategory,
    setContentCategory,
    imageSource,
    setImageSource,
    htmlFile,
    setHtmlFile,
    editHtmlFile,
    setEditHtmlFile,
    fileInputRef,
    editFileInputRef,
    newItem,
    setNewItem,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editContentCategory,
    setEditContentCategory,
    editImageSource,
    setEditImageSource,
    editingItem,
    setEditingItem,
    handleAddItem,
    handleDeleteItem,
    handleEditItem,
    handleSaveEdit,
    handlePositionChange,
    handleToggleActive,
    handleSyncDisplays,
  } = useBannerSetting();

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
      case 'video':
        return (
          <div className={previewClass}>
            <div className="text-center">
              <Video className="size-12 text-purple-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Video File</div>
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
    <div className="container mx-auto p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Banner Setting</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Tambah Konten
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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

        <Button onClick={handleSyncDisplays} variant="outline">
          <RefreshCw className="size-4 mr-2" />
          Sync Display
        </Button>
      </div>
      </div>

      {bannerItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground text-lg mb-2">Belum ada item banner</p>
          <p className="text-muted-foreground text-sm">Klik Tambah Konten untuk memulai</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-2 text-left align-middle font-medium w-20">Posisi ↕</th>
                <th className="h-10 px-2 text-left align-middle font-medium w-32">Preview</th>
                <th className="h-10 px-2 text-left align-middle font-medium">Judul</th>
                <th className="h-10 px-2 text-left align-middle font-medium w-24">Tipe</th>
                <th className="h-10 px-2 text-left align-middle font-medium">URL</th>
                <th className="h-10 px-2 text-left align-middle font-medium w-20">Durasi</th>
                <th className="h-10 px-2 text-left align-middle font-medium w-24">Aktif</th>
                <th className="h-10 px-2 text-left align-middle font-medium w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {bannerItems.map((item, index) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {/* Position */}
                  <td className="p-2 align-middle">
                    <Input
                      key={`${item.id}-${index}`}
                      type="number"
                      min={1}
                      max={bannerItems.length}
                      defaultValue={index + 1}
                      className="w-16 h-8 text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const newPosition = parseInt(input.value);
                          if (!isNaN(newPosition)) {
                            handlePositionChange(item, newPosition);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const newPosition = parseInt(e.target.value);
                        if (!isNaN(newPosition) && newPosition !== index + 1) {
                          handlePositionChange(item, newPosition);
                        } else {
                          e.target.value = String(index + 1);
                        }
                      }}
                    />
                  </td>

                  {/* Preview */}
                  <td className="p-2 align-middle">
                    <div className="w-32 h-20 rounded border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative">
                      {item.type === 'image' ? (
                        <img src={item.url} alt="Preview" className="max-w-full max-h-full object-contain" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }} />
                      ) : item.type === 'youtube' ? (
                        <div className="text-center">
                          {getIconForType(item.type)}
                        </div>
                      ) : (
                        <div className="text-center">
                          {getIconForType(item.type)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title || item.type}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-1">
                      {getIconForType(item.type)}
                      <span className="text-xs capitalize">{item.type}</span>
                    </div>
                  </td>

                  {/* URL */}
                  <td className="p-2 align-middle">
                    <div className="font-mono text-xs text-muted-foreground truncate max-w-md" title={item.url}>
                      {item.url}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="p-2 align-middle">
                    {item.type !== 'youtube' && item.type !== 'video' ? (
                      <span className="text-xs">{item.duration}s</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Active */}
                  <td className="p-2 align-middle">
                    <Switch
                      checked={item.active !== false}
                      onCheckedChange={() => handleToggleActive(item)}
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => handleEditItem(index)}
                        title="Edit"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BannerSetting;
