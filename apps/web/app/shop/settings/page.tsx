import type { Metadata } from "next";
import {
  BellRing,
  ClipboardList,
  KeyRound,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";

import { getRealSettingsData } from "@/features/core-modules/real-data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  humanizeStatus,
  settingTone,
} from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { measurementTemplates, settingsItems, settings } =
    await getRealSettingsData();
  const readyCount = settingsItems.filter(
    (item) => item.state === "ready",
  ).length;
  const reviewCount = settingsItems.filter(
    (item) => item.state === "needs_review",
  ).length;

  return (
    <>
      <PageHeader
        body="Settings keep the shop configurable without hiding security boundaries. TailorOS owns roles, templates, receipt identity, consent state, and event policy; WhatsApp provider credentials stay in the connector."
        eyebrow="Settings"
        title="Operational controls for pilot readiness."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Configured with shop and branch identity"
            icon={Store}
            label="Shop profile"
            tone="success"
            value="Ready"
          />
          <MetricCard
            detail={`${measurementTemplates.length} garment categories`}
            icon={ClipboardList}
            label="Templates"
            tone="accent"
            value={`${measurementTemplates.length}`}
          />
          <MetricCard
            detail="Owner, manager, counter, tailor, support"
            icon={UsersRound}
            label="Roles"
            tone="neutral"
            value={`${settings.staff.length}`}
          />
          <MetricCard
            detail={`${reviewCount} review item before pilot`}
            icon={Settings2}
            label="Checklist"
            tone="warning"
            value={`${readyCount}/${settingsItems.length}`}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Settings rows should be auditable because they change IDs, receipts, roles, templates, and message behavior."
            title="Pilot configuration checklist"
          >
            <div className="grid gap-3">
              {settingsItems.map((item) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-medium text-ink-display">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Owner: {item.owner}
                      </p>
                    </div>
                    <StatusBadge tone={settingTone(item.state)}>
                      {humanizeStatus(item.state)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-body">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <div className="grid gap-5">
            <DataPanel title="Role guardrails">
              <div className="grid gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Owner",
                    body: "Can export, correct payments, change settings, and audit support access.",
                  },
                  {
                    icon: ReceiptText,
                    title: "Counter",
                    body: "Can create orders, record standard payments, and print receipts.",
                  },
                  {
                    icon: KeyRound,
                    title: "Tailor",
                    body: "Can view assigned tasks and update production status only.",
                  },
                ].map((role) => {
                  const Icon = role.icon;

                  return (
                    <article
                      className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-hairline bg-surface p-3"
                      key={role.title}
                    >
                      <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page text-accent">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink-display">
                          {role.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ink-muted">
                          {role.body}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </DataPanel>
            <DataPanel title="WhatsApp boundary">
              <div className="rounded-lg border border-hairline bg-surface p-4">
                <BellRing aria-hidden className="mb-3 size-5 text-accent" />
                <p className="text-sm leading-6 text-ink-body">
                  TailorOS stores consent, opt-out state, notification logs, and
                  business outbox events. Provider credentials, template
                  approval, policy checks, delivery webhooks, and usage ledger
                  live in the WhatsApp Connector.
                </p>
              </div>
            </DataPanel>
          </div>
        </section>

        <section>
          <SectionHeader
            body="Templates remain tenant-editable, but changes should be versioned before the pilot shop uses them on live orders."
            eyebrow="Garment setup"
            title="Template review"
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {measurementTemplates.map((template) => (
              <article
                className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm"
                key={template.code}
              >
                <h3 className="font-display text-xl font-medium text-ink-display">
                  {template.label}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {template.version} · {template.defaultDays} day default
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <StatusBadge tone="accent">
                    {template.requiredFields.length} required
                  </StatusBadge>
                  <StatusBadge tone="neutral">
                    {template.optionalFields.length} optional
                  </StatusBadge>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
