"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { initialAuthActionState } from "@/features/auth/action-state";
import { confirmPasswordResetAction } from "@/features/auth/actions";

import { AuthField } from "./auth-field";

export function PasswordResetConfirmForm({
  mode,
  token,
}: {
  mode: "reset" | "setup";
  token: string;
}) {
  const [state, formAction] = useActionState(
    confirmPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <input name="mode" type="hidden" value={mode} />
      {mode === "reset" ? (
        <input name="token" type="hidden" value={token} />
      ) : null}

      <div>
        <p className="font-display text-3xl font-medium leading-none text-ink-display">
          {mode === "setup" ? "Create password" : "Reset password"}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {mode === "setup"
            ? "Your setup token was accepted. Create the owner password before entering the shop."
            : "Choose a new password. The reset token can be used only once."}
        </p>
      </div>

      {mode === "reset" && !token ? (
        <AuthField id="token" label="Reset token">
          <Input
            id="token"
            name="token"
            placeholder="Paste reset token"
            required
          />
        </AuthField>
      ) : null}
      <AuthField
        errors={state.fields?.newPassword}
        id="newPassword"
        inputProps={{
          autoComplete: "new-password",
          placeholder: "At least 10 characters",
          required: true,
          type: "password",
        }}
        label="New password"
      />
      <AuthField
        errors={state.fields?.confirmPassword}
        id="confirmPassword"
        inputProps={{
          autoComplete: "new-password",
          placeholder: "Repeat password",
          required: true,
          type: "password",
        }}
        label="Confirm password"
      />

      {state.status === "error" ? (
        <Callout variant="danger">{state.message}</Callout>
      ) : null}

      <SubmitButton />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-sm">
        <Link
          className="font-semibold text-accent hover:underline"
          href="/login"
        >
          Back to login
        </Link>
        <span className="inline-flex items-center gap-2 text-ink-muted">
          <ShieldCheck aria-hidden className="size-4" />
          One tenant only
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
      Save password
      <ArrowRight aria-hidden className="size-4" />
    </Button>
  );
}
