"use client";

import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import SnowfallEffect from "@/components/snowfall-effect";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="text-primary hover:text-primary/90 flex items-center justify-center"
        >
          <Image
            src="/ecampus-logo.svg"
            alt="Logo"
            width={100}
            height={40}
            className="h-8 w-auto sm:h-11"
          />
        </Link>
        <SnowfallEffect />
        {children}
      </div>
    </div>
  );
}
