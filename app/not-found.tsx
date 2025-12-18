"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GradientBackground from "./(public)/_components/Gradient";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="relative overflow-hidden flex-1 flex items-center">
        <GradientBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* 404 Illustration */}
            <div className="mb-4">
              <div className="relative inline-block">
                <div className="text-[180px] sm:text-[240px] font-bold text-blue-600/10 dark:text-blue-400/10 leading-none select-none">
                  404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-32 h-32 sm:w-40 sm:h-40 text-blue-600 dark:text-blue-400 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content Card */}
            <Card className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-none shadow-xl mb-8">
              <CardContent className="p-8 sm:p-12">
                <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                  Page Not Found
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-950 dark:text-gray-100">
                  Oops! Lost on Campus?
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  The page you're looking for seems to have wandered off. It
                  might have been moved, deleted, or perhaps it never existed at
                  all.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25"
                  >
                    Back to Home
                  </Link>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-blue-900 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors dark:text-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help?{" "}
              <Link
                href="/contact"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
