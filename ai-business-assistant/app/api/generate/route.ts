import { NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProvider, buildPrompt } from "@/lib/ai";
import { saveHistory } from "@/services/history";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";
import type { CreditsRow, DbToolType, Json } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  tool: z.enum([
    "social-media",
    "product-description",
    "blog-writer",
    "email-writer",
    "invoice-generator",
    "translator",
  ]),
  input: z.record(z.unknown()),
  title: z.string().min(1).max(300),
});

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = rateLimit(`ai:${ip}`, RATE_LIMIT_CONFIGS.ai);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(rl.retryAfter ?? 60),
      },
    });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const { tool, input, title } = body;
  const creditCost = TOOL_CREDIT_COSTS[tool as keyof typeof TOOL_CREDIT_COSTS];

  const { data: credits } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", user.id)
    .single<CreditsRow>();

  if (!credits || credits.balance < creditCost) {
    return errorResponse(
      `Insufficient credits. You need ${creditCost} credits but have ${credits?.balance ?? 0}.`,
      402,
    );
  }

  let prompt: ReturnType<typeof buildPrompt>;
  try {
    prompt = buildPrompt(tool as DbToolType, input);
  } catch {
    return errorResponse("Failed to build prompt for this tool", 400);
  }

  const provider = getProvider();

  let providerStream: ReadableStream<string>;
  try {
    providerStream = await provider.stream(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI provider error";
    return errorResponse(message, 502);
  }

  const encoder = new TextEncoder();
  const userId = user.id;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = providerStream.getReader();
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += value;
          controller.enqueue(encoder.encode(value));
        }
        controller.close();

        if (fullContent.trim()) {
          const adminClient = createAdminClient();

          await Promise.all([
            adminClient.rpc(
              "deduct_credits",
              { p_user_id: userId, p_amount: creditCost } as unknown as { p_user_id: string; p_amount: number },
            ),
            saveHistory({
              user_id: userId,
              tool: tool as DbToolType,
              title,
              input: input as unknown as Json,
              output: fullContent,
              credits_used: creditCost,
            }),
          ]);
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Credit-Cost": String(creditCost),
    },
  });
}
