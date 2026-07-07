"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceGeneratorFormValues } from "@/actions/tools";

interface Props {
  form: UseFormReturn<InvoiceGeneratorFormValues>;
}

export function InvoiceGeneratorFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ig-client">Client Name</Label>
        <Input
          id="ig-client"
          placeholder="e.g. Acme Corporation"
          {...register("clientName")}
        />
        {errors.clientName && (
          <p className="text-xs text-destructive">{errors.clientName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ig-services">Services / Products Provided</Label>
        <Textarea
          id="ig-services"
          rows={4}
          placeholder="Describe the services rendered. Include quantities if relevant. e.g. Web design (40 hrs), Brand identity package, Monthly retainer..."
          {...register("services")}
        />
        {errors.services && (
          <p className="text-xs text-destructive">{errors.services.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ig-currency">Currency</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="ig-currency">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ig-terms">Payment Terms</Label>
          <Controller
            control={control}
            name="paymentTerms"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="ig-terms">
                  <SelectValue placeholder="Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net-15">Net 15</SelectItem>
                  <SelectItem value="net-30">Net 30</SelectItem>
                  <SelectItem value="net-60">Net 60</SelectItem>
                  <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ig-notes">Additional Notes (optional)</Label>
        <Input
          id="ig-notes"
          placeholder="Late fee policy, bank details note, thank you message..."
          {...register("additionalNotes")}
        />
      </div>
    </div>
  );
}
