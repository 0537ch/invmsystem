import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';
import type { BannerItem, ContentCategory, ImageSourceType } from '../_hooks/use-banner-setting';
import { DatePickerWithRange } from './datepicker';
import { type DateRange } from 'react-day-picker';
import { useEffect, useState, useRef } from 'react';
import type { Location } from '@/lib/db';

interface BannerFormProps {
  mode: 'add' | 'edit';
  data: Partial<BannerItem>;
  category: ContentCategory;
  imageSource: ImageSourceType;
  htmlFile: File | null;
  onDataChange: (data: Partial<BannerItem>) => void;
  onCategoryChange: (category: ContentCategory) => void;
  onImageSourceChange: (source: ImageSourceType) => void;
  onHtmlFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const BannerForm: React.FC<BannerFormProps> = ({
  mode,
  data,
  category,
  imageSource,
  htmlFile,
  onDataChange,
  onCategoryChange,
  onImageSourceChange,
  onHtmlFileChange,
  onSubmit,
  onCancel,
  fileInputRef,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const result = await response.json();
        if (response.ok) {
          setLocations(result.locations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (data.locations) {
      setSelectedLocationIds(data.locations.map((loc: Location) => loc.id));
    } else {
      setSelectedLocationIds([]);
    }
  }, [data.locations]);

  const handleLocationToggle = (locationId: number) => {
    const newSelectedIds = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter((id) => id !== locationId)
      : [...selectedLocationIds, locationId];

    setSelectedLocationIds(newSelectedIds);
    onDataChange({ ...data, location_ids: newSelectedIds });
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const convertToDate = (date: typeof data.start_date): Date | undefined => {
      if (!date) return undefined;
      if (date instanceof Date) return date;
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    if (data.start_date || data.end_date) {
      return {
        from: convertToDate(data.start_date),
        to: convertToDate(data.end_date),
      };
    }
    return undefined;
  });

  const prevDataRef = useRef<{ start_date?: typeof data.start_date; end_date?: typeof data.end_date } | null>(null);

  useEffect(() => {
    const prev = prevDataRef.current;

    const hasChanged = !prev || prev.start_date !== data.start_date || prev.end_date !== data.end_date;

    if (hasChanged) {
      const convertToDate = (date: typeof data.start_date): Date | undefined => {
        if (!date) return undefined;
        if (date instanceof Date) return date;
        // Already a date string (ISO format like "2026-01-22T00:00:00.000Z" or "2026-01-22")
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      };

      setDateRange({
        from: convertToDate(data.start_date),
        to: convertToDate(data.end_date),
      });
    }

    prevDataRef.current = { start_date: data.start_date, end_date: data.end_date };
  }, [data.start_date, data.end_date]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    onDataChange({
      ...data,
      start_date: range?.from,
      end_date: range?.to,
    });
  };
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Judul (opsional)</Label>
        <Input
          placeholder="Item Banner Saya"
          value={data.title || ''}
          onChange={(e) => onDataChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Deskripsi (opsional)</Label>
        <textarea
          placeholder="Deskripsi singkat tentang banner ini..."
          value={data.description || ''}
          onChange={(e) => onDataChange({ ...data, description: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Main Category Selection */}
      <div className="space-y-2">
        <Label>Tipe Konten</Label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Gambar</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="video">Video File (MP4, WebM)</SelectItem>
            <SelectItem value="html">HTML / Website</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Source Selection */}
      {category === 'image' && (
        <div className="space-y-2">
          <Label>Sumber Gambar</Label>
          <Select
            value={imageSource}
            onValueChange={onImageSourceChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="gdrive">Google Drive</SelectItem>
              <SelectItem value="upload">Unggah File</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        {category === 'html' ? (
          <>
            <Label>File HTML atau URL Website</Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef?.current?.click()}
              >
                <Upload className="size-4 mr-2" />
                {htmlFile ? htmlFile.name : 'Pilih File HTML'}
              </Button>
              {fileInputRef && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onHtmlFileChange(file);
                      onDataChange({ ...data, url: '' });
                    }
                  }}
                />
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">atau</span>
                </div>
              </div>
              <Input
                placeholder="https://example.com"
                value={data.url || ''}
                onChange={(e) => {
                  onDataChange({ ...data, url: e.target.value });
                  if (e.target.value) {
                    onHtmlFileChange(null);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload file HTML lokal atau tempel URL website untuk di-embed
                {htmlFile && <span className="text-amber-600 block mt-1">⚠️ File upload tidak akan tersimpan setelah refresh halaman</span>}
              </p>
            </div>
          </>
        ) : (
          <>
            <Label>
              {category === 'youtube' ? 'URL YouTube' :
               category === 'video' ? 'URL Video File' :
               imageSource === 'gdrive' ? 'URL Google Drive' :
               imageSource === 'upload' ? 'File (Segera Hadir)' : 'URL Gambar'}
            </Label>
            {category === 'image' && imageSource === 'upload' ? (
              <Button variant="outline" className="w-full" disabled>
                <Upload className="size-4 mr-2" />
                Pilih File (Segera Hadir)
              </Button>
            ) : (
              <Input
                placeholder={
                  category === 'youtube' ? 'https://youtube.com/watch?v=...' :
                  category === 'video' ? 'https://example.com/video.mp4' :
                  imageSource === 'gdrive' ? 'https://drive.google.com/file/d/.../view' :
                  'https://example.com/image.jpg'
                }
                value={data.url || ''}
                onChange={(e) => onDataChange({ ...data, url: e.target.value })}
                disabled={category === 'image' && imageSource === 'upload'}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {category === 'youtube' ? 'Tempel URL video YouTube' :
               category === 'video' ? 'Tempel URL file video (MP4, WebM, dll)' :
               imageSource === 'gdrive' ? 'Tempel tautan berbagi Google Drive' :
               imageSource === 'upload' ? 'Fitur upload file segera hadir' :
               'Tempel URL gambar langsung'}
            </p>
          </>
        )}
      </div>

      {/* Duration for images and html only */}
      {category !== 'youtube' && category !== 'video' && (
        <div className="space-y-2">
          <Label>Durasi (detik)</Label>
          <Input
            type="number"
            min="1"
            value={data.duration === 0 ? '' : (data.duration ?? '')}
            onChange={(e) => {
              const value = e.target.value;
              onDataChange({ ...data, duration: value === '' ? 0 : parseInt(value) });
            }}
          />
          <p className="text-xs text-muted-foreground">Berapa lama konten ditampilkan</p>
        </div>
      )}

      <DatePickerWithRange
        value={dateRange}
        onChange={handleDateChange}
        label="Schedule (optional)"
      />

      {locations.length > 0 && (
        <div className="space-y-2">
          <Label>Lokasi Display</Label>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${location.id}`}
                  checked={selectedLocationIds.includes(location.id)}
                  onCheckedChange={() => handleLocationToggle(location.id)}
                />
                <Label
                  htmlFor={`location-${location.id}`}
                  className="font-normal cursor-pointer"
                >
                  {location.name}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Pilih lokasi untuk menampilkan banner ini
          </p>
        </div>
      )}

      {/* Dialog Footer */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={onSubmit}>
          {mode === 'add' ? 'Tambah Item' : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  );
};
