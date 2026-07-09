"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const PRICING_FAQS: FaqItem[] = [
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes — upgrades take effect immediately and you're billed the prorated difference. Downgrades take effect at the end of your current billing period, so you keep access to premium features until then.",
  },
  {
    question: "What happens to unused credits at the end of the month?",
    answer:
      "Credits reset on your monthly billing anniversary. Unused credits don't roll over, so make sure to use them before your next billing date.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "The Free plan gives you 50 credits every month with no time limit, so you can evaluate the AI tools before committing. No credit card required.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer a 7-day money-back guarantee on your first payment for Starter and Pro plans. Contact support within 7 days of your first charge and we'll issue a full refund, no questions asked.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, Amex, Discover) as well as Apple Pay and Google Pay, all processed securely through Stripe.",
  },
  {
    question: "Do annual plans renew automatically?",
    answer:
      "Yes, annual plans auto-renew each year. You'll receive a reminder email 7 days before renewal. You can cancel anytime from your Billing settings to prevent the next charge.",
  },
  {
    question: "What is API access on the Pro plan?",
    answer:
      "Pro subscribers get a personal API key that lets them call our AI generation endpoints programmatically — great for automating content workflows or building internal tools on top of our platform.",
  },
  {
    question: "Do you offer discounts for nonprofits or startups?",
    answer:
      "Yes. We offer 50% off for registered nonprofits and early-stage startups (under $1M ARR). Email support@aibusiness.ai with proof of eligibility and we'll set up a discount for you.",
  },
];

function FaqRow({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-primary"
        type="button"
        onClick={onToggle}
      >
        <span className="text-sm font-semibold leading-snug">{item.question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function PricingFaq() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about plans and billing.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6">
        {PRICING_FAQS.map((item, i) => (
          <FaqRow
            key={item.question}
            isOpen={openIndex === i}
            item={item}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Still have questions?{" "}
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href="mailto:support@aibusiness.ai"
        >
          Contact our support team
        </a>
      </p>
    </div>
  );
}
