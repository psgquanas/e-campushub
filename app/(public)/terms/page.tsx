import GradientBackground from "../_components/Gradient";
import Navbar from "../_components/Navbar";
import FooterBlock from "../_components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for E-CampusHub",
};

export default function TermsPage() {
  return (
    <div className="relative">
      <Navbar />
      <div className="relative overflow-hidden min-h-screen">
        <GradientBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-blue-950 dark:text-gray-100">
            Terms of Service
          </h1>
          <div className="prose dark:prose-invert max-w-none bg-white/50 dark:bg-black/50 p-8 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-2xl font-semibold mt-6 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              By accessing and using CampusHub, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our services.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              2. User Conduct
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You agree to use CampusHub only for lawful purposes and in a way
              that does not infringe the rights of, restrict or inhibit anyone
              else's use and enjoyment of the platform. Prohibited behavior
              includes harassing or causing distress or inconvenience to any
              other user, transmitting obscene or offensive content, or
              disrupting the normal flow of dialogue within our platform.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              3. Content Ownership
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You retain all rights to any content you submit, post or display
              on or through CampusHub. By submitting, posting or displaying
              content on or through CampusHub, you grant us a worldwide,
              non-exclusive, royalty-free license to use, copy, reproduce,
              process, adapt, modify, publish, transmit, display and distribute
              such content in any and all media or distribution methods.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Privacy</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Your privacy is important to us. Please review our Privacy Policy
              to understand how we collect, use, and share your information.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              5. Modifications
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We reserve the right to modify these terms at any time. We will
              provide notice of any significant changes by posting the new terms
              on this page. Your continued use of CampusHub after any such
              changes constitutes your acceptance of the new terms.
            </p>

            <p className="mt-8 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <FooterBlock />
      </div>
    </div>
  );
}
