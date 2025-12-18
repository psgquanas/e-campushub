import { z } from "zod";

export const materialCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum([
    "SLIDES",
    "LECTURE_NOTES",
    "ASSIGNMENT",
    "PAST_QUESTION",
    "TUTORIAL",
    "LAB_MANUAL",
    "READING_MATERIAL",
    "VIDEO",
    "OTHER",
  ]),
  fileUrl: z.string().url("Invalid file URL"),
  fileKey: z.string().min(1, "File key is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.coerce.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  courseId: z.coerce.number().int().positive("Invalid course ID"),
  tags: z.array(z.string()).optional(),
  academicYear: z.string().optional(),
});

export type MaterialCreateInput = z.infer<typeof materialCreateSchema>;

export function validateMaterialCreate(data: unknown) {
  return materialCreateSchema.safeParse(data);
}

export const postCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Content cannot be empty")
    .max(5000, "Content is too long (max 5000 characters)"),
  imageUrls: z
    .array(z.string().url())
    .max(3, "Max 3 images allowed")
    .optional()
    .default([]),
});

export const postUpdateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content cannot be empty")
    .max(5000, "Content is too long (max 5000 characters)"),
});

export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;

export function validatePostCreate(data: unknown) {
  return postCreateSchema.safeParse(data);
}

export function validatePostUpdate(data: unknown) {
  return postUpdateSchema.safeParse(data);
}

export const commentCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment is too long (max 1000 characters)"),
  isAnonymous: z.boolean().optional(),
  parentId: z.string().optional(),
});

export const commentUpdateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment is too long (max 1000 characters)"),
});

export const confessionCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Confession must be at least 10 characters")
    .max(5000, "Confession is too long (max 5000 characters)"),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;
export type ConfessionCreateInput = z.infer<typeof confessionCreateSchema>;

export function validateCommentCreate(data: unknown) {
  return commentCreateSchema.safeParse(data);
}

export function validateCommentUpdate(data: unknown) {
  return commentUpdateSchema.safeParse(data);
}

export function validateConfessionCreate(data: unknown) {
  return confessionCreateSchema.safeParse(data);
}
