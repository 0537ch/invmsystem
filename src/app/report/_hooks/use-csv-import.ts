import { useState } from 'react'

export interface CSVImportResponse {
  message: string
  error?: string
}

export interface CSVImportError {
  error: string
}

export function useCSVImport() {
  const [uploading, setUploading] = useState(false)

  async function importCSV(
    file: File,
    onSuccess?: () => void
  ): Promise<CSVImportResponse> {
    if (!file.name.endsWith('.csv')) {
      throw new Error('Please upload a CSV file')
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })

      const data = (await response.json()) as CSVImportResponse | CSVImportError

      if (!response.ok) {
        throw new Error('error' in data ? data.error : 'Failed to import CSV')
      }

      if (onSuccess) {
        onSuccess()
      }

      return data as CSVImportResponse
    } finally {
      setUploading(false)
    }
  }

  return {
    uploading,
    importCSV
  }
}
