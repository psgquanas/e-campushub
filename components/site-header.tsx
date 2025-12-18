import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NotificationBell } from "./notification-bell";

export async function SiteHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const name = session?.user.name;
  const programmeId = session?.user.programmeId;

  const programme = programmeId
    ? await prisma.programme.findUnique({
        where: { id: programmeId },
        select: { name: true }, // or select other fields you need
      })
    : null;

  const programmeName = programme?.name;

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 lg:hidden" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 lg:hidden"
        />
        <h1 className="text-xs lg:text-base font-medium">{name}</h1>
        <div className="ml-auto flex items-center gap-4 ">
          <h2 className="hidden md:block text-xs lg:text-base font-medium">
            {programmeName}
          </h2>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
