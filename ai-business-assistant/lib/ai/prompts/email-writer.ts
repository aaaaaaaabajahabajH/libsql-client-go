import type { BuiltPrompt } from "./types";

const EMAIL_TYPE_CONTEXT: Record<string, string> = {
  "cold-outreach": "This is a cold outreach email to a prospect who hasn't heard from you before. Be concise (under 150 words for body), lead with value, make the ask clear and low-friction. No fluff.",
  "follow-up": "This is a follow-up to a previous interaction. Reference the prior contact briefly, add new value, make the next step easy. Keep it short — 3-5 sentences.",
  newsletter: "This is a newsletter email. Use a friendly, conversational tone. Lead with the most valuable content. Use short sections and clear calls-to-action.",
  support: "This is a customer support / service email. Be empathetic, solution-focused, and professional. Acknowledge any frustration, provide the resolution clearly.",
  sales: "This is a sales email. Lead with a strong benefit statement, use social proof if possible, create urgency without being pushy, end with a clear CTA.",
};

interface Input {
  emailType: string;
  recipientContext: string;
  senderContext: string;
  tone: string;
  includeSubjectLine: boolean;
}

export function buildEmailWriterPrompt(input: Input): BuiltPrompt {
  const typeContext = EMAIL_TYPE_CONTEXT[input.emailType] ?? "";

  const systemPrompt = `You are a professional business email writer. ${typeContext} Write in a ${input.tone} tone.
${input.includeSubjectLine ? 'Start with "Subject: [your subject line]" on its own line, then a blank line, then the email body.' : "Write only the email body (no subject line)."}
Write naturally — avoid clichés like "I hope this email finds you well", "As per my last email", or excessive pleasantries.
Output ONLY the complete email — no meta-commentary, no alternatives, no explanations.`;

  const userPrompt = `Write a ${input.emailType.replace("-", " ")} email.

About the recipient / context: ${input.recipientContext}
About the sender / company: ${input.senderContext}
Tone: ${input.tone}

Write the complete, ready-to-send email.`;

  return { systemPrompt, userPrompt, maxTokens: 600, temperature: 0.55 };
}
