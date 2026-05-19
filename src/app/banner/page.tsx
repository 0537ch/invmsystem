import BannerSetting from "./_components/bannerSetting";
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

export default function BannerPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200/60 bg-slate-50/40 px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-sm font-semibold text-foreground">Banner Setting</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <RefreshCw className="size-3.5 mr-1.5" />
              <span className="hidden sm:inline">Sync Display</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button size="sm">
              <Plus className="size-3.5 mr-1.5" />
              <span className="hidden sm:inline">Tambah Konten</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </header>
        <BannerSetting />
      </SidebarInset>
    </SidebarProvider>
  );
}
