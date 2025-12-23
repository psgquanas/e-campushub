"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  IconTrophy,
  IconFileDescription,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconMessageCircle,
  IconArrowRight,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconDots,
  IconShare,
  IconTrash,
  IconSend,
  IconEye,
  IconLoader,
  IconEdit,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ProfileImageDialog } from "@/components/ProfileImageDialog";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";

interface User {
  id: string;
  name: string;
  image: string | null;
  currentLevel: number | null;
  points: number;
}

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
  isPinned?: boolean;
  views: number;
  createdAt: Date;
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
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  }[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  user: {
    name: string;
    image: string | null;
    level: number;
  };
  totalPoints: number;
}

interface Material {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  course: {
    code: string;
  };
  fileUrl: string;
}

interface DashboardClientProps {
  currentUser: User;
  userRank: number | null;
  userPoints: number;
  recentPosts: Post[];
  topLeaderboard: LeaderboardEntry[];
  recentMaterials: Material[];
  isAdmin: boolean;
}

function ImageGrid({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (index: number) => void;
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

export default function DashboardClient({
  currentUser,
  userRank,
  userPoints,
  recentPosts,
  topLeaderboard,
  recentMaterials,
  isAdmin,
}: DashboardClientProps) {
  const router = useRouter();
  const currentUserId = currentUser.id;

  // Posts state for optimistic updates
  const [posts, setPosts] = useState<Post[]>(recentPosts);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal states
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});

  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "post" | "comment";
    id: string;
    postId?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const saveEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    // Optimistically update
    const previousPosts = [...posts];
    const previousSelectedPost = selectedPost ? { ...selectedPost } : null;

    // Update local state immediately
    const updatedContent = editContent;
    setEditingCommentId(null);
    setEditContent("");

    // Update posts state
    setPosts((prevPosts) =>
      prevPosts.map((post) => ({
        ...post,
        comments: post.comments.map((c) => {
          if (c.id === commentId) return { ...c, content: updatedContent };
          // Check replies
          if (c.replies?.some((r) => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, content: updatedContent } : r
              ),
            };
          }
          return c;
        }),
      }))
    );

    // Update selectedPost state if open
    if (selectedPost) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) => {
                if (c.id === commentId)
                  return { ...c, content: updatedContent };
                if (c.replies?.some((r) => r.id === commentId)) {
                  return {
                    ...c,
                    replies: c.replies.map((r) =>
                      r.id === commentId ? { ...r, content: updatedContent } : r
                    ),
                  };
                }
                return c;
              }),
            }
          : null
      );
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (!response.ok) throw new Error("Failed to update comment");

      // router.refresh() is not needed for optimistic UI unless structure changes deeply
      // keeping it removed for true optimistic feel, or silent refresh
      router.refresh();
    } catch (error) {
      // Revert changes on error
      setPosts(previousPosts);
      setSelectedPost(previousSelectedPost);
      toast.error("Failed to update comment");
      setEditingCommentId(commentId);
      setEditContent(updatedContent);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openImageViewer = (images: string[], startIndex: number) => {
    setViewerImages(images);
    setCurrentImageIndex(startIndex);
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

  const toggleLike = async (postId: string) => {
    // Find the post
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.some((like) => like.userId === currentUserId);

    // Track view when liking a post
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

    // Make API call in background
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          throw new Error("Rate limit exceeded");
        }
        throw new Error("Failed to toggle like");
      }
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
      toast.error("Failed to update like");
    }
  };

  const isCommentLikedByUser = (comment: Comment) => {
    return (
      comment.likes?.some((like) => like.userId === currentUserId) || false
    );
  };

  const openLikesModal = (post: Post) => {
    setSelectedPost(post);
    setLikesModalOpen(true);
    // Track view when opening likes modal
    trackView(post.id);
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

  const openCommentsModal = (post: Post) => {
    setSelectedPost(post);
    setCommentsModalOpen(true);
    // Track view when opening comments
    trackView(post.id);
  };

  const addComment = async (postId?: string) => {
    const targetPostId = postId || selectedPost?.id;
    if (!targetPostId) return;

    const content = commentInputs[targetPostId]?.trim();
    if (!content) return;

    const tempId = `temp-${Date.now()}`;

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUser.name,
        image: currentUser.image,
      },
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === targetPostId) {
          return {
            ...p,
            comments: [...p.comments, optimisticComment],
            _count: {
              ...p._count,
              comments: p._count.comments + 1,
            },
          };
        }
        return p;
      })
    );

    // Update selected post
    if (selectedPost?.id === targetPostId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, optimisticComment],
              _count: {
                ...prev._count,
                comments: prev._count.comments + 1,
              },
            }
          : null
      );
    }

    setCommentInputs((prev) => ({ ...prev, [targetPostId]: "" }));
    setIsCommenting((prev) => ({ ...prev, [targetPostId]: true }));

    // Make API call in background
    try {
      const response = await fetch(`/api/posts/${targetPostId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          throw new Error("Rate limit exceeded");
        }
        throw new Error("Failed to add comment");
      }

      const { comment: realComment } = await response.json();

      // Replace temp comment with real one
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === targetPostId) {
            return {
              ...p,
              comments: p.comments.map((c) =>
                c.id === tempId ? realComment : c
              ),
            };
          }
          return p;
        })
      );

      if (selectedPost?.id === targetPostId) {
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
    } catch (error) {
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === targetPostId) {
            return {
              ...p,
              comments: p.comments.filter((c) => c.id !== tempId),
              _count: {
                ...p._count,
                comments: p._count.comments - 1,
              },
            };
          }
          return p;
        })
      );

      if (selectedPost?.id === targetPostId) {
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

      toast.error("Failed to add comment");
    } finally {
      setIsCommenting((prev) => ({ ...prev, [targetPostId]: false }));
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!selectedPost) return;

    // Find the comment and check if it's currently liked
    const comment = selectedPost.comments.find((c) => c.id === commentId);
    if (!comment) return;

    const isLiked = isCommentLikedByUser(comment);

    // Optimistic update helper
    const updateCommentLikes = (c: Comment, liked: boolean) => {
      if (c.id !== commentId) return c;

      const newLikes = liked
        ? [...(c.likes || []), { userId: currentUserId }]
        : (c.likes || []).filter((l) => l.userId !== currentUserId);

      return {
        ...c,
        likes: newLikes,
        _count: {
          ...c._count,
          likes: liked ? c._count.likes + 1 : c._count.likes - 1,
        },
      };
    };

    // Apply optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === selectedPost.id) {
          return {
            ...p,
            comments: p.comments.map((c) => updateCommentLikes(c, !isLiked)),
          };
        }
        return p;
      })
    );

    setSelectedPost((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.map((c) => updateCommentLikes(c, !isLiked)),
          }
        : null
    );

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.message || "Too many attempts. Try again later.");
          // Revert will happen in catch block if we throw here, but we need to revert manually if we return
          throw new Error("Rate limit exceeded");
        }
        throw new Error("Failed to toggle like");
      }

      // No need to refresh router for silent update, local state is already correct
    } catch (error) {
      console.error("Error toggling comment like:", error);
      toast.error("Failed to like comment");

      // Revert optimistic update on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === selectedPost.id) {
            return {
              ...p,
              comments: p.comments.map((c) => updateCommentLikes(c, isLiked)),
            };
          }
          return p;
        })
      );

      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                updateCommentLikes(c, isLiked)
              ),
            }
          : null
      );
    }
  };

  const addReply = async (commentId: string) => {
    if (!selectedPost) return;

    const content = commentInputs[selectedPost.id]?.trim();
    if (!content) return;

    const tempId = `temp-reply-${Date.now()}`;

    // Create optimistic reply
    const optimisticReply: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUser.name,
        image: currentUser.image,
      },
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    setIsReplying(true);
    setCommentInputs((prev) => ({ ...prev, [selectedPost.id]: "" }));
    setReplyingTo(null);

    // Helper to add reply to specific comment
    const addReplyToComment = (c: Comment) => {
      if (c.id !== commentId) return c;
      return {
        ...c,
        replies: [...(c.replies || []), optimisticReply],
        _count: {
          ...c._count,
          replies: c._count.replies + 1,
        },
      };
    };

    // Apply optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === selectedPost.id) {
          return {
            ...p,
            comments: p.comments.map(addReplyToComment),
          };
        }
        return p;
      })
    );

    setSelectedPost((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.map(addReplyToComment),
          }
        : null
    );

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
          throw new Error("Rate limit exceeded");
        }
        throw new Error("Failed to reply");
      }

      const realReply = await response.json();

      // Replace temp reply with real one
      const replaceTempReply = (c: Comment) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies || []).map((r) =>
            r.id === tempId ? realReply : r
          ),
        };
      };

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === selectedPost.id) {
            return {
              ...p,
              comments: p.comments.map(replaceTempReply),
            };
          }
          return p;
        })
      );

      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map(replaceTempReply),
            }
          : null
      );
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");

      const removeTempReply = (c: Comment) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== tempId),
          _count: {
            ...c._count,
            replies: c._count.replies - 1,
          },
        };
      };

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === selectedPost.id) {
            return {
              ...p,
              comments: p.comments.map(removeTempReply),
            };
          }
          return p;
        })
      );

      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map(removeTempReply),
            }
          : null
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/dashboard/feed/${post.id}`;
    const shareData = {
      title: `Post by ${post.author.name}`,
      text:
        post.content.slice(0, 100) + (post.content.length > 100 ? "..." : ""),
      url: shareUrl,
    };

    // Try native share first (works well on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; // Success, exit early
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return; // User cancelled, don't show error
        }
        // Fall through to clipboard method if share fails
      }
    }

    // Fallback copy function using multiple methods
    const copyToClipboard = async (text: string): Promise<boolean> => {
      // Method 1: Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          console.log("Clipboard API failed, trying fallback");
        }
      }

      // Method 2: Fallback using textarea (works on most mobile browsers)
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        // Make it invisible but accessible
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        textarea.style.top = "-999999px";
        textarea.setAttribute("readonly", "");

        document.body.appendChild(textarea);

        // Select the text
        textarea.focus();
        textarea.select();

        // iOS specific selection
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        textarea.setSelectionRange(0, textarea.value.length);

        // Copy command
        const successful = document.execCommand("copy");

        document.body.removeChild(textarea);

        return successful;
      } catch (e) {
        console.error("Fallback copy failed:", e);
        return false;
      }
    };

    // Try to copy
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      toast.success("Link copied to clipboard!");
    } else {
      // Last resort: Show the URL for manual copying
      toast.info(
        <div className="flex flex-col gap-2">
          <p className="font-medium">Copy this link:</p>
          <p className="text-xs break-all bg-muted p-2 rounded">{shareUrl}</p>
        </div>,
        {
          duration: 10000,
        }
      );
    }
  };

  const confirmDelete = (
    type: "post" | "comment",
    id: string,
    postId?: string
  ) => {
    setItemToDelete({ type, id, postId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);

    // Store previous state for rollback
    const previousPosts = [...posts];
    const previousSelectedPost = selectedPost ? { ...selectedPost } : null;
    const itemType = itemToDelete.type;
    const itemId = itemToDelete.id;

    try {
      if (itemType === "post") {
        // Optimistic delete for post
        setPosts((prev) => prev.filter((p) => p.id !== itemId));

        const response = await fetch(`/api/posts/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete post");

        toast.success("Post deleted successfully");
        router.refresh();
      } else if (itemType === "comment") {
        // Optimistic delete for comment

        // Helper to process comments list
        const updateComments = (
          comments: Comment[],
          idToDelete: string
        ): Comment[] => {
          // Check if it's a top-level comment
          if (comments.some((c) => c.id === idToDelete)) {
            return comments.filter((c) => c.id !== idToDelete);
          }

          // Check if it's a reply inside a comment
          return comments.map((c) => {
            if (c.replies?.some((r) => r.id === idToDelete)) {
              return {
                ...c,
                replies: c.replies.filter((r) => r.id !== idToDelete),
                _count: {
                  ...c._count,
                  replies: Math.max(0, c._count.replies - 1),
                },
              };
            }
            return c;
          });
        };

        // Update posts state
        setPosts((prevPosts) =>
          prevPosts.map((post) => ({
            ...post,
            comments: updateComments(post.comments, itemId),
            _count: {
              ...post._count,
              comments: post.comments.some((c) => c.id === itemId)
                ? post._count.comments - 1
                : post._count.comments,
            },
          }))
        );

        // Update selectedPost state
        if (selectedPost) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  comments: updateComments(prev.comments, itemId),
                  _count: {
                    ...prev._count,
                    comments: prev.comments.some((c) => c.id === itemId)
                      ? Math.max(0, prev._count.comments - 1)
                      : prev._count.comments,
                  },
                }
              : null
          );
        }

        const response = await fetch(`/api/comments/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete comment");

        // Silent success for comments as requested
        router.refresh();
      }
    } catch (error) {
      // Revert on error
      if (itemType === "post") {
        setPosts(previousPosts);
      } else if (itemType === "comment") {
        setPosts(previousPosts);
        setSelectedPost(previousSelectedPost);
      }
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {currentUser.name}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's what's happening on campus
          </p>
        </div>

        {userRank && (
          <Card className="w-full rounded-md sm:w-auto">
            <CardContent className="flex items-center gap-3 sm:p-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                <IconTrophy className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#{userRank}</p>
                <p className="text-xs text-muted-foreground">
                  {userPoints} points
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Campus Feed (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campus Feed Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Campus Feed</h2>
            <Link href="/dashboard/feed">
              <Button variant="ghost" size="sm">
                View All
                <IconArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>

          {/* Posts Feed - Facebook-style on mobile, cards on desktop */}
          <div className="space-y-0 sm:space-y-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <p>No posts yet. Be the first to share something!</p>
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
                            <IconShare className="mr-2 size-4" />
                            Share Post
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => confirmDelete("post", post.id)}
                            >
                              <IconTrash className="mr-2 size-4" />
                              Delete Post
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Post Content */}
                    <p className="text-sm whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Image Grid - Full width on mobile */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <div className="-mx-3 sm:mx-0 sm:rounded-lg overflow-hidden">
                        <ImageGrid
                          images={post.imageUrls}
                          onImageClick={(index) =>
                            openImageViewer(post.imageUrls, index)
                          }
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

        {/* Right Column - Widgets (1/3 width on desktop, sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Leaderboard Widget */}
          <Card className="rounded-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Performers</CardTitle>
              <Link href="/dashboard/leaderboard">
                <Button variant="ghost" size="sm">
                  View All
                  <IconArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {topLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 font-bold text-sm">
                    {entry.rank}
                  </div>
                  <ProfileImageDialog
                    image={entry.user.image}
                    name={entry.user.name}
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={entry.user.image || undefined} />
                      <AvatarFallback>
                        {entry.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </ProfileImageDialog>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entry.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {entry.user.level}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{entry.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Course Materials Widget */}
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Materials</CardTitle>
                <Link href="/dashboard/course-materials">
                  <Button variant="ghost" size="sm">
                    View All
                    <IconArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMaterials.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <IconFileDescription className="size-8 mx-auto mb-2 opacity-50" />
                    <p>No materials yet</p>
                  </div>
                ) : (
                  recentMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() =>
                        setPreviewFile({
                          url: material.fileUrl,
                          name: material.title,
                        })
                      }
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                    >
                      <IconFileDescription className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">
                          {material.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            className={`${getTypeColor(material.type)} text-xs`}
                          >
                            {material.type.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {material.course.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <IconClock className="size-3" />
                          {formatDistanceToNow(new Date(material.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <FilePreviewDialog
              isOpen={!!previewFile}
              onClose={() => setPreviewFile(null)}
              fileUrl={previewFile?.url || null}
              fileName={previewFile?.name || ""}
            />
          </>
        </div>
      </div>

      {/* Likes Modal */}
      <Dialog open={likesModalOpen} onOpenChange={setLikesModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-0 gap-0">
          <DialogHeader className="px-4 pt-6 pb-4 border-b">
            <DialogTitle>Likes</DialogTitle>
            <DialogDescription>People who liked this post</DialogDescription>
          </DialogHeader>
          <div
            className="overflow-y-auto px-4 py-2"
            style={{
              maxHeight:
                (selectedPost?.likes.length || 0) > 5 ? "400px" : "auto",
            }}
          >
            {selectedPost?.likes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No likes yet
              </p>
            ) : (
              <div className="space-y-3">
                {selectedPost?.likes.map((like) => (
                  <div key={like.userId} className="flex items-center gap-3">
                    <ProfileImageDialog
                      image={like.user.image}
                      name={like.user.name}
                    >
                      <Avatar>
                        <AvatarImage src={like.user.image || undefined} />
                        <AvatarFallback>
                          {getInitials(like.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </ProfileImageDialog>
                    <p className="font-medium">{like.user.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] h-[60vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 pt-6 pb-4 border-b">
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              {selectedPost?._count.comments || 0}{" "}
              {selectedPost?._count.comments === 1 ? "comment" : "comments"}
            </DialogDescription>
          </DialogHeader>
          <div
            className="overflow-y-auto px-4 py-2 flex-1"
            style={{
              maxHeight:
                (selectedPost?.comments.length || 0) > 3
                  ? "450px"
                  : (selectedPost?.comments.length || 0) > 2
                    ? "300px"
                    : "auto",
            }}
          >
            {selectedPost?.comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {selectedPost?.comments.map((comment) => (
                  <div key={comment.id}>
                    <div className="flex gap-3">
                      <ProfileImageDialog
                        image={comment.author.image}
                        name={comment.author.name}
                      >
                        <Avatar className="size-8">
                          <AvatarImage
                            src={comment.author.image || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(comment.author.name)}
                          </AvatarFallback>
                        </Avatar>
                      </ProfileImageDialog>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3 group relative">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-sm">
                              {comment.author.name}
                            </p>
                            {(comment.author.id === currentUser.id ||
                              isAdmin) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <IconDots className="size-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {comment.author.id === currentUser.id && (
                                    <DropdownMenuItem
                                      onClick={() => handleEditComment(comment)}
                                    >
                                      <IconEdit className="mr-2 size-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() =>
                                      confirmDelete("comment", comment.id)
                                    }
                                  >
                                    <IconTrash className="mr-2 size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] text-sm"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCommentId(null)}
                                  disabled={isSavingEdit}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveEditComment(comment.id)}
                                  disabled={isSavingEdit || !editContent.trim()}
                                >
                                  {isSavingEdit ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{comment.content}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <button
                            onClick={() => toggleCommentLike(comment.id)}
                            className="flex items-center gap-1 hover:text-foreground transition"
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
                            onClick={() => {
                              setReplyingTo(comment.id);
                              document
                                .getElementById("comment-input-area")
                                ?.focus();
                            }}
                            className="hover:text-foreground transition"
                          >
                            Reply
                            {comment._count?.replies > 0 &&
                              ` (${comment._count.replies})`}
                          </button>
                        </div>

                        {/* Display Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-6 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <ProfileImageDialog
                                  image={reply.author.image}
                                  name={reply.author.name}
                                >
                                  <Avatar className="size-6">
                                    <AvatarImage
                                      src={reply.author.image || undefined}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(reply.author.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </ProfileImageDialog>
                                <div className="flex-1">
                                  <div className="bg-muted/50 rounded-lg p-2 group relative">
                                    <div className="flex items-start justify-between">
                                      <p className="font-semibold text-xs">
                                        {reply.author.name}
                                      </p>
                                      {(reply.author.id === currentUser.id ||
                                        isAdmin) && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                            >
                                              <IconDots className="size-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {reply.author.id ===
                                              currentUser.id && (
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  handleEditComment(reply)
                                                }
                                              >
                                                <IconEdit className="mr-2 size-4" />
                                                Edit
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              className="text-red-600 focus:text-red-600"
                                              onClick={() =>
                                                confirmDelete(
                                                  "comment",
                                                  reply.id
                                                )
                                              }
                                            >
                                              <IconTrash className="mr-2 size-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    {editingCommentId === reply.id ? (
                                      <div className="mt-1 space-y-2">
                                        <Textarea
                                          value={editContent}
                                          onChange={(e) =>
                                            setEditContent(e.target.value)
                                          }
                                          className="min-h-[40px] text-xs"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              setEditingCommentId(null)
                                            }
                                            disabled={isSavingEdit}
                                            className="h-6 text-xs"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              saveEditComment(reply.id)
                                            }
                                            disabled={
                                              isSavingEdit ||
                                              !editContent.trim()
                                            }
                                            className="h-6 text-xs"
                                          >
                                            {isSavingEdit ? "..." : "Save"}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs">{reply.content}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Fixed Comment Input at Bottom */}
          <div className="shrink-0 border-t bg-background p-3 sm:p-4">
            {replyingTo && (
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg mb-2 text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  Replying to{" "}
                  <span className="font-semibold text-foreground">
                    {selectedPost?.comments.find((c) => c.id === replyingTo)
                      ?.author.name || "deleted user"}
                  </span>
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3 sm:size-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <Avatar className="size-8 sm:size-10 shrink-0">
                <AvatarImage src={currentUser.image || undefined} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2 min-w-0">
                <Textarea
                  id="comment-input-area"
                  placeholder={
                    replyingTo ? "Write a reply..." : "Write a comment..."
                  }
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
                      if (replyingTo) {
                        addReply(replyingTo);
                      } else {
                        addComment(selectedPost.id);
                      }
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => {
                    if (!selectedPost) return;
                    if (replyingTo) {
                      addReply(replyingTo);
                    } else {
                      addComment(selectedPost.id);
                    }
                  }}
                  disabled={
                    !commentInputs[selectedPost?.id || ""]?.trim() ||
                    isCommenting[selectedPost?.id || ""] ||
                    isReplying
                  }
                >
                  {isCommenting[selectedPost?.id || ""] || isReplying ? (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{" "}
              {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="absolute top-0 right-0 z-50 p-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setImageViewerOpen(false)}
            >
              <IconX className="size-4" />
            </Button>
          </DialogHeader>
          <div className="relative">
            <img
              src={viewerImages[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />
            {viewerImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevImage}
                >
                  <IconChevronLeft className="size-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextImage}
                >
                  <IconChevronRight className="size-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {viewerImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
