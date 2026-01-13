import GradientBackground from "../_components/Gradient";
import Navbar from "../_components/Navbar";
import FooterBlock from "../_components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  IconTarget,
  IconEye,
  IconHeart,
  IconUsers,
  IconBulb,
  IconShield,
} from "@tabler/icons-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About E-CampusHub",
  description: "An overview of E-CampusHub",
};

export default function AboutPage() {
  return (
    <div className="relative">
      <Navbar />
      <div className="relative overflow-hidden min-h-screen">
        <GradientBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
              Our Story
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-blue-950 dark:text-gray-100">
              About CampusHub
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              We are dedicated to transforming the student experience by
              creating a centralized, connected, and vibrant digital campus
              ecosystem.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <IconTarget className="size-6" />
                  </div>
                  <CardTitle>Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  To empower students with a comprehensive digital platform that
                  simplifies academic life, fosters meaningful connections, and
                  promotes a collaborative learning environment where everyone
                  can thrive.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <IconEye className="size-6" />
                  </div>
                  <CardTitle>Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  To become the leading digital companion for university
                  students, bridging the gap between academic requirements and
                  social engagement in a secure and inclusive space.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10 text-blue-950 dark:text-gray-100">
              Core Values
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: IconUsers,
                  label: "Community",
                  color: "text-purple-600",
                  bg: "bg-purple-100 dark:bg-purple-900/30",
                },
                {
                  icon: IconBulb,
                  label: "Innovation",
                  color: "text-yellow-600",
                  bg: "bg-yellow-100 dark:bg-yellow-900/30",
                },
                {
                  icon: IconShield,
                  label: "Integrity",
                  color: "text-green-600",
                  bg: "bg-green-100 dark:bg-green-900/30",
                },
                {
                  icon: IconHeart,
                  label: "Inclusivity",
                  color: "text-pink-600",
                  bg: "bg-pink-100 dark:bg-pink-900/30",
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-none hover:bg-white/60 dark:hover:bg-black/60 transition-colors"
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div
                      className={`p-3 rounded-full mb-4 ${item.bg} ${item.color}`}
                    >
                      <item.icon className="size-8" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      Commitment to fostering a supportive and forward-thinking
                      environment.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Section Placeholder */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-10 text-blue-950 dark:text-gray-100">
              Meet the Team
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col items-center">
                <Avatar className="size-24 mb-4 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                  <AvatarImage
                    src={`https://e-campushub.t3.storage.dev/profiles/MpiVdRXA1u0TV2oGQ6Bl7BlMipRHh1BC/1765219941530-unnamed.jpg`}
                  />
                  <AvatarFallback>F</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">Desmond Selorm</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Founder and Lead Developer
                </p>
              </div>
            </div>
          </div>
        </div>
        <FooterBlock />
      </div>
    </div>
  );
}
