import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import arcjet, { slidingWindow } from "@/lib/arcjet";
import ip from "@arcjet/ip";
import { otpStore } from "@/lib/otp-store";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Apply Arcjet rate limiting to prevent brute force attacks
    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "10m",
          max: 10, // 10 verification attempts per 10 minutes
        })
      )
      .protect(req, { fingerprint: ip(req) || session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          {
            message: "Too many verification attempts. Please try again later.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    const body = await req.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    const isValid = await otpStore.verify(session.user.id, email, otp);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // OTP is valid, update the user's personal email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { personalEmail: email },
    });

    // Clean up OTP
    await otpStore.delete(session.user.id, email);

    return NextResponse.json({
      message: "Personal email verified and updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
