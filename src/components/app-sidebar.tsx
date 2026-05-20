"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
   MessageCircleWarning, MapPin, Image, LogOut, User
} from "lucide-react";
import type { Route } from "./nav-main";
import DashboardNavigation from "./nav-main";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dashboardRoutes: Route[] = [
  {
    id: "banner",
    title: "Banner",
    icon: <Image className="size-4" />,
    link: "/banner",
  },
  {
    id: "locations",
    title: "Lokasi",
    icon: <MapPin className="size-4" />,
    link: "/locations",
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader
        className={cn(
          "px-3 py-4",
          isCollapsed
            ? "flex-row items-center justify-center"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="/banner" className="flex items-center gap-3">
          <div className="shrink-0">
            <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-slate-900 tracking-tight leading-none">
              Manajemen Banner
            </span>
          )}
        </a>
      </SidebarHeader>
      <SidebarSeparator className="ms-0 me-auto w-[calc(100%-1rem)]" />
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring transition-colors outline-none">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{user?.name || user?.username}</span>
                  <span className="text-xs text-muted-foreground truncate">@{user?.username}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center px-2 py-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring transition-colors outline-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
