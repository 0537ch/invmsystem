import { useState, useEffect, useRef } from 'react';

export type BannerItemType = 'image' | 'youtube' | 'video' | 'iframe' | 'gdrive';
export type ImageSourceType = 'url' | 'gdrive' | 'upload';
export type ContentCategory = 'image' | 'youtube' | 'video' | 'html';

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
}

export function useBannerSetting() {
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
    // Use the current array index as the position, not item.position
    // This ensures the position matches the visual order
    const currentPosition = editingIndex!;

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

  const handlePositionChange = async (item: BannerItem, newPosition: number) => {
    // Find the current array index (visual position)
    const currentIndex = bannerItems.findIndex(b => b.id === item.id);
    const targetPosition = newPosition - 1; // Convert to 0-based index

    if (targetPosition < 0 || targetPosition >= bannerItems.length) {
      alert(`Posisi harus antara 1 dan ${bannerItems.length}`);
      return;
    }

    if (currentIndex === targetPosition) return; // No change needed

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
    }
  };

  const handleToggleActive = async (item: BannerItem) => {
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
    }
  };

  const handleSyncDisplays = async () => {
    try {
      const response = await fetch('/api/banner/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Displays synced successfully!');
      } else {
        alert('Failed to sync displays');
      }
    } catch (error) {
      console.error('Error syncing displays:', error);
      alert('Failed to sync displays');
    }
  };

  return {
    // State
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
    editingIndex,
    setEditingIndex,
    // Actions
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
