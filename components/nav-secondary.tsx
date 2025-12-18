import * as React from "react";
import type { Icon as TablerIcon, IconProps } from "@tabler/icons-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

interface NavSecondaryProps extends React.ComponentProps<typeof SidebarGroup> {
  items: {
    title: string;
    url: string;
    icon?: ForwardRefExoticComponent<IconProps & RefAttributes<TablerIcon>>;
  }[];
  onNavigate?: () => void;
}

export function NavSecondary({
  items,
  onNavigate,
  ...props
}: NavSecondaryProps) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url} onClick={onNavigate}>
                <SidebarMenuButton asChild>
                  <span>
                    {item.icon && <item.icon />}

                    {item.title}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
