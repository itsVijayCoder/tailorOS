"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  Command,
  Keyboard,
  Pencil,
  Plus,
  ReceiptText,
  Ruler,
  Search,
  ShoppingBag,
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
  OrderSummary,
} from "@tailoros/schemas";

type TabKey = "create" | "garments" | "order" | "search";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

const tabItems: { key: TabKey; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "create", label: "New customer" },
  { key: "order", label: "New order" },
  { key: "garments", label: "Garments" },
];

type CustomerDraft = {
  fullName: string;
  primaryMobile: string;
};

const emptyCustomerDraft: CustomerDraft = {
  fullName: "",
  primaryMobile: "",
};

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
  const [customerDraft, setCustomerDraft] =
    useState<CustomerDraft>(emptyCustomerDraft);
  const [createdOrder, setCreatedOrder] = useState<OrderSummary | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const openSearch = useCallback(() => {
    setNotice(null);
    setCreatedOrder(null);
    setOpen(true);
    setTab("search");
  }, []);

  const openNewCustomer = useCallback(() => {
    setNotice(null);
    setCreatedOrder(null);
    setCustomerDraft(draftCustomerFromQuery(query));
    setOpen(true);
    setTab("create");
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCommandSearch =
        key === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      const isNewCustomer =
        key === "n" &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey;

      if (!isCommandSearch && !isNewCustomer) return;

      event.preventDefault();
      if (isCommandSearch) openSearch();
      if (isNewCustomer) openNewCustomer();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openNewCustomer, openSearch]);

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
  const effectiveSelectedProfileId = useMemo(() => {
    if (!selectedContact) return "";

    const selectedProfileExists = selectedContact.profiles.some(
      (profile) => profile.id === selectedProfileId,
    );

    return selectedProfileExists
      ? selectedProfileId
      : (selectedContact.profiles[0]?.id ?? "");
  }, [selectedContact, selectedProfileId]);

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
      "Customer created. Create the first order now.",
    );

    if (data) {
      const primaryMobile = data.contact.primaryMobileE164;
      const nextQuery = primaryMobile || String(body.fullName ?? "");
      setQuery(nextQuery);
      setCustomers((currentCustomers) => [
        data.contact,
        ...currentCustomers.filter(
          (customer) => customer.contactId !== data.contact.contactId,
        ),
      ]);
      setCustomerDraft(emptyCustomerDraft);
      setSelectedContactId(data.contact.contactId);
      setSelectedProfileId(data.contact.profiles[0]?.id ?? "");
      setCreatedOrder(null);
      setTab("order");
      void refreshCustomers(nextQuery);
      event.currentTarget.reset();
    }
  }

  function handleStartOrder(profile?: CustomerProfileRead) {
    if (profile) {
      setSelectedProfileId(profile.id);
    }

    setNotice(null);
    setCreatedOrder(null);
    setTab("order");
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const data = await runMutation(
      () => postOrder(body),
      "Order finalized. Receipt and notification events were created.",
    );

    if (data) {
      setCreatedOrder(data.order);
      void refreshCustomers();
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
              Ctrl/Command K search
            </Badge>
            <Badge variant="neutral">
              <Keyboard aria-hidden className="size-3.5" />
              Alt N new customer
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

        {notice ? <Callout variant={notice.tone}>{notice.text}</Callout> : null}

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
                  <EmptySearchResult
                    onCreate={() => {
                      setCustomerDraft(draftCustomerFromQuery(query));
                      setTab("create");
                    }}
                    query={query}
                  />
                )}
              </div>
            </div>

            {selectedContact ? (
              <CustomerEditor
                contact={selectedContact}
                isBusy={isBusy}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
                onStartOrder={handleStartOrder}
                onUpdateContact={handleUpdateContact}
                onUpdateProfile={handleUpdateProfile}
              />
            ) : null}
          </div>
        ) : null}

        {tab === "create" ? (
          <NewCustomerForm
            draft={customerDraft}
            isBusy={isBusy}
            onSubmit={handleCreateCustomer}
          />
        ) : null}

        {tab === "order" ? (
          <OrderFlow
            contact={selectedContact}
            createdOrder={createdOrder}
            isBusy={isBusy}
            onCreateCustomer={() => {
              setCustomerDraft(draftCustomerFromQuery(query));
              setTab("create");
            }}
            onProfileChange={setSelectedProfileId}
            onSubmit={handleCreateOrder}
            selectedProfileId={effectiveSelectedProfileId}
            templates={templates}
          />
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

function EmptySearchResult({
  onCreate,
  query,
}: {
  onCreate: () => void;
  query: string;
}) {
  const trimmedQuery = query.trim();

  return (
    <div className="grid gap-3 rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
      <p>
        {trimmedQuery
          ? "No customer match for this search."
          : "Search by mobile, customer code, or family name."}
      </p>
      {trimmedQuery ? (
        <Button onClick={onCreate} type="button" variant="secondary">
          <UserRoundPlus aria-hidden className="size-4" />
          Add customer with this search
        </Button>
      ) : null}
    </div>
  );
}

function NewCustomerForm({
  draft,
  isBusy,
  onSubmit,
}: {
  draft: CustomerDraft;
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      key={`${draft.primaryMobile}:${draft.fullName}`}
      onSubmit={onSubmit}
    >
      <div className="md:col-span-2">
        <Callout variant="neutral">
          Creating a customer here moves directly into first-order creation.
        </Callout>
      </div>
      <Field
        defaultValue={draft.primaryMobile}
        label="Mobile"
        name="primaryMobile"
        placeholder="+91 98765 43210"
      />
      <Field
        defaultValue={draft.fullName}
        label="Customer name"
        name="fullName"
        placeholder="Meena Ravi"
      />
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
  onStartOrder,
  onUpdateContact,
  onUpdateProfile,
}: {
  contact: CustomerContactRead;
  isBusy: boolean;
  onAddProfile: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteProfile: (profile: CustomerProfileRead) => void;
  onStartOrder: (profile?: CustomerProfileRead) => void;
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
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => onStartOrder(profile)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <ShoppingBag aria-hidden className="size-4" />
                  Order
                </Button>
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

function OrderFlow({
  contact,
  createdOrder,
  isBusy,
  onCreateCustomer,
  onProfileChange,
  onSubmit,
  selectedProfileId,
  templates,
}: {
  contact: CustomerContactRead | null;
  createdOrder: OrderSummary | null;
  isBusy: boolean;
  onCreateCustomer: () => void;
  onProfileChange: (profileId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  selectedProfileId: string;
  templates: MeasurementTemplateRead[];
}) {
  const templateOptions = useMemo(() => {
    const activeTemplates = templates.filter((template) => template.isActive);
    return activeTemplates.length > 0
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
          {
            code: "sari_fall",
            defaultExpectedDays: 1,
            defaultPricePaise: 0,
            displayName: "Sari fall and pico",
            isActive: true,
            measurementSchema: {},
            updatedAt: new Date(0).toISOString(),
          },
        ];
  }, [templates]);
  const [garmentCode, setGarmentCode] = useState(
    templateOptions[0]?.code ?? "",
  );
  const effectiveGarmentCode = garmentCode || templateOptions[0]?.code || "";
  const selectedTemplate =
    templateOptions.find(
      (template) => template.code === effectiveGarmentCode,
    ) ?? templateOptions[0];

  if (!contact) {
    return (
      <div className="grid gap-4 rounded-lg border border-dashed border-hairline bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
            <Search aria-hidden className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-medium text-ink-display">
              Select a customer first
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Search existing customers or create a new customer before
              finalizing an order.
            </p>
          </div>
        </div>
        <Button onClick={onCreateCustomer} type="button" variant="secondary">
          <UserRoundPlus aria-hidden className="size-4" />
          Create customer
        </Button>
      </div>
    );
  }

  const selectedProfile =
    contact.profiles.find((profile) => profile.id === selectedProfileId) ??
    contact.profiles[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
      <section className="grid content-start gap-3 rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
            <UsersRound aria-hidden className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-medium text-ink-display">
              {contact.profiles.map((profile) => profile.fullName).join(", ")}
            </h3>
            <p className="text-sm text-ink-muted">
              {contact.primaryMobileE164} · {contact.profiles.length} profile
              {contact.profiles.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          {contact.profiles.map((profile) => (
            <button
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-hairline bg-page px-3 py-2 text-left text-sm transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none",
                selectedProfile?.id === profile.id &&
                  "border-accent bg-accent-faded",
              )}
              key={profile.id}
              onClick={() => onProfileChange(profile.id)}
              type="button"
            >
              <span>
                <strong className="block text-ink-display">
                  {profile.fullName}
                </strong>
                <span className="text-xs text-ink-muted">
                  {profile.customerCode}
                </span>
              </span>
              {selectedProfile?.id === profile.id ? (
                <CheckCircle2 aria-hidden className="size-4 text-accent" />
              ) : null}
            </button>
          ))}
        </div>
        {createdOrder ? <OrderFinalized order={createdOrder} /> : null}
      </section>

      <form
        className="grid content-start gap-4 rounded-lg border border-hairline bg-surface p-4"
        key={`${contact.contactId}:${selectedProfile?.id ?? ""}:${effectiveGarmentCode}:${createdOrder?.orderId ?? "draft"}`}
        onSubmit={onSubmit}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag aria-hidden className="size-4 text-accent" />
          <h3 className="font-display text-2xl font-medium text-ink-display">
            Finalize order
          </h3>
        </div>
        <input name="contactId" type="hidden" value={contact.contactId} />
        <div className="grid gap-2">
          <Label htmlFor="customerProfileId">Customer profile</Label>
          <Select
            id="customerProfileId"
            name="customerProfileId"
            onChange={(event) => onProfileChange(event.target.value)}
            required
            value={selectedProfile?.id ?? ""}
          >
            {contact.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.fullName} · {profile.customerCode}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="garmentTypeCode">Garment/service</Label>
          <Select
            id="garmentTypeCode"
            name="garmentTypeCode"
            onChange={(event) => setGarmentCode(event.target.value)}
            required
            value={effectiveGarmentCode}
          >
            {templateOptions.map((template) => (
              <option key={template.code} value={template.code}>
                {template.displayName}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-3 rounded-lg border border-hairline bg-page p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-display text-xl font-medium text-ink-display">
                Measurement snapshot
              </h4>
              <p className="text-xs leading-5 text-ink-muted">
                Saved on this order item exactly as entered.
              </p>
            </div>
            <Badge variant="signal">Required</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {templateFields(selectedTemplate).map((field) => (
              <Field
                key={field}
                label={measurementLabel(field)}
                name={`measurement:${field}`}
                placeholder={measurementPlaceholder(field)}
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
            <div className="grid gap-2">
              <Label htmlFor="fitNotes">Fit notes</Label>
              <Input
                id="fitNotes"
                name="fitNotes"
                placeholder="Slim fit, loose waist, lining note"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Advance" name="advanceRupees" placeholder="500" />
          <Field
            label="Due date"
            name="promisedDeliveryDate"
            required={false}
            type="date"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Order notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Fit instruction, fabric handoff, or counter note"
          />
        </div>
        <Button disabled={!selectedProfile} isLoading={isBusy} type="submit">
          <ReceiptText aria-hidden className="size-4" />
          Finalize with measurements
        </Button>
      </form>
    </div>
  );
}

function OrderFinalized({ order }: { order: OrderSummary }) {
  return (
    <div className="grid gap-3 rounded-lg border border-state-success bg-page p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-lg border border-state-success bg-state-success text-success-foreground">
          <CheckCircle2 aria-hidden className="size-5" />
        </span>
        <div>
          <h4 className="font-display text-xl font-medium text-ink-display">
            {order.orderCode} finalized
          </h4>
          <p className="text-sm leading-6 text-ink-muted">
            Receipt {order.receiptId ? "generated" : "pending"} ·{" "}
            {order.outboxEventIds.length} event
            {order.outboxEventIds.length === 1 ? "" : "s"} queued
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
          <span className="block text-xs text-ink-muted">Total</span>
          <strong className="text-ink-display">
            {formatRupees(order.finalTotalPaise)}
          </strong>
        </div>
        <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
          <span className="block text-xs text-ink-muted">Balance</span>
          <strong className="text-ink-display">
            {formatRupees(order.balanceDuePaise)}
          </strong>
        </div>
      </div>
      <a
        className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
        href="/shop/orders"
      >
        View order book
        <ArrowRight aria-hidden className="size-4" />
      </a>
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

async function patchCustomer(
  body: Record<string, FormDataEntryValue | string>,
) {
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

async function postOrder(body: Record<string, FormDataEntryValue>) {
  const measurementValues = Object.fromEntries(
    Object.entries(body)
      .filter(([key]) => key.startsWith("measurement:"))
      .map(([key, value]) => [
        key.replace(/^measurement:/, ""),
        stringValue(value),
      ])
      .filter(([, value]) => value),
  );

  return requestJson<{ order: OrderSummary }>("/api/shop/orders", "POST", {
    advanceRupees: stringValue(body.advanceRupees),
    contactId: stringValue(body.contactId),
    customerProfileId: stringValue(body.customerProfileId),
    fitNotes: stringValue(body.fitNotes),
    garmentTypeCode: stringValue(body.garmentTypeCode),
    measurementUnit: stringValue(body.measurementUnit) || "inch",
    measurementValues,
    notes: stringValue(body.notes),
    priceRupees: stringValue(body.priceRupees),
    promisedDeliveryDate: stringValue(body.promisedDeliveryDate),
    quantity: stringValue(body.quantity) || "1",
  });
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

function draftCustomerFromQuery(query: string): CustomerDraft {
  const text = query.trim();
  if (!text) return emptyCustomerDraft;

  const digitCount = text.replace(/\D/g, "").length;
  return digitCount >= 5
    ? { fullName: "", primaryMobile: text }
    : { fullName: text, primaryMobile: "" };
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
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

function measurementPlaceholder(field: string) {
  return field.toLowerCase().includes("note") ||
    field.toLowerCase().includes("issue")
    ? "Describe clearly"
    : "0";
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(paise / 100);
}
