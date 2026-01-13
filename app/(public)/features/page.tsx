import GradientBackground from "../_components/Gradient";
import Navbar from "../_components/Navbar";
import FooterBlock from "../_components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconMessageCircle2,
  IconTrophy,
  IconBook,
  IconUsers,
  IconLock,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { Metadata } from "next";
import SnowfallEffect from "@/components/snowfall-effect";

export const metadata: Metadata = {
  title: "Features",
  description: "An overview of E-CampusHub features",
};

export default function FeaturesPage() {
  const features = [
    {
      icon: IconMessageCircle2,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      title: "Anonymous Confessions",
      description:
        "Share your thoughts, ask questions, or vent safely without revealing your identity. Our moderated environment ensures a supportive community.",
    },
    {
      icon: IconBook,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/30",
      title: "Academic Repository",
      description:
        "Access a vast collection of study materials, past questions, and lecture notes shared by students and faculty.",
    },
    {
      icon: IconUsers,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      title: "Student Community",
      description:
        "Connect with colleagues, engage in meaningful discussions about campus life and academics.",
    },
    {
      icon: IconLock,
      color: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/30",
      title: "Privacy Focused",
      description:
        "Your data security is our priority. We use advanced encryption and strict privacy controls to keep your information safe.",
    },
    {
      icon: IconSearch,
      color: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      title: "Smart Search",
      description:
        "Find exactly what you need with our powerful search engine. Filter by course, level, or topic to locate resources instantly.",
    },
  ];

  return (
    <div className="relative">
      <Navbar />
      <div className="relative overflow-hidden min-h-screen">
        <GradientBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
              Platform Overview
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-blue-950 dark:text-gray-100">
              Everything You Need to Excel
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              CampusHub provides a comprehensive suite of tools designed to
              enhance your academic journey and social experience on campus.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`size-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-950 dark:text-gray-100">
              Ready to get started?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already using CampusHub to
              succeed in their studies and connect with the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25"
              >
                Sign In
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-blue-900 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors dark:text-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900/70"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        <FooterBlock />
      </div>
    </div>
  );
}
