import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import AdminMaterialsClient from "./AdminMaterialsClient";

export default async function AdminMaterialsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const admin = await isAdmin(session.user.id);
  if (!admin) {
    redirect("/dashboard");
  }

  // Get all pending materials
  const pendingMaterials = await prisma.courseMaterial.findMany({
    where: {
      isVerified: false,
    },
    include: {
      course: {
        select: {
          code: true,
          name: true,
        },
      },
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all approved materials
  const approvedMaterials = await prisma.courseMaterial.findMany({
    where: {
      isVerified: true,
    },
    include: {
      course: {
        select: {
          code: true,
          name: true,
        },
      },
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Material Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve uploaded course materials
        </p>
      </div>

      <AdminMaterialsClient
        pendingMaterials={pendingMaterials}
        approvedMaterials={approvedMaterials}
      />
    </div>
  );
}
