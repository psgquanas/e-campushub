"use client";

import * as React from "react";
import {
  IconBellCheck,
  IconBrain,
  IconCoin,
  IconDashboard,
  IconHistory,
  IconInfoCircle,
  IconListDetails,
  IconListSearch,
  IconNews,
  IconPlus,
  IconTrash,
  IconUserCircle,
  IconViewfinder,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  const [points, setPoints] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Fetch user points
    fetch("/api/user/points")
      .then((res) => res.json())
      .then((data) => setPoints(data.points))
      .catch((err) => console.error("Failed to fetch points:", err));
  }, []);

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
            <div className="flex items-center justify-between gap-2">
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
              {points !== null && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20">
                      <IconCoin
                        size={16}
                        className="text-yellow-500 animate-pulse"
                      />
                      <span className="text-sm font-bold">{points}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Image
                          src="/ecampus-logo.svg"
                          alt="Logo"
                          width={100}
                          height={40}
                          className="h-8 w-auto sm:h-8"
                        />
                        Points System
                      </DialogTitle>
                      <DialogDescription>
                        Earn points by contributing to the community and spend
                        them on premium AI features.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                          <IconPlus size={16} />
                          How to Earn
                        </h4>
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Daily Login Bonus
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-none font-bold"
                            >
                              +5 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Upload Course Material
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-none font-bold"
                            >
                              +10 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Material Verified by Admin
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-none font-bold"
                            >
                              +50 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Create an Anonymous Post
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-none font-bold"
                            >
                              +5 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Comment on a Post
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-none font-bold"
                            >
                              +2 pts
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                          <IconTrash size={16} />
                          AI Feature Costs
                        </h4>
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              AI Chat Message
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive border-none font-bold"
                            >
                              -5 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Generate Practice Quiz
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive border-none font-bold"
                            >
                              -20 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Document Analysis Upload
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive border-none font-bold"
                            >
                              -10 pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
