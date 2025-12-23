"use client";

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const [googlePending, startGoogleTransition] = useTransition();
  const [emailPending, setEmailPending] = useState(false);
  const [email, setEmail] = useState("");

  const router = useRouter();

  async function signInWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Redirecting...");
          },
          onError: () => {
            toast.error("Failed to sign in with Google.");
          },
        },
      });
    });
  }

  async function handleEmailSignIn() {
    setEmailPending(true);
    try {
      // Check if email exists
      const checkRes = await fetch("/api/user/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!checkRes.ok) {
        if (checkRes.status === 429) {
          const data = await checkRes.json();
          toast.error(
            data.message || "Too many attempts. Please try again later."
          );
          return;
        }
        toast.error("Failed to verify email");
        return;
      }

      const { exists } = await checkRes.json();

      if (!exists) {
        toast.error("No account found with this email.");
        return;
      }

      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification OTP sent to your email");
            setEmailPending(false);
            document.cookie =
              "email_verification_pending=true; path=/; max-age=600";
            router.push(`/verify-email?email=${email}`);
          },
          onError: () => {
            toast.error("Internal Server Error");
            setEmailPending(false);
          },
        },
      });
    } catch (error) {
      toast.error("An unexpected error occurred");
      setEmailPending(false);
    }
  }

  return (
    <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Login with your Student Email</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 sm:px-6">
        <Button
          onClick={signInWithGoogle}
          disabled={googlePending}
          className="w-full sm:h-11"
          variant="outline"
        >
          {googlePending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Loading....</span>
            </>
          ) : (
            <>
              <GoogleIcon className="size-4" />
              Sign in with Google
            </>
          )}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              placeholder="index@st.uew.edu.gh"
              className="sm:h-11"
              required
            />
          </div>

          <Button
            disabled={emailPending || !email.trim()}
            onClick={handleEmailSignIn}
            className="sm:h-11"
          >
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Continue with Email</span>
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground text-center">
            First time users{" "}
            <span className="text-black dark:text-white">must</span> sign in
            with Google.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
