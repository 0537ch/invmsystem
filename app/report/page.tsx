import { AppSidebar } from '@/components/app-sidebar'
import InvoiceTable from '@/components/InvoiceTable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default function InvoicePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* 1. Create a dedicated Header bar */}
        <header className="flex h-13 shrink-0 items-center gap-2 border-b px-2 bg-background sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
        </header>

        {/* 2. Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Report
            </h1>
          </div>
          <Separator className="my-2" />
          <InvoiceTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}