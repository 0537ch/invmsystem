import BannerSetting from "./_components/bannerSetting";
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function BannerPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <BannerSetting />
      </SidebarInset>
    </SidebarProvider>
  );
}
