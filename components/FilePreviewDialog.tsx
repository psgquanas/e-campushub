"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IconDownload,
  IconExternalLink,
  IconFileAlert,
} from "@tabler/icons-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface FilePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
}

export function FilePreviewDialog({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}: FilePreviewDialogProps) {
  if (!fileUrl) return null;

  const getFileExtension = (url: string) => {
    return url.split(".").pop()?.toLowerCase() || "";
  };

  const extension = getFileExtension(fileUrl);
  const isPdf = extension === "pdf";
  const isOfficeDoc = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(
    extension
  );

  // Use Google Viewer for both PDFs and Office Docs to ensure mobile compatibility
  const shouldUseGoogleViewer = isPdf || isOfficeDoc;

  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    fileUrl
  )}&embedded=true`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] sm:h-[80vh] flex flex-col p-0 gap-0 max-h-[90vh]">
        <DialogHeader className="px-3 sm:px-4 py-2 sm:py-3 border-b shrink-0">
          <VisuallyHidden>
            <DialogTitle>Preview: {fileName}</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-between gap-2 pr-10">
            <div className="font-semibold truncate flex-1 min-w-0 text-sm sm:text-base">
              {fileName}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                asChild
                title="Open in new tab"
              >
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="size-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                asChild
                title="Download"
              >
                <a href={fileUrl} download>
                  <IconDownload className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/20 relative overflow-hidden">
          {shouldUseGoogleViewer ? (
            <iframe
              src={googleViewerUrl}
              className="w-full h-full border-none"
              title={`Preview of ${fileName}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
              <div className="bg-muted rounded-full p-4">
                <IconFileAlert className="size-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Preview not available</h3>
                <p className="text-muted-foreground">
                  This file type cannot be previewed directly in the browser.
                </p>
              </div>
              <Button asChild>
                <a href={fileUrl} download>
                  <IconDownload className="mr-2 size-4" />
                  Download File
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
