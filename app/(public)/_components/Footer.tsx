"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface FooterItemType {
  id: string | number;
  text: string;
  link: string;
}

interface FooterBlockItemProps {
  title: string;
  items: FooterItemType[];
}

const FooterItem = ({ text, link }: { text: string; link: string }) => {
  return (
    <li>
      <Link
        href={link}
        className="duration-200 hover:text-blue-600 dark:hover:text-blue-500"
      >
        {text}
      </Link>
    </li>
  );
};

const FooterBlockItem = ({ title, items }: FooterBlockItemProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Links
      </h1>
      <ul className="space-y-3">
        {items.map((item) => (
          <FooterItem key={item.id} {...item} />
        ))}
      </ul>
    </div>
  );
};

const footerBlocks = [
  {
    id: 1,
    title: "Links",
    items: [
      {
        id: 1,
        text: "About",
        link: "/about",
      },
      {
        id: 2,
        text: "Contact",
        link: "/contact",
      },
    ],
  },
  {
    id: 2,
    title: "Resources",
    items: [
      {
        id: 1,
        text: "Privacy",
        link: "/privacy",
      },
      {
        id: 2,
        text: "Terms",
        link: "/terms",
      },
    ],
  },
];

const FooterBlock = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Successfully subscribed!", {
      description:
        "Thank you for joining our newsletter. You'll hear from us soon!",
    });

    console.log("Subscribed email:", email); // Log for now
    setEmail(""); // Clear the input
    setIsSubmitting(false);
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5 grid grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-16 py-20">
        <div className="space-y-6 col-span-2">
          <a href="/" className="text-primary hover:text-primary/90">
            <Image
              src="/ecampus-logo.svg"
              alt="Logo"
              width={100}
              height={40}
              className="h-8 w-auto sm:h-11"
            />
          </a>
          <p className="max-w-lg">
            Study smarter, connect better, stay updated
          </p>
        </div>

        {footerBlocks.map((footerBlock) => (
          <FooterBlockItem key={footerBlock.id} {...footerBlock} />
        ))}

        <div className="space-y-6 col-span-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            News-letter
          </h1>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="johndoe@gmail.com"
              className="px-5 py-2.5 rounded-sm outline-none flex-1 bg-gray-200 dark:bg-gray-800"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="outline-none w-full py-2.5 px-5 sm:w-max bg-blue-600 text-white rounded-sm flex items-center justify-center cursor-pointer hover:bg-blue-700"
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        <div className="w-full flex flex-col md:flex-row gap-4 items-center sm:justify-between py-3 border-t border-gray-200 dark:border-t-gray-800 text-gray-700 dark:text-gray-300">
          <div className="flex text-center sm:text-left sm:min-w-max">
            <p> © 2025 E-CampusHub. All right reserved </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterBlock;
