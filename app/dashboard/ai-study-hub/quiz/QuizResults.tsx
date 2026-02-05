"use client";

import {
  IconConfetti,
  IconHome,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizData } from "./page";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizResultsProps {
  quiz: QuizData;
  results: { score: number; total: number; answers: number[] };
  onBackToLobby: () => void;
}

export function QuizResults({
  quiz,
  results,
  onBackToLobby,
}: QuizResultsProps) {
  const percentage = Math.round((results.score / results.total) * 100);

  const getFeedback = () => {
    if (percentage >= 90)
      return { title: "Outstanding!", emoji: "🎉", color: "text-green-500" };
    if (percentage >= 70)
      return { title: "Great Job!", emoji: "👏", color: "text-blue-500" };
    if (percentage >= 50)
      return { title: "Keep it up!", emoji: "📚", color: "text-yellow-600" };
    return { title: "Keep Practicing", emoji: "💪", color: "text-red-500" };
  };

  const feedback = getFeedback();

  return (
    <div className="h-full flex flex-col gap-4 md:gap-8 py-3 md:py-6 max-w-5xl mx-auto px-3 md:px-4 overflow-y-auto">
      {/* Hero Score Section - Horizontal on mobile, vertical on tablet+ */}
      <div className="flex flex-row md:flex-row items-center justify-between gap-4 md:gap-8 bg-muted/20 rounded-2xl md:rounded-3xl p-4 md:p-8 border shadow-sm ring-1 ring-border/50">
        <div className="flex flex-col items-start text-left flex-1">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
          >
            <div
              className={cn(
                "text-3xl md:text-6xl font-black mb-1 md:mb-2 flex items-center gap-2 md:gap-4",
                feedback.color,
              )}
            >
              <span className="text-2xl md:text-6xl">{feedback.emoji}</span>
              <span>{percentage}%</span>
            </div>
          </motion.div>
          <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
            {feedback.title}
          </h2>
          <p className="text-xs md:text-base text-muted-foreground">
            {results.score} / {results.total} correct
          </p>
          <div className="flex gap-2 md:gap-4 mt-4 md:mt-8">
            <Button
              className=" rounded-md gap-1.5 md:gap-2 px-3 md:px-6 h-8 md:h-10 text-xs md:text-sm"
              onClick={onBackToLobby}
            >
              <IconHome size={16} className="md:size-[18px]" />
              <span className="hidden sm:inline">Return Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Circular Progress - Smaller on mobile */}
        <div className="relative w-24 h-24 md:w-48 md:h-48 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-muted/40 md:hidden"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={276.5} // 2 * pi * 44
              initial={{ strokeDashoffset: 276.5 }}
              animate={{ strokeDashoffset: 276.5 - (276.5 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(feedback.color, "md:hidden")}
            />
            {/* Desktop circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-muted/40 hidden md:block"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={553} // 2 * pi * 88
              initial={{ strokeDashoffset: 553 }}
              animate={{ strokeDashoffset: 553 - (553 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(feedback.color, "hidden md:block")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg md:text-4xl font-bold">
              {results.score}/{results.total}
            </span>
            <span className="text-[8px] md:text-xs text-muted-foreground uppercase tracking-widest">
              Correct
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Review Section */}
      <div className="space-y-3 md:space-y-6">
        <h3 className="text-base md:text-xl font-bold flex items-center gap-2 px-1 md:px-2">
          <IconAlertCircle size={18} className="md:size-[22px] text-primary" />
          Review Questions
        </h3>

        <div className="grid grid-cols-1 gap-3 md:gap-6 pb-8 md:pb-12">
          {quiz.questions.map((question, qIdx) => {
            const userAnswer = results.answers[qIdx];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <motion.div
                key={question.id || `question-${qIdx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.1 }}
              >
                <Card
                  className={cn(
                    "border-l-4 overflow-hidden shadow-sm",
                    isCorrect ? "border-l-green-500" : "border-l-red-500",
                  )}
                >
                  <CardHeader className="bg-muted/5 pb-3 md:pb-4 p-3 md:p-6">
                    <div className="flex items-start justify-between gap-2 md:gap-4">
                      <CardTitle className="text-sm md:text-lg leading-relaxed">
                        {question.question}
                      </CardTitle>
                      {isCorrect ? (
                        <Badge className="bg-green-500 text-white gap-1 shrink-0 h-5 md:h-6 text-[10px] md:text-xs px-1.5 md:px-2">
                          <IconCheck size={12} className="md:size-[14px]" />
                          <span className="hidden sm:inline">Correct</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="gap-1 shrink-0 h-5 md:h-6 text-[10px] md:text-xs px-1.5 md:px-2"
                        >
                          <IconX size={12} className="md:size-[14px]" />
                          <span className="hidden sm:inline">Incorrect</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 md:pt-2 space-y-3 md:space-y-4">
                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {question.options.map((option, oIdx) => {
                        const isUserSelection = userAnswer === oIdx;
                        const isCorrectOption = question.correctAnswer === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "p-2 md:p-3 rounded-lg border text-xs md:text-sm flex items-center gap-2 md:gap-3 transition-colors",
                              isCorrectOption
                                ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400 font-medium"
                                : isUserSelection
                                  ? "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400"
                                  : "bg-muted/30 border-transparent text-muted-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shrink-0",
                                isCorrectOption
                                  ? "bg-green-500 text-white"
                                  : isUserSelection
                                    ? "bg-red-500 text-white"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="flex-1 wrap-break-word">
                              {option}
                            </span>
                            {isCorrectOption && (
                              <IconCheck
                                size={12}
                                className="md:size-[14px] ml-auto shrink-0"
                              />
                            )}
                            {isUserSelection && !isCorrect && (
                              <IconX
                                size={12}
                                className="md:size-[14px] ml-auto shrink-0"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 md:mt-4 p-3 md:p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-2 md:gap-4">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <IconConfetti size={14} className="md:size-[18px]" />
                      </div>
                      <div className="text-xs md:text-sm flex-1 min-w-0">
                        <span className="font-bold text-primary block mb-0.5 md:mb-1">
                          Explanation:
                        </span>
                        <p className="text-muted-foreground italic leading-relaxed wrap-break-word">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
