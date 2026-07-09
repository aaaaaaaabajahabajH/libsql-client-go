"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const faqs: { q: string; a: string }[] = [
  {
    q: "What is AI Business Assistant?",
    a: "AI Business Assistant is an all-in-one SaaS platform with 6 AI-powered tools: a Social Media Generator, Product Description Writer, Email Writer, Invoice Generator, Blog Writer, and Text Translator. It helps businesses create professional content in seconds instead of hours.",
  },
  {
    q: "How does the credit system work?",
    a: "Every AI generation costs a small number of credits depending on the tool — typically 3–10 credits per output. Credits refresh automatically at the start of each billing cycle. Free accounts get 50 credits monthly, Starter gets 1,000, and Pro gets 5,000. Unused credits don't roll over.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. You can sign up and start using all 6 AI tools with 50 free credits per month — no credit card required. You only need payment information if you decide to upgrade to a paid plan.",
  },
  {
    q: "What AI models power the tools?",
    a: "Our tools are powered by the latest large language models optimized for business content. We continuously update models to improve output quality and add new capabilities — paid subscribers always get access to the newest models first.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. You can cancel your subscription at any time from your billing settings with no cancellation fees. You'll continue to have access to your paid plan until the end of your current billing period.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never use your content or inputs to train AI models. Your generated content and business data is yours and is never shared with third parties.",
  },
  {
    q: "What happens to my content when I generate it?",
    a: "All generated content is saved automatically to your history. Free plan history is retained for 7 days, Starter for 90 days, and Pro/Enterprise indefinitely. You can also save any output to your personal documents library for permanent access.",
  },
  {
    q: "Do you offer team or enterprise plans?",
    a: "Yes! Our Enterprise plan offers 20,000 credits per month, unlimited history, API access, dedicated support, and custom billing. Contact our team to discuss volume discounts and custom feature requirements for your organization.",
  },
  {
    q: "How accurate is the AI translator?",
    a: "Our translator supports 50+ languages with high accuracy for professional content. It preserves tone, context, and cultural nuance rather than doing a word-for-word translation. We recommend a human review for legal or medical content in critical use cases.",
  },
  {
    q: "Can I use the API to integrate with my own tools?",
    a: "API access is available on the Pro and Enterprise plans. Our REST API allows you to trigger any AI tool programmatically, retrieve history, and manage saved documents — enabling full integration with your existing tech stack.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-5 text-left gap-4 group"
        onClick={onToggle}
      >
        <span className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors">
          {question}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="py-20 sm:py-28 bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <Badge className="text-xs font-semibold px-3 py-1" variant="secondary">
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Questions?{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              We&apos;ve got answers
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about AI Business Assistant.
          </p>
        </div>

        {/* FAQ list */}
        <div className="rounded-2xl border border-border/50 bg-card divide-y-0 overflow-hidden px-6 shadow-sm">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              answer={faq.a}
              isOpen={openIndex === i}
              question={faq.q}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* Support link */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Still have questions?{" "}
          <a
            className="font-medium text-primary hover:underline"
            href="mailto:support@aibusiness.ai"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </section>
  );
}
