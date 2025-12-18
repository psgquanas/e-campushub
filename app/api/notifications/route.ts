import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getAllNotifications,
  getUnreadNotifications,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = unreadOnly
      ? await getUnreadNotifications(session.user.id)
      : await getAllNotifications(session.user.id);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
