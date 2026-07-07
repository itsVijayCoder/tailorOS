"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { initialCoreFormActionState } from "@/features/core-modules/action-state";
import { createStaffFormAction } from "@/features/core-modules/actions";

export function StaffCreateForm() {
  const [state, formAction] = useActionState(
    createStaffFormAction,
    initialCoreFormActionState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="displayName">Name</Label>
        <Input
          autoComplete="name"
          id="displayName"
          name="displayName"
          placeholder="Tailor One"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue="tailor">
          <option value="manager">Manager</option>
          <option value="counter_staff">Counter staff</option>
          <option value="measurement_taker">Measurement taker</option>
          <option value="tailor">Tailor</option>
          <option value="cutter">Cutter</option>
          <option value="cashier">Cashier</option>
          <option value="viewer">Viewer</option>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="employee@example.com"
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="mobileE164">Mobile</Label>
        <Input
          autoComplete="tel"
          id="mobileE164"
          name="mobileE164"
          placeholder="+919800000001"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="active">
          <option value="active">Active</option>
          <option value="invited">Invited</option>
        </Select>
      </div>
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
      Add employee
    </Button>
  );
}
