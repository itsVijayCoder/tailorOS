"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialTenantOnboardingState } from "@/features/admin/action-state";
import { onboardTenantAction } from "@/features/admin/actions";

export function TenantOnboardingForm() {
  const [state, formAction] = useActionState(
    onboardTenantAction,
    initialTenantOnboardingState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldError
          errors={state.fields?.shopName}
          id="shopName"
          label="Shop name"
        >
          <Input
            autoComplete="organization"
            id="shopName"
            name="shopName"
            placeholder="Sri Raja Tailors"
            required
          />
        </FieldError>
        <FieldError
          errors={state.fields?.preferredSlug}
          id="preferredSlug"
          label="Shop slug"
        >
          <Input
            autoComplete="off"
            id="preferredSlug"
            name="preferredSlug"
            placeholder="sri-raja-tailors"
            required
          />
        </FieldError>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldError errors={state.fields?.city} id="city" label="City">
          <Input
            autoComplete="address-level2"
            id="city"
            name="city"
            placeholder="Madurai"
            required
          />
        </FieldError>
        <div className="grid gap-2">
          <Label htmlFor="plan">Plan</Label>
          <Select id="plan" name="plan" defaultValue="pilot">
            <option value="pilot">Pilot</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldError
          errors={state.fields?.ownerName}
          id="ownerName"
          label="Owner name"
        >
          <Input
            autoComplete="name"
            id="ownerName"
            name="ownerName"
            placeholder="Raja Raman"
            required
          />
        </FieldError>
        <FieldError
          errors={state.fields?.ownerMobile}
          id="ownerMobile"
          label="Owner mobile"
        >
          <Input
            autoComplete="tel"
            id="ownerMobile"
            name="ownerMobile"
            placeholder="+919876543210"
            required
          />
        </FieldError>
      </div>

      <FieldError
        errors={state.fields?.ownerEmail}
        id="ownerEmail"
        label="Owner email"
      >
        <Input
          autoComplete="email"
          id="ownerEmail"
          name="ownerEmail"
          placeholder="owner@example.com"
          required
          type="email"
        />
      </FieldError>

      <div className="grid gap-2">
        <Label htmlFor="adminReason">Admin reason</Label>
        <Textarea
          id="adminReason"
          name="adminReason"
          placeholder="super_admin_onboarding"
        />
      </div>

      {state.status === "error" ? (
        <Callout variant="danger">{state.message}</Callout>
      ) : null}

      {state.status === "success" && state.ownerAccess ? (
        <Callout variant="success">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Owner access issued</Badge>
              <span className="text-sm font-semibold text-ink-display">
                {state.ownerAccess.email}
              </span>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="grid gap-1">
                <dt className="font-semibold text-ink-display">
                  Session token
                </dt>
                <dd className="break-all font-ui text-ink-body">
                  {state.ownerAccess.sessionToken}
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-ink-display">Expires</dt>
                <dd>{state.ownerAccess.expiresAt}</dd>
              </div>
            </dl>
          </div>
        </Callout>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function FieldError({
  children,
  errors,
  id,
  label,
}: {
  children: React.ReactNode;
  errors?: string[] | undefined;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {errors?.length ? (
        <p className="text-sm font-semibold text-state-danger">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button className="w-full" isLoading={status.pending} type="submit">
      Onboard tailor shop
    </Button>
  );
}
