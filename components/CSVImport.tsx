'use client'

import { useState, useRef } from 'react'

interface CSVImportProps {
  onImportSuccess?: () => void
}

export default function CSVImport({ onImportSuccess }: CSVImportProps) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' })
      return
    }

    setUploading(true)
    setMessage(null)

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

      setMessage({ type: 'success', text: data.message || 'Import successful!' })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import CSV'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Import CSV Data</h3>
      </div>

      <div className="bg-gray-50 border rounded p-4">
        <code className="text-sm text-gray-700">
          name, email, invoice_number, price
        </code>
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {uploading && (
          <div className="text-sm text-blue-600">Uploading and processing...</div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <strong>Note:</strong> This will replace all existing data in the system.
      </div>
    </div>
  )
}
