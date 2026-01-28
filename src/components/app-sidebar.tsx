"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FileText, MessageCircleWarning, Monitor
} from "lucide-react";
import type { Route } from "./nav-main";
import DashboardNavigation from "./nav-main";

const dashboardRoutes: Route[] = [
  {
    id: "banner",
    title: "Banner",
    icon: <Monitor className="size-4" />,
    link: "/banner",
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
  const isCollapsed = state === "collapsed";

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
        <a href="#" className="flex items-center gap-2">
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
    </Sidebar>
  );
}
