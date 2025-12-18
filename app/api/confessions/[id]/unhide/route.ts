import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin status
    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Unhide the confession
    const confession = await prisma.confession.update({
      where: { id },
      data: {
        isHidden: false,
        // Optionally reset report count
        // reportCount: 0,
      },
      select: {
        id: true,
        isHidden: true,
        reportCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      confession,
      message: "Confession unhidden successfully",
    });
  } catch (error) {
    console.error("Error unhiding confession:", error);
    return NextResponse.json(
      { error: "Failed to unhide confession" },
      { status: 500 }
    );
  }
}
