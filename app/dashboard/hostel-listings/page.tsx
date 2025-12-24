import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IconBuildingCommunity, IconClock } from "@tabler/icons-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hostel Listings",
  description: "Dashboard - Hostel Listings",
};

export default async function HostelListingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="container py-2">
      <div className="max-w-3xl mx-auto">
        <div>
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="relative mb-6">
              <IconBuildingCommunity className="size-20 text-muted-foreground" />
              <div className="absolute -top-2 -right-2">
                <IconClock className="size-8 text-primary animate-pulse" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-3">Hostel Listings</h1>

            <div className="mb-6 space-y-2">
              <p className="text-xl text-muted-foreground">Coming Soon! 🏠</p>
              <p className="text-sm text-muted-foreground max-w-md">
                We're working hard to bring you a comprehensive hostel listing
                platform. Browse available hostels, compare prices, view photos,
                and plan your accommodation all in one place.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <span>📍</span>
                <span>Location Maps</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <span>💰</span>
                <span>Price Comparison</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <span>📸</span>
                <span>Photo Gallery</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <span>⭐</span>
                <span>Reviews & Ratings</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-8">
              Stay tuned for updates!
            </p>

            <p className="text-xs text-muted-foreground mt-8">
              Email: info@e-campushub.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
