"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconHistory,
  IconBrain,
  IconArrowRight,
  IconTrophy,
  IconClock,
  IconBook,
  IconSelector,
  IconCheck,
  IconSearch,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuizData } from "./page";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuizLobbyProps {}

// Reality: Quizzes are fetched from the database

// Mock data for starting a quiz
// We are now using real data from the database

export function QuizLobby({}: QuizLobbyProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [open, setOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("Med");
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const fetchUserPoints = async () => {
    try {
      const res = await fetch("/api/user/points");
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points);
      }
    } catch (error) {
      console.error("Failed to fetch points:", error);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/quiz");
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };

    fetchCourses();
    fetchQuizzes();
    fetchUserPoints();
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedCourse) {
        setAvailableMaterials([]);
        setSelectedMaterials([]);
        return;
      }

      setIsLoadingMaterials(true);
      try {
        const response = await fetch(
          `/api/courses/${selectedCourse}/materials`,
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableMaterials(data);
          // Auto-select all by default or let user pick? User asked for "all materials" option.
          // Let's start with empty or provided choice.
        }
      } catch (error) {
        console.error("Failed to fetch materials:", error);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, [selectedCourse]);

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  const toggleAllMaterials = () => {
    if (selectedMaterials.length === availableMaterials.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(availableMaterials.map((m) => m.id));
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedCourse || selectedMaterials.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          materialIds: selectedMaterials,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          throw new Error(data.message || "Insufficient points");
        }
        throw new Error("Failed to generate quiz");
      }

      const generatedQuiz = await response.json();
      router.push(`/dashboard/ai-study-hub/quiz/${generatedQuiz.id}`);
      fetchUserPoints(); // Refresh points balance
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Quick Start / Generate Card - Sidebar on Desktop, Top Section on Tablet/Mobile */}
      <div className="w-full lg:w-[350px] shrink-0">
        <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBrain className="text-primary" />
              AI Generator
            </CardTitle>
            <CardDescription className="text-sm">
              Generate a personalized quiz based on your study materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Course
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between text-left h-auto py-2.5 px-3 min-h-[40px]"
                  >
                    {isLoadingCourses ? (
                      <IconLoader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : selectedCourse ? (
                      <span className="truncate mr-2">
                        {(() => {
                          const course = courses.find(
                            (c) => c.id.toString() === selectedCourse,
                          );
                          return course
                            ? `${course.code} - ${course.name}`
                            : "Search course...";
                        })()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground truncate">
                        Search course...
                      </span>
                    )}
                    <IconSelector className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search course..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCourses
                          ? "Loading courses..."
                          : "No course found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {courses.map((course) => (
                          <CommandItem
                            key={course.id}
                            value={course.name + " " + course.code}
                            onSelect={() => {
                              setSelectedCourse(course.id.toString());
                              setOpen(false);
                            }}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                              <span className="font-semibold truncate">
                                {course.code}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {course.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground/70">
                                Level {course.level} • Semester{" "}
                                {course.semester}
                              </span>
                            </div>
                            <IconCheck
                              className={cn(
                                "h-4 w-4 shrink-0",
                                selectedCourse === course.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Materials
              </label>
              <Popover open={materialsOpen} onOpenChange={setMaterialsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!selectedCourse || isLoadingMaterials}
                    className="w-full justify-between text-left h-auto py-2.5 px-3 min-h-[40px]"
                  >
                    {isLoadingMaterials ? (
                      <IconLoader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : selectedMaterials.length === 0 ? (
                      <span className="text-muted-foreground truncate">
                        Select materials...
                      </span>
                    ) : selectedMaterials.length ===
                      availableMaterials.length ? (
                      <span className="truncate">All materials selected</span>
                    ) : (
                      <span className="truncate">
                        {selectedMaterials.length}{" "}
                        {selectedMaterials.length === 1
                          ? "material"
                          : "materials"}{" "}
                        selected
                      </span>
                    )}
                    <IconSelector className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search materials..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No materials found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={toggleAllMaterials}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={
                              availableMaterials.length > 0 &&
                              selectedMaterials.length ===
                                availableMaterials.length
                            }
                            onCheckedChange={toggleAllMaterials}
                          />
                          <span className="font-medium">All Materials</span>
                        </CommandItem>
                        <div className="h-px bg-muted my-1" />
                        {availableMaterials.map((material) => (
                          <CommandItem
                            key={material.id}
                            onSelect={() => toggleMaterial(material.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedMaterials.includes(material.id)}
                              onCheckedChange={() =>
                                toggleMaterial(material.id)
                              }
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm truncate">
                                {material.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {material.type}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Easy", "Med", "Hard"].map((d) => (
                  <Button
                    key={d}
                    variant={difficulty === d ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full gap-2 shadow-lg hover:shadow-primary/20 transition-all font-semibold rounded-md"
              onClick={handleGenerateQuiz}
              disabled={
                isGenerating ||
                !selectedCourse ||
                selectedMaterials.length === 0
              }
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <IconPlus size={18} />
                  <span>Start New Quiz</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-primary/20 text-primary border-none text-[10px]"
                  >
                    20 pts
                  </Badge>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* History / Recent Sections - Main content on Desktop, Bottom on Tablet/Mobile */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconHistory size={20} className="text-muted-foreground" />
            Recent Quizzes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4 h-full">
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 pb-4">
            {isLoadingQuizzes ? (
              <div className="col-span-1 2xl:col-span-2 flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IconLoader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading your quiz history...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="col-span-1 2xl:col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                <IconBrain size={64} className="mb-4 opacity-10" />
                <p className="font-medium">
                  No quizzes yet. Generate your first one!
                </p>
              </div>
            ) : (
              quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="hover:border-primary/50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md overflow-hidden h-full ring-primary/5 hover:ring-2 rounded-md"
                    onClick={() => {
                      if (quiz.completed) {
                        router.push(
                          `/dashboard/ai-study-hub/quiz/${quiz.id}/results`,
                        );
                      } else {
                        router.push(`/dashboard/ai-study-hub/quiz/${quiz.id}`);
                      }
                    }}
                  >
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative h-full">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-inner">
                        <IconBook size={28} />
                      </div>
                      <div className="flex-1 min-w-0 w-full space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base sm:text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                            {quiz.title}
                          </h3>
                          {quiz.completed ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-[11px] font-bold bg-green-500/10 text-green-700 border-green-200/50 uppercase tracking-tighter"
                            >
                              Completed
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-[11px] font-bold bg-amber-500/10 text-amber-700 border-amber-200/50 uppercase tracking-tighter animate-pulse"
                            >
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-transparent group-hover:border-primary/10 transition-colors">
                            <IconBook
                              size={14}
                              className="shrink-0 text-primary/60"
                            />
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">
                              {quiz.subject}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                            <IconClock size={14} className="shrink-0" />
                            <span>
                              {new Date(quiz.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: quiz.createdAt.startsWith(
                                    new Date().getFullYear().toString(),
                                  )
                                    ? undefined
                                    : "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-none mt-2 sm:mt-0 gap-3">
                        {quiz.completed ? (
                          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5">
                            <div className="text-xl sm:text-2xl font-black text-primary leading-none">
                              {quiz.score}
                              <span className="text-sm font-medium text-muted-foreground/60 ml-1">
                                /{quiz.totalPoints}
                              </span>
                            </div>
                            <div className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">
                              {quiz.percentage?.toFixed(0) || 0}% Correct
                            </div>
                          </div>
                        ) : (
                          <div className="text-primary font-bold text-xs sm:text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-all duration-300">
                            Resume{" "}
                            <IconArrowRight
                              size={16}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </div>
                        )}
                        <div className="hidden sm:block">
                          <IconArrowRight
                            size={20}
                            className="text-muted-foreground/40 group-hover:translate-x-2 group-hover:text-primary transition-all duration-300 ml-4 lg:hidden 2xl:block"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
