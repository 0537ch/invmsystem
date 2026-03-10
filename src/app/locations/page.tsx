"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Play } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Location, Banner } from '@/lib/db';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface LocationWithBanners extends Location {
  banners: Banner[];
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationWithBanners[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationSlug, setNewLocationSlug] = useState('');

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations/with-banners');
      const data = await response.json();
      if (response.ok) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !newLocationSlug.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocationName,
          slug: newLocationSlug.toLowerCase().replace(/\s+/g, '-'),
        }),
      });

      if (response.ok) {
        await fetchLocations();
        setNewLocationName('');
        setNewLocationSlug('');
        setIsOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Gagal membuat lokasi');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      alert('Gagal membuat lokasi');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLocations();
      } else {
        alert('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (value: string) => {
    setNewLocationName(value);
    setNewLocationSlug(generateSlug(value));
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="font-semibold">Locations</h1>
          </div>
        </header>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Locations</h1>
              <p className="text-muted-foreground">Manage display locations</p>
            </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Buat lokasi tampilan baru. Slug akan digunakan dalam URL (contoh: /display/lobby)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  placeholder="Lobby"
                  value={newLocationName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  placeholder="lobby"
                  value={newLocationSlug}
                  onChange={(e) => setNewLocationSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ini akan digunakan dalam URL: /display/{newLocationSlug}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddLocation}>
                Tambah Lokasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg px-4">
          <p className="text-muted-foreground text-lg mb-2">Belum ada lokasi</p>
          <p className="text-muted-foreground text-sm">Klik "Tambah Lokasi" untuk membuat baru</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {locations.map((location) => (
              <div key={location.id} className="border rounded-lg p-4 space-y-3">
                {/* Header: Name + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{location.name}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{location.slug}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 flex-shrink-0"
                    onClick={() => handleDeleteLocation(location.id)}
                    title="Delete"
                    aria-label={`Delete location: ${location.name}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                {/* URL Link */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Display URL:</p>
                  <a
                    href={`/display/${location.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline break-all"
                  >
                    /display/{location.slug}
                  </a>
                </div>

                {/* Banners */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Banners ({location.banners?.length || 0}):
                  </p>
                  {location.banners && location.banners.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {location.banners.map((banner) => (
                        <div
                          key={banner.id}
                          className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                        >
                          <span>{banner.title || banner.type}</span>
                          <span className="text-muted-foreground">#{banner.id}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Tidak ada banner</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-md border overflow-x-auto">
            <table className="w-full min-w-[600px] caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-4 text-left align-middle font-medium">Nama</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Slug</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">URL</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Banner</th>
                  <th className="h-10 px-4 text-left align-middle font-medium w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {locations.map((location) => (
                  <tr key={location.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{location.name}</td>
                    <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{location.slug}</td>
                    <td className="p-4 align-middle">
                      <a
                        href={`/display/${location.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        /display/{location.slug}
                      </a>
                    </td>
                    <td className="p-4 align-middle">
                      {location.banners && location.banners.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {location.banners.map((banner) => (
                            <div key={banner.id} className="text-xs flex items-center gap-2">
                              <span className="font-medium">{banner.title || banner.type}</span>
                              <span className="text-muted-foreground">({banner.id})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Tidak ada banner</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 sm:size-9 min-h-[44px] min-w-[44px] sm:min-h-0"
                        onClick={() => handleDeleteLocation(location.id)}
                        title="Delete"
                        aria-label={`Delete location: ${location.name}`}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </SidebarInset>
  </SidebarProvider>
);
}
