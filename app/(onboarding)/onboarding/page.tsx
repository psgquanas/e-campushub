import { prisma } from "@/lib/db";
import OnboardingForm from "./_components/OnboardingForm";
import GradientBackground from "@/app/(public)/_components/Gradient";

export default async function OnboardingPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <GradientBackground />
      <OnboardingForm programmes={programmes} />
    </>
  );
}
