import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to TailorOS with tenant-scoped owner or staff credentials.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const next = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <AuthShell
      eyebrow="Secure access"
      subtitle="Counter work starts only after TailorOS knows the shop, staff identity, and tenant session. Every order, payment, measurement, and message action remains scoped to that shop."
      title="Open the shop desk without mixing customer data."
    >
      <LoginForm nextPath={next ?? "/shop"} />
    </AuthShell>
  );
}
