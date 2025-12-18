// app/dashboard/course-materials/upload/UploadMaterialForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconFile,
  IconX,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

const materialTypes = [
  { value: "SLIDES", label: "Slides" },
  { value: "LECTURE_NOTES", label: "Lecture Notes" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PAST_QUESTION", label: "Past Question" },
  { value: "TUTORIAL", label: "Tutorial" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "READING_MATERIAL", label: "Reading Material" },
  { value: "OTHER", label: "Other" },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.string().min(1, "Please select a material type"),
  courseId: z.string().min(1, "Please select a course"),
  tags: z.string().optional(),
  academicYear: z.string().optional(),
});

interface Course {
  id: number;
  code: string;
  name: string;
  semester: number;
}

export default function UploadMaterialForm({
  courses,
  userId,
}: {
  courses: Course[];
  userId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      courseId: "",
      tags: "",
      academicYear:
        new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 50MB");
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast.error(
          "Invalid file type. Please upload PDF, DOC, DOCX, PPT, or PPTX files"
        );
        return;
      }

      setFile(selectedFile);

      // Auto-fill title from filename if empty
      if (!form.getValues("title")) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", nameWithoutExt);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file directly through API
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/materials/upload-direct", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const { key, fileUrl, fileName, fileSize, mimeType } =
        await uploadResponse.json();
      setUploadProgress(70);

      // Step 2: Create material record in database
      const createResponse = await fetch("/api/materials/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          fileUrl,
          fileKey: key,
          fileName,
          fileSize,
          mimeType,
          tags: values.tags ? values.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      if (!createResponse.ok) {
        if (createResponse.status === 429) {
          const data = await createResponse.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          return;
        }
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create material record");
      }

      setUploadProgress(100);
      toast.success("Material uploaded successfully!");

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard/course-materials");
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload material"
      );
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  // Group courses by semester
  const coursesBySemester = courses.reduce(
    (acc, course) => {
      const semester = course.semester;
      if (!acc[semester]) acc[semester] = [];
      acc[semester].push(course);
      return acc;
    },
    {} as Record<number, Course[]>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Material Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">File *</label>
              {!file ? (
                <label
                  htmlFor="file-input"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:border-muted-foreground/50"
                >
                  <IconUpload className="mb-4 size-12 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, PPT, PPTX (max 50MB)
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <IconFile className="size-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={uploading}
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Week 5 Lecture Slides - Data Structures"
                      {...field}
                      disabled={uploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the material..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={uploading}
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand what this material covers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course and Type in same row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Course */}
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={uploading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full truncate [&>span]:truncate">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(coursesBySemester).map(
                          ([semester, semesterCourses]) => (
                            <div key={semester}>
                              <div className="px-2 py-1.5 text-sm font-semibold">
                                Semester {semester}
                              </div>
                              {semesterCourses.map((course) => (
                                <SelectItem
                                  key={course.id}
                                  value={course.id.toString()}
                                >
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Material Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={uploading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full truncate [&>span]:truncate">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags and Academic Year in same row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., midterm, chapter-3, algorithms"
                        {...field}
                        disabled={uploading}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated tags</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Academic Year */}
              <FormField
                control={form.control}
                name="academicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 2024/2025"
                        {...field}
                        disabled={uploading}
                      />
                    </FormControl>
                    <FormDescription>Current academic year</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Info Alert */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <IconAlertCircle className="size-5 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium">Material Review</p>
                <p className="mt-1 text-blue-700 dark:text-blue-300">
                  Your upload will be reviewed by admins before being visible to
                  other students. You'll be notified once it's approved.
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || !file}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <IconUpload className="mr-2 size-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 size-4" />
                    Upload Material
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
