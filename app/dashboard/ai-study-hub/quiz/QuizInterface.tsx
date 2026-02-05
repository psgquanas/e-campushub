"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuizData } from "./page";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizInterfaceProps {
  quiz: QuizData;
  onCancel: () => void;
  onFinish: (
    score: number,
    total: number,
    answers: number[],
    timeTaken: number,
  ) => void;
}

export function QuizInterface({
  quiz,
  onCancel,
  onFinish,
}: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    quiz.userAnswers || new Array(quiz.questions.length).fill(-1),
  );
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 0);
  const [isTimeOut, setIsTimeOut] = useState(false);

  const calculateAndFinish = useCallback(() => {
    let score = 0;
    selectedAnswers.forEach((answer, index) => {
      if (
        quiz.questions[index] &&
        answer === quiz.questions[index].correctAnswer
      ) {
        score++;
      }
    });

    const timeTaken = (quiz.timeLimit || 0) - timeLeft;
    onFinish(score, quiz.questions.length, selectedAnswers, timeTaken);
  }, [selectedAnswers, quiz.questions, onFinish, timeLeft, quiz.timeLimit]);

  useEffect(() => {
    if (timeLeft <= 0 && quiz.timeLimit) {
      if (!isTimeOut) {
        setIsTimeOut(true);
        calculateAndFinish();
      }
      return;
    }

    if (!quiz.timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz.timeLimit, isTimeOut, calculateAndFinish]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      setSelectedAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = optionIndex;
        return newAnswers;
      });
    },
    [currentQuestionIndex],
  );

  const nextQuestion = useCallback(() => {
    if (isLastQuestion) {
      calculateAndFinish();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [isLastQuestion, calculateAndFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Answer selection (1-4 or A-D)
      const key = e.key.toUpperCase();
      const optionIdx = ["1", "2", "3", "4"].includes(key)
        ? parseInt(key) - 1
        : ["A", "B", "C", "D"].indexOf(key);

      if (optionIdx >= 0 && optionIdx < currentQuestion.options.length) {
        handleSelectOption(optionIdx);
        return;
      }

      // Navigation (Enter)
      if (e.key === "Enter") {
        if (selectedAnswers[currentQuestionIndex] !== -1) {
          nextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    handleSelectOption,
    nextQuestion,
    selectedAnswers,
    currentQuestionIndex,
  ]);

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto flex flex-col gap-6 py-4 px-2">
      {/* Header with Exit and Progress */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg truncate max-w-[200px] md:max-w-md">
              {quiz.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <IconClock size={12} />
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <IconX size={20} />
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Active Question Area */}
      <div className="flex-1 flex items-center justify-center p-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="border-2 shadow-lg overflow-hidden glass-card">
              <CardHeader className="bg-muted/30 pb-8 pt-10">
                <CardTitle className="text-xl md:text-2xl font-serif text-center leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectOption(idx)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 relative group overflow-hidden",
                        selectedAnswers[currentQuestionIndex] === idx
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                          selectedAnswers[currentQuestionIndex] === idx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-[15px] font-medium leading-normal">
                        {option}
                      </span>

                      {selectedAnswers[currentQuestionIndex] === idx && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                          <IconCheck size={20} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center p-6 border-t bg-muted/10">
                <Button
                  variant="ghost"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="gap-2"
                >
                  <IconArrowLeft size={18} />
                  Previous
                </Button>

                <Button
                  onClick={nextQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === -1}
                  className={cn(
                    "gap-2 px-8 shadow-sm transition-all",
                    isLastQuestion
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "",
                  )}
                >
                  {isLastQuestion ? "Finish Quiz" : "Next Question"}
                  {!isLastQuestion && <IconArrowRight size={18} />}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .dark .glass-card {
          background: rgba(10, 10, 10, 0.4);
        }
      `}</style>
    </div>
  );
}
