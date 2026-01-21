'use client'

import InvoiceTable from '@/components/InvoiceTable'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice Management System
          </h1>
        </div>

        {/* Invoice Table */}
        <InvoiceTable />
      </div>
    </div>
  )
}
