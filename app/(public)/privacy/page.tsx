import GradientBackground from "../_components/Gradient";
import Navbar from "../_components/Navbar";
import FooterBlock from "../_components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for E-CampusHub",
};

export default function PrivacyPage() {
  return (
    <div className="relative">
      <Navbar />
      <div className="relative overflow-hidden min-h-screen">
        <GradientBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-blue-950 dark:text-gray-100">
            Privacy Policy
          </h1>
          <div className="prose dark:prose-invert max-w-none bg-white/50 dark:bg-black/50 p-8 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-2xl font-semibold mt-6 mb-4">
              1. Information We Collect
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We collect information you provide directly to us, such as when
              you create an account, update your profile, post content, or
              communicate with us. This may include your name, email address,
              profile picture, and any other information you choose to provide.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We use the information we collect to provide, maintain, and
              improve our services, to develop new ones, and to protect
              CampusHub and our users. We also use this information to
              communicate with you, such as to send you updates and security
              alerts.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              3. Information Sharing
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We do not share your personal information with companies,
              organizations, or individuals outside of CampusHub except in the
              following cases: with your consent, for legal reasons, or to
              protect rights, property or safety.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">
              4. Data Security
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We work hard to protect CampusHub and our users from unauthorized
              access to or unauthorized alteration, disclosure or destruction of
              information we hold.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Cookies</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We use cookies and similar technologies to help us provide our
              services, understand how they are used, and improve your
              experience.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Contact Us</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please
              contact us at support@campushub.com.
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
