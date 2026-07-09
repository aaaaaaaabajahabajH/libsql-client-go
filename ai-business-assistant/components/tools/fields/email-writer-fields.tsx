"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import type { EmailWriterFormValues } from "@/actions/tools";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  form: UseFormReturn<EmailWriterFormValues>;
}

export function EmailWriterFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ew-type">Email Type</Label>
        <Controller
          control={control}
          name="emailType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="ew-type">
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                <SelectItem value="follow-up">Follow-Up</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="support">Customer Support</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ew-recipient">About the Recipient</Label>
        <Textarea
          id="ew-recipient"
          placeholder="Who is the recipient? What do they do, what problem do you solve for them, or what's the context?"
          rows={3}
          {...register("recipientContext")}
        />
        {errors.recipientContext && (
          <p className="text-xs text-destructive">{errors.recipientContext.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ew-sender">About You / Your Company</Label>
        <Textarea
          id="ew-sender"
          placeholder="Who are you? What does your company do or offer?"
          rows={2}
          {...register("senderContext")}
        />
        {errors.senderContext && (
          <p className="text-xs text-destructive">{errors.senderContext.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ew-tone">Tone</Label>
        <Controller
          control={control}
          name="tone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="ew-tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          className="h-4 w-4 rounded border-border accent-primary"
          type="checkbox"
          {...register("includeSubjectLine")}
        />
        <span className="text-sm">Include subject line</span>
      </label>
    </div>
  );
}
