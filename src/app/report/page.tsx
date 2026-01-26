'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import InvoiceTable from '@/app/report/_components/InvoiceTable'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

export default function InvoicePage() {
  const [totalCount, setTotalCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchTotal() {
      try {
        const response = await fetch('/api/people')
        if (response.ok) {
          const data = await response.json()
          setTotalCount(data.people?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch total:', error)
      }
    }
    fetchTotal()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* 1. Create a dedicated Header bar */}
        <header className="flex h-13 shrink-0 items-center gap-2 border-b px-2 bg-background sticky top-0 z-10">
        </header>

        {/* 2. Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Report
              </h1>
              <p className="text-muted-foreground mt-1">
                Total: {totalCount} orang
              </p>
              <Input
              placeholder='Search'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='mt-3 max-w-sm'/>
            </div>
          </div>
          <Separator className="my-2" />
          <InvoiceTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}