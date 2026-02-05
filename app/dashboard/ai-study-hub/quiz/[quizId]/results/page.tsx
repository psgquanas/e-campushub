"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { QuizResults } from "../../QuizResults";
import { QuizData } from "../../page";
import { IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    answers: number[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/quiz/${quizId}`);
        if (!response.ok) {
          throw new Error("Quiz not found");
        }
        const quizData = await response.json();

        // Check if quiz is completed
        if (
          !quizData.completed ||
          quizData.score === undefined ||
          !quizData.userAnswers
        ) {
          setError("This quiz hasn't been completed yet.");
          setQuiz(null);
          return;
        }

        setQuiz(quizData);
        setResults({
          score: quizData.score,
          total: quizData.questions.length,
          answers: quizData.userAnswers,
        });
      } catch (err) {
        console.error("Failed to fetch quiz results:", err);
        setError("Failed to load quiz results. The quiz may not exist.");
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuizResults();
    }
  }, [quizId]);

  const handleBackToLobby = () => {
    router.push("/dashboard/ai-study-hub/quiz");
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/30 rounded-3xl border border-dashed text-muted-foreground">
        <IconLoader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !quiz || !results) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/30 rounded-3xl border border-dashed text-muted-foreground">
        <IconAlertCircle className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-bold mb-2">Results Not Available</h2>
        <p className="mb-6 text-center max-w-md">
          {error || "Unable to load quiz results."}
        </p>
        <Button onClick={handleBackToLobby}>Return to Quiz Lobby</Button>
      </div>
    );
  }

  return (
    <QuizResults
      quiz={quiz}
      results={results}
      onBackToLobby={handleBackToLobby}
    />
  );
}
