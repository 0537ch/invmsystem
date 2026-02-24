'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import InvoiceTable from '@/app/report/_components/InvoiceTable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { AuthProvider } from '@/components/auth-provider'

export default function InvoicePage() {

  return (
    <AuthProvider>
      <SidebarProvider>
      {/* Gradient Background - needs to be outside SidebarInset */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl" />
      </div>
      <AppSidebar />
      <SidebarInset className="bg-transparent overflow-x-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/20 px-4 md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:bg-gray-900/80 dark:border-white/10">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="font-semibold">Report</h1>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="w-full hidden md:flex h-13 shrink-0 items-center gap-2 border-b border-white/20 px-2 -ml-2 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:bg-gray-900/80 dark:border-white/10">
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 sm:p-8 pt-6 relative overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Report
              </h1></div>
          </div>
          <InvoiceTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthProvider>
  )
}
