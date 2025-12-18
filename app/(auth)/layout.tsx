"use client";

import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import GradientBackground from "../(public)/_components/Gradient";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathName = usePathname();

  const backHref = pathName === "/verify-email" ? "/sign-in" : "/";
  return (
    <>
      <div className="relative overflow-hidden flex min-h-svh flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <GradientBackground />
        <Link
          href={backHref}
          className={buttonVariants({
            variant: "default",
            className: "absolute left-2 top-2 sm:left-4 sm:top-4",
          })}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline ml-2">Back</span>
        </Link>

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
          {children}

          <div className="text-balance text-center text-xs text-muted-foreground px-2 sm:px-0">
            By clicking continue, you agree to our{" "}
            <span className="hover:text-primary hover:underline cursor-pointer">
              <Link href="/terms">Terms of Service</Link>
            </span>{" "}
            and{" "}
            <span className="hover:text-primary hover:underline cursor-pointer">
              <Link href="/privacy">Privacy Policy</Link>
            </span>
            .
          </div>
        </div>
      </div>
    </>
  );
}
