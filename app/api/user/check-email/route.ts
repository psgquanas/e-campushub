import { prisma } from "@/lib/db";
import aj, { slidingWindow } from "@/lib/arcjet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.string().email(),
});

// Create Arcjet instance with rate limiting
const arcjet = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "2m",
    max: 5,
  })
);

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const fingerprint =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const decision = await arcjet.protect(req, { fingerprint });

    if (decision.isDenied()) {
      if (decision.reason.type === "RATE_LIMIT") {
        return NextResponse.json(
          {
            message: "Too many attempts. Try again in a few minutes.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    const body = await req.json();
    const { email } = checkEmailSchema.parse(body);

    // Check if user exists with either email or personalEmail
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { personalEmail: email }],
      },
      select: { id: true },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
