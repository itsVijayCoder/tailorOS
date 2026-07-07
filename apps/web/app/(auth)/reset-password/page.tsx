import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordResetConfirmForm } from "@/features/auth/components/password-reset-confirm-form";

export const metadata: Metadata = {
  title: "Create Password",
  description: "Create or reset a TailorOS tenant password.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const tokenParam = Array.isArray(params.token)
    ? params.token[0]
    : params.token;
  const mode = modeParam === "setup" ? "setup" : "reset";

  return (
    <AuthShell
      eyebrow={mode === "setup" ? "First sign-in" : "Password reset"}
      subtitle={
        mode === "setup"
          ? "Owner setup tokens are temporary. Create the shop password once, then use the normal login screen."
          : "Reset tokens are one-use credentials. After saving the password, TailorOS signs you into the correct shop session."
      }
      title={
        mode === "setup" ? "Create the owner password." : "Set a new password."
      }
    >
      <PasswordResetConfirmForm mode={mode} token={tokenParam ?? ""} />
    </AuthShell>
  );
}
