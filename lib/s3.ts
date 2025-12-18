// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import { v4 as uuidv4 } from "uuid";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL_S3, // https://t3.storage.dev
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES,
    Key: key,
  });

  await s3Client.send(command);
}

export function getPublicUrl(key: string) {
  // Always use fly.storage.tigris.dev for public access
  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES}.fly.storage.tigris.dev/${key}`;
}
