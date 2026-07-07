import type { BuiltPrompt } from "./types";

const PAYMENT_TERMS_LABEL: Record<string, string> = {
  "net-15": "Net 15 (due in 15 days)",
  "net-30": "Net 30 (due in 30 days)",
  "net-60": "Net 60 (due in 60 days)",
  "due-on-receipt": "Due on Receipt",
};

interface Input {
  clientName: string;
  services: string;
  currency: string;
  paymentTerms: string;
  additionalNotes?: string;
}

export function buildInvoiceGeneratorPrompt(input: Input): BuiltPrompt {
  const today = new Date();
  const dueDate = new Date(today);
  if (input.paymentTerms === "net-15") dueDate.setDate(dueDate.getDate() + 15);
  else if (input.paymentTerms === "net-30") dueDate.setDate(dueDate.getDate() + 30);
  else if (input.paymentTerms === "net-60") dueDate.setDate(dueDate.getDate() + 60);

  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt = `You are a professional business document writer. Generate a complete, professional invoice in plain text format.
Format the invoice exactly as follows:
1. Invoice header (INVOICE, invoice number like #INV-XXXX, date, due date)
2. Bill To section with client name
3. Line Items table with columns: Description | Qty | Unit Price | Amount
4. Subtotal, any applicable taxes (estimate 0% unless specified), and TOTAL
5. Payment Terms and Payment Instructions section
6. Professional closing note
Use ${input.currency} currency. Make prices realistic based on the services described.
Output ONLY the formatted invoice — no preamble, no "Here is your invoice:".`;

  const userPrompt = `Generate a professional invoice:

Client: ${input.clientName}
Services Provided: ${input.services}
Currency: ${input.currency}
Payment Terms: ${PAYMENT_TERMS_LABEL[input.paymentTerms] ?? input.paymentTerms}
Invoice Date: ${formatDate(today)}
Due Date: ${input.paymentTerms === "due-on-receipt" ? formatDate(today) : formatDate(dueDate)}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ""}

Create a complete, professional invoice with realistic pricing.`;

  return { systemPrompt, userPrompt, maxTokens: 700, temperature: 0.25 };
}
