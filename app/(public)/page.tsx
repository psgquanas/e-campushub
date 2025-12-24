import Navbar from "@/app/(public)/_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/FeaturedSection";
import GradientBackground from "./_components/Gradient";
import CtaSection from "./_components/CTASection";
import FooterBlock from "./_components/Footer";
import SnowfallEffect from "@/components/snowfall-effect";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <SnowfallEffect />
      <div className="relative overflow-hidden">
        <GradientBackground />
        <Hero />
        <Features />
        <CtaSection />
        <FooterBlock />
      </div>
    </div>
  );
}
