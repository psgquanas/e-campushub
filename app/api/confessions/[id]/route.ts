import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id);

    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only admins can delete confessions" },
        { status: 403 }
      );
    }

    // Delete the confession
    await prisma.confession.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting confession:", error);
    return NextResponse.json(
      { error: "Failed to delete confession" },
      { status: 500 }
    );
  }
}
