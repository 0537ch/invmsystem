import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Location } from '@/lib/db';

export type BannerItemType = 'image' | 'youtube' | 'video' | 'iframe' | 'gdrive' | 'pdf';
export type ImageSourceType = 'url' | 'gdrive' | 'upload';
export type ContentCategory = 'image' | 'youtube' | 'video' | 'html' | 'pdf';

export interface BannerItem {
  id: number;
  type: BannerItemType;
  url: string;
  duration: number;
  title?: string;
  description?: string;
  active?: boolean;
  imageSource?: ImageSourceType;
  position?: number;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  locations?: Location[];
  location_ids?: number[];
}

export function useBannerSetting() {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [isUpdatingPosition, setIsUpdatingPosition] = useState<number | null>(null);
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
    description: '',
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editContentCategory, setEditContentCategory] = useState<ContentCategory>('image');
  const [editImageSource, setEditImageSource] = useState<ImageSourceType>('url');
  const [editingItem, setEditingItem] = useState<Partial<BannerItem>>({
    type: 'image',
    url: '',
    duration: 10,
    title: '',
    description: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

    if (contentCategory === 'youtube') {
      itemType = 'youtube';
    } else if (contentCategory === 'video') {
      itemType = 'video';
    } else if (contentCategory === 'html') {
      itemType = 'iframe';
      if (htmlFile) {
        alert('HTML file upload not implemented yet. Please use URL.');
        return;
      }
    } else {
      if (imageSource === 'gdrive') {
        itemType = 'gdrive';
      } else if (imageSource === 'upload') {
        itemType = 'image';
        alert('Image upload not implemented yet. Please use URL.');
        return;
      } else {
        itemType = 'image';
      }
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          url: finalUrl,
          duration: (contentCategory === 'youtube' || contentCategory === 'video') ? 0 : (newItem.duration || 10),
          title: newItem.title || `${contentCategory}${contentCategory === 'image' && imageSource ? ` (${imageSource})` : ''}` || null,
          description: newItem.description || null,
          image_source: contentCategory === 'image' ? imageSource : null,
          start_date: newItem.start_date || null,
          end_date: newItem.end_date || null,
          location_ids: newItem.location_ids || []
        }),
      });

      if (response.ok) {
        await fetchBanners();
        setNewItem({ type: 'image', url: '', duration: 10, title: '', description: '' });
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
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    setIsDeleting(id);
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
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditItem = (index: number) => {
    const item = bannerItems[index];
    setEditingIndex(index);
    setEditingItem(item);
    setEditHtmlFile(null);

    if (item.type === 'youtube') {
      setEditContentCategory('youtube');
    } else if (item.type === 'video') {
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

    if (editContentCategory === 'youtube') {
      itemType = 'youtube';
    } else if (editContentCategory === 'video') {
      itemType = 'video';
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
    const currentPosition = editingIndex!;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          url: finalUrl,
          duration: (editContentCategory === 'youtube' || editContentCategory === 'video') ? 0 : (editingItem.duration || 10),
          title: editingItem.title || `${editContentCategory}${editContentCategory === 'image' && editImageSource ? ` (${editImageSource})` : ''}` || null,
          description: editingItem.description || null,
          image_source: editContentCategory === 'image' ? editImageSource : null,
          position: currentPosition,
          start_date: editingItem.start_date || null,
          end_date: editingItem.end_date || null,
          location_ids: editingItem.location_ids
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
    } finally {
      setIsSaving(false);
    }
  };

  const handlePositionChange = async (item: BannerItem, newPosition: number) => {
    const currentIndex = bannerItems.findIndex(b => b.id === item.id);
    const targetPosition = newPosition - 1;

    if (targetPosition < 0 || targetPosition >= bannerItems.length) {
      alert(`Posisi harus antara 1 dan ${bannerItems.length}`);
      return;
    }

    if (currentIndex === targetPosition) return;

    setIsUpdatingPosition(item.id);
    try {
      const response = await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          position: targetPosition,
        }),
      });

      if (response.ok) {
        await fetchBanners();
      } else {
        alert('Failed to update position');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      alert('Failed to update position');
    } finally {
      setIsUpdatingPosition(null);
    }
  };

  const handleToggleActive = async (item: BannerItem) => {
    setIsToggling(item.id);
    try {
      const response = await fetch(`/api/banner/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          active: !item.active,
        }),
      });

      if (response.ok) {
        await fetchBanners();
      } else {
        alert('Failed to update active status');
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update active status');
    } finally {
      setIsToggling(null);
    }
  };

  const handleSyncDisplays = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/banner/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Displays synced successfully!', {
        style: {
          '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
          '--normal-text': 'var(--color-white)',
          '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
        } as React.CSSProperties
      });
      } else if (response.status === 429) {
        toast.error(data.message || 'Please wait before syncing again');
      } else {
        toast.error('Failed to sync displays');
      }
    } catch (error) {
      console.error('Error syncing displays:', error);
      toast.error('Failed to sync displays');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    bannerItems,
    loading,
    isAdding,
    isSaving,
    isDeleting,
    isSyncing,
    isToggling,
    isUpdatingPosition,
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
    editingIndex,
    setEditingIndex,
    fetchBanners,
    handleAddItem,
    handleDeleteItem,
    handleEditItem,
    handleSaveEdit,
    handlePositionChange,
    handleToggleActive,
    handleSyncDisplays,
  };
}
