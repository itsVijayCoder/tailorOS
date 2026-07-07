"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerContactRead } from "@tailoros/schemas";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

export function CustomerIntakeForm({
  defaultMobile = "",
  defaultName = "",
}: {
  defaultMobile?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await requestJson<{ contact: CustomerContactRead }>(
      "/api/shop/customers",
      {
        fullName: stringValue(formData.get("fullName")),
        genderContext: stringValue(formData.get("genderContext")),
        notes: stringValue(formData.get("notes")),
        primaryMobile: stringValue(formData.get("primaryMobile")),
        relationLabel: stringValue(formData.get("relationLabel")) || "self",
        whatsappOptIn: formData.get("whatsappOptIn") === "on",
      },
    );

    setIsBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/shop/customers/${result.data.contact.contactId}`);
    router.refresh();
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-hairline bg-surface-strong p-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <UserRoundPlus aria-hidden className="size-4 text-accent" />
        <h2 className="font-display text-2xl font-medium text-ink-display">
          Customer profile
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          defaultValue={defaultMobile}
          label="Mobile"
          name="primaryMobile"
          placeholder="+91 98765 43210"
        />
        <Field
          defaultValue={defaultName}
          label="Name"
          name="fullName"
          placeholder="Meena Ravi"
        />
        <Field label="Relation" name="relationLabel" placeholder="self" />
        <Field
          label="Gender/context"
          name="genderContext"
          placeholder="women, men, kids"
          required={false}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Address hint, fit preference, or notebook import note"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-ink-body">
        <input name="whatsappOptIn" type="checkbox" />
        WhatsApp opt-in
      </label>
      {error ? <Callout variant="danger">{error}</Callout> : null}
      <Button isLoading={isBusy} type="submit">
        Create customer
        <ArrowRight aria-hidden className="size-4" />
      </Button>
    </form>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required = true,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

async function requestJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiState<T>> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  return (await response.json()) as ApiState<T>;
}

function stringValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
