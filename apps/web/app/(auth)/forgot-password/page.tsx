import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordResetRequestForm } from "@/features/auth/components/password-reset-request-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a tenant-scoped TailorOS password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      subtitle="Recovery is scoped to one shop and one owner account. Reset links expire quickly and cannot reveal whether another tenant owns the same email."
      title="Recover access without opening tenant data."
    >
      <PasswordResetRequestForm />
    </AuthShell>
  );
}
