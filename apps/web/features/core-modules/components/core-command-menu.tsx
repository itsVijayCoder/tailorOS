"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import {
  Command,
  Pencil,
  Plus,
  Ruler,
  Search,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CustomerContactRead,
  CustomerProfileRead,
  MeasurementTemplateRead,
} from "@tailoros/schemas";

type TabKey = "create" | "garments" | "search";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

const tabItems: { key: TabKey; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "create", label: "New customer" },
  { key: "garments", label: "Garments" },
];

export function CoreCommandMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("search");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerContactRead[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplateRead[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "danger" | "success";
    text: string;
  } | null>(null);

  useHotkey(
    "Mod+K",
    (event) => {
      event.preventDefault();
      setOpen(true);
      setTab("search");
    },
    { preventDefault: true },
  );

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void loadCustomers(query, controller.signal).then(setCustomers);
    }, 120);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    void loadTemplates().then(setTemplates);
  }, [open]);

  const selectedContact = useMemo(
    () =>
      customers.find((customer) => customer.contactId === selectedContactId) ??
      customers[0] ??
      null,
    [customers, selectedContactId],
  );

  async function refreshCustomers(nextQuery = query) {
    const nextCustomers = await loadCustomers(nextQuery);
    setCustomers(nextCustomers);
    return nextCustomers;
  }

  async function refreshTemplates() {
    const nextTemplates = await loadTemplates();
    setTemplates(nextTemplates);
    return nextTemplates;
  }

  async function runMutation<T>(
    action: () => Promise<ApiState<T>>,
    successText: string,
  ) {
    setIsBusy(true);
    setNotice(null);

    try {
      const result = await action();
      if (result.error) {
        setNotice({ text: result.error, tone: "danger" });
        return null;
      }

      setNotice({ text: successText, tone: "success" });
      return result.data;
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Action failed.",
        tone: "danger",
      });
      return null;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const data = await runMutation(
      () => postCustomer(body),
      "Customer created.",
    );

    if (data) {
      const nextCustomers = await refreshCustomers(String(body.fullName ?? ""));
      setQuery(String(body.fullName ?? ""));
      setSelectedContactId(data.contact.contactId);
      setCustomers(nextCustomers);
      setTab("search");
      event.currentTarget.reset();
    }
  }

  async function handleUpdateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = await runMutation(
      () => patchCustomer({ ...data, mode: "contact" }),
      "Contact updated.",
    );
    if (result) {
      await refreshCustomers();
      setSelectedContactId(result.contact.contactId);
    }
  }

  async function handleAddProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const result = await runMutation(
      () => postCustomer({ ...body, mode: "add-profile" }),
      "Family profile added.",
    );
    if (result) {
      await refreshCustomers();
      setSelectedContactId(result.contact.contactId);
      event.currentTarget.reset();
    }
  }

  async function handleUpdateProfile(
    event: FormEvent<HTMLFormElement>,
    profile: CustomerProfileRead,
  ) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const result = await runMutation(
      () => patchCustomer({ ...body, mode: "profile", profileId: profile.id }),
      "Profile updated.",
    );
    if (result) {
      await refreshCustomers();
      setSelectedContactId(result.contact.contactId);
    }
  }

  async function handleDeleteProfile(profile: CustomerProfileRead) {
    const result = await runMutation(
      () => deleteCustomerProfile(profile.id),
      "Profile removed.",
    );
    if (result) {
      await refreshCustomers();
      setSelectedContactId(result.contact.contactId);
    }
  }

  async function handleSaveGarment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const isEdit = Boolean(String(body.code ?? "").trim());
    const result = await runMutation(
      () => saveGarment(body, isEdit),
      isEdit ? "Garment template updated." : "Garment template added.",
    );
    if (result) {
      await refreshTemplates();
      event.currentTarget.reset();
    }
  }

  async function handleDeleteGarment(code: string) {
    const result = await runMutation(
      () => deleteGarment(code),
      "Garment template removed or deactivated.",
    );
    if (result) await refreshTemplates();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Open customer command center"
        className={cn(buttonVariants({ variant: "secondary" }))}
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden sm:inline">Customers</span>
        <span className="ml-1 hidden rounded-full border border-hairline bg-page px-2 py-0.5 text-[11px] font-semibold text-ink-muted lg:inline">
          Ctrl K
        </span>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-5xl" size="lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="signal">
              <Command aria-hidden className="size-3.5" />
              Ctrl/Command K
            </Badge>
            <Badge variant="neutral">
              <UsersRound aria-hidden className="size-3.5" />
              Customer desk
            </Badge>
          </div>
          <DialogTitle>Customer command center</DialogTitle>
          <DialogDescription>
            Search customers, create a new customer, edit family profiles, and
            customize garment measurement templates from any shop page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 border-b border-hairline pb-3">
          {tabItems.map((item) => (
            <button
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display",
                tab === item.key && "bg-accent text-accent-foreground",
              )}
              key={item.key}
              onClick={() => setTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {notice ? (
          <Callout variant={notice.tone}>{notice.text}</Callout>
        ) : null}

        {tab === "search" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
            <div className="grid min-h-0 gap-3">
              <SearchField
                autoFocus
                isLoading={isBusy}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search mobile, customer code, or family name"
                value={query}
              />
              <div className="grid max-h-[30rem] gap-2 overflow-y-auto pr-1">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <button
                      className={cn(
                        "grid gap-1 rounded-lg border border-hairline bg-surface p-3 text-left transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded",
                        selectedContact?.contactId === customer.contactId &&
                          "border-accent bg-accent-faded",
                      )}
                      key={customer.contactId}
                      onClick={() => setSelectedContactId(customer.contactId)}
                      type="button"
                    >
                      <span className="font-semibold text-ink-display">
                        {customer.profiles
                          .map((profile) => profile.fullName)
                          .join(", ")}
                      </span>
                      <span className="text-sm text-ink-muted">
                        {customer.primaryMobileE164} ·{" "}
                        {customer.profiles.length} profile
                        {customer.profiles.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                    No customer match. Add a new customer from the next tab.
                  </div>
                )}
              </div>
            </div>

            {selectedContact ? (
              <CustomerEditor
                contact={selectedContact}
                isBusy={isBusy}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
                onUpdateContact={handleUpdateContact}
                onUpdateProfile={handleUpdateProfile}
              />
            ) : null}
          </div>
        ) : null}

        {tab === "create" ? (
          <NewCustomerForm isBusy={isBusy} onSubmit={handleCreateCustomer} />
        ) : null}

        {tab === "garments" ? (
          <GarmentManager
            isBusy={isBusy}
            onDelete={handleDeleteGarment}
            onSubmit={handleSaveGarment}
            templates={templates}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function NewCustomerForm({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <Field label="Mobile" name="primaryMobile" placeholder="+91 98765 43210" />
      <Field label="Customer name" name="fullName" placeholder="Meena Ravi" />
      <Field label="Relation" name="relationLabel" placeholder="self" />
      <Field label="Gender/context" name="genderContext" placeholder="women" />
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Address hint, fit preference, or notebook import note"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-ink-body">
        <input name="whatsappOptIn" type="checkbox" value="true" />
        WhatsApp opt-in
      </label>
      <div className="md:col-span-2">
        <Button isLoading={isBusy} type="submit">
          <Plus aria-hidden className="size-4" />
          Create customer
        </Button>
      </div>
    </form>
  );
}

function CustomerEditor({
  contact,
  isBusy,
  onAddProfile,
  onDeleteProfile,
  onUpdateContact,
  onUpdateProfile,
}: {
  contact: CustomerContactRead;
  isBusy: boolean;
  onAddProfile: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteProfile: (profile: CustomerProfileRead) => void;
  onUpdateContact: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateProfile: (
    event: FormEvent<HTMLFormElement>,
    profile: CustomerProfileRead,
  ) => void;
}) {
  return (
    <div className="grid gap-4">
      <form
        className="grid gap-3 rounded-lg border border-hairline bg-surface p-4"
        onSubmit={onUpdateContact}
      >
        <input name="contactId" type="hidden" value={contact.contactId} />
        <div className="flex items-center gap-2">
          <Pencil aria-hidden className="size-4 text-accent" />
          <h3 className="font-display text-xl font-medium text-ink-display">
            Edit contact
          </h3>
        </div>
        <Field
          defaultValue={contact.primaryMobileE164}
          label="Primary mobile"
          name="primaryMobile"
        />
        <div className="grid gap-2">
          <Label htmlFor="contactNotes">Notes</Label>
          <Textarea
            defaultValue={contact.notes ?? ""}
            id="contactNotes"
            name="notes"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink-body">
          <input
            defaultChecked={contact.whatsappOptIn}
            name="whatsappOptIn"
            type="checkbox"
            value="true"
          />
          WhatsApp opt-in
        </label>
        <Button isLoading={isBusy} type="submit" variant="secondary">
          Save contact
        </Button>
      </form>

      <div className="grid gap-3">
        {contact.profiles.map((profile) => (
          <form
            className="grid gap-3 rounded-lg border border-hairline bg-surface p-4"
            key={profile.id}
            onSubmit={(event) => onUpdateProfile(event, profile)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-medium text-ink-display">
                  {profile.fullName}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {profile.customerCode}
                </p>
              </div>
              <Button
                aria-label={`Delete ${profile.fullName}`}
                onClick={() => onDeleteProfile(profile)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
            <Field
              defaultValue={profile.fullName}
              label="Name"
              name="fullName"
            />
            <Field
              defaultValue={profile.relationLabel ?? ""}
              label="Relation"
              name="relationLabel"
            />
            <Field
              defaultValue={profile.genderContext ?? ""}
              label="Gender/context"
              name="genderContext"
            />
            <Button isLoading={isBusy} type="submit" variant="secondary">
              Save profile
            </Button>
          </form>
        ))}
      </div>

      <form
        className="grid gap-3 rounded-lg border border-dashed border-hairline bg-page p-4"
        onSubmit={onAddProfile}
      >
        <input name="contactId" type="hidden" value={contact.contactId} />
        <div className="flex items-center gap-2">
          <UserRoundPlus aria-hidden className="size-4 text-accent" />
          <h3 className="font-display text-xl font-medium text-ink-display">
            Add family profile
          </h3>
        </div>
        <Field label="Name" name="fullName" placeholder="Family member name" />
        <Field label="Relation" name="relationLabel" placeholder="daughter" />
        <Field label="Gender/context" name="genderContext" placeholder="kids" />
        <Button isLoading={isBusy} type="submit">
          Add family
        </Button>
      </form>
    </div>
  );
}

function GarmentManager({
  isBusy,
  onDelete,
  onSubmit,
  templates,
}: {
  isBusy: boolean;
  onDelete: (code: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  templates: MeasurementTemplateRead[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid max-h-[30rem] gap-3 overflow-y-auto pr-1">
        {templates.map((template) => (
          <article
            className="rounded-lg border border-hairline bg-surface p-4"
            key={template.code}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-medium text-ink-display">
                    {template.displayName}
                  </h3>
                  {!template.isActive ? (
                    <Badge variant="neutral">Inactive</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-ink-muted">
                  {template.code} · {template.defaultExpectedDays} days ·{" "}
                  {formatRupees(template.defaultPricePaise)}
                </p>
              </div>
              <Button
                aria-label={`Delete ${template.displayName}`}
                onClick={() => onDelete(template.code)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {templateFields(template).map((field) => (
                <Badge key={field} variant="neutral">
                  {field}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>

      <form
        className="grid content-start gap-3 rounded-lg border border-hairline bg-surface p-4"
        onSubmit={onSubmit}
      >
        <div className="flex items-center gap-2">
          <Ruler aria-hidden className="size-4 text-accent" />
          <h3 className="font-display text-xl font-medium text-ink-display">
            Add or edit garment
          </h3>
        </div>
        <Field label="Code" name="code" placeholder="blouse" required={false} />
        <Field label="Display name" name="displayName" placeholder="Blouse" />
        <Field
          label="Measurement order"
          name="fields"
          placeholder="chest,waist,shoulder,sleeve"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            defaultValue="7"
            label="Default days"
            name="defaultExpectedDays"
            type="number"
          />
          <Field
            defaultValue="0"
            label="Default price paise"
            name="defaultPricePaise"
            type="number"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="isActive">Status</Label>
          <Select defaultValue="true" id="isActive" name="isActive">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <Button isLoading={isBusy} type="submit">
          Save garment
        </Button>
      </form>
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

async function loadCustomers(query: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/shop/customers?q=${encodeURIComponent(query)}`,
    signal ? { signal } : undefined,
  );
  const result = (await response.json()) as ApiState<{
    customers: CustomerContactRead[];
  }>;
  return result.data.customers;
}

async function loadTemplates() {
  const response = await fetch("/api/shop/garments");
  const result = (await response.json()) as ApiState<{
    templates: MeasurementTemplateRead[];
  }>;
  return result.data.templates;
}

async function postCustomer(body: Record<string, FormDataEntryValue>) {
  return requestJson<{ contact: CustomerContactRead }>(
    "/api/shop/customers",
    "POST",
    normalizeCustomerBody(body),
  );
}

async function patchCustomer(body: Record<string, FormDataEntryValue | string>) {
  return requestJson<{ contact: CustomerContactRead }>(
    "/api/shop/customers",
    "PATCH",
    normalizeCustomerBody(body),
  );
}

async function deleteCustomerProfile(profileId: string) {
  return requestJson<{ contact: CustomerContactRead }>(
    `/api/shop/customers?profileId=${encodeURIComponent(profileId)}`,
    "DELETE",
  );
}

async function saveGarment(
  body: Record<string, FormDataEntryValue>,
  isEdit: boolean,
) {
  return requestJson<{ template: MeasurementTemplateRead }>(
    "/api/shop/garments",
    isEdit ? "PATCH" : "POST",
    {
      code: stringValue(body.code),
      defaultExpectedDays: Number(stringValue(body.defaultExpectedDays) || 7),
      defaultPricePaise: Number(stringValue(body.defaultPricePaise) || 0),
      displayName: stringValue(body.displayName),
      fields: stringValue(body.fields),
      isActive: stringValue(body.isActive) !== "false",
    },
  );
}

async function deleteGarment(code: string) {
  return requestJson<{ template: MeasurementTemplateRead }>(
    `/api/shop/garments?code=${encodeURIComponent(code)}`,
    "DELETE",
  );
}

async function requestJson<T>(
  path: string,
  method: "DELETE" | "PATCH" | "POST",
  body?: Record<string, unknown>,
): Promise<ApiState<T>> {
  const response = await fetch(path, {
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { "content-type": "application/json" },
    method,
  });

  return (await response.json()) as ApiState<T>;
}

function normalizeCustomerBody(
  body: Record<string, FormDataEntryValue | string>,
) {
  return {
    contactId: stringValue(body.contactId),
    fullName: stringValue(body.fullName),
    genderContext: stringValue(body.genderContext),
    mode: stringValue(body.mode),
    notes: stringValue(body.notes),
    primaryMobile: stringValue(body.primaryMobile),
    profileId: stringValue(body.profileId),
    relationLabel: stringValue(body.relationLabel),
    whatsappOptIn: body.whatsappOptIn === "true",
  };
}

function stringValue(value: FormDataEntryValue | string | undefined) {
  return String(value ?? "").trim();
}

function templateFields(template: MeasurementTemplateRead) {
  const fieldOrder = template.measurementSchema.fieldOrder;
  if (Array.isArray(fieldOrder)) {
    return fieldOrder.filter((field): field is string => typeof field === "string");
  }

  const fields = template.measurementSchema.fields;
  if (Array.isArray(fields)) {
    return fields.filter((field): field is string => typeof field === "string");
  }

  return fields && typeof fields === "object" && !Array.isArray(fields)
    ? Object.keys(fields)
    : [];
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(paise / 100);
}
