"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FileText, MessageCircleWarning, Monitor, MapPin, Image, LogOut, User
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
    title: "Banners",
    icon: <Image className="size-4" />,
    link: "/banner",
  },
  {
    id: "locations",
    title: "Locations",
    icon: <MapPin className="size-4" />,
    link: "/locations",
  },
  {
    id: "display",
    title: "Display",
    icon: <Monitor className="size-4" />,
    link: "/display",
  },
  {
    id: "report",
    title: "Report",
    icon: <FileText className="size-4" />,
    link: "/report",
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
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="/banner" className="flex items-center gap-2">
          <MessageCircleWarning className="h-8 w-8"/>
          {!isCollapsed && (
            <span className="font-semibold text-black dark:text-white">
              Notification Management
            </span>
          )}
        </a>
        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{user?.name || user?.username}</span>
                  <span className="text-xs text-muted-foreground truncate">@{user?.username}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center px-2 py-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
