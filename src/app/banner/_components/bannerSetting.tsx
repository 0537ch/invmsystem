"use client";

import { Youtube, Globe, Image as ImageIcon, HardDrive, Trash2, Pencil, Video, Eye, Calendar, Search, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BannerForm } from './BannerForm';
import { BannerDetailDialog } from './BannerDetailDialog';
import { useBannerSetting } from '../_hooks/use-banner-setting';
import type { BannerItem, BannerItemType } from '@/types';
import { useState } from 'react';

const BannerSetting = () => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BannerItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    bannerItems,
    loading,
    isSaving,
    isDeleting,
    isToggling,
    isUpdatingPosition,
    editHtmlFile,
    setEditHtmlFile,
    editFileInputRef,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editContentCategory,
    setEditContentCategory,
    editImageSource,
    setEditImageSource,
    editingItem,
    setEditingItem,
    handleDeleteItem,
    handleEditItem,
    handleSaveEdit,
    handlePositionChange,
    handleToggleActive,
    isUploading,
    uploadedFilePath,
    handleUpload,
    editPendingFile,
    setEditPendingFile,
    handleEditUploadPending,
    formatFileSize,
    clearEditPendingFile,
    editEventEntries,
    setEditEventEntries,
    searchQuery,
    setSearchQuery,
    filterLocation,
    setFilterLocation,
    filterStatus,
    setFilterStatus,
    locations,
    filteredBannerItems,
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
      case 'event':
        return <Calendar className="size-4" />;
      // case 'pdf':
      //   return <FileText className="size-4" />;
    }
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusInfo = (status: string | undefined) => {
    switch (status) {
      case 'live':
        return { label: 'Live', variant: 'emerald' as const };
      case 'scheduled':
        return { label: 'Scheduled', variant: 'blue' as const };
      case 'expired':
        return { label: 'Expired', variant: 'destructive' as const };
      case 'inactive':
      default:
        return { label: 'Inactive', variant: 'outline' as const };
    }
  };

  const handleViewDetails = (item: BannerItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 h-full overflow-y-auto">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-lg">
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
              isLoading={isSaving}
              onDataChange={setEditingItem}
              onCategoryChange={setEditContentCategory}
              onImageSourceChange={setEditImageSource}
              onHtmlFileChange={setEditHtmlFile}
              onSubmit={handleSaveEdit}
              onCancel={() => setIsEditDialogOpen(false)}
              fileInputRef={editFileInputRef}
              onUploadPending={setEditPendingFile}
              onUploadConfirmed={handleEditUploadPending}
              onClearPending={clearEditPendingFile}
              isUploading={isUploading}
              uploadedFilePath={uploadedFilePath}
              pendingFile={editPendingFile}
              formatFileSize={formatFileSize}
              eventEntries={editEventEntries}
              onEventEntriesChange={setEditEventEntries}
              onEventUpload={handleUpload}
            />
          </DialogContent>
        </Dialog>

        </div>

        

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center border-b pb-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau tipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Location Filter */}
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Semua Lokasi</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Result count */}
        <span className="text-sm text-muted-foreground">
          {filteredBannerItems.length} dari {bannerItems.length}
        </span>
      </div>

      {filteredBannerItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg px-4">
          <p className="text-muted-foreground text-lg mb-2">Tidak ada banner yang cocok</p>
          <p className="text-muted-foreground text-sm">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="rounded-xl border border-slate-200/60 bg-card text-card-foreground shadow-md flex-1 min-h-0 overflow-y-auto">
            <table className="w-full caption-bottom text-sm whitespace-nowrap">
              <thead className="bg-slate-100/100 border-b border-slate-200/80 sticky top-0 z-10">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Posisi</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Preview</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Judul</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Durasi</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tanggal Tayang</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aktif</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBannerItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200/80 transition-colors hover:bg-slate-50/80 hover:border-l-2 hover:border-l-slate-400">
                    {/* Position */}
                    <td className="p-4 align-middle">
                      <div className="relative">
                        <Input
                          key={`${item.id}-${index}`}
                          type="number"
                          min={1}
                          max={bannerItems.length}
                          defaultValue={index + 1}
                          className="w-16 h-8 text-center border-muted-foreground/20"
                          disabled={isUpdatingPosition === item.id}
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
                        {isUpdatingPosition === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Spinner className="size-3" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Preview */}
                    <td className="p-4 align-middle">
                      <div className="w-32 h-20 rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center overflow-hidden">
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Preview" className="max-w-full max-h-full object-contain" onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }} />
                        ) : item.type === 'youtube' ? (
                          <div className="text-center text-muted-foreground">
                            {getIconForType(item.type)}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            {getIconForType(item.type)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusInfo(item.status).variant}>{getStatusInfo(item.status).label}</Badge>
                        <span className="font-medium">{item.title || item.type}</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="p-4 align-middle">
                      {item.type !== 'youtube' && item.type !== 'video' ? (
                        <span className="text-sm text-muted-foreground">{item.duration}s</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Tanggal Tayang */}
                    <td className="p-4 align-middle">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(item.start_date)} - {formatDate(item.end_date)}
                      </span>
                    </td>

                    {/* Active */}
                    <td className="p-4 align-middle">
                      <Switch
                        checked={item.active !== false}
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={isToggling === item.id}
                      />
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:bg-slate-100/50"
                          onClick={() => handleViewDetails(item)}
                          title="View Details"
                          aria-label={`View details for ${item.title || item.type}`}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:bg-slate-100/50"
                          onClick={() => handleEditItem(bannerItems.findIndex(b => b.id === item.id))}
                          title="Edit"
                          aria-label={`Edit ${item.title || item.type}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:bg-slate-100/50"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isDeleting === item.id}
                          title="Delete"
                          aria-label={`Delete ${item.title || item.type}`}
                        >
                          {isDeleting === item.id ? (
                            <Spinner className="size-4 text-destructive" />
                          ) : (
                            <Trash2 className="size-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <BannerDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        item={selectedItem}
      />
    </div>
  );
};

export default BannerSetting;
