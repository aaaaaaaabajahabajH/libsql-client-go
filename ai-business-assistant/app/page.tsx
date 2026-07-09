import type { Metadata } from "next";

import {
  LandingNavbar,
  Hero,
  SocialProof,
  Features,
  HowItWorks,
  DashboardPreview,
  Testimonials,
  PricingPreview,
  FAQ,
  CTA,
  Footer,
} from "@/components/landing";
import { APP_DESCRIPTION, APP_NAME } from "@/utils/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Grow Faster with AI`,
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} — Grow Faster with AI`,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <PricingPreview />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
