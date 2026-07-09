"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import type { ProductDescriptionFormValues } from "@/actions/tools";
import { Input } from "@/components/ui/input";
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
  form: UseFormReturn<ProductDescriptionFormValues>;
}

export function ProductDescriptionFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pd-name">Product Name</Label>
        <Input
          id="pd-name"
          placeholder="e.g. AeroGrip Pro Running Shoes"
          {...register("productName")}
        />
        {errors.productName && (
          <p className="text-xs text-destructive">{errors.productName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pd-features">Key Features & Specs</Label>
        <Textarea
          id="pd-features"
          placeholder="List the main features, specs, materials, or selling points. Be specific."
          rows={3}
          {...register("keyFeatures")}
        />
        {errors.keyFeatures && (
          <p className="text-xs text-destructive">{errors.keyFeatures.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pd-audience">Target Audience</Label>
        <Input
          id="pd-audience"
          placeholder="e.g. Serious runners aged 25-45 who train 5+ days a week"
          {...register("targetAudience")}
        />
        {errors.targetAudience && (
          <p className="text-xs text-destructive">{errors.targetAudience.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pd-tone">Writing Tone</Label>
        <Controller
          control={control}
          name="tone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="pd-tone">
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
    </div>
  );
}
