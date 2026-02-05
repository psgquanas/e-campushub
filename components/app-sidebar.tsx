"use client";

import * as React from "react";
import {
  IconBellCheck,
  IconBrain,
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconListSearch,
  IconNews,
  IconSearch,
  IconTrophy,
  IconUserCircle,
  IconViewfinder,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false, ...props }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Course Materials",
      url: "/dashboard/course-materials",
      icon: IconListDetails,
    },
    {
      title: "Campus News",
      url: "/dashboard/feed",
      icon: IconNews,
    },
    {
      title: "Anonymous",
      url: "/dashboard/anonymous",
      icon: IconViewfinder,
    },
    {
      title: "Hostel Listings",
      url: "/dashboard/hostel-listings",
      icon: IconListSearch,
    },
    {
      title: "AI Study Hub",
      url: "#",
      icon: IconBrain,
      items: [
        {
          title: "Chat Assistant",
          url: "/dashboard/ai-study-hub/chat-assistant",
        },
        {
          title: "Practice Quizzes",
          url: "/dashboard/ai-study-hub/quiz",
        },
      ],
    },
  ];

  const navSecondary = [
    ...(isAdmin
      ? [
          {
            title: "Reviews",
            url: "/dashboard/admin/materials",
            icon: IconBellCheck,
          },
        ]
      : []),
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: IconUserCircle,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <a
                  href="/dashboard"
                  className="text-primary hover:text-primary/90"
                >
                  <Image
                    src="/ecampus-logo.svg"
                    alt="Logo"
                    width={100}
                    height={40}
                    className="h-8 w-auto sm:h-8"
                  />
                </a>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} onNavigate={handleNavigate} />
        <NavSecondary
          items={navSecondary}
          className="mt-auto"
          onNavigate={handleNavigate}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
