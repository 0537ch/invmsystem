import { Upload, Trash2 } from 'lucide-react'
import type { BannerEventEntry } from '@/types'

interface Props {
  entries: BannerEventEntry[]
  onChange: (entries: BannerEventEntry[]) => void
  onUpload: (file: File) => Promise<string | null>
}

export function EventEntriesInput({ entries, onChange, onUpload }: Props) {
  const addEntry = () => {
    onChange([...entries, { name: '', pictureUrl: '', position: entries.length }])
  }

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof BannerEventEntry, value: string | number) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleFileSelect = async (index: number, file: File) => {
    const path = await onUpload(file)
    if (path) {
      updateEntry(index, 'pictureUrl', path)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>Nama Event</span>
        <span className="ml-auto">Gambar</span>
        <span className="w-20 text-right">Durasi</span>
      </div>
      {entries.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md min-w-0">
          <input
            type="text"
            value={entry.name}
            onChange={(e) => updateEntry(index, 'name', e.target.value)}
            placeholder="Nama event"
            className="w-32 shrink-0 h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <label className="shrink-0 flex items-center gap-1 cursor-pointer px-2 py-2 border rounded-md hover:bg-muted/50">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(index, file)
              }}
            />
          </label>
          {entry.pictureUrl && (
            <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
              {entry.pictureUrl.split('/').pop()}
            </span>
          )}
          <input
            type="number"
            value={entry.duration ?? ''}
            onChange={(e) => updateEntry(index, 'duration', Number(e.target.value))}
            placeholder="dtk"
            min={1}
            className="w-16 shrink-0 h-9 rounded-md border border-input bg-background px-2 text-sm text-center"
          />
          <button
            type="button"
            onClick={() => removeEntry(index)}
            className="text-destructive hover:text-destructive/80 p-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry} className="text-sm text-primary hover:underline">
        + Tambah Event
      </button>
    </div>
  )
}