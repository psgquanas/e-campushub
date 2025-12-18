"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconSearch,
  IconFilter,
  IconUpload,
  IconFileDescription,
  IconDownload,
  IconEye,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatBytes, formatDate } from "@/lib/utils";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  downloads: number;
  views: number;
  createdAt: Date;
  uploader: {
    name: string;
    email: string;
  };
}

interface Course {
  id: number;
  code: string;
  name: string;
  level: number;
  semester: number;
  materials: Material[];
}

export default function CourseMaterialsClient({
  courses,
  userLevel,
  userId,
}: {
  courses: Course[];
  userLevel: number;
  userId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<Material | null>(null);

  // Filter materials
  const filteredMaterials = courses
    .filter(
      (course) =>
        selectedCourse === "all" || course.id.toString() === selectedCourse
    )
    .flatMap((course) =>
      course.materials.map((material) => ({
        ...material,
        course: { code: course.code, name: course.name },
      }))
    )
    .filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.course.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "all" || material.type === selectedType;
      return matchesSearch && matchesType;
    });

  const materialTypes = [
    { value: "all", label: "All Types" },
    { value: "SLIDES", label: "Slides" },
    { value: "LECTURE_NOTES", label: "Lecture Notes" },
    { value: "ASSIGNMENT", label: "Assignments" },
    { value: "PAST_QUESTION", label: "Past Questions" },
    { value: "TUTORIAL", label: "Tutorials" },
    { value: "LAB_MANUAL", label: "Lab Manuals" },
  ];

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Course Materials</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Share and access lecture notes, slides, and study materials for
            Level {userLevel}
          </p>
        </div>
        <Link
          href="/dashboard/course-materials/upload"
          className="w-full md:w-auto"
        >
          <Button className="w-full md:w-auto">
            <IconUpload className="mr-2 size-4" />
            Upload Material
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="rounded-md">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Course Filter */}
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "grid" | "list")}
      >
        <TabsList>
          <TabsTrigger value="grid" className="flex-1 sm:flex-initial">
            Grid View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1 sm:flex-initial">
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4 sm:mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onPreview={setPreviewFile}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-2">
            {filteredMaterials.map((material) => (
              <MaterialListItem
                key={material.id}
                material={material}
                onPreview={setPreviewFile}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 sm:p-12 text-center w-full">
          <IconFileDescription className="size-10 sm:size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No materials found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your filters or be the first to upload materials
          </p>
        </div>
      )}

      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.fileUrl || null}
        fileName={previewFile?.title || ""}
      />
    </div>
  );
}

// Material Card Component
function MaterialCard({
  material,
  onPreview,
}: {
  material: any;
  onPreview: (material: any) => void;
}) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SLIDES: "bg-blue-500",
      LECTURE_NOTES: "bg-green-500",
      ASSIGNMENT: "bg-orange-500",
      PAST_QUESTION: "bg-purple-500",
      TUTORIAL: "bg-pink-500",
      LAB_MANUAL: "bg-cyan-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge className={`${getTypeColor(material.type)} mb-2`}>
              {material.type.replace("_", " ")}
            </Badge>
            <CardTitle className="text-base line-clamp-2">
              {material.title}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
              {material.course.code} - {material.course.name}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {material.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {material.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <IconEye className="size-4" />
              {material.views}
            </span>
            <span className="flex items-center gap-1">
              <IconDownload className="size-4" />
              {material.downloads}
            </span>
          </div>
          <span className="text-xs">
            Uploaded {formatDate(material.createdAt)}
          </span>
          <span className="text-xs">{formatBytes(material.fileSize)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => onPreview(material)}
          >
            <IconEye className="mr-2 size-4" />
            View
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/materials/${material.id}/download`}>
              <IconDownload className="size-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Material List Item Component
function MaterialListItem({
  material,
  onPreview,
}: {
  material: any;
  onPreview: (material: any) => void;
}) {
  return (
    <Card className="hover:bg-accent transition-colors">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
        <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
          <IconFileDescription className="size-8 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{material.title}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
              <span>{material.course.code}</span>
              <span className="hidden sm:inline">•</span>
              <span className="line-clamp-1">
                {material.type.replace("_", " ")}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{formatBytes(material.fileSize)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                {formatDate(material.createdAt)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-initial"
            onClick={() => onPreview(material)}
          >
            <IconEye className="size-4 sm:mr-2" />
            <span className="sm:inline">View</span>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={material.fileUrl} download>
              <IconDownload className="size-4 sm:mr-2" />
              <span className="sm:inline hidden">Download</span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
