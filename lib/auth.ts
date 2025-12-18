import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP, customSession } from "better-auth/plugins";
import { resend } from "./resend";
import VerifyEmail from "@/react-email-starter/emails/verify-email";
import type { Session, User } from "better-auth/types";
import { createAuthMiddleware } from "better-auth/api";
import { ADMIN_EMAILS } from "./admin";
import { checkAndAwardDailyLogin } from "./point";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      programmeId: {
        type: "number",
        required: false,
      },
    },
  },

  trustedOrigins: ["http://localhost:3000", "http://192.168.43.64:3000"],

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        try {
          await resend.emails.send({
            from: "SelormOG <onboarding@resend.dev>",
            to: [email],
            subject: "E-CampusHub - Sign In Code",
            react: VerifyEmail({ verificationCode: otp }),
          });
        } catch (error) {
          console.error("Failed to send verification OTP:", error);
          throw error; // Re-throw to let better-auth handle it, but now we have logs
        }
      },
    }),
    customSession(async ({ user, session }) => {
      const userWithRole = user as any;

      if (
        userWithRole.email &&
        userWithRole.emailVerified && // ✅ Require email verification
        ADMIN_EMAILS.includes(userWithRole.email) &&
        userWithRole.role !== "ADMIN"
      ) {
        await prisma.user.update({
          where: { id: userWithRole.id },
          data: { role: "ADMIN" },
        });
        userWithRole.role = "ADMIN";
        userWithRole.role = "ADMIN";
      }

      // Check for daily login points
      // We don't await this to avoid blocking the session response
      checkAndAwardDailyLogin(user.id).catch((err: unknown) => {
        console.error("Failed to award daily login points:", err);
      });

      // The role and programmeId are already on the user object
      // from additionalFields, so we can just return them
      return {
        user: {
          ...userWithRole,
          role: userWithRole.role,
          programmeId: userWithRole.programmeId,
        },
        session,
      };
    }),
  ],

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Check if this is a sign-in event
      if (ctx.path.startsWith("/sign-in")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const email = newSession.user.email;
          if (email) {
            console.log(
              `User ${email} signed in with role: ${
                newSession.user.role || "USER"
              }`
            );
          }
        }
      }
    }),
  },
});
