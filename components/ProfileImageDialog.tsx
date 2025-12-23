"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";

interface ProfileImageDialogProps {
  image: string | null;
  name: string;
  children: React.ReactNode;
}

export function ProfileImageDialog({
  image,
  name,
  children,
}: ProfileImageDialogProps) {
  if (!image) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger
        asChild
        className="cursor-pointer hover:opacity-90 transition-opacity"
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Profile Picture of {name}</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
        <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <Image
            src={image}
            alt={`Profile picture of ${name}`}
            width={400}
            height={400}
            quality={90}
            className="w-full h-full object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
