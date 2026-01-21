'use client'

import { useState } from 'react'
import InvoiceTable from '@/components/InvoiceTable'
import CSVImport from '@/components/CSVImport'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleImportSuccess() {
    // Refresh the table after import
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice Management System
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Import CSV data and view invoices by person
          </p>
        </div>

        {/* CSV Import Section */}
        <div className="mb-8">
          <CSVImport onImportSuccess={handleImportSuccess} />
        </div>

        {/* Invoice Table */}
        <div key={refreshKey}>
          <InvoiceTable />
        </div>
      </div>
    </div>
  )
}
