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
import { Upload, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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
  isLoading?: boolean;
  onDataChange: (data: Partial<BannerItem>) => void;
  onCategoryChange: (category: ContentCategory) => void;
  onImageSourceChange: (source: ImageSourceType) => void;
  onHtmlFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onUpload?: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadedFilePath?: string | null;
}

export function BannerForm({
  mode,
  data,
  category,
  imageSource,
  htmlFile,
  isLoading,
  onDataChange,
  onCategoryChange,
  onImageSourceChange,
  onHtmlFileChange,
  onSubmit,
  onCancel,
  fileInputRef,
  onUpload,
  isUploading = false,
  uploadedFilePath = null,
}: BannerFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [inputSource, setInputSource] = useState<'upload' | 'url'>(() =>
    data.url?.startsWith('/uploads/') ? 'upload' : 'url'
  );

  const handleSourceChange = (newSource: 'upload' | 'url') => {
    setInputSource(newSource);
    onDataChange({ ...data, url: '' });
  };

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

  const selectedLocationIds = data.locations
    ? data.locations.map((loc: Location) => loc.id)
    : (data.location_ids as number[]) || [];

  const handleLocationToggle = (locationId: number) => {
    const newSelectedIds = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter((id) => id !== locationId)
      : [...selectedLocationIds, locationId];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { locations, ...restData } = data;
    onDataChange({ ...restData, location_ids: newSelectedIds });
  };

  const convertToDate = (date: typeof data.start_date): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const dateRange: DateRange | undefined = (data.start_date || data.end_date)
    ? {
        from: convertToDate(data.start_date),
        to: convertToDate(data.end_date),
      }
    : undefined;

  const handleDateChange = (range: DateRange | undefined) => {
    onDataChange({
      ...data,
      start_date: range?.from,
      end_date: range?.to,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onUpload) return;

    const filePath = await onUpload(file);
    if (filePath) {
      onDataChange({ ...data, url: filePath });
    }

    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="banner-title">Judul (opsional)</Label>
        <Input
          id="banner-title"
          placeholder="Item Banner Saya"
          value={data.title || ''}
          onChange={(e) => onDataChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-description" className="text-sm sm:text-base">Deskripsi (opsional)</Label>
        <textarea
          id="banner-description"
          placeholder="Deskripsi singkat tentang banner ini..."
          value={data.description || ''}
          onChange={(e) => onDataChange({ ...data, description: e.target.value })}
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-type" className="text-sm sm:text-base">Tipe Konten</Label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger id="banner-type">
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

      <div className="space-y-2">
        {category === 'html' ? (
          <>
            <Label htmlFor="html-url">File HTML atau URL Website</Label>
            <div className="space-y-2">
              <Button
                type="button"
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
                id="html-url"
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
                {htmlFile && (
                  <span className="text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="size-3" />
                    File upload tidak akan tersimpan setelah refresh halaman
                  </span>
                )}
              </p>
            </div>
          </>
        ) : category === 'image' ? (
          <>
            <Label htmlFor="image-url">Sumber Gambar</Label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="image-source"
                  checked={inputSource === 'url'}
                  onChange={() => handleSourceChange('url')}
                  className="cursor-pointer"
                />
                <span className="text-sm">URL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="image-source"
                  checked={inputSource === 'upload'}
                  onChange={() => handleSourceChange('upload')}
                  className="cursor-pointer"
                />
                <span className="text-sm">Upload File</span>
              </label>
            </div>
            {inputSource === 'url' ? (
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={data.url?.startsWith('/uploads/') ? '' : (data.url || '')}
                onChange={(e) => onDataChange({ ...data, url: e.target.value })}
              />
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="size-4 mr-2" />
                  {isUploading ? 'Mengunggah...' : 'Pilih File Gambar'}
                </Button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploadedFilePath && data.url === uploadedFilePath && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {uploadedFilePath}
                  </p>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {inputSource === 'url'
                ? 'Tempel URL gambar langsung'
                : 'Upload file gambar (max 20MB)'}
            </p>
          </>
        ) : category === 'video' ? (
          <>
            <Label htmlFor="video-url">Sumber Video</Label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="video-source"
                  id="video-source-url"
                  checked={inputSource === 'url'}
                  onChange={() => handleSourceChange('url')}
                  className="cursor-pointer"
                />
                <span className="text-sm">URL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="video-source"
                  id="video-source-upload"
                  checked={inputSource === 'upload'}
                  onChange={() => handleSourceChange('upload')}
                  className="cursor-pointer"
                />
                <span className="text-sm">Upload File</span>
              </label>
            </div>
            {inputSource === 'url' ? (
              <Input
                id="video-url"
                placeholder="https://example.com/video.mp4"
                value={data.url?.startsWith('/uploads/') ? '' : (data.url || '')}
                onChange={(e) => onDataChange({ ...data, url: e.target.value })}
              />
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="size-4 mr-2" />
                  {isUploading ? 'Mengunggah...' : 'Pilih File Video'}
                </Button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploadedFilePath && data.url === uploadedFilePath && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {uploadedFilePath}
                  </p>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {inputSource === 'url'
                ? 'Tempel URL file video'
                : 'Upload file video (max 100MB)'}
            </p>
          </>
        ) : (
          <>
            <Label htmlFor="youtube-url">
              {category === 'youtube' ? 'URL YouTube' :
               'URL'}
            </Label>
            <Input
              id="youtube-url"
              placeholder={
                category === 'youtube' ? 'https://youtube.com/watch?v=...' :
                'https://example.com'
              }
              value={data.url || ''}
              onChange={(e) => onDataChange({ ...data, url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {category === 'youtube' ? 'Tempel URL video YouTube' : 'Tempel URL'}
            </p>
          </>
        )}
      </div>

      {category !== 'youtube' && category !== 'video' && (
        <div className="space-y-2">
          <Label htmlFor="banner-duration">Durasi (detik)</Label>
          <Input
            id="banner-duration"
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
          <Label className="text-sm sm:text-base">Lokasi Display</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${location.id}`}
                  checked={selectedLocationIds.includes(location.id)}
                  onCheckedChange={(checked) => {
                    if (checked !== undefined) {
                      handleLocationToggle(location.id);
                    }
                  }}
                />
                <Label
                  htmlFor={`location-${location.id}`}
                  className="font-normal cursor-pointer text-sm sm:text-base"
                >
                  {location.name}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Pilih lokasi untuk menampilkan banner ini
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Batal
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {mode === 'add' ? 'Menambahkan...' : 'Menyimpan...'}
            </>
          ) : (
            mode === 'add' ? 'Tambah Item' : 'Simpan Perubahan'
          )}
        </Button>
      </div>
    </div>
  );
};
