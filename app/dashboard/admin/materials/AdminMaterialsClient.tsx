"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCheck,
  IconX,
  IconEye,
  IconFileDescription,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
  course: {
    code: string;
    name: string;
  };
  uploader: {
    name: string;
    email: string;
  };
}

export default function AdminMaterialsClient({
  pendingMaterials,
  approvedMaterials,
}: {
  pendingMaterials: Material[];
  approvedMaterials: Material[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<Material | null>(null);

  const handleApprove = async (materialId: string) => {
    setProcessing(materialId);
    try {
      const response = await fetch(`/api/materials/${materialId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve material");
      }

      toast.success("Material approved successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to approve material");
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (materialId: string) => {
    setProcessing(materialId);
    try {
      const response = await fetch(`/api/materials/${materialId}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject material");
      }

      toast.success("Material rejected and deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to reject material");
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const MaterialsList = ({
    items,
    showApprove = false,
  }: {
    items: Material[];
    showApprove?: boolean;
  }) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFileDescription className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No materials found</h3>
            <p className="text-sm text-muted-foreground">
              {showApprove
                ? "No pending materials to review"
                : "No approved materials yet"}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((material) => (
          <Card key={material.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle
                    className="truncate max-w-[210px] md:text-lg md:max-w-[500px]"
                    title={material.title}
                  >
                    {material.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {material.course.code} - {material.course.name}
                  </p>
                </div>
                <Badge>{material.type.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {material.description && (
                <p className="text-sm text-muted-foreground">
                  {material.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Uploaded by: {material.uploader.name}</span>
                <span>•</span>
                <span>{formatDate(material.createdAt)}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setPreviewFile(material)}
                >
                  <IconEye className="mr-2 size-4" />
                  Preview
                </Button>

                {showApprove && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(material.id)}
                    disabled={processing === material.id}
                    className="w-full sm:w-auto"
                  >
                    <IconCheck className="mr-2 size-4" />
                    Approve
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(material.id)}
                  disabled={processing === material.id}
                  className="w-full sm:w-auto"
                >
                  <IconX className="mr-2 size-4" />
                  {showApprove ? "Reject" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pending">
          Pending
          {pendingMaterials.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-full">
              {pendingMaterials.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <MaterialsList items={pendingMaterials} showApprove={true} />
      </TabsContent>
      <TabsContent value="approved">
        <MaterialsList items={approvedMaterials} showApprove={false} />
      </TabsContent>
      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.fileUrl || null}
        fileName={previewFile?.title || ""}
      />
    </Tabs>
  );
}
