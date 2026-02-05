import React from "react";
import { ChatAssistant } from "./ChatAssistant";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Assistant",
  description: "Your personalized AI study companion.",
};

export default function ChatAssistantPage() {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Section - Fixed height */}
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">AI Chat Assistant</h1>
        <p className="text-muted-foreground text-sm">
          Collaborate with AI to understand complex topics, summarize materials,
          or plan your studies.
        </p>
      </div>

      {/* Chat Component - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">
                Initializing assistant...
              </p>
            </div>
          }
        >
          <ChatAssistant />
        </React.Suspense>
      </div>
    </div>
  );
}
