"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { initialAuthActionState } from "@/features/auth/action-state";
import { loginAction } from "@/features/auth/actions";
import { defaultShopSlug } from "@/features/auth/session";

import { AuthField } from "./auth-field";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(
    loginAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <input name="next" type="hidden" value={nextPath} />
      <div>
        <p className="font-display text-3xl font-medium leading-none text-ink-display">
          Sign in
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Use the shop slug, owner email, and password. First-time owners can
          use the setup token issued by super admin.
        </p>
      </div>

      <AuthField
        errors={state.fields?.shopSlug}
        id="shopSlug"
        inputProps={{
          autoComplete: "organization",
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
      <AuthField
        errors={state.fields?.password}
        id="password"
        inputProps={{
          autoComplete: "current-password",
          placeholder: "Password or owner setup token",
          required: true,
          type: "password",
        }}
        label="Password"
      />

      {state.status === "error" ? (
        <Callout variant="danger">{state.message}</Callout>
      ) : null}

      <SubmitButton />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-sm">
        <Link
          className="font-semibold text-accent hover:underline"
          href="/forgot-password"
        >
          Reset password
        </Link>
        <span className="inline-flex items-center gap-2 text-ink-muted">
          <KeyRound aria-hidden className="size-4" />
          Secure shop session
        </span>
      </div>
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
      Continue to shop
      <ArrowRight aria-hidden className="size-4" />
    </Button>
  );
}
