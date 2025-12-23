"use client";

import { useState, useEffect } from "react";
import { confessionCreateSchema } from "@/lib/validation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconSend,
  IconLoader,
  IconDots,
  IconTrash,
  IconEye,
  IconFlag,
  IconEyeOff,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  isAnonymous: boolean;
  likes?: { userId: string }[];
  replies?: Comment[];
  _count: {
    likes: number;
    replies: number;
  };
}

interface Confession {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  views: number;
  reportCount: number;
  isHidden: boolean;
  likes: {
    userId: string;
  }[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

type SortOption = "newest" | "popular" | "discussed" | "trending";

interface CurrentUser {
  id: string;
  name: string;
  image: string | null;
}

interface AnonymousClientProps {
  initialConfessions: Confession[];
  currentUser: CurrentUser;
  isAdmin: boolean;
}

// Generate consistent color based on ID
const getAvatarColor = (id: string) => {
  const colors = [
    "bg-purple-500",
    "bg-pink-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function AnonymousClient({
  initialConfessions,
  currentUser,
  isAdmin,
}: AnonymousClientProps) {
  const router = useRouter();
  const currentUserId = currentUser.id;

  const [confessions, setConfessions] = useState(initialConfessions);
  const [newConfession, setNewConfession] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Comment states (matches CampusFeedClient structure)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [commentAnonymous, setCommentAnonymous] = useState<
    Record<string, boolean>
  >({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});

  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

  // Modal states (matches CampusFeedClient)
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedConfession, setSelectedConfession] =
    useState<Confession | null>(null);

  // Sorting states
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoadingSorted, setIsLoadingSorted] = useState(false);

  // Report states
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [confessionToReport, setConfessionToReport] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState("harassment");
  const [isReporting, setIsReporting] = useState(false);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "confession" | "comment" | "reply";
    id: string;
    confessionId?: string;
    commentId?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync with initial data when refreshed
  useEffect(() => {
    setConfessions(initialConfessions);
  }, [initialConfessions]);

  const isLikedByUser = (confession: Confession) => {
    return confession.likes.some((like) => like.userId === currentUserId);
  };

  const isCommentLikedByUser = (comment: Comment) => {
    return (
      comment.likes?.some((like) => like.userId === currentUserId) || false
    );
  };

  const createConfession = async () => {
    const result = confessionCreateSchema.safeParse({ content: newConfession });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newConfession }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create confession");
      }

      toast.success("Confession posted anonymously!");
      setNewConfession("");
      setShowCreateModal(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to post confession");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (confessionId: string) => {
    const confession = confessions.find((c) => c.id === confessionId);
    if (!confession) return;

    const isLiked = isLikedByUser(confession);

    // Optimistic update
    setConfessions((prev) =>
      prev.map((c) => {
        if (c.id === confessionId) {
          return {
            ...c,
            likes: isLiked
              ? c.likes.filter((l) => l.userId !== currentUserId)
              : [...c.likes, { userId: currentUserId }],
            _count: {
              ...c._count,
              likes: isLiked ? c._count.likes - 1 : c._count.likes + 1,
            },
          };
        }
        return c;
      })
    );

    if (selectedConfession?.id === confessionId) {
      setSelectedConfession((prev) =>
        prev
          ? {
              ...prev,
              likes: isLiked
                ? prev.likes.filter((l) => l.userId !== currentUserId)
                : [...prev.likes, { userId: currentUserId }],
              _count: {
                ...prev._count,
                likes: isLiked ? prev._count.likes - 1 : prev._count.likes + 1,
              },
            }
          : null
      );
    }

    try {
      const response = await fetch(`/api/confessions/${confessionId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
    } catch (error) {
      // Revert
      setConfessions((prev) =>
        prev.map((c) => {
          if (c.id === confessionId) {
            return {
              ...c,
              likes: isLiked
                ? [...c.likes, { userId: currentUserId }]
                : c.likes.filter((l) => l.userId !== currentUserId),
              _count: {
                ...c._count,
                likes: isLiked ? c._count.likes + 1 : c._count.likes - 1,
              },
            };
          }
          return c;
        })
      );
      toast.error("Failed to update like");
    }
  };

  const addComment = async (confessionId: string) => {
    const content = commentInputs[confessionId]?.trim();
    if (!content) return;

    const isAnonymous = commentAnonymous[confessionId] ?? true;
    const tempId = `temp-${Date.now()}`;

    const optimisticComment: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUser.name,
        image: currentUser.image,
      },
      isAnonymous,
      likes: [],
      replies: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    setConfessions((prev) =>
      prev.map((c) => {
        if (c.id === confessionId) {
          return {
            ...c,
            comments: [...c.comments, optimisticComment],
            _count: {
              ...c._count,
              comments: c._count.comments + 1,
            },
          };
        }
        return c;
      })
    );

    if (selectedConfession?.id === confessionId) {
      setSelectedConfession((prev) =>
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

    setCommentInputs((prev) => ({ ...prev, [confessionId]: "" }));
    setIsCommenting((prev) => ({ ...prev, [confessionId]: true }));

    try {
      const response = await fetch(`/api/confessions/${confessionId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isAnonymous }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const realComment = await response.json();

      setConfessions((prev) =>
        prev.map((c) => {
          if (c.id === confessionId) {
            return {
              ...c,
              comments: c.comments.map((cm) =>
                cm.id === tempId ? realComment : cm
              ),
            };
          }
          return c;
        })
      );

      if (selectedConfession?.id === confessionId) {
        setSelectedConfession((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((cm) =>
                  cm.id === tempId ? realComment : cm
                ),
              }
            : null
        );
      }

      router.refresh();
    } catch (error) {
      // Revert
      setConfessions((prev) =>
        prev.map((c) => {
          if (c.id === confessionId) {
            return {
              ...c,
              comments: c.comments.filter((cm) => cm.id !== tempId),
              _count: {
                ...c._count,
                comments: c._count.comments - 1,
              },
            };
          }
          return c;
        })
      );

      setCommentInputs((prev) => ({ ...prev, [confessionId]: content }));
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting((prev) => ({ ...prev, [confessionId]: false }));
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      let isCurrentlyLiked = false;

      // Find in comments
      for (const confession of confessions) {
        const comment = confession.comments.find((c) => c.id === commentId);
        if (comment) {
          isCurrentlyLiked = isCommentLikedByUser(comment);
          break;
        }
        // Check in replies
        for (const comment of confession.comments) {
          const reply = comment.replies?.find((r) => r.id === commentId);
          if (reply) {
            isCurrentlyLiked = isCommentLikedByUser(reply);
            break;
          }
        }
      }

      const response = await fetch(
        `/api/confessions/comments/${commentId}/like`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const liked = !isCurrentlyLiked;

      // Update state
      setConfessions((prevConfessions) =>
        prevConfessions.map((confession) => ({
          ...confession,
          comments: confession.comments.map((comment) => {
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
            // Check replies
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

      if (selectedConfession) {
        setSelectedConfession((prev) =>
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

      router.refresh();
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const replyToComment = async (commentId: string) => {
    const content = replyInputs[commentId]?.trim();
    if (!content) return;

    const isAnonymous = commentAnonymous[`reply-${commentId}`] ?? true;
    const tempId = `temp-reply-${Date.now()}`;

    const optimisticReply: Comment = {
      id: tempId,
      content,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUser.name,
        image: currentUser.image,
      },
      isAnonymous,
      likes: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    };

    setIsReplying({ ...isReplying, [commentId]: true });
    setReplyInputs({ ...replyInputs, [commentId]: "" });
    setReplyingTo(null);

    setConfessions((prevConfessions) =>
      prevConfessions.map((confession) => ({
        ...confession,
        comments: confession.comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), optimisticReply],
              _count: {
                ...comment._count,
                replies: comment._count.replies + 1,
              },
            };
          }
          return comment;
        }),
        _count: {
          ...confession._count,
          comments: confession._count.comments + 1,
        },
      }))
    );

    if (selectedConfession) {
      setSelectedConfession((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((comment) => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), optimisticReply],
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

    try {
      const response = await fetch(
        `/api/confessions/${selectedConfession?.id}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, isAnonymous, parentId: commentId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reply");
      }

      const realReply = await response.json();

      setConfessions((prevConfessions) =>
        prevConfessions.map((confession) => ({
          ...confession,
          comments: confession.comments.map((comment) => {
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

      if (selectedConfession) {
        setSelectedConfession((prev) =>
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

      router.refresh();
    } catch (error) {
      // Revert
      setConfessions((prevConfessions) =>
        prevConfessions.map((confession) => ({
          ...confession,
          comments: confession.comments.map((comment) => {
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
            ...confession._count,
            comments: confession._count.comments - 1,
          },
        }))
      );

      setReplyInputs({ ...replyInputs, [commentId]: content });
      toast.error("Failed to add reply");
    } finally {
      setIsReplying({ ...isReplying, [commentId]: false });
    }
  };

  const confirmDelete = (
    type: "confession" | "comment" | "reply",
    id: string,
    confessionId?: string,
    commentId?: string
  ) => {
    setItemToDelete({ type, id, confessionId, commentId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === "confession") {
        const response = await fetch(`/api/confessions/${itemToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete confession");

        setConfessions((prev) => prev.filter((c) => c.id !== itemToDelete.id));

        if (selectedConfession?.id === itemToDelete.id) {
          setCommentsModalOpen(false);
          setSelectedConfession(null);
        }

        toast.success("Confession deleted");
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

  const openLikesModal = (confession: Confession) => {
    setSelectedConfession(confession);
    setLikesModalOpen(true);
  };

  const openCommentsModal = (confession: Confession) => {
    setSelectedConfession(confession);
    setCommentsModalOpen(true);
    // Track view in background
    trackView(confession.id);
  };

  const trackView = async (confessionId: string) => {
    try {
      const response = await fetch(`/api/confessions/${confessionId}/view`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Update view count in state
        setConfessions((prev) =>
          prev.map((c) =>
            c.id === confessionId ? { ...c, views: data.views } : c
          )
        );
        if (selectedConfession?.id === confessionId) {
          setSelectedConfession((prev) =>
            prev ? { ...prev, views: data.views } : null
          );
        }
      }
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  const handleSortChange = async (value: SortOption) => {
    setSortBy(value);
    setIsLoadingSorted(true);
    try {
      const response = await fetch(`/api/confessions?sort=${value}`);
      if (!response.ok) throw new Error("Failed to fetch sorted confessions");
      const data = await response.json();
      setConfessions(data);
    } catch (error) {
      toast.error("Failed to load sorted confessions");
    } finally {
      setIsLoadingSorted(false);
    }
  };

  const openReportDialog = (confessionId: string) => {
    setConfessionToReport(confessionId);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!confessionToReport) return;

    setIsReporting(true);
    try {
      const response = await fetch(
        `/api/confessions/${confessionToReport}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reportReason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to report");
      }

      const data = await response.json();

      // Update confession if hidden
      if (data.isHidden) {
        setConfessions((prev) =>
          prev.map((c) =>
            c.id === confessionToReport
              ? { ...c, reportCount: data.reportCount, isHidden: true }
              : c
          )
        );
      }

      toast.success(data.message);
      setReportDialogOpen(false);
      setReportReason("harassment");
      setConfessionToReport(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to report confession");
    } finally {
      setIsReporting(false);
    }
  };

  const unhideConfession = async (confessionId: string) => {
    try {
      const response = await fetch(`/api/confessions/${confessionId}/unhide`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to unhide");

      setConfessions((prev) =>
        prev.map((c) => (c.id === confessionId ? { ...c, isHidden: false } : c))
      );

      toast.success("Confession unhidden successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to unhide confession");
    }
  };

  return (
    <>
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campus Confessions</h1>
          <p className="text-muted-foreground">
            Share your thoughts anonymously without judgment
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 rounded-md"
          >
            <IconMessage className="size-4" />
            Post Anonymously
          </Button>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Liked</SelectItem>
              <SelectItem value="discussed">Most Commented</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Create Confession Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Post Anonymously</DialogTitle>
                <DialogDescription>
                  Your identity will remain completely anonymous
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newConfession}
                  onChange={(e) => setNewConfession(e.target.value)}
                  rows={4}
                  className="resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newConfession.length}/2000 characters
                </p>
                <div className="flex items-center justify-between">
                  <div />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewConfession("");
                      }}
                      disabled={isPosting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createConfession}
                      disabled={isPosting || !newConfession.trim()}
                    >
                      {isPosting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4 md:space-y-8">
            {isLoadingSorted ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border-0 sm:bg-card sm:border sm:rounded-md mb-2 sm:mb-0"
                >
                  <div className="px-3 py-3 sm:px-6 sm:pt-6 space-y-3 sm:space-y-4 border-b-8 border-muted/50 sm:border-b-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex items-center gap-2 border-t pt-2">
                      <Skeleton className="h-8 w-16 flex-1" />
                      <Skeleton className="h-8 w-16 flex-1" />
                    </div>
                  </div>
                </div>
              ))
            ) : confessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <IconMessage className="size-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to share!
                  </p>
                </CardContent>
              </Card>
            ) : (
              confessions.map((confession) => (
                <div
                  key={confession.id}
                  className="border-0 sm:bg-card sm:border sm:rounded-md mb-2 sm:mb-4"
                >
                  <div className="px-3 py-3 sm:px-6 sm:pt-6 space-y-3 sm:space-y-4 border-b-8 border-muted/50 sm:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className={getAvatarColor(confession.id)}>
                          <AvatarFallback className="text-white font-semibold">
                            A
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">
                              Anonymous Student
                            </p>
                            {isAdmin && confession.isHidden && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                                <IconAlertTriangle className="size-3" />
                                Hidden - {confession.reportCount} reports
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(confession.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Dropdown menu for all users */}
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
                          {/* Report option for all users */}
                          <DropdownMenuItem
                            onClick={() => openReportDialog(confession.id)}
                          >
                            <IconFlag className="mr-2 size-4" />
                            Report
                          </DropdownMenuItem>

                          {/* Admin-only options */}
                          {isAdmin && confession.isHidden && (
                            <DropdownMenuItem
                              onClick={() => unhideConfession(confession.id)}
                              className="text-green-600 focus:text-green-600"
                            >
                              <IconEyeOff className="mr-2 size-4" />
                              Unhide
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() =>
                                confirmDelete("confession", confession.id)
                              }
                            >
                              <IconTrash className="mr-2 size-4" />
                              Delete Confession
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* CONTENT */}
                    <p className="text-sm whitespace-pre-wrap">
                      {confession.content}
                    </p>

                    {/* ENGAGEMENT STATS - EXACT STRUCTURE */}
                    <div className="flex items-center gap-4 text-sm border-t pt-2">
                      <button
                        onClick={() => openLikesModal(confession)}
                        className="text-muted-foreground hover:text-foreground hover:underline transition"
                        disabled={confession._count.likes === 0}
                      >
                        {confession._count.likes}{" "}
                        {confession._count.likes === 1 ? "like" : "likes"}
                      </button>
                      <button
                        onClick={() => openCommentsModal(confession)}
                        className="text-muted-foreground hover:text-foreground hover:underline transition"
                        disabled={confession._count.comments === 0}
                      >
                        {confession._count.comments}{" "}
                        {confession._count.comments === 1
                          ? "comment"
                          : "comments"}
                      </button>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <IconEye className="size-4" />
                        <span>
                          {confession.views}{" "}
                          {confession.views === 1 ? "view" : "views"}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS - EXACT STRUCTURE */}
                    <div className="flex items-center gap-2 border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleLike(confession.id)}
                      >
                        {isLikedByUser(confession) ? (
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
                        onClick={() => openCommentsModal(confession)}
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

        {/* SIDEBAR - PLACEHOLDER FOR AD CARD OR INFO */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">About Anonymous Feed</h3>
              <p className="text-sm text-muted-foreground">
                This is a safe space to share your thoughts anonymously. All
                posts are moderated.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* LIKES MODAL - EXACT STRUCTURE */}
        <Dialog open={likesModalOpen} onOpenChange={setLikesModalOpen}>
          <DialogContent className="max-w-md w-[95vw] max-h-[70vh] p-0 gap-0">
            <DialogHeader className="px-4 pt-6 pb-4 border-b">
              <DialogTitle>Likes</DialogTitle>
              <DialogDescription>
                People who liked this confession
              </DialogDescription>
            </DialogHeader>
            <div
              className="overflow-y-auto px-4 py-2"
              style={{ maxHeight: "calc(70vh - 120px)" }}
            >
              {selectedConfession?.likes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No likes yet
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedConfession?._count.likes}{" "}
                    {selectedConfession?._count.likes === 1
                      ? "person"
                      : "people"}{" "}
                    liked this
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* COMMENTS MODAL */}
        <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[60vh] sm:max-h-[80vh] p-0 gap-0 flex flex-col">
            <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle>Comments</DialogTitle>
              <VisuallyHidden>
                <DialogDescription>View and add comments</DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {selectedConfession && (
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Original Confession */}
                  <div className="pb-4 border-b">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className={getAvatarColor(selectedConfession.id)}>
                        <AvatarFallback className="text-white font-semibold">
                          A
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">Anonymous Student</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(selectedConfession.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedConfession.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <button
                            onClick={() => toggleLike(selectedConfession.id)}
                            className="hover:text-foreground flex items-center gap-1"
                          >
                            {isLikedByUser(selectedConfession) ? (
                              <IconHeartFilled className="size-3 text-red-500" />
                            ) : (
                              <IconHeart className="size-3" />
                            )}
                            {selectedConfession._count.likes > 0 &&
                              selectedConfession._count.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {selectedConfession.comments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No comments yet. Be the first!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedConfession.comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            {comment.isAnonymous ? (
                              <Avatar
                                className={`size-8 ${getAvatarColor(
                                  comment.id
                                )}`}
                              >
                                <AvatarFallback className="text-white text-sm">
                                  A
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <Avatar className="size-8">
                                <AvatarImage
                                  src={comment.author.image || undefined}
                                />
                                <AvatarFallback className="text-sm">
                                  {getInitials(comment.author.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <p className="font-medium text-sm">
                                  {comment.isAnonymous
                                    ? "Anonymous"
                                    : comment.author.name}
                                </p>
                                <p className="text-sm mt-0.5">
                                  {comment.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <button
                                  onClick={() => toggleCommentLike(comment.id)}
                                  className="hover:text-foreground flex items-center gap-1"
                                >
                                  {isCommentLikedByUser(comment) ? (
                                    <IconHeartFilled className="size-3 text-red-500" />
                                  ) : (
                                    <IconHeart className="size-3" />
                                  )}
                                  {comment._count.likes > 0 &&
                                    comment._count.likes}
                                </button>
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="hover:text-foreground"
                                >
                                  Reply
                                </button>
                                <span>
                                  {formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder="Write a reply..."
                                    value={replyInputs[comment.id] || ""}
                                    onChange={(e) =>
                                      setReplyInputs({
                                        ...replyInputs,
                                        [comment.id]: e.target.value,
                                      })
                                    }
                                    rows={2}
                                    className="text-sm resize-none"
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`reply-anon-${comment.id}`}
                                        checked={
                                          commentAnonymous[
                                            `reply-${comment.id}`
                                          ] ?? true
                                        }
                                        onCheckedChange={(checked) =>
                                          setCommentAnonymous((prev) => ({
                                            ...prev,
                                            [`reply-${comment.id}`]:
                                              checked as boolean,
                                          }))
                                        }
                                      />
                                      <label
                                        htmlFor={`reply-anon-${comment.id}`}
                                        className="text-xs text-muted-foreground cursor-pointer"
                                      >
                                        Reply anonymously
                                      </label>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setReplyInputs({
                                            ...replyInputs,
                                            [comment.id]: "",
                                          });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          replyToComment(comment.id)
                                        }
                                        disabled={
                                          !replyInputs[comment.id]?.trim() ||
                                          isReplying[comment.id]
                                        }
                                      >
                                        {isReplying[comment.id] ? (
                                          <IconLoader className="size-4 animate-spin" />
                                        ) : (
                                          "Reply"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Replies */}
                              {comment.replies &&
                                comment.replies.length > 0 && (
                                  <div className="mt-3 space-y-3 pl-4 border-l-2">
                                    {comment.replies.map((reply) => (
                                      <div
                                        key={reply.id}
                                        className="flex items-start gap-2"
                                      >
                                        {reply.isAnonymous ? (
                                          <Avatar
                                            className={`size-6 ${getAvatarColor(
                                              reply.id
                                            )}`}
                                          >
                                            <AvatarFallback className="text-white text-xs">
                                              A
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <Avatar className="size-6">
                                            <AvatarImage
                                              src={
                                                reply.author.image || undefined
                                              }
                                            />
                                            <AvatarFallback className="text-xs">
                                              {getInitials(reply.author.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <div className="flex-1">
                                          <div className="bg-muted rounded-lg px-2 py-1">
                                            <p className="font-medium text-xs">
                                              {reply.isAnonymous
                                                ? "Anonymous"
                                                : reply.author.name}
                                            </p>
                                            <p className="text-xs mt-0.5">
                                              {reply.content}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                            <button
                                              onClick={() =>
                                                toggleCommentLike(reply.id)
                                              }
                                              className="hover:text-foreground flex items-center gap-1"
                                            >
                                              {isCommentLikedByUser(reply) ? (
                                                <IconHeartFilled className="size-3 text-red-500" />
                                              ) : (
                                                <IconHeart className="size-3" />
                                              )}
                                              {reply._count.likes > 0 &&
                                                reply._count.likes}
                                            </button>
                                            <span>
                                              {formatDistanceToNow(
                                                new Date(reply.createdAt),
                                                { addSuffix: true }
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
              )}
            </div>

            {/* Add Comment Input - EXACT STRUCTURE AS CAMPUS FEED */}
            <div className="shrink-0 border-t bg-background p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <Avatar className="size-8 sm:size-10 shrink-0">
                  <AvatarImage src={currentUser.image || undefined} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2 min-w-0">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentInputs[selectedConfession?.id || ""] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [selectedConfession?.id || ""]: e.target.value,
                      }))
                    }
                    className="resize-none rounded-2xl text-sm min-h-[40px] max-h-[120px] w-full"
                    rows={1}
                    disabled={!selectedConfession}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        selectedConfession
                      ) {
                        e.preventDefault();
                        addComment(selectedConfession.id);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full"
                    onClick={() =>
                      selectedConfession && addComment(selectedConfession.id)
                    }
                    disabled={
                      !selectedConfession ||
                      !commentInputs[selectedConfession.id]?.trim() ||
                      isCommenting[selectedConfession.id]
                    }
                  >
                    {isCommenting[selectedConfession?.id || ""] ? (
                      <IconLoader className="size-4 animate-spin" />
                    ) : (
                      <IconSend className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-12 sm:ml-14">
                <Checkbox
                  id={`comment-anon-${selectedConfession?.id}`}
                  checked={
                    commentAnonymous[selectedConfession?.id || ""] ?? true
                  }
                  onCheckedChange={(checked) =>
                    selectedConfession &&
                    setCommentAnonymous((prev) => ({
                      ...prev,
                      [selectedConfession.id]: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor={`comment-anon-${selectedConfession?.id}`}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Comment anonymously
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-12 hidden sm:block">
                Press Enter to post, Shift + Enter for new line
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {itemToDelete?.type || "item"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* REPORT DIALOG */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Report Confession</DialogTitle>
              <DialogDescription>
                Help us maintain a safe community by reporting inappropriate
                content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" />
                  <Label htmlFor="harassment">Harassment or hate speech</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam">Spam or misleading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate">Inappropriate content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setReportDialogOpen(false);
                  setReportReason("harassment");
                }}
                disabled={isReporting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReport}
                disabled={isReporting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isReporting ? (
                  <>
                    <IconLoader className="mr-2 size-4 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <IconFlag className="mr-2 size-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
