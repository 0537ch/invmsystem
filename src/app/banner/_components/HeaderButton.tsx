"use client";

import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { BannerForm } from './BannerForm';
import { useBannerSetting } from '../_hooks/use-banner-setting';

export default function HeaderButton() {
  const {
    isAdding,
    isSaving,
    isSyncing,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
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
    editingItem,
    setEditingItem,
    editContentCategory,
    setEditContentCategory,
    editImageSource,
    setEditImageSource,
    handleAddItem,
    handleSaveEdit,
    handleSyncDisplays,
    isUploading,
    uploadedFilePath,
    handleUpload,
    pendingFile,
    setPendingFile,
    editPendingFile,
    setEditPendingFile,
    handleUploadPending,
    handleEditUploadPending,
    formatFileSize,
    clearPendingFile,
    clearEditPendingFile,
    eventEntries,
    setEventEntries,
    editEventEntries,
    setEditEventEntries,
  } = useBannerSetting();

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="size-3.5 mr-1.5" />
            <span className="hidden sm:inline">Tambah Konten</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-lg">
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
            isLoading={isAdding}
            onDataChange={setNewItem}
            onCategoryChange={setContentCategory}
            onImageSourceChange={setImageSource}
            onHtmlFileChange={setHtmlFile}
            onSubmit={handleAddItem}
            onCancel={() => setIsAddDialogOpen(false)}
            fileInputRef={fileInputRef}
            onUploadPending={setPendingFile}
            onUploadConfirmed={handleUploadPending}
            onClearPending={clearPendingFile}
            isUploading={isUploading}
            uploadedFilePath={uploadedFilePath}
            pendingFile={pendingFile}
            formatFileSize={formatFileSize}
            eventEntries={eventEntries}
            onEventEntriesChange={setEventEntries}
            onEventUpload={handleUpload}
          />
        </DialogContent>
      </Dialog>

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

      <Button size="sm" variant="outline" onClick={handleSyncDisplays} disabled={isSyncing}>
        {isSyncing ? (
          <Spinner className="mr-1.5" />
        ) : (
          <RefreshCw className="size-3.5 mr-1.5" />
        )}
        <span className="hidden sm:inline">Sync Display</span>
        <span className="sm:hidden">Sync</span>
      </Button>
    </div>
  );
}