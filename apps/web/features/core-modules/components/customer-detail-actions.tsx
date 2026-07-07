"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ruler, ShoppingBag, Trash2, UserRoundPlus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerContactRead, CustomerProfileRead } from "@tailoros/schemas";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

export function CustomerDetailActions({
  contact,
}: {
  contact: CustomerContactRead;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: "danger" | "success";
    text: string;
  } | null>(null);

  async function addProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await requestJson<{ contact: CustomerContactRead }>(
      "/api/shop/customers",
      "POST",
      {
        contactId: contact.contactId,
        fullName: stringValue(formData.get("fullName")),
        genderContext: stringValue(formData.get("genderContext")),
        mode: "add-profile",
        relationLabel: stringValue(formData.get("relationLabel")) || "family",
      },
    );

    setIsBusy(false);

    if (result.error) {
      setMessage({ text: result.error, tone: "danger" });
      return;
    }

    event.currentTarget.reset();
    setMessage({ text: "Family member added.", tone: "success" });
    router.refresh();
  }

  async function deleteProfile(profile: CustomerProfileRead) {
    setIsBusy(true);
    setMessage(null);

    const result = await requestJson<{ contact: CustomerContactRead }>(
      `/api/shop/customers?profileId=${encodeURIComponent(profile.id)}`,
      "DELETE",
    );

    setIsBusy(false);

    if (result.error) {
      setMessage({ text: result.error, tone: "danger" });
      return;
    }

    setMessage({ text: "Profile removed.", tone: "success" });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <Callout variant={message.tone}>{message.text}</Callout>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {contact.profiles.map((profile) => (
          <article
            className="rounded-lg border border-hairline bg-surface-strong p-4"
            key={profile.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-medium text-ink-display">
                  {profile.fullName}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {profile.customerCode}
                </p>
              </div>
              <Button
                aria-label={`Remove ${profile.fullName}`}
                disabled={isBusy}
                onClick={() => deleteProfile(profile)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "sm", variant: "secondary" })}
                href={`/shop/orders/new?contactId=${encodeURIComponent(
                  contact.contactId,
                )}&profileId=${encodeURIComponent(profile.id)}`}
              >
                <ShoppingBag aria-hidden className="size-4" />
                New order
              </Link>
              <Link
                className={buttonVariants({ size: "sm", variant: "ghost" })}
                href={`/shop/measurements/new?profileId=${encodeURIComponent(
                  profile.id,
                )}`}
              >
                <Ruler aria-hidden className="size-4" />
                Measurement
              </Link>
            </div>
          </article>
        ))}
      </div>

      <form
        className="grid gap-3 rounded-lg border border-dashed border-hairline bg-page p-4"
        onSubmit={addProfile}
      >
        <div className="flex items-center gap-2">
          <UserRoundPlus aria-hidden className="size-4 text-accent" />
          <h2 className="font-display text-2xl font-medium text-ink-display">
            Add family member
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" name="fullName" placeholder="Family member" />
          <Field label="Relation" name="relationLabel" placeholder="daughter" />
          <Field
            label="Gender/context"
            name="genderContext"
            placeholder="kids"
            required={false}
          />
        </div>
        <Button isLoading={isBusy} type="submit">
          Add family member
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} required={required} />
    </div>
  );
}

async function requestJson<T>(
  path: string,
  method: "DELETE" | "PATCH" | "POST",
  body?: Record<string, unknown>,
): Promise<ApiState<T>> {
  const response = await fetch(path, {
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { "content-type": "application/json" },
    method,
  });

  return (await response.json()) as ApiState<T>;
}

function stringValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
