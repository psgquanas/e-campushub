import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

interface UserWithProgramme {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  programmeId: number | null;
}

export async function proxy(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const user = session?.user as UserWithProgramme | undefined;
  const programmeId = user?.programmeId;
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  // Not logged in → redirect to homepage
  if ((isProtectedRoute || isOnboardingRoute) && !user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Logged in but not onboarded, send user to onboarding flow
  if (user && !programmeId && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Onboarded but accessing onboarding we redirect user to dashboard
  if (user && programmeId && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
