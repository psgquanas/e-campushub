"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
        <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center p-4">
          <img
            src={image}
            alt={`Profile picture of ${name}`}
            className="max-w-full max-h-full object-contain rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
