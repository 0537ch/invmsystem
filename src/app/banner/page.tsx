import BannerSetting from "./_components/bannerSetting";
import HeaderButton from "./_components/HeaderButton";
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

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
          <HeaderButton />
        </header>
        <BannerSetting />
      </SidebarInset>
    </SidebarProvider>
  );
}