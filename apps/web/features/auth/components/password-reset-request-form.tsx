"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { initialAuthActionState } from "@/features/auth/action-state";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { defaultShopSlug } from "@/features/auth/session";

import { AuthField } from "./auth-field";

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div>
        <p className="font-display text-3xl font-medium leading-none text-ink-display">
          Recover access
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Enter the shop and owner email. Reset links are scoped to one tenant
          and expire quickly.
        </p>
      </div>

      <AuthField
        errors={state.fields?.shopSlug}
        id="shopSlug"
        inputProps={{
          defaultValue: defaultShopSlug,
          placeholder: "sri-raja-tailors",
          required: true,
        }}
        label="Shop slug"
      />
      <AuthField
        errors={state.fields?.email}
        id="email"
        inputProps={{
          autoComplete: "email",
          defaultValue: "owner@sriraja.example.com",
          placeholder: "owner@example.com",
          required: true,
          type: "email",
        }}
        label="Owner email"
      />

      {state.status === "error" ? (
        <Callout variant="danger">{state.message}</Callout>
      ) : null}
      {state.status === "success" ? (
        <Callout variant="success">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 font-semibold text-ink-display">
              <MailCheck aria-hidden className="size-4 text-state-success" />
              Recovery request accepted
            </div>
            <p>{state.message}</p>
            {state.devResetLink ? (
              <Link
                className="font-semibold text-accent hover:underline"
                href={state.devResetLink}
              >
                Open local reset link
              </Link>
            ) : null}
          </div>
        </Callout>
      ) : null}

      <SubmitButton />

      <Link
        className="text-sm font-semibold text-accent hover:underline"
        href="/login"
      >
        Back to login
      </Link>
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button
      className="w-full"
      isLoading={status.pending}
      size="lg"
      type="submit"
    >
      Send reset link
      <ArrowRight aria-hidden className="size-4" />
    </Button>
  );
}
