"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

export default function VerifyRequest({ email }: { email: string }) {
  const [otp, setOtp] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState(30); // Initial countdown of 30 seconds
  const router = useRouter();
  const isOTPCompleted = otp.length === 6;

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  function verifyOtp() {
    startEmailTransition(async () => {
      await authClient.signIn.emailOtp({
        email: email,
        otp: otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email Verified Successfully");
            router.push("/dashboard");
          },
          onError: () => {
            toast.error("Invalid OTP. Please try again.");
          },
        },
      });
    });
  }

  function resendOtp() {
    startResendTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("New verification code sent!");
            setOtp(""); // Clear current OTP
            setTimeLeft(60); // Reset countdown to 60 seconds
          },
          onError: () => {
            toast.error("Failed to resend code. Please try again.");
          },
        },
      });
    });
  }

  return (
    <Card className="w-full mx-auto border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center space-y-3 px-4 sm:px-6 pt-6">
        <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </div>
        <CardTitle className="text-lg sm:text-xl md:text-2xl">
          Check Your Email
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm px-2 sm:px-4">
          We have sent a verification email code to your inbox. Please check
          your email and paste the code below
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <InputOTP
            value={otp}
            onChange={(value) => setOtp(value)}
            maxLength={6}
            className="gap-1.5 sm:gap-2"
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

          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            {isOTPCompleted
              ? "Code complete! Click verify below."
              : `Enter the 6-digit code (${otp.length}/6)`}
          </p>
        </div>

        <Button
          onClick={verifyOtp}
          disabled={emailPending || !isOTPCompleted}
          className="w-full h-10 sm:h-11"
        >
          {emailPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="text-center">
          <button
            onClick={resendOtp}
            disabled={resendPending || timeLeft > 0}
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            {resendPending ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Sending...</span>
              </>
            ) : timeLeft > 0 ? (
              <span>Resend in {timeLeft}s</span>
            ) : (
              <>
                Didn&apos;t receive the code?{" "}
                <span className="font-medium underline underline-offset-2">
                  Resend
                </span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Check your spam folder if you don&apos;t see the email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
