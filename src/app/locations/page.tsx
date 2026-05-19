"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
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
import type { Location, Banner } from '@/types';
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/60 bg-slate-50/40 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">Manajemen Lokasi</h1>
          </div>
        </header>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60">
            <div>
              <h1 className="text-2xl font-bold">Lokasi</h1>
              <p className="text-sm text-muted-foreground">Kelola lokasi tampilan</p>
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
          <p className="text-muted-foreground text-sm">Klik Tambah Lokasi untuk membuat baru</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border border-slate-200/60 bg-card text-card-foreground shadow-md overflow-hidden">
            <table className="w-full min-w-[600px] caption-bottom text-sm whitespace-nowrap">
              <thead className="bg-slate-100/70 border-b border-slate-200/80">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nama</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Slug</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">URL</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground">Banner</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.id} className="border-b border-slate-200/80 transition-colors hover:bg-slate-50/80 hover:border-l-2 hover:border-l-slate-400">
                    <td className="p-4 align-middle font-medium">{location.name}</td>
                    <td className="p-4 align-middle font-mono text-sm text-muted-foreground">{location.slug}</td>
                    <td className="p-4 align-middle">
                      <a
                        href={`/display/${location.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        /display/{location.slug}
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td className="p-4 align-middle">
                      {location.banners && location.banners.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {location.banners.map((banner) => (
                            <div key={banner.id} className="text-sm flex items-center gap-2">
                              <span className="font-medium">{banner.title || banner.type}</span>
                              <span className="text-muted-foreground">#{banner.id}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Tidak ada banner</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:bg-slate-100/50"
                        onClick={() => handleDeleteLocation(location.id)}
                        title="Delete"
                        aria-label={`Delete location: ${location.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
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
