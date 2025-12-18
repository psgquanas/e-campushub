import { auth } from "@/lib/auth";
import { resend } from "@/lib/resend";
import VerifyEmail from "@/react-email-starter/emails/verify-email";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import arcjet, { protectSignup, slidingWindow } from "@/lib/arcjet";
import ip from "@arcjet/ip";
import { otpStore } from "@/lib/otp-store";

const sendOtpSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email } = sendOtpSchema.parse(body);

    // Apply Arcjet protection
    const decision = await arcjet
      .withRule(
        protectSignup({
          email: {
            mode: "LIVE",
            block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
          },
          bots: {
            mode: "LIVE",
            allow: [],
          },
          rateLimit: {
            mode: "LIVE",
            interval: "10m",
            max: 5, // 5 OTP requests per 10 minutes
          },
        })
      )
      .protect(req, { email, fingerprint: ip(req) || session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 }
        );
      } else if (decision.reason.isEmail()) {
        let message: string;
        if (decision.reason.emailTypes.includes("INVALID")) {
          message = "Email address format is invalid.";
        } else if (decision.reason.emailTypes.includes("DISPOSABLE")) {
          message = "We do not allow disposable email addresses.";
        } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
          message = "Email entered invalid";
        } else {
          message = "Invalid email.";
        }
        return NextResponse.json({ message }, { status: 400 });
      } else {
        return NextResponse.json(
          { message: "Request blocked" },
          { status: 403 }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis
    await otpStore.set(session.user.id, email, otp);

    // Send OTP via email
    await resend.emails.send({
      from: "SelormOG <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Personal Email",
      react: VerifyEmail({ verificationCode: otp }),
    });

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export the OTP store for verification
export { otpStore };
