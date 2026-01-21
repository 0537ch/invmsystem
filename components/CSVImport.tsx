'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface CSVImportProps {
  onImportSuccess?: () => void
}

export default function CSVImport({ onImportSuccess }: CSVImportProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import CSV')
      }

      toast.success(data.message || 'Import successful!')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import CSV')
    } finally {
      setUploading(false)
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
