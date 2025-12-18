"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import GradientBackground from "@/app/(public)/_components/Gradient";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

interface Programme {
  id: number;
  name: string;
}

interface OnboardingFormProps {
  programmes: Programme[];
}

export default function OnboardingForm({ programmes }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      programmeId: "",
      currentLevel: "",
    },
  });

  async function onSubmit(data: any) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/programme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programmeId: data.programmeId,
          currentLevel: parseInt(data.currentLevel),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update programme");
      }
      toast.success("Sign In Completed! Redirecting to Dashboard...");

      console.log("About to redirect to /dashboard");

      setTimeout(() => {
        console.log("Redirecting now...");
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error updating programme:", error);
      toast.error("Failed to update programme. Please try again.");
    }
  }
  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <GradientBackground />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">
            Let's set up your Academic Profile
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            We ask for your academic information so we can personalize your
            CampusHub experience. Your programme helps us show you the right
            past questions, course materials, announcements, and updates that
            are relevant to your department.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-4 sm:px-6">
          <div className="grid gap-3">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-3 sm:gap-4"
              >
                <FormField
                  control={form.control}
                  name="programmeId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm">
                        Select your programme
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose Programme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programmes.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentLevel"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm">
                        Select your current level
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose Level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="300">300</SelectItem>
                          <SelectItem value="400">400</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    !form.watch("programmeId") ||
                    !form.watch("currentLevel")
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm sm:text-base">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span className="text-sm sm:text-base">
                        Complete Sign In
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-[11px] sm:text-xs text-white text-center mt-3 sm:mt-5 px-2">
              Note: You won't be able to change this later on
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
