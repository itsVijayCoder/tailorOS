"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialCoreFormActionState } from "@/features/core-modules/action-state";
import { createCustomerFormAction } from "@/features/core-modules/actions";

export function CustomerCreateForm() {
  const [state, formAction] = useActionState(
    createCustomerFormAction,
    initialCoreFormActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="primaryMobile">Mobile</Label>
        <Input
          id="primaryMobile"
          name="primaryMobile"
          placeholder="+91 98765 43210"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profileName">Primary profile</Label>
        <Input
          id="profileName"
          name="profileName"
          placeholder="Customer full name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profileName2">Family profile</Label>
        <Input
          id="profileName2"
          name="profileName"
          placeholder="Optional family member"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Notebook import, address hint, or staff note"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-body">
        <input name="whatsappOptIn" type="checkbox" />
        WhatsApp opt-in
      </label>
      {state.status === "success" ? (
        <Callout variant="success">{state.message}</Callout>
      ) : null}
      {state.status === "error" ? (
        <Callout variant="danger">{state.message}</Callout>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button isLoading={status.pending} type="submit">
      Create customer
    </Button>
  );
}
