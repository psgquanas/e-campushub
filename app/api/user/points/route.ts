import { auth } from "@/lib/auth";
import { getUserPoints } from "@/lib/points";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const points = await getUserPoints(session.user.id);

    return NextResponse.json({ points });
  } catch (error) {
    console.error("[USER_POINTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
