"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { IconCamera, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserAvatarUploadProps {
  currentImage: string | null;
  userName: string;
}

export default function UserAvatarUpload({
  currentImage,
  userName,
}: UserAvatarUploadProps) {
  const [image, setImage] = useState(currentImage || "/images/user/owner.jpg");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation before upload
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setImage(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/user/upload-profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload");
      }

      const data = await response.json();
      setImage(data.imageUrl); // Update with authoritative URL
      toast.success("Profile picture updated!");
      router.refresh(); // Refresh server components to show new image elsewhere
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to update profile picture");
      setImage(currentImage || "/images/user/owner.jpg"); // Revert on error
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative group">
      <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 relative">
        <Image src={image} alt={userName} fill className="object-cover" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <IconLoader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 cursor-pointer transition-colors border-2 border-white dark:border-gray-950 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Change profile picture"
      >
        <IconCamera className="size-3.5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/gif"
      />
    </div>
  );
}
