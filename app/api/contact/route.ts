import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { contactEmailTemplate } from "@/lib/email-template";
import z from "zod";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

const contactSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Send email notification
    await resend.emails.send(contactEmailTemplate(validatedData));

    return NextResponse.json(
      { success: true, message: "Message received successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
