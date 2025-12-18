"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { postCreateSchema, postUpdateSchema } from "@/lib/validation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconPin,
  IconSend,
  IconPhoto,
  IconX,
  IconLoader,
  IconDots,
  IconShare,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconPencil,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, X } from "lucide-react";
import { AdCard } from "./AdCard";
import { ProfileImageDialog } from "@/components/ProfileImageDialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  likes?: { userId: string }[];
  replies?: Comment[];
  _count: {
    likes: number;
    replies: number;
  };
}

interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  isPinned: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
    email: string;
    role: string;
    badgeName: string | null;
  };
  likes: {
    userId: string;
    user: { id: string; name: string; image: string | null };
  }[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

interface CurrentUser {
  id: string;
  name: string;
  image: string | null;
}

interface CampusFeedClientProps {
  initialPosts: Post[];
  currentUser: CurrentUser;
  isAdmin: boolean;
  postId?: string;
  initialSort?: string;
}

const PostSkeleton = () => (
  <Card className="overflow-hidden border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
    <CardContent className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 sm:size-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-[250px] w-full rounded-lg" />
      <div className="flex items-center gap-4 border-t pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

function ImageGrid({
  images,
  onImageClick,
  post,
}: {
  images: string[];
  onImageClick: (index: number) => void;
  post: Post;
}) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Post attachment"
        className="rounded-lg w-full max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition"
        onClick={() => onImageClick(0)}
      />
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 h-[300px]">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Post attachment ${i + 1}`}
            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition first:rounded-l-lg last:rounded-r-lg"
            onClick={() => onImageClick(i)}
          />
        ))}
      </div>
    );
  }

  // 3 or more images (Facebook style: 1 big left, 2 small right)
  return (
    <div className="grid grid-cols-2 gap-1 h-[400px]">
      <div className="h-full">
        <img
          src={images[0]}
          alt="Post attachment 1"
          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition rounded-l-lg"
          onClick={() => onImageClick(0)}
        />
      </div>
      <div className="grid grid-rows-2 gap-1 h-full">
        <img
          src={images[1]}
          alt="Post attachment 2"
          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition rounded-tr-lg"
          onClick={() => onImageClick(1)}
        />
        <div className="relative h-full">
          <img
            src={images[2]}
            alt="Post attachment 3"
            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition rounded-br-lg"
            onClick={() => onImageClick(2)}
          />
          {images.length > 3 && (
            <div
              className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-br-lg cursor-pointer hover:bg-black/60 transition"
              onClick={() => onImageClick(2)}
            >
              <span className="text-white text-2xl font-bold">
                +{images.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampusFeedClient({
  initialPosts,
  currentUser,
  isAdmin,
  initialSort = "newest",
}: CampusFeedClientProps) {
  const currentUserId = currentUser.id;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [sortBy, setSortBy] = useState(initialSort);
  const [isLoadingSorted, setIsLoadingSorted] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewerPost, setViewerPost] = useState<Post | null>(null);

  const openImageViewer = (
    images: string[],
    startIndex: number,
    post: Post
  ) => {
    setViewerImages(images);
    setCurrentImageIndex(startIndex);
    setViewerPost(post);
    setImageViewerOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % viewerImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + viewerImages.length) % viewerImages.length
    );
  };

  // Sync posts with initialPosts when they change (after router.refresh())
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handleSortChange = async (value: string) => {
    setSortBy(value);
    setIsLoadingSorted(true);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("sort", value);
    window.history.pushState({}, "", url.toString());

    try {
      const response = await fetch(`/api/posts?sort=${value}`);
      if (!response.ok) throw new Error("Failed to fetch sorted posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      toast.error("Failed to load sorted posts");
    } finally {
      setIsLoadingSorted(false);
    }
  };

  // Handle direct post links - check URL for post ID and open modal
  useEffect(() => {
    const path = window.location.pathname;
    const postIdMatch = path.match(/\/feed\/([^/]+)$/);

    if (postIdMatch) {
      const postId = postIdMatch[1];
      const post = initialPosts.find((p) => p.id === postId);

      if (post) {
        setSelectedPost(post);
        setCommentsModalOpen(true);
        // Clean up URL without reload
        window.history.replaceState({}, "", "/dashboard/feed");
      } else {
        // Post not found, redirect to feed
        toast.error("Post not found");
        router.push("/dashboard/feed");
      }
    }
  }, [initialPosts, router]);

  // Modal states
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "post" | "comment" | "reply";
    id: string;
    postId?: string; // For comments/replies
    commentId?: string; // For replies
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Post states
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [updatePostError, setUpdatePostError] = useState<string | null>(null);

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/dashboard/feed/${post.id}`;
    const shareData = {
      title: `Post by ${post.author.name}`,
      text:
        post.content.slice(0, 100) + (post.content.length > 100 ? "..." : ""),
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share post");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  const confirmDelete = (
    type: "post" | "comment" | "reply",
    id: string,
    postId?: string,
    parentId?: string
  ) => {
    setItemToDelete({ type, id, postId, commentId: parentId });
    setDeleteDialogOpen(true);
  };

  const startEditing = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const startEditingPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setUpdatePostError(null);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    setUpdatePostError(null);

    // Client-side validation
    const validationResult = postUpdateSchema.safeParse({
      content: editPostContent,
    });

    if (!validationResult.success) {
      setUpdatePostError(validationResult.error.issues[0].message);
      return;
    }

    setIsUpdatingPost(true);

    try {
      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editPostContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        throw new Error("Failed to update post");
      }

      const updatedPost = await response.json();

      // Convert date strings back to Date objects
      updatedPost.createdAt = new Date(updatedPost.createdAt);
      updatedPost.updatedAt = new Date(updatedPost.updatedAt);
      updatedPost.comments = updatedPost.comments.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));

      // Update local state
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? updatedPost : p))
      );

      if (selectedPost?.id === editingPost.id) {
        setSelectedPost(updatedPost);
      }

      toast.success("Post updated successfully");
      setEditingPost(null);
      setEditPostContent("");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setUpdatePostError(error.message);
      } else {
        toast.error("Failed to update post");
      }
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const saveEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSavingEdit(true);

    // Optimistically update
    const previousPosts = [...posts];

    // Helper to update comment in a post
    const updateCommentInPost = (post: Post) => {
      return {
        ...post,
        comments: post.comments.map((c) => {
          if (c.id === commentId) return { ...c, content: editContent };
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, content: editContent } : r
              ),
            };
          }
          return c;
        }),
      };
    };

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        // Find post containing the comment
        const hasComment =
          p.comments.some((c) => c.id === commentId) ||
          p.comments.some((c) => c.replies?.some((r) => r.id === commentId));

        if (hasComment) {
          return updateCommentInPost(p);
        }
        return p;
      })
    );

    // Also update selectedPost if it's the one being viewed
    if (selectedPost) {
      setSelectedPost(updateCommentInPost(selectedPost));
    }

    setEditingCommentId(null);
    setEditContent("");

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error("Failed to update comment");

      router.refresh();
    } catch (error) {
      setPosts(previousPosts);
      toast.error("Failed to update comment");
      setEditingCommentId(commentId);
      setEditContent(editContent);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === "post") {
        const response = await fetch(`/api/posts/${itemToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete post");

        setPosts((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        if (selectedPost?.id === itemToDelete.id) {
          setCommentsModalOpen(false);
          setSelectedPost(null);
        }
        toast.success("Post deleted successfully");
      } else if (itemToDelete.type === "comment") {
        const response = await fetch(`/api/comments/${itemToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete comment");

        // Update local state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === itemToDelete.postId) {
              return {
                ...post,
                comments: post.comments.filter((c) => c.id !== itemToDelete.id),
                _count: {
                  ...post._count,
                  comments: post._count.comments - 1,
                },
              };
            }
            return post;
          })
        );

        if (selectedPost?.id === itemToDelete.postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  comments: prev.comments.filter(
                    (c) => c.id !== itemToDelete.id
                  ),
                  _count: {
                    ...prev._count,
                    comments: prev._count.comments - 1,
                  },
                }
              : null
          );
        }
        toast.success("Comment deleted successfully");
      } else if (itemToDelete.type === "reply") {
        const response = await fetch(`/api/comments/${itemToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete reply");

        // Update local state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === itemToDelete.postId) {
              return {
                ...post,
                comments: post.comments.map((c) => {
                  if (c.id === itemToDelete.commentId) {
                    return {
                      ...c,
                      replies: c.replies?.filter(
                        (r) => r.id !== itemToDelete.id
                      ),
                      _count: {
                        ...c._count,
                        replies: c._count.replies - 1,
                      },
                    };
                  }
                  return c;
                }),
              };
            }
            return post;
          })
        );

        if (selectedPost?.id === itemToDelete.postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  comments: prev.comments.map((c) => {
                    if (c.id === itemToDelete.commentId) {
                      return {
                        ...c,
                        replies: c.replies?.filter(
                          (r) => r.id !== itemToDelete.id
                        ),
                        _count: {
                          ...c._count,
                          replies: c._count.replies - 1,
                        },
                      };
                    }
                    return c;
                  }),
                }
              : null
          );
        }
        toast.success("Reply deleted successfully");
      }

      router.refresh();
    } catch (error) {
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Check if adding these files would exceed the limit
    if (imagePreviews.length + files.length > 3) {
      toast.error("You can only upload up to 3 images per post");
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select only image files");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be less than 5MB");
        return;
      }
    }

    // Create previews for the new files
    const newPreviews: string[] = [];
    let loadedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        loadedCount++;

        // When all files are loaded, update state
        if (loadedCount === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
          setSelectedFiles((prev) => [...prev, ...files]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImagePreviews([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createPost = async () => {
    setCreatePostError(null);

    // Client-side validation
    const validationResult = postCreateSchema.safeParse({
      content: newPostContent,
      imageUrls: [], // Validation doesn't check files, only URLs, which we don't have yet
    });

    if (!validationResult.success) {
      const error = validationResult.error.issues.find(
        (i) => i.path[0] === "content"
      );
      if (error) {
        setCreatePostError(error.message);
        return;
      }
    }

    if (!newPostContent.trim()) {
      setCreatePostError("Post content must have 3 or more characters");
      return;
    }

    setIsPosting(true);
    try {
      // Upload all selected images first
      const imageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setIsUploadingImage(true);

        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("image", file);

          const uploadResponse = await fetch("/api/posts/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            if (uploadResponse.status === 429) {
              const data = await uploadResponse.json();
              toast.error(
                data.message || "Too many attempts. Try again later."
              );
              return;
            }
            throw new Error("Failed to upload image");
          }

          const { imageUrl } = await uploadResponse.json();
          imageUrls.push(imageUrl);
        }

        setIsUploadingImage(false);
      }

      // Create the post with uploaded image URLs
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          imageUrls,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          return;
        }

        const data = await response.json();
        if (data.error) {
          setCreatePostError(data.error);
          return;
        }

        throw new Error("Failed to create post");
      }

      toast.success("Post created successfully!");
      setNewPostContent("");
      clearImages();
      setShowCreatePost(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to create post");
      setIsUploadingImage(false);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    // Find the post
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.some((like) => like.userId === currentUserId);

    // Track view when liking
    trackView(postId);

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((like) => like.userId !== currentUserId)
              : [
                  ...p.likes,
                  {
                    userId: currentUserId,
                    user: {
                      id: currentUserId,
                      name: currentUser.name,
                      image: currentUser.image,
                    },
                  },
                ],
            _count: {
              ...p._count,
              likes: isLiked ? p._count.likes - 1 : p._count.likes + 1,
            },
          };
        }
        return p;
      })
    );

    // Update selected post if it's open in modal
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likes: isLiked
                ? prev.likes.filter((like) => like.userId !== currentUserId)
                : [
                    ...prev.likes,
                    {
                      userId: currentUserId,
                      user: {
                        id: currentUserId,
                        name: currentUser.name,
                        image: currentUser.image,
                      },
                    },
                  ],
              _count: {
                ...prev._count,
                likes: isLiked ? prev._count.likes - 1 : prev._count.likes + 1,
              },
            }
          : null
      );
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 429) {
          toast.error(data.message || "Too many attempts. Try again later.");
        } else {
          toast.error(data.error || "Failed to update like");
        }
        throw new Error("Failed to toggle like");
      }

      // We don't need router.refresh() here because we've handled the UI optimistically
      // and want to avoid the "jumping" effect of a server refresh.
    } catch (error) {
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isLiked
                ? [
                    ...p.likes,
                    {
                      userId: currentUserId,
                      user: {
                        id: currentUserId,
                        name: currentUser.name,
                        image: currentUser.image,
                      },
                    },
                  ]
                : p.likes.filter((like) => like.userId !== currentUserId),
              _count: {
                ...p._count,
                likes: isLiked ? p._count.likes + 1 : p._count.likes - 1,
              },
            };
          }
          return p;
        })
      );

      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likes: isLiked
                  ? [
                      ...prev.likes,
                      {
                        userId: currentUserId,
                        user: {
                          id: currentUserId,
                          name: currentUser.name,
                          image: currentUser.image,
                        },
                      },
                    ]
                  : prev.likes.filter((like) => like.userId !== currentUserId),
                _count: {
                  ...prev._count,
                  likes: isLiked
                    ? prev._count.likes + 1
                    : prev._count.likes - 1,
                },
              }
            : null
        );
      }
    }
  };

  const addComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image,
      },
      likes: [],
      replies: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    // Update posts state immediately
    const updatePostsWithComment = (newComment: Comment) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment],
              _count: {
                ...post._count,
                comments: post._count.comments + 1,
              },
            };
          }
          return post;
        })
      );

      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: [...prev.comments, newComment],
                _count: {
                  ...prev._count,
                  comments: prev._count.comments + 1,
                },
              }
            : null
        );
      }
    };

    // Apply optimistic update
    updatePostsWithComment(optimisticComment);
    setCommentInputs({ ...commentInputs, [postId]: "" });
    setIsCommenting({ ...isCommenting, [postId]: true });

    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          return;
        }
        throw new Error("Failed to add comment");
      }

      const { comment: realComment } = await response.json();

      // Replace optimistic comment with real one
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map((c) =>
                c.id === tempId ? realComment : c
              ),
            };
          }
          return post;
        })
      );

      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((c) =>
                  c.id === tempId ? realComment : c
                ),
              }
            : null
        );
      }

      toast.success("Comment added!");
      router.refresh();
    } catch (error) {
      // Revert optimistic update on error
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter((c) => c.id !== tempId),
              _count: {
                ...post._count,
                comments: post._count.comments - 1,
              },
            };
          }
          return post;
        })
      );

      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.filter((c) => c.id !== tempId),
                _count: {
                  ...prev._count,
                  comments: prev._count.comments - 1,
                },
              }
            : null
        );
      }

      setCommentInputs({ ...commentInputs, [postId]: content }); // Restore content
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting({ ...isCommenting, [postId]: false });
    }
  };

  const togglePin = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to toggle pin");

      router.refresh();
    } catch (error) {
      toast.error("Failed to update pin");
    }
  };

  const trackView = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/view`, {
        method: "POST",
      });

      if (response.ok) {
        const { views } = await response.json();
        // Update local state with new view count
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? { ...p, views } : p))
        );
      }
    } catch (error) {
      // Silently fail - views are not critical
      console.error("Failed to track view:", error);
    }
  };

  const openLikesModal = (post: Post) => {
    setSelectedPost(post);
    setLikesModalOpen(true);
    trackView(post.id);
  };

  const openCommentsModal = (post: Post) => {
    setSelectedPost(post);
    setCommentsModalOpen(true);
    trackView(post.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isLikedByUser = (post: Post) => {
    return post.likes.some((like) => like.userId === currentUserId);
  };

  const isCommentLikedByUser = (comment: Comment) => {
    return (
      comment.likes?.some((like) => like.userId === currentUserId) || false
    );
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      // Determine current like state before making the request
      let isCurrentlyLiked = false;

      // Check in posts
      for (const post of posts) {
        const comment = post.comments.find((c) => c.id === commentId);
        if (comment) {
          isCurrentlyLiked =
            comment.likes?.some((like) => like.userId === currentUserId) ||
            false;
          break;
        }
        // Check in replies
        for (const comment of post.comments) {
          const reply = comment.replies?.find((r) => r.id === commentId);
          if (reply) {
            isCurrentlyLiked =
              reply.likes?.some((like) => like.userId === currentUserId) ||
              false;
            break;
          }
        }
      }

      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          return;
        }
        throw new Error("Failed to toggle like");
      }

      // Toggle the like state
      const liked = !isCurrentlyLiked;

      // Update posts state immediately
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes: liked
                  ? [...(comment.likes || []), { userId: currentUserId }]
                  : (comment.likes || []).filter(
                      (like) => like.userId !== currentUserId
                    ),
                _count: {
                  ...comment._count,
                  likes: liked
                    ? comment._count.likes + 1
                    : comment._count.likes - 1,
                },
              };
            }
            // Also check replies
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      likes: liked
                        ? [...(reply.likes || []), { userId: currentUserId }]
                        : (reply.likes || []).filter(
                            (like) => like.userId !== currentUserId
                          ),
                      _count: {
                        ...reply._count,
                        likes: liked
                          ? reply._count.likes + 1
                          : reply._count.likes - 1,
                      },
                    };
                  }
                  return reply;
                }),
              };
            }
            return comment;
          }),
        }))
      );

      // Also update selectedPost if modal is open
      if (selectedPost) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((comment) => {
                  if (comment.id === commentId) {
                    return {
                      ...comment,
                      likes: liked
                        ? [...(comment.likes || []), { userId: currentUserId }]
                        : (comment.likes || []).filter(
                            (like) => like.userId !== currentUserId
                          ),
                      _count: {
                        ...comment._count,
                        likes: liked
                          ? comment._count.likes + 1
                          : comment._count.likes - 1,
                      },
                    };
                  }
                  // Also check replies
                  if (comment.replies) {
                    return {
                      ...comment,
                      replies: comment.replies.map((reply) => {
                        if (reply.id === commentId) {
                          return {
                            ...reply,
                            likes: liked
                              ? [
                                  ...(reply.likes || []),
                                  { userId: currentUserId },
                                ]
                              : (reply.likes || []).filter(
                                  (like) => like.userId !== currentUserId
                                ),
                            _count: {
                              ...reply._count,
                              likes: liked
                                ? reply._count.likes + 1
                                : reply._count.likes - 1,
                            },
                          };
                        }
                        return reply;
                      }),
                    };
                  }
                  return comment;
                }),
              }
            : null
        );
      }

      // Refresh from server in background
      router.refresh();
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const replyToComment = async (commentId: string) => {
    const content = replyInputs[commentId]?.trim();
    if (!content) return;

    // Optimistic update
    const tempId = `temp-reply-${Date.now()}`;
    const optimisticReply: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image,
      },
      likes: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    // Update posts state immediately
    const updatePostsWithReply = (newReply: Comment) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
                _count: {
                  ...comment._count,
                  replies: comment._count.replies + 1,
                },
              };
            }
            return comment;
          }),
          _count: {
            ...post._count,
            comments: post._count.comments + 1,
          },
        }))
      );

      if (selectedPost) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((comment) => {
                  if (comment.id === commentId) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), newReply],
                      _count: {
                        ...comment._count,
                        replies: comment._count.replies + 1,
                      },
                    };
                  }
                  return comment;
                }),
                _count: {
                  ...prev._count,
                  comments: prev._count.comments + 1,
                },
              }
            : null
        );
      }
    };

    // Apply optimistic update
    updatePostsWithReply(optimisticReply);
    setReplyInputs({ ...replyInputs, [commentId]: "" });
    setReplyingTo(null);
    setIsReplying({ ...isReplying, [commentId]: true });

    try {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          return;
        }
        throw new Error("Failed to reply");
      }

      const realReply = await response.json();

      // Replace optimistic reply with real one
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map((r) =>
                  r.id === tempId ? realReply : r
                ),
              };
            }
            return comment;
          }),
        }))
      );

      if (selectedPost) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((comment) => {
                  if (comment.id === commentId) {
                    return {
                      ...comment,
                      replies: (comment.replies || []).map((r) =>
                        r.id === tempId ? realReply : r
                      ),
                    };
                  }
                  return comment;
                }),
              }
            : null
        );
      }

      toast.success("Reply added!");
      router.refresh();
    } catch (error) {
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((post) => ({
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter((r) => r.id !== tempId),
                _count: {
                  ...comment._count,
                  replies: comment._count.replies - 1,
                },
              };
            }
            return comment;
          }),
          _count: {
            ...post._count,
            comments: post._count.comments - 1,
          },
        }))
      );

      if (selectedPost) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((comment) => {
                  if (comment.id === commentId) {
                    return {
                      ...comment,
                      replies: (comment.replies || []).filter(
                        (r) => r.id !== tempId
                      ),
                      _count: {
                        ...comment._count,
                        replies: comment._count.replies - 1,
                      },
                    };
                  }
                  return comment;
                }),
                _count: {
                  ...prev._count,
                  comments: prev._count.comments - 1,
                },
              }
            : null
        );
      }

      setReplyInputs({ ...replyInputs, [commentId]: content }); // Restore content
      toast.error("Failed to add reply");
    } finally {
      setIsReplying({ ...isReplying, [commentId]: false });
    }
  };

  return (
    <>
      {/* Page Header with Create Post Button */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campus Feed</h1>
          <p className="text-muted-foreground">
            Stay updated with campus news and announcements
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreatePost(true)}
            className="mt-4 w-full rounded-md"
          >
            <IconMessage className="size-4" />
            Create Post
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Feed Controls */}
          <div className="flex items-center justify-between gap-4 py-1">
            <h2 className="text-xl font-semibold hidden sm:block">Feed</h2>
            <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
              <span className="text-sm text-muted-foreground hidden xs:block">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onValueChange={handleSortChange}
                disabled={isLoadingSorted}
              >
                <SelectTrigger className="w-[140px] h-9 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Likes</SelectItem>
                  <SelectItem value="discussed">Most Comments</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edit Post Modal */}
          <Dialog
            open={!!editingPost}
            onOpenChange={(open) => !open && setEditingPost(null)}
          >
            <DialogContent className="sm:max-w-[600px] border-none bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Update your post content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="What's on your mind?"
                  value={editPostContent}
                  onChange={(e) => {
                    setEditPostContent(e.target.value);
                    if (updatePostError) setUpdatePostError(null);
                  }}
                  rows={4}
                  className="resize-none"
                />

                {updatePostError && (
                  <p className="text-sm text-destructive font-medium">
                    {updatePostError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPost(null)}
                    disabled={isUpdatingPost}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePost} disabled={isUpdatingPost}>
                    {isUpdatingPost && (
                      <IconLoader className="animate-spin mr-2 size-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Post Modal - Admin Only */}
          {isAdmin && (
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>
                    Share news and announcements with the campus community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="rounded-lg h-32 w-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                            disabled={isUploadingImage || isPosting}
                          >
                            <IconX className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {createPostError && (
                    <p className="text-sm text-destructive font-medium">
                      {createPostError}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={isUploadingImage || imagePreviews.length >= 3}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage || imagePreviews.length >= 3}
                      >
                        <IconPhoto className="mr-2 size-4" />
                        {imagePreviews.length >= 3
                          ? "Max 3 images"
                          : `Add Photo${imagePreviews.length > 0 ? "s" : ""} (${
                              imagePreviews.length
                            }/3)`}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowCreatePost(false);
                          setNewPostContent("");
                          clearImages();
                        }}
                        disabled={isPosting || isUploadingImage}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createPost}
                        disabled={
                          isPosting ||
                          isUploadingImage ||
                          !newPostContent.trim()
                        }
                      >
                        {isPosting
                          ? isUploadingImage
                            ? "Uploading..."
                            : "Posting..."
                          : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {isLoadingSorted ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <IconMessage className="size-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin
                      ? "Be the first to create a post!"
                      : "Check back later for updates"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="border-0 sm:bg-card sm:border sm:rounded-md mb-2 sm:mb-0"
                >
                  <div className="px-3 py-3 sm:px-6 sm:pt-6 space-y-3 sm:space-y-4 border-b-8 border-muted/50 sm:border-b-0">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ProfileImageDialog
                          image={post.author.image}
                          name={post.author.name}
                        >
                          <Avatar>
                            <AvatarImage src={post.author.image || undefined} />
                            <AvatarFallback>
                              {getInitials(post.author.name)}
                            </AvatarFallback>
                          </Avatar>
                        </ProfileImageDialog>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">
                              {post.author.name}
                            </p>
                            {post.author.role === "ADMIN" && (
                              <Badge variant="secondary" className="text-xs">
                                {post.author.badgeName || "Admin"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(post.id)}
                        >
                          <IconPin
                            className={`size-4 ${
                              post.isPinned ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <IconDots className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShare(post)}>
                            <IconShare className="size-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          {(isAdmin || post.author.id === currentUserId) && (
                            <DropdownMenuItem
                              onClick={() => confirmDelete("post", post.id)}
                            >
                              <IconTrash className="size-4 mr-2 text-destructive" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {post.author.id === currentUserId && (
                            <DropdownMenuItem
                              onClick={() => startEditingPost(post)}
                            >
                              <IconPencil className="size-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {post.isPinned && (
                      <Badge variant="default" className="gap-1">
                        <IconPin className="size-3" />
                        Pinned Post
                      </Badge>
                    )}

                    <p className="text-sm whitespace-pre-wrap">
                      {post.content}
                      {post.updatedAt &&
                        new Date(post.updatedAt).getTime() !==
                          new Date(post.createdAt).getTime() && (
                          <span className="text-muted-foreground text-xs ml-2">
                            (edited)
                          </span>
                        )}
                    </p>

                    {/* Image Grid */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <div className="-mx-3 sm:mx-0 sm:rounded-lg overflow-hidden">
                        <ImageGrid
                          images={post.imageUrls}
                          onImageClick={(index) =>
                            openImageViewer(post.imageUrls, index, post)
                          }
                          post={post}
                        />
                      </div>
                    )}

                    {/* Engagement Stats - CLICKABLE */}
                    <div className="flex items-center gap-4 text-sm border-t pt-2">
                      <button
                        onClick={() => openLikesModal(post)}
                        className="text-muted-foreground hover:text-foreground hover:underline transition"
                        disabled={post._count.likes === 0}
                      >
                        {post._count.likes}{" "}
                        {post._count.likes === 1 ? "like" : "likes"}
                      </button>
                      <button
                        onClick={() => openCommentsModal(post)}
                        className="text-muted-foreground hover:text-foreground hover:underline transition"
                        disabled={post._count.comments === 0}
                      >
                        {post._count.comments}{" "}
                        {post._count.comments === 1 ? "comment" : "comments"}
                      </button>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <IconEye className="size-4" />
                        <span>
                          {post.views} {post.views === 1 ? "view" : "views"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleLike(post.id)}
                      >
                        {isLikedByUser(post) ? (
                          <IconHeartFilled className="mr-2 size-4 fill-red-500 text-red-500" />
                        ) : (
                          <IconHeart className="mr-2 size-4" />
                        )}
                        Like
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => openCommentsModal(post)}
                      >
                        <IconMessage className="mr-2 size-4" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <AdCard />
        </div>
      </div>

      {/* Likes Modal */}
      <Dialog open={likesModalOpen} onOpenChange={setLikesModalOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[70vh] p-0 gap-0">
          <DialogHeader className="px-4 pt-6 pb-4 border-b">
            <DialogTitle>Likes</DialogTitle>
            <DialogDescription>People who liked this post</DialogDescription>
          </DialogHeader>
          <div
            className="overflow-y-auto px-4 py-2"
            style={{ maxHeight: "calc(70vh - 120px)" }}
          >
            {selectedPost?.likes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No likes yet
              </p>
            ) : (
              <div className="space-y-2">
                {selectedPost?.likes.map((like) => (
                  <div
                    key={like.userId}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition"
                  >
                    <ProfileImageDialog
                      image={like.user.image}
                      name={like.user.name}
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={like.user.image || undefined} />
                        <AvatarFallback>
                          {getInitials(like.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </ProfileImageDialog>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {like.user.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Post Modal (Facebook Style) */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[60vh] sm:max-h-[80vh] p-0 gap-0 flex flex-col">
          {/* Header */}
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b shrink-0">
            <DialogTitle className="text-lg sm:text-xl">
              {selectedPost?.author.name}'s Post
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedPost && (
              <div className="p-4 sm:p-6">
                {/* Post Content */}
                <div className="space-y-4 pb-6 border-b">
                  {/* Post Header */}
                  <div className="flex items-start gap-3">
                    <ProfileImageDialog
                      image={selectedPost.author.image}
                      name={selectedPost.author.name}
                    >
                      <Avatar className="size-10 sm:size-12">
                        <AvatarImage
                          src={selectedPost.author.image || undefined}
                        />
                        <AvatarFallback>
                          {getInitials(selectedPost.author.name)}
                        </AvatarFallback>
                      </Avatar>
                    </ProfileImageDialog>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {selectedPost.author.name}
                        </p>
                        {selectedPost.author.role === "ADMIN" && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedPost.author.badgeName || "Admin"}
                          </Badge>
                        )}
                        {selectedPost.isPinned && (
                          <Badge variant="default" className="text-xs gap-1">
                            <IconPin className="size-3" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedPost.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Post Text */}
                  <p className="text-sm sm:text-base whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>

                  {/* Post Image */}
                  {selectedPost.imageUrls &&
                    selectedPost.imageUrls.length > 0 && (
                      <div className="mt-3">
                        <ImageGrid
                          images={selectedPost.imageUrls}
                          onImageClick={(index) =>
                            openImageViewer(
                              selectedPost.imageUrls,
                              index,
                              selectedPost
                            )
                          }
                          post={selectedPost}
                        />
                      </div>
                    )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-sm pt-2">
                    <button
                      onClick={() => openLikesModal(selectedPost!)}
                      className="text-muted-foreground hover:text-foreground hover:underline transition"
                      disabled={selectedPost._count.likes === 0}
                    >
                      {selectedPost._count.likes}{" "}
                      {selectedPost._count.likes === 1 ? "like" : "likes"}
                    </button>
                    <span className="text-muted-foreground">
                      {selectedPost._count.comments}{" "}
                      {selectedPost._count.comments === 1
                        ? "comment"
                        : "comments"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toggleLike(selectedPost!.id);
                      }}
                    >
                      {isLikedByUser(selectedPost!) ? (
                        <IconHeartFilled className="mr-2 size-4 fill-red-500 text-red-500" />
                      ) : (
                        <IconHeart className="mr-2 size-4" />
                      )}
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <IconMessage className="mr-2 size-4" />
                      Comment
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 space-y-6">
                  <h3 className="font-semibold text-base sm:text-lg">
                    Comments ({selectedPost.comments.length})
                  </h3>

                  {selectedPost.comments.length === 0 ? (
                    <div className="text-center py-8">
                      <IconMessage className="size-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedPost.comments.map((comment) => (
                        <div key={comment.id} className="space-y-3 group">
                          {/* Main Comment */}
                          <div className="flex gap-2 sm:gap-3">
                            <ProfileImageDialog
                              image={comment.author.image}
                              name={comment.author.name}
                            >
                              <Avatar className="size-8 sm:size-10 shrink-0">
                                <AvatarImage
                                  src={comment.author.image || undefined}
                                />
                                <AvatarFallback className="text-xs sm:text-sm">
                                  {getInitials(comment.author.name)}
                                </AvatarFallback>
                              </Avatar>
                            </ProfileImageDialog>
                            <div className="flex-1 min-w-0">
                              <div className="bg-muted rounded-2xl px-3 py-2 sm:px-4 sm:py-3 relative">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-sm font-semibold mb-1 truncate">
                                      {comment.author.name}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{comment.author.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {editingCommentId === comment.id ? (
                                  <div className="space-y-2 mt-1">
                                    <Textarea
                                      value={editContent}
                                      onChange={(e) =>
                                        setEditContent(e.target.value)
                                      }
                                      className="min-h-[60px] resize-none text-sm bg-background"
                                      autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={cancelEditing}
                                        disabled={isSavingEdit}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                          saveEditComment(comment.id)
                                        }
                                        disabled={
                                          isSavingEdit || !editContent.trim()
                                        }
                                      >
                                        {isSavingEdit ? (
                                          <IconLoader className="size-3 animate-spin mr-1" />
                                        ) : (
                                          "Save"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm wrap-break-word whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                )}
                                {(isAdmin ||
                                  comment.author.id === currentUserId) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                      >
                                        <IconDots className="size-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {comment.author.id === currentUserId && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            startEditing(
                                              comment.id,
                                              comment.content
                                            )
                                          }
                                        >
                                          <IconPencil className="mr-2 size-4" />
                                          Edit Comment
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() =>
                                          confirmDelete(
                                            "comment",
                                            comment.id,
                                            selectedPost!.id
                                          )
                                        }
                                      >
                                        <IconTrash className="mr-2 size-4" />
                                        Delete Comment
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4 mt-2 ml-3 sm:ml-4 text-xs">
                                <button
                                  onClick={() => toggleCommentLike(comment.id)}
                                  className="flex items-center gap-1 font-semibold hover:underline transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  {isCommentLikedByUser(comment) ? (
                                    <IconHeartFilled className="size-4 fill-red-500 text-red-500" />
                                  ) : (
                                    <IconHeart className="size-4" />
                                  )}
                                  {comment._count.likes > 0 && (
                                    <span>{comment._count.likes}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    setReplyingTo(
                                      replyingTo === comment.id
                                        ? null
                                        : comment.id
                                    )
                                  }
                                  className="font-semibold text-muted-foreground hover:underline hover:text-foreground transition-colors"
                                >
                                  Reply
                                </button>
                                <span className="text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </span>
                              </div>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="mt-3 ml-1 sm:ml-2 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <Avatar className="size-8 shrink-0">
                                    <AvatarImage
                                      src={
                                        posts.find(
                                          (p) => p.author.id === currentUserId
                                        )?.author.image || undefined
                                      }
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(
                                        selectedPost!.author.id ===
                                          currentUserId
                                          ? selectedPost!.author.name
                                          : "You"
                                      )}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 flex gap-2">
                                    <Textarea
                                      value={replyInputs[comment.id] || ""}
                                      onChange={(e) =>
                                        setReplyInputs({
                                          ...replyInputs,
                                          [comment.id]: e.target.value,
                                        })
                                      }
                                      placeholder={`Reply to ${comment.author.name}...`}
                                      className="min-h-[60px] resize-none text-sm rounded-2xl"
                                      autoFocus
                                    />
                                    <Button
                                      size="icon"
                                      className="shrink-0 rounded-full"
                                      onClick={() => replyToComment(comment.id)}
                                      disabled={
                                        !replyInputs[comment.id]?.trim() ||
                                        isReplying[comment.id]
                                      }
                                    >
                                      {isReplying[comment.id] ? (
                                        <IconLoader className="size-4 animate-spin" />
                                      ) : (
                                        <IconSend className="size-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-10 sm:ml-14 space-y-4 border-l-2 border-muted pl-3 sm:pl-4">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="flex gap-2 sm:gap-3 group/reply"
                                >
                                  <Avatar className="size-7 sm:size-8 shrink-0">
                                    <AvatarImage
                                      src={reply.author.image || undefined}
                                    />
                                    <AvatarFallback className="text-[10px] sm:text-xs">
                                      {getInitials(reply.author.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-muted rounded-2xl px-3 py-2 relative">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <p className="text-sm font-semibold mb-1 truncate">
                                            {reply.author.name}
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{reply.author.name}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      {editingCommentId === reply.id ? (
                                        <div className="space-y-2 mt-1">
                                          <Textarea
                                            value={editContent}
                                            onChange={(e) =>
                                              setEditContent(e.target.value)
                                            }
                                            className="min-h-[60px] resize-none text-sm bg-background"
                                            autoFocus
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={cancelEditing}
                                              disabled={isSavingEdit}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={() =>
                                                saveEditComment(reply.id)
                                              }
                                              disabled={
                                                isSavingEdit ||
                                                !editContent.trim()
                                              }
                                            >
                                              {isSavingEdit ? (
                                                <IconLoader className="size-3 animate-spin mr-1" />
                                              ) : (
                                                "Save"
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm wrap-break-word whitespace-pre-wrap">
                                          {reply.content}
                                        </p>
                                      )}
                                      {(isAdmin ||
                                        reply.author.id === currentUserId) && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-100 sm:opacity-0 sm:group-hover/reply:opacity-100 transition-opacity"
                                            >
                                              <IconDots className="size-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {reply.author.id ===
                                              currentUserId && (
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  startEditing(
                                                    reply.id,
                                                    reply.content
                                                  )
                                                }
                                              >
                                                <IconPencil className="mr-2 size-4" />
                                                Edit Reply
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              className="text-red-600 focus:text-red-600"
                                              onClick={() =>
                                                confirmDelete(
                                                  "reply",
                                                  reply.id,
                                                  selectedPost!.id,
                                                  comment.id
                                                )
                                              }
                                            >
                                              <IconTrash className="mr-2 size-4" />
                                              Delete Reply
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 ml-3 text-xs">
                                      <button
                                        onClick={() =>
                                          toggleCommentLike(reply.id)
                                        }
                                        className="flex items-center gap-1 font-semibold hover:underline transition-colors text-muted-foreground hover:text-foreground"
                                      >
                                        {isCommentLikedByUser(reply) ? (
                                          <IconHeartFilled className="size-4 fill-red-500 text-red-500" />
                                        ) : (
                                          <IconHeart className="size-4" />
                                        )}
                                        {reply._count.likes > 0 && (
                                          <span>{reply._count.likes}</span>
                                        )}
                                      </button>
                                      <span className="text-muted-foreground">
                                        {formatDistanceToNow(
                                          new Date(reply.createdAt),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Comment Input at Bottom */}
          <div className="shrink-0 border-t bg-background p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <Avatar className="size-8 sm:size-10 shrink-0">
                <AvatarImage
                  src={
                    selectedPost?.author.id === currentUserId
                      ? selectedPost.author.image || undefined
                      : undefined
                  }
                />
                <AvatarFallback className="text-xs sm:text-sm">
                  {selectedPost &&
                    getInitials(
                      selectedPost.author.id === currentUserId
                        ? selectedPost.author.name
                        : "You"
                    )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2 min-w-0">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentInputs[selectedPost?.id || ""] || ""}
                  onChange={(e) =>
                    setCommentInputs({
                      ...commentInputs,
                      [selectedPost?.id || ""]: e.target.value,
                    })
                  }
                  className="resize-none rounded-2xl text-sm min-h-[40px] max-h-[120px] w-full"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && selectedPost) {
                      e.preventDefault();
                      addComment(selectedPost.id);
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => selectedPost && addComment(selectedPost.id)}
                  disabled={
                    !commentInputs[selectedPost?.id || ""]?.trim() ||
                    isCommenting[selectedPost?.id || ""]
                  }
                >
                  {isCommenting[selectedPost?.id || ""] ? (
                    <IconLoader className="size-4 animate-spin" />
                  ) : (
                    <IconSend className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-12 sm:ml-14">
              Press Enter to post, Shift + Enter for new line
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <IconLoader className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-[100vw] w-screen max-h-screen h-screen p-0 gap-0 bg-black/95 md:max-w-[90vw] md:h-[90vh] md:max-h-[90vh]">
          <VisuallyHidden>
            <DialogHeader>Image Viewer</DialogHeader>
          </VisuallyHidden>
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Side - Image */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              {/* Close Button - Top Right (Mobile) */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white md:hidden"
                onClick={() => setImageViewerOpen(false)}
              >
                <X className="size-6" />
              </Button>

              {/* Navigation Buttons */}
              {viewerImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={prevImage}
                  >
                    <IconChevronLeft className="size-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={nextImage}
                  >
                    <IconChevronRight className="size-6" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              {viewerImages.length > 1 && (
                <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {viewerImages.length}
                </div>
              )}

              {/* Main Image */}
              <img
                src={viewerImages[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>

            {/* Mobile Action Bar - Bottom */}
            {viewerPost && (
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-4 md:hidden">
                <div className="flex items-center gap-3 mb-3">
                  <ProfileImageDialog
                    image={viewerPost?.author.image || null}
                    name={viewerPost?.author.name || ""}
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={viewerPost?.author.image || undefined}
                      />
                      <AvatarFallback>
                        {viewerPost && getInitials(viewerPost.author.name)}
                      </AvatarFallback>
                    </Avatar>
                  </ProfileImageDialog>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">
                      {viewerPost?.author.name}
                    </p>
                    <p className="text-xs text-gray-300">
                      {formatDistanceToNow(new Date(viewerPost.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-white hover:bg-white/10"
                    onClick={() => toggleLike(viewerPost.id)}
                  >
                    {isLikedByUser(viewerPost) ? (
                      <IconHeart className="mr-2 size-4 fill-red-500 text-red-500" />
                    ) : (
                      <IconHeart className="mr-2 size-4" />
                    )}
                    {viewerPost._count.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-white hover:bg-white/10"
                    onClick={() => {
                      setImageViewerOpen(false);
                      openCommentsModal(viewerPost);
                    }}
                  >
                    <MessageCircle className="mr-2 size-4" />
                    {viewerPost._count.comments}
                  </Button>
                </div>
              </div>
            )}

            {/* Right Side - Post Info */}
            <div className="hidden md:flex md:w-[350px] lg:w-[400px] bg-background border-l flex-col">
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <ProfileImageDialog
                  image={viewerPost?.author.image || null}
                  name={viewerPost?.author.name || ""}
                >
                  <Avatar className="size-10">
                    <AvatarImage src={viewerPost?.author.image || undefined} />
                    <AvatarFallback>
                      {viewerPost && getInitials(viewerPost.author.name)}
                    </AvatarFallback>
                  </Avatar>
                </ProfileImageDialog>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {viewerPost?.author.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewerPost &&
                      formatDistanceToNow(new Date(viewerPost.createdAt), {
                        addSuffix: true,
                      })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {viewerPost?.content}
                </p>
              </div>

              {/* Engagement Stats */}
              {viewerPost && (
                <div className="p-4 border-t space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => openLikesModal(viewerPost)}
                      className="text-muted-foreground hover:text-foreground hover:underline transition"
                      disabled={viewerPost._count.likes === 0}
                    >
                      {viewerPost._count.likes}{" "}
                      {viewerPost._count.likes === 1 ? "like" : "likes"}
                    </button>
                    <button
                      onClick={() => {
                        setImageViewerOpen(false);
                        openCommentsModal(viewerPost);
                      }}
                      className="text-muted-foreground hover:text-foreground hover:underline transition"
                      disabled={viewerPost._count.comments === 0}
                    >
                      {viewerPost._count.comments}{" "}
                      {viewerPost._count.comments === 1
                        ? "comment"
                        : "comments"}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleLike(viewerPost.id)}
                    >
                      {isLikedByUser(viewerPost) ? (
                        <IconHeartFilled className="mr-2 size-4 fill-red-500 text-red-500" />
                      ) : (
                        <IconHeart className="mr-2 size-4" />
                      )}
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setImageViewerOpen(false);
                        openCommentsModal(viewerPost);
                      }}
                    >
                      <IconMessage className="mr-2 size-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
