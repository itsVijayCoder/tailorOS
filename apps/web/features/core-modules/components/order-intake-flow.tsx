"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MessageCircle,
  ReceiptText,
  Ruler,
  ShoppingBag,
  UserRoundPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CustomerContactRead,
  MeasurementTemplateRead,
  OrderSummary,
} from "@tailoros/schemas";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

const steps = [
  { icon: UsersRound, key: "customer", label: "Customer" },
  { icon: ShoppingBag, key: "items", label: "Items" },
  { icon: Ruler, key: "measurement", label: "Measurement" },
  { icon: WalletCards, key: "payment", label: "Payment" },
  { icon: ReceiptText, key: "receipt", label: "Receipt" },
  { icon: MessageCircle, key: "whatsapp", label: "WhatsApp" },
] as const;

export function OrderIntakeFlow({
  contacts,
  initialContactId = "",
  initialProfileId = "",
  templates,
}: {
  contacts: CustomerContactRead[];
  initialContactId?: string;
  initialProfileId?: string;
  templates: MeasurementTemplateRead[];
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [contactId, setContactId] = useState(
    initialContactId || contacts[0]?.contactId || "",
  );
  const selectedContact =
    contacts.find((contact) => contact.contactId === contactId) ?? contacts[0];
  const [profileId, setProfileId] = useState(
    initialProfileId || selectedContact?.profiles[0]?.id || "",
  );
  const effectiveProfileId =
    selectedContact?.profiles.some((profile) => profile.id === profileId)
      ? profileId
      : selectedContact?.profiles[0]?.id || "";
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.isActive),
    [templates],
  );
  const fallbackTemplates =
    activeTemplates.length > 0
      ? activeTemplates
      : [
          {
            code: "alteration",
            defaultExpectedDays: 2,
            defaultPricePaise: 0,
            displayName: "Alteration",
            isActive: true,
            measurementSchema: {},
            updatedAt: new Date(0).toISOString(),
          },
        ];
  const [garmentCode, setGarmentCode] = useState(
    fallbackTemplates[0]?.code ?? "",
  );
  const selectedTemplate =
    fallbackTemplates.find((template) => template.code === garmentCode) ??
    fallbackTemplates[0];
  const [measurementMode, setMeasurementMode] = useState<"capture" | "latest">(
    "latest",
  );
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "danger" | "success";
    text: string;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderSummary | null>(null);

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const measurementValues =
      measurementMode === "latest"
        ? { note: "Use latest measurement on profile" }
        : Object.fromEntries(
            Object.entries(Object.fromEntries(formData))
              .filter(([key]) => key.startsWith("measurement:"))
              .map(([key, value]) => [
                key.replace(/^measurement:/, ""),
                String(value ?? "").trim(),
              ])
              .filter(([, value]) => value),
          );

    const result = await requestJson<{ order: OrderSummary }>(
      "/api/shop/orders",
      {
        advanceRupees: stringValue(formData.get("advanceRupees")),
        contactId: stringValue(formData.get("contactId")),
        customerProfileId: stringValue(formData.get("customerProfileId")),
        fitNotes: stringValue(formData.get("fitNotes")),
        garmentTypeCode: stringValue(formData.get("garmentTypeCode")),
        measurementUnit: stringValue(formData.get("measurementUnit")) || "inch",
        measurementValues,
        notes: stringValue(formData.get("notes")),
        priceRupees: stringValue(formData.get("priceRupees")),
        promisedDeliveryDate: stringValue(
          formData.get("promisedDeliveryDate"),
        ),
        quantity: stringValue(formData.get("quantity")) || "1",
      },
    );

    setIsBusy(false);

    if (result.error) {
      setNotice({ text: result.error, tone: "danger" });
      return;
    }

    setCreatedOrder(result.data.order);
    setStepIndex(4);
    setNotice({
      text: "Order created. Receipt and WhatsApp outbox are ready for review.",
      tone: "success",
    });
  }

  if (!selectedContact) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-surface-strong p-5">
        <h2 className="font-display text-2xl font-medium text-ink-display">
          No customer selected
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Create or search a customer before opening the order workflow.
        </p>
        <Link
          className={cn(buttonVariants(), "mt-4")}
          href="/shop/customers/new"
        >
          <UserRoundPlus aria-hidden className="size-4" />
          New customer
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]"
      onSubmit={createOrder}
    >
      <aside className="grid content-start gap-2 rounded-lg border border-hairline bg-surface-strong p-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === stepIndex;
          const isDone = index < stepIndex || (createdOrder && index <= 4);

          return (
            <button
              className={cn(
                "grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition duration-200 ease-premium hover:bg-accent-faded motion-reduce:transition-none",
                isActive && "bg-accent text-accent-foreground",
              )}
              key={step.key}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-lg border",
                  isActive
                    ? "border-accent-foreground/30 bg-accent-darker text-accent-foreground"
                    : "border-hairline bg-page text-accent",
                )}
              >
                {isDone ? (
                  <CheckCircle2 aria-hidden className="size-4" />
                ) : (
                  <Icon aria-hidden className="size-4" />
                )}
              </span>
              <span className="font-semibold">{step.label}</span>
            </button>
          );
        })}
      </aside>

      <section className="grid gap-4 rounded-lg border border-hairline bg-surface-strong p-4">
        {notice ? <Callout variant={notice.tone}>{notice.text}</Callout> : null}
        <input name="contactId" type="hidden" value={selectedContact.contactId} />

        {stepIndex === 0 ? (
          <StepPanel
            actions={
              <Button onClick={() => setStepIndex(1)} type="button">
                Continue to items
              </Button>
            }
            title="Step 1: select customer or family member"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contactSelect">Family contact</Label>
                <Select
                  id="contactSelect"
                  onChange={(event) => {
                    const nextContact = contacts.find(
                      (contact) => contact.contactId === event.target.value,
                    );
                    setContactId(event.target.value);
                    setProfileId(nextContact?.profiles[0]?.id ?? "");
                  }}
                  value={selectedContact.contactId}
                >
                  {contacts.map((contact) => (
                    <option key={contact.contactId} value={contact.contactId}>
                      {contact.primaryMobileE164} ·{" "}
                      {contact.profiles
                        .map((profile) => profile.fullName)
                        .join(", ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerProfileId">Profile</Label>
                <Select
                  id="customerProfileId"
                  name="customerProfileId"
                  onChange={(event) => setProfileId(event.target.value)}
                  required
                  value={effectiveProfileId}
                >
                  {selectedContact.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.fullName} · {profile.customerCode}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href={`/shop/customers/${selectedContact.contactId}`}
              >
                Add family member
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href="/shop/customers/new"
              >
                New customer
              </Link>
            </div>
          </StepPanel>
        ) : null}

        {stepIndex === 1 ? (
          <StepPanel
            actions={
              <>
                <Button
                  onClick={() => setStepIndex(0)}
                  type="button"
                  variant="ghost"
                >
                  Back
                </Button>
                <Button onClick={() => setStepIndex(2)} type="button">
                  Continue to measurement
                </Button>
              </>
            }
            title="Step 2: create order and line item"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="garmentTypeCode">Garment/service</Label>
                <Select
                  id="garmentTypeCode"
                  name="garmentTypeCode"
                  onChange={(event) => setGarmentCode(event.target.value)}
                  required
                  value={selectedTemplate?.code ?? ""}
                >
                  {fallbackTemplates.map((template) => (
                    <option key={template.code} value={template.code}>
                      {template.displayName}
                    </option>
                  ))}
                </Select>
              </div>
              <Field defaultValue="1" label="Qty" name="quantity" type="number" />
              <Field
                defaultValue={
                  selectedTemplate
                    ? String(selectedTemplate.defaultPricePaise / 100)
                    : ""
                }
                label="Price"
                name="priceRupees"
                placeholder="1200"
              />
              <Field
                label="Due date"
                name="promisedDeliveryDate"
                required={false}
                type="date"
              />
            </div>
          </StepPanel>
        ) : null}

        {stepIndex === 2 ? (
          <StepPanel
            actions={
              <>
                <Button
                  onClick={() => setStepIndex(1)}
                  type="button"
                  variant="ghost"
                >
                  Back
                </Button>
                <Button onClick={() => setStepIndex(3)} type="button">
                  Continue to payment
                </Button>
              </>
            }
            title="Step 3: measurement"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-hairline bg-page p-3 text-sm font-semibold text-ink-display">
                <input
                  checked={measurementMode === "latest"}
                  onChange={() => setMeasurementMode("latest")}
                  type="radio"
                />
                Use latest measurement
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-hairline bg-page p-3 text-sm font-semibold text-ink-display">
                <input
                  checked={measurementMode === "capture"}
                  onChange={() => setMeasurementMode("capture")}
                  type="radio"
                />
                Add another measurement
              </label>
            </div>
            {measurementMode === "capture" ? (
              <div className="grid gap-3 rounded-lg border border-hairline bg-page p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {templateFields(selectedTemplate).map((field) => (
                    <Field
                      key={field}
                      label={measurementLabel(field)}
                      name={`measurement:${field}`}
                      placeholder="0"
                      required={false}
                    />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="measurementUnit">Unit</Label>
                    <Select
                      defaultValue="inch"
                      id="measurementUnit"
                      name="measurementUnit"
                    >
                      <option value="inch">Inch</option>
                      <option value="cm">Centimeter</option>
                    </Select>
                  </div>
                  <Field
                    label="Fit notes"
                    name="fitNotes"
                    placeholder="Loose waist, slim sleeve"
                    required={false}
                  />
                </div>
              </div>
            ) : (
              <input name="measurementUnit" type="hidden" value="inch" />
            )}
          </StepPanel>
        ) : null}

        {stepIndex === 3 ? (
          <StepPanel
            actions={
              <>
                <Button
                  onClick={() => setStepIndex(2)}
                  type="button"
                  variant="ghost"
                >
                  Back
                </Button>
                <Button isLoading={isBusy} type="submit">
                  Create order
                </Button>
              </>
            }
            title="Step 4: payment"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Advance" name="advanceRupees" placeholder="500" />
              <div className="grid gap-2">
                <Label htmlFor="paymentMode">Mode</Label>
                <Select defaultValue="cash" id="paymentMode" name="paymentMode">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Order notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </StepPanel>
        ) : null}

        {stepIndex >= 4 ? (
          <StepPanel
            actions={
              <>
                <Button
                  onClick={() => setStepIndex(5)}
                  type="button"
                  variant="secondary"
                >
                  WhatsApp step
                </Button>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href="/shop/orders"
                >
                  Order book
                </Link>
              </>
            }
            title="Step 5: receipt"
          >
            {createdOrder ? (
              <div className="grid gap-3 rounded-lg border border-state-success bg-page p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-medium text-ink-display">
                      {createdOrder.orderCode}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      Receipt {createdOrder.receiptId ? "generated" : "pending"}
                    </p>
                  </div>
                  <Badge variant="success">Booked</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <SummaryValue
                    label="Items"
                    value={`${createdOrder.itemCount}`}
                  />
                  <SummaryValue
                    label="Total"
                    value={formatRupees(createdOrder.finalTotalPaise)}
                  />
                  <SummaryValue
                    label="Balance"
                    value={formatRupees(createdOrder.balanceDuePaise)}
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-hairline bg-page p-4 text-sm text-ink-muted">
                Create the order to generate receipt details.
              </p>
            )}
            {stepIndex === 5 ? (
              <div className="rounded-lg border border-hairline bg-surface p-4">
                <h3 className="font-display text-xl font-medium text-ink-display">
                  Step 6: WhatsApp message
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  The order confirmation event is queued after receipt creation.
                </p>
              </div>
            ) : null}
          </StepPanel>
        ) : null}
      </section>
    </form>
  );
}

function StepPanel({
  actions,
  children,
  title,
}: {
  actions: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-4">
      <h2 className="font-display text-2xl font-medium text-ink-display">
        {title}
      </h2>
      {children}
      <div className="flex flex-wrap justify-end gap-2 border-t border-hairline pt-4">
        {actions}
      </div>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required = true,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
      <span className="block text-xs text-ink-muted">{label}</span>
      <strong className="text-ink-display">{value}</strong>
    </div>
  );
}

async function requestJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiState<T>> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  return (await response.json()) as ApiState<T>;
}

function templateFields(template: MeasurementTemplateRead | undefined) {
  if (!template) return ["note"];

  const fieldOrder = template.measurementSchema.fieldOrder;
  if (Array.isArray(fieldOrder)) {
    return fieldOrder.filter(
      (field): field is string => typeof field === "string",
    );
  }

  const fields = template.measurementSchema.fields;
  if (Array.isArray(fields)) {
    return fields.filter((field): field is string => typeof field === "string");
  }

  const objectFields =
    fields && typeof fields === "object" && !Array.isArray(fields)
      ? Object.keys(fields)
      : [];

  return objectFields.length > 0 ? objectFields : ["note"];
}

function measurementLabel(field: string) {
  return field
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stringValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(paise / 100);
}
