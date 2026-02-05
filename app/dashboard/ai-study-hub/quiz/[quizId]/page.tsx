"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { QuizInterface } from "../QuizInterface";
import { QuizData } from "../page";
import { IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ActiveQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/quiz/${quizId}`);
        if (!response.ok) {
          throw new Error("Quiz not found");
        }
        const quizData = await response.json();
        setQuiz(quizData);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        setError(
          "Failed to load quiz. It may not exist or you don't have access.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const handleCancel = () => {
    router.push("/dashboard/ai-study-hub/quiz");
  };

  const handleFinish = async (
    score: number,
    total: number,
    answers: number[],
    timeTaken: number,
  ) => {
    // Save results to database
    try {
      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          totalPoints: total,
          userAnswers: answers,
          timeTaken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save quiz results");
      }

      toast.success("Quiz results saved successfully!");
      // Navigate to results page
      router.push(`/dashboard/ai-study-hub/quiz/${quizId}/results`);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save quiz results to the database.");
      // Still navigate to results even if save failed
      router.push(`/dashboard/ai-study-hub/quiz/${quizId}/results`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/30 rounded-3xl border border-dashed text-muted-foreground">
        <IconLoader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/30 rounded-3xl border border-dashed text-muted-foreground">
        <IconAlertCircle className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-bold mb-2">Quiz Not Found</h2>
        <p className="mb-6 text-center max-w-md">{error}</p>
        <Button onClick={handleCancel}>Return to Quiz Lobby</Button>
      </div>
    );
  }

  return (
    <QuizInterface
      quiz={quiz}
      onCancel={handleCancel}
      onFinish={handleFinish}
    />
  );
}
