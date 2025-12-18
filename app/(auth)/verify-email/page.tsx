import VerifyRequest from "./VerifyRequest";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function VerifyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const cookieStore = await cookies();
  const hasVerificationCookie = cookieStore.has("email_verification_pending");

  if (!hasVerificationCookie) {
    return redirect("/sign-in");
  }
  // Get the email from query parameters
  const params = await searchParams;
  const emailParam = params.email;

  if (!emailParam) {
    return redirect("/sign-in");
  }

  return <VerifyRequest email={emailParam} />;
}
