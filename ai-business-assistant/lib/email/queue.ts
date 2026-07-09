import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "./index";

export interface EnqueueEmailPayload {
  emailType: string;
  toAddress: string;
  subject: string;
  htmlBody: string;
  userId?: string | null;
  maxRetries?: number;
  scheduledAt?: Date;
}

export async function enqueueEmail(payload: EnqueueEmailPayload): Promise<void> {
  const admin = createAdminClient();
  await admin.from("email_queue").insert({
    email_type: payload.emailType,
    to_address: payload.toAddress,
    subject: payload.subject,
    html_body: payload.htmlBody,
    user_id: payload.userId ?? null,
    max_retries: payload.maxRetries ?? 3,
    scheduled_at: payload.scheduledAt?.toISOString() ?? new Date().toISOString(),
    status: "queued",
  });
}

export async function processEmailQueue(batchSize = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const provider = getEmailProvider();
  const now = new Date().toISOString();

  const { data: jobs } = await admin
    .from("email_queue")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(batchSize);

  if (!jobs?.length) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const jobIds = jobs.map((j) => j.id as string);

  await admin
    .from("email_queue")
    .update({ status: "processing" })
    .in("id", jobIds);

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    const result = await provider.send({
      to: job.to_address as string,
      subject: job.subject as string,
      html: job.html_body as string,
    });

    if (result.success) {
      await admin
        .from("email_queue")
        .update({ status: "sent", processed_at: new Date().toISOString(), error_message: null })
        .eq("id", job.id as string);
      succeeded++;
    } else {
      const retryCount = ((job.retry_count as number) ?? 0) + 1;
      const maxRetries = (job.max_retries as number) ?? 3;

      if (retryCount >= maxRetries) {
        await admin
          .from("email_queue")
          .update({
            status: "failed",
            retry_count: retryCount,
            processed_at: new Date().toISOString(),
            error_message: result.error ?? "Max retries exceeded",
          })
          .eq("id", job.id as string);
      } else {
        const backoffMs = Math.pow(2, retryCount) * 60 * 1000;
        const nextSchedule = new Date(Date.now() + backoffMs).toISOString();
        await admin
          .from("email_queue")
          .update({
            status: "queued",
            retry_count: retryCount,
            scheduled_at: nextSchedule,
            error_message: result.error ?? null,
          })
          .eq("id", job.id as string);
      }
      failed++;
    }
  }

  return { processed: jobs.length, succeeded, failed };
}
