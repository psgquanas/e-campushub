"use client";

import { type Icon } from "@tabler/icons-react";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  onNavigate?: () => void;
}

export function NavMain({ items, onNavigate }: NavMainProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

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
              ) : item.items && item.items.length > 0 ? (
                <Collapsible
                  open={openItems.includes(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon && <item.icon />}
                      {item.title}
                      <IconChevronDown
                        className={`ml-auto transition-transform ${
                          openItems.includes(item.title) ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <AnimatePresence initial={false}>
                    {openItems.includes(item.title) && (
                      <CollapsibleContent forceMount asChild>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url} onClick={onNavigate}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </motion.div>
                      </CollapsibleContent>
                    )}
                  </AnimatePresence>
                </Collapsible>
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
