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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, Loader2, Check, ChevronsUpDown } from "lucide-react";
import GradientBackground from "@/app/(public)/_components/Gradient";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Programme {
  id: number;
  name: string;
}

interface OnboardingFormProps {
  programmes: Programme[];
}

export default function OnboardingForm({ programmes }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
      toast.success("Sign In Completed!");
      setIsLoading(false);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error updating programme:", error);
      toast.error("Failed to update programme. Please try again.");
      setIsLoading(false);
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
                    <FormItem className="w-full flex flex-col">
                      <FormLabel className="text-sm">
                        Select your programme
                      </FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? programmes.find(
                                    (p) => String(p.id) === field.value
                                  )?.name
                                : "Search and select programme..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search programme..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No programme found.</CommandEmpty>
                              <CommandGroup>
                                {programmes.map((programme) => (
                                  <CommandItem
                                    key={programme.id}
                                    value={programme.name}
                                    onSelect={() => {
                                      form.setValue(
                                        "programmeId",
                                        String(programme.id)
                                      );
                                      setOpen(false);
                                    }}
                                  >
                                    {programme.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        field.value === String(programme.id)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                      <span className="text-xs">Complete Sign In</span>
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
