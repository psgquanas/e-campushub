"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconSend,
  IconPaperclip,
  IconDotsVertical,
  IconPlus,
  IconDownload,
  IconHistory,
  IconUser,
  IconRobot,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconArrowDown,
  IconFile,
  IconFileText,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { MarkdownComponents } from "@/components/markdown-components";
import { exportChatToPDF } from "@/lib/export-chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: { name: string; type: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  subject: string;
}

interface ChatDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// Helper function to truncate title to first 3 words
const truncateTitle = (title: string): string => {
  const words = title.trim().split(/\s+/);
  if (words.length <= 3) return title;
  return words.slice(0, 3).join(" ") + "...";
};

export function ChatAssistant() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("id");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionIdFromUrl,
  );
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [sessionDocuments, setSessionDocuments] = useState<ChatDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(
    (force = false) => {
      if (force || !userHasScrolled) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
      }
    },
    [userHasScrolled],
  );

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Consider user at bottom if within 50px
    const isAtBottom = distanceFromBottom < 50;
    const isScrolledUp = distanceFromBottom > 50;

    setUserHasScrolled(!isAtBottom);
    setShowScrollButton(isScrolledUp);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollHandler = () => {
      handleScroll();
    };

    container.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      container.removeEventListener("scroll", scrollHandler);
    };
  }, [handleScroll]);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle URL changes (back/forward navigation or manual ID in URL)
  useEffect(() => {
    if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      loadSession(sessionIdFromUrl, false); // false = don't update URL again
    } else if (!sessionIdFromUrl && currentSessionId) {
      // If URL ID removed but we have active session, reset (or keep- but user probably clicked New Chat)
      setCurrentSessionId(null);
      setMessages([]);
      setSessionDocuments([]);
    }
  }, [sessionIdFromUrl]);

  // Initial load if ID in URL
  useEffect(() => {
    if (sessionIdFromUrl) {
      loadSession(sessionIdFromUrl, false);
    }
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/chat/history");
      const data = await response.json();
      if (data.success) {
        setHistory(
          data.sessions.map((s: any) => ({
            id: s.id,
            title: s.title,
            lastMessage: `Session with ${s.messageCount} messages`,
            timestamp: new Date(s.lastMessageAt || s.createdAt),
            subject: s.subject,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSession = async (sessionId: string, updateUrl = true) => {
    setIsSidebarOpen(false); // Close on mobile
    if (updateUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", sessionId);
      router.push(`?${params.toString()}`);
    }

    // Don't reload if it's already the current session
    if (sessionId === currentSessionId && messages.length > 0) return;

    toast.loading("Loading conversation...", { id: "load-session" });
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.session.id);
        setSubject(data.session.subject);
        setMessages(
          data.session.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          })),
        );
        if (data.session.documents) {
          setSessionDocuments(data.session.documents);
        } else {
          setSessionDocuments([]);
        }
        toast.success("Conversation loaded", { id: "load-session" });
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      toast.error("Failed to load conversation", { id: "load-session" });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessageContent = input;
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsSending(true);

    // Show loading indicator
    const assistantMessageId = "assistant-" + Date.now();
    const loadingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageContent,
          subject: subject,
          sessionId: currentSessionId,
          documentIds: sessionDocuments.map((doc) => doc.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let isHeaderParsed = false;
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (!isHeaderParsed) {
          const parts = chunk.split("\n---\n");
          if (parts.length > 1) {
            // Parse header
            try {
              const header = JSON.parse(parts[0]);
              if (header.sessionId && !currentSessionId) {
                setCurrentSessionId(header.sessionId);
                // Update URL for the new session
                const params = new URLSearchParams(searchParams.toString());
                params.set("id", header.sessionId);
                router.replace(`?${params.toString()}`);
                fetchHistory();
              }
            } catch (e) {
              console.error("Failed to parse header", e);
            }
            isHeaderParsed = true;
            // The rest is content
            const actualContent = parts.slice(1).join("\n---\n");
            accumulatedContent += actualContent;
          } else {
            // Header hasn't arrived fully or delimiter not found yet
            // In our case, we expect the header to be small and arrive in the first chunk
            // If it's partial, we might need more complex logic, but usually it's fine.
            continue;
          }
        } else {
          accumulatedContent += chunk;
        }

        // Update UI with accumulated content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg,
          ),
        );
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : msg,
        ),
      );
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
      setUserHasScrolled(false);

      // Refresh history after a delay to show AI-generated title
      setTimeout(() => {
        fetchHistory();
      }, 3000);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentSessionId) {
        formData.append("sessionId", currentSessionId);
      }

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSessionDocuments((prev) => [...prev, data.document]);
        toast.success(`File "${file.name}" uploaded successfully!`, {
          id: toastId,
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeDocument = (id: string) => {
    // For now just local remove, or we could add a DELETE API
    setSessionDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast.success("Document removed");
  };

  const handleExport = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    try {
      const title = currentSessionId
        ? history.find((s) => s.id === currentSessionId)?.title || "Chat Export"
        : "Chat Export";

      exportChatToPDF(messages, title, subject);
      toast.success("Chat exported as PDF");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export chat");
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setSubject("general");
    setSessionDocuments([]);

    // Clear URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(
      searchParams.toString()
        ? `?${params.toString()}`
        : window.location.pathname,
    );

    toast.info("Started a new conversation");
  };

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setSessionToRename(sessionId);
    setNewTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!sessionToRename || !newTitle.trim()) return;

    try {
      const response = await fetch(`/api/chat/history/${sessionToRename}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Session renamed");
        fetchHistory();
        setRenameDialogOpen(false);
      } else {
        throw new Error(data.error || "Failed to rename");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to rename session");
    }
  };

  const openDeleteDialog = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await fetch(`/api/chat/history/${sessionToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Session deleted");

        // If deleted session was active, reset to empty state
        if (sessionToDelete === currentSessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          setSubject("general");
        }

        fetchHistory();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete session");
    }
  };

  return (
    <div className="flex h-full bg-background border rounded-xl overflow-hidden shadow-sm relative">
      {/* Sidebar Backdrop for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar for History */}
      <motion.div
        initial={false}
        animate={{
          width: isSidebarOpen ? 256 : 0,
          x: isSidebarOpen ? 0 : -256,
          opacity: isSidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "bg-muted/30 border-r flex flex-col absolute inset-y-0 left-0 z-40 md:relative",
          !isSidebarOpen && "pointer-events-none md:w-0",
        )}
      >
        <div className="p-4 border-b flex items-center justify-between min-w-[256px]">
          <h2 className="font-semibold flex items-center gap-2">
            <IconHistory size={18} />
            History
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft size={18} />
          </Button>
        </div>

        <div className="p-3 min-w-[256px]">
          <Button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 mb-4"
            variant="outline"
          >
            <IconPlus size={18} />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 min-w-[256px]">
          <div className="space-y-2 pb-4">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Loading history...
                </span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-muted-foreground">
                  No history yet. Start a new chat!
                </p>
              </div>
            ) : (
              history.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex flex-col p-2.5 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-accent",
                    currentSessionId === session.id &&
                      "bg-accent border-accent",
                  )}
                >
                  <div
                    onClick={() => loadSession(session.id)}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1 min-w-0">
                        {truncateTitle(session.title)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {session.timestamp.toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        •
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {session.lastMessage}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-3.5 uppercase"
                      >
                        {session.subject}
                      </Badge>
                    </div>
                  </div>

                  {/* Dropdown menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 "
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(session.id, session.title);
                        }}
                        className="flex items-center gap-2"
                      >
                        <IconEdit size={14} />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(session.id);
                        }}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <IconTrash size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Chat Header */}
        <div className="h-14 border-b flex items-center justify-between px-3 md:px-4 bg-background/95 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className={cn("shrink-0", isSidebarOpen && "hidden")}
            >
              <IconChevronRight size={18} />
            </Button>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate">
                Study Assistant
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                <span className="text-[10px] md:text-[11px] text-muted-foreground truncate">
                  AI Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[110px] md:w-[140px] h-8 text-[11px] md:text-xs px-2 md:px-3">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="literature">Literature</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDotsVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <IconDownload size={16} />
                  Export Notes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={startNewChat}
                  className="flex items-center gap-2 text-destructive"
                >
                  <IconPlus size={16} />
                  Clear Current Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages - Scrollable area with position relative for button positioning */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative"
        >
          <div className="max-w-3xl mx-auto py-4 md:py-8 px-2 md:px-4 space-y-4 md:space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-primary/50">
                  <IconRobot size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Welcome to AI Study Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Ask questions, get homework help, or summarize topics in any
                    of your subjects.
                  </p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <Avatar
                  className={cn(
                    "h-7 w-7 md:h-8 md:w-8 border shrink-0",
                    message.role === "user" ? "bg-primary" : "bg-muted",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="flex items-center justify-center w-full h-full text-primary">
                      <IconRobot size={15} className="md:size-[18px]" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-primary-foreground">
                      <IconUser size={15} className="md:size-[18px]" />
                    </div>
                  )}
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col max-w-[85%] sm:max-w-[90%] md:max-w-[90%]",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-2.5 md:px-4 py-2 md:py-2.5 rounded-2xl text-[13px] md:text-sm leading-relaxed wrap-break-word overflow-hidden max-w-full",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                        : "bg-muted text-foreground rounded-tl-none border border-border",
                    )}
                  >
                    <ReactMarkdown components={MarkdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {/* Invisible div to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to Bottom Button - Now inside the scroll container */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20"
              >
                <Button
                  size="icon"
                  className="rounded-full shadow-lg h-10 w-10 bg-primary hover:bg-primary/90 hover:scale-110 transition-transform pointer-events-auto"
                  onClick={() => scrollToBottom(true)}
                >
                  <IconArrowDown size={20} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="p-3 md:p-4 bg-background border-t shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            {/* Uploaded Documents Context */}
            {sessionDocuments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {sessionDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 bg-muted/50 border rounded-lg px-2 py-1.5 animate-in fade-in slide-in-from-bottom-1"
                  >
                    {doc.fileType.includes("pdf") ? (
                      <IconFileText size={14} className="text-red-500" />
                    ) : (
                      <IconFile size={14} className="text-blue-500" />
                    )}
                    <span className="text-[11px] font-medium truncate max-w-[120px]">
                      {doc.fileName}
                    </span>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl border bg-muted/20 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 shadow-sm">
              <Textarea
                placeholder="Ask something..."
                className="min-h-[50px] md:min-h-[60px] max-h-[150px] md:max-h-[200px] w-full bg-transparent border-0 focus-visible:ring-0 px-3 md:px-4 py-2.5 md:py-3 resize-none text-[13px] md:text-sm pr-16 md:pr-20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <div className="absolute bottom-1.5 md:bottom-2 right-1.5 md:right-2 flex items-center gap-0.5 md:gap-1">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleFileUpload}
                  title="Attach file"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <IconLoader2
                      size={16}
                      className="md:size-[18px] animate-spin"
                    />
                  ) : (
                    <IconPaperclip size={16} className="md:size-[18px]" />
                  )}
                </Button>
                <Button
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 shadow-md"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                >
                  <IconSend size={15} className="md:size-[16px]" />
                </Button>
              </div>
            </div>
            <p className="text-[9px] md:text-[10px] text-center text-muted-foreground mt-2 hidden sm:block">
              Press Enter to send, Shift + Enter for new line.
            </p>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new title for this conversation
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Conversation title"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
