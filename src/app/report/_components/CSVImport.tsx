'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCSVImport } from '../_hooks/use-csv-import'

interface CSVImportProps {
  onImportSuccess?: () => void
}

export default function CSVImport({ onImportSuccess }: CSVImportProps) {
  const { uploading, importCSV } = useCSVImport()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await importCSV(file, onImportSuccess)

      toast.success(result.message || 'Import successful!')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import CSV')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className='text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:mr-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-bold file:not-italic h-10'
        />

        {uploading && (
          <div className="text-sm text-muted-foreground mt-2">Uploading and processing...</div>
        )}
      </CardContent>
    </Card>
  )
}
