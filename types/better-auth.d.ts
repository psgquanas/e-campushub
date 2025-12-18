import type { Session, User } from "better-auth/types";

declare module "better-auth/types" {
  interface User {
    programmeId: number | null;
  }

  interface Session {
    user: User & {
      programmeId: number | null;
    };
  }

  interface SessionUser {
    programmeId: number | null;
  }
}
