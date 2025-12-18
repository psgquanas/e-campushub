"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const PROMPT_START_DATE = new Date("2026-06-11");

interface AlumniEmailPromptProps {
  currentLevel: number | null;
  personalEmail: string | null;
}

export function AlumniEmailPrompt({
  currentLevel,
  personalEmail,
}: AlumniEmailPromptProps) {
  // Check if current date is on or after the start date
  const isAfterStartDate = new Date() >= PROMPT_START_DATE;

  const [open, setOpen] = useState(
    currentLevel === 400 && !personalEmail && isAfterStartDate
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  if (!open) return null;

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/personal-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your email");
      setStep("otp");
      setResendCountdown(60); // Start 60s countdown
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    await handleSendOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/personal-email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to verify OTP");
        return;
      }

      toast.success("Personal email verified successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Personal Email</DialogTitle>
          <DialogDescription>
            As a final year student (Level 400), please add your personal email
            to maintain access to the platform as an alumni. You'll be required
            to verify your email.
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="personal-email">Personal Email</Label>
                <Input
                  id="personal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="rounded-md">
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send Verification Code
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center">
                  We sent a verification code to <strong>{email}</strong>
                </p>
                <InputOTP
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  maxLength={6}
                  className="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex items-center gap-2 text-xs">
                  <p className="text-muted-foreground">
                    {otp.length === 6
                      ? "Code complete! Click verify below."
                      : `Enter the 6-digit code (${otp.length}/6)`}
                  </p>
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground">
                      Resend code in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-primary hover:underline font-medium disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("email")}
                disabled={isLoading}
                className="rounded-md"
              >
                Change Email
              </Button>
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="rounded-md"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Verify Email
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
