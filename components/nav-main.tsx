import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
  }[];
  onNavigate?: () => void;
}

export function NavMain({ items, onNavigate }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.disabled ? (
                <div className="relative">
                  <SidebarMenuButton
                    className="cursor-not-allowed opacity-60"
                    disabled
                  >
                    {item.icon && <item.icon />}
                    {item.title}
                  </SidebarMenuButton>
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 right-2 text-[10px] px-1.5 py-0 h-4 pointer-events-none"
                  >
                    Soon
                  </Badge>
                </div>
              ) : (
                <Link href={item.url} onClick={onNavigate}>
                  <SidebarMenuButton asChild>
                    <span>
                      {item.icon && <item.icon />}
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
