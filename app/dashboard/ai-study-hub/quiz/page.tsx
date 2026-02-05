"use client";

import { QuizLobby } from "./QuizLobby";
import { useEffect, useState } from "react";

export type QuizView = "LOBBY" | "QUIZ" | "RESULTS";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizData {
  id: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
  score?: number;
  userAnswers?: number[];
  completed?: boolean;
  timeTaken?: number;
  timeLimit?: number; // Time limit in seconds
}

export default function PracticeQuizPage() {
  const [stats, setStats] = useState({ highestScore: 0, totalQuizzes: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/quiz/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch quiz stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header with Title and Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Practice Quizzes
          </h1>
          <p className="text-muted-foreground text-sm">
            Test your knowledge and track your progress with AI-generated
            quizzes.
          </p>
        </div>

        {/* Quick Stats - Responsive */}
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Highest Score
              </span>
              {isLoadingStats ? (
                <div className="h-7 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {stats.highestScore}%
                </span>
              )}
            </div>
          </div>

          <div className="h-12 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Quizzes Taken
              </span>
              {isLoadingStats ? (
                <div className="h-7 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {stats.totalQuizzes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <QuizLobby />
      </div>
    </div>
  );
}
