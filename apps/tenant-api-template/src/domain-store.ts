import { normalizeSearchText } from "@tailoros/core";
import {
  contactProfileSummarySchema,
  measurementVersionSummarySchema,
  orderSummarySchema,
  paymentSummarySchema,
  type ContactProfileSummary,
  type MeasurementVersionSummary,
  type OrderSummary,
  type PaymentSummary,
} from "@tailoros/schemas";

import type {
  ContactProfileCreateRecord,
  DomainAuditRecord,
  DomainOutboxRecord,
  MeasurementProfileRecord,
  MeasurementVersionCreateRecord,
  MeasurementVersionRecord,
  OrderCreateRecord,
  OrderPaymentState,
  PaymentCreateRecord,
  PaymentRecordBundle,
  ReceiptUpsertRecord,
  SearchProjectionRecord,
  SearchResultRecord,
  TenantDomainRepository,
} from "./domain-service";

type ContactProfileRow = {
  contactId: string;
  primaryMobileE164: string;
  primaryMobileNational: string;
  whatsappMobileE164: string | null;
  whatsappOptIn: number;
  profileId: string;
  customerCode: string;
  fullName: string;
  relationLabel: string | null;
  genderContext: string | null;
};

type CustomerProfileRow = {
  id: string;
  contactId: string;
  customerCode: string;
  fullName: string;
  relationLabel: string | null;
  genderContext: string | null;
};

type MeasurementProfileRow = {
  id: string;
  customerProfileId: string;
  garmentTypeCode: string;
  displayName: string;
  currentVersionId: string | null;
  currentVersionNo: number | null;
};

type MeasurementVersionRow = {
  id: string;
  measurementProfileId: string;
  customerProfileId: string;
  garmentTypeCode: string;
  versionNo: number;
  valuesJson: string;
  unit: "inch" | "cm";
};

type OrderStateRow = {
  orderId: string;
  orderCode: string;
  contactId: string;
  customerProfileId: string;
  finalTotalPaise: number;
  balanceDuePaise: number;
  receiptId: string | null;
  receiptCode: string | null;
};

type PaymentRow = {
  id: string;
  paymentCode: string;
  amountPaise: number;
  mode: "cash" | "upi" | "card" | "bank" | "credit" | "adjustment";
  kind: "advance" | "balance" | "refund" | "correction";
  reason: string | null;
};

type SearchRow = {
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  payloadJson: string;
};

export class D1TenantDomainRepository implements TenantDomainRepository {
  constructor(private readonly db: D1Database) {}

  async findContactByMobile(
    mobileE164: string,
  ): Promise<ContactProfileSummary | null> {
    const result = await this.db
      .prepare(
        `SELECT
          c.id AS contactId,
          c.primary_mobile_e164 AS primaryMobileE164,
          c.primary_mobile_national AS primaryMobileNational,
          c.whatsapp_mobile_e164 AS whatsappMobileE164,
          c.whatsapp_opt_in AS whatsappOptIn,
          p.id AS profileId,
          p.customer_code AS customerCode,
          p.full_name AS fullName,
          p.relation_label AS relationLabel,
          p.gender_context AS genderContext
        FROM customer_contacts c
        LEFT JOIN customer_profiles p ON p.contact_id = c.id
        WHERE c.primary_mobile_e164 = ?
           OR c.whatsapp_mobile_e164 = ?
           OR EXISTS (
             SELECT 1
             FROM contact_phone_history h
             WHERE h.contact_id = c.id AND h.phone_e164 = ?
           )
        ORDER BY p.created_at ASC`,
      )
      .bind(mobileE164, mobileE164, mobileE164)
      .all<ContactProfileRow>();

    if (result.results.length === 0) {
      return null;
    }

    return parseContactProfileRows(result.results);
  }

  async createContactWithProfiles(record: ContactProfileCreateRecord) {
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO customer_contacts (
            id,
            primary_mobile_e164,
            primary_mobile_national,
            whatsapp_mobile_e164,
            whatsapp_opt_in,
            address_json,
            notes,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.contact.id,
          record.contact.primaryMobileE164,
          record.contact.primaryMobileNational,
          record.contact.whatsappMobileE164,
          record.contact.whatsappOptIn ? 1 : 0,
          record.contact.addressJson,
          record.contact.notes,
          record.contact.createdAt,
          record.contact.updatedAt,
        ),
      ...record.phoneHistory.map((phone) =>
        this.db
          .prepare(
            `INSERT INTO contact_phone_history (
              id,
              contact_id,
              phone_e164,
              phone_national,
              phone_kind,
              valid_from,
              valid_to,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
          )
          .bind(
            phone.id,
            record.contact.id,
            phone.phoneE164,
            phone.phoneNational,
            phone.phoneKind,
            record.contact.createdAt,
            record.contact.createdAt,
          ),
      ),
      ...record.profiles.map((profile) =>
        this.db
          .prepare(
            `INSERT INTO customer_profiles (
              id,
              customer_code,
              contact_id,
              full_name,
              search_name,
              relation_label,
              gender_context,
              is_active,
              created_by_user_id,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          )
          .bind(
            profile.id,
            profile.customerCode,
            record.contact.id,
            profile.fullName,
            normalizeSearchText(profile.fullName),
            profile.relationLabel,
            profile.genderContext,
            record.audit.actorUserId,
            record.contact.createdAt,
            record.contact.createdAt,
          ),
      ),
      auditStatement(this.db, record.audit),
      ...searchStatements(this.db, record.search),
    ]);

    const created = await this.findContactByMobile(
      record.contact.primaryMobileE164,
    );

    if (!created) {
      throw new Error("Contact was not readable after insert.");
    }

    return created;
  }

  async findCustomerProfile(customerProfileId: string) {
    return this.db
      .prepare(
        `SELECT
          id,
          contact_id AS contactId,
          customer_code AS customerCode,
          full_name AS fullName,
          relation_label AS relationLabel,
          gender_context AS genderContext
        FROM customer_profiles
        WHERE id = ? AND is_active = 1
        LIMIT 1`,
      )
      .bind(customerProfileId)
      .first<CustomerProfileRow>();
  }

  async findMeasurementProfileById(measurementProfileId: string) {
    const row = await this.db
      .prepare(`${measurementProfileSelect} WHERE mp.id = ? LIMIT 1`)
      .bind(measurementProfileId)
      .first<MeasurementProfileRow>();

    return row ?? null;
  }

  async findMeasurementProfileByCustomerAndGarment(input: {
    customerProfileId: string;
    garmentTypeCode: string;
    displayName: string;
  }) {
    const row = await this.db
      .prepare(
        `${measurementProfileSelect}
        WHERE mp.customer_profile_id = ?
          AND mp.garment_type_code = ?
          AND mp.display_name = ?
        LIMIT 1`,
      )
      .bind(input.customerProfileId, input.garmentTypeCode, input.displayName)
      .first<MeasurementProfileRow>();

    return row ?? null;
  }

  async createMeasurementVersion(
    record: MeasurementVersionCreateRecord,
  ): Promise<MeasurementVersionSummary> {
    await this.db.batch([
      ...(record.measurementProfile.shouldCreate
        ? [
            this.db
              .prepare(
                `INSERT INTO measurement_profiles (
                  id,
                  customer_profile_id,
                  garment_type_code,
                  display_name,
                  current_version_id,
                  created_at,
                  updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                record.measurementProfile.id,
                record.measurementProfile.customerProfileId,
                record.measurementProfile.garmentTypeCode,
                record.measurementProfile.displayName,
                record.version.id,
                record.measurementProfile.createdAt,
                record.measurementProfile.updatedAt,
              ),
          ]
        : [
            this.db
              .prepare(
                `UPDATE measurement_profiles
                SET current_version_id = ?,
                    updated_at = ?
                WHERE id = ?`,
              )
              .bind(
                record.version.id,
                record.measurementProfile.updatedAt,
                record.measurementProfile.id,
              ),
          ]),
      this.db
        .prepare(
          `INSERT INTO measurement_versions (
            id,
            measurement_profile_id,
            version_no,
            values_json,
            unit,
            fit_notes,
            reason,
            captured_by_user_id,
            captured_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.version.id,
          record.version.measurementProfileId,
          record.version.versionNo,
          JSON.stringify(record.version.values),
          record.version.unit,
          record.version.fitNotes,
          record.version.reason,
          record.version.capturedByUserId,
          record.version.capturedAt,
        ),
      auditStatement(this.db, record.audit),
      ...searchStatements(this.db, [record.search]),
    ]);

    return measurementVersionSummarySchema.parse({
      measurementProfileId: record.measurementProfile.id,
      measurementVersionId: record.version.id,
      customerProfileId: record.version.customerProfileId,
      garmentTypeCode: record.version.garmentTypeCode,
      versionNo: record.version.versionNo,
      values: record.version.values,
      unit: record.version.unit,
      capturedAt: record.version.capturedAt,
    });
  }

  async findMeasurementVersion(measurementVersionId: string) {
    const row = await this.db
      .prepare(
        `SELECT
          mv.id AS id,
          mv.measurement_profile_id AS measurementProfileId,
          mp.customer_profile_id AS customerProfileId,
          mp.garment_type_code AS garmentTypeCode,
          mv.version_no AS versionNo,
          mv.values_json AS valuesJson,
          mv.unit AS unit
        FROM measurement_versions mv
        INNER JOIN measurement_profiles mp ON mp.id = mv.measurement_profile_id
        WHERE mv.id = ?
        LIMIT 1`,
      )
      .bind(measurementVersionId)
      .first<MeasurementVersionRow>();

    return row ? parseMeasurementVersionRow(row) : null;
  }

  async createOrder(record: OrderCreateRecord): Promise<OrderSummary> {
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO orders (
            id,
            order_code,
            contact_id,
            customer_profile_id,
            current_status,
            order_date,
            trial_date,
            promised_delivery_date,
            subtotal_paise,
            discount_paise,
            final_total_paise,
            balance_due_paise,
            notes,
            created_by_user_id,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.order.id,
          record.order.orderCode,
          record.order.contactId,
          record.order.customerProfileId,
          record.order.currentStatus,
          record.order.orderDate,
          record.order.trialDate,
          record.order.promisedDeliveryDate,
          record.order.subtotalPaise,
          record.order.discountPaise,
          record.order.finalTotalPaise,
          record.order.balanceDuePaise,
          record.order.notes,
          record.order.createdByUserId,
          record.order.createdAt,
          record.order.updatedAt,
        ),
      ...record.items.flatMap((item) => [
        this.db
          .prepare(
            `INSERT INTO order_items (
              id,
              item_code,
              order_id,
              garment_type_code,
              quantity,
              item_status,
              price_paise,
              assigned_staff_user_id,
              promised_delivery_date,
              notes,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            item.id,
            item.itemCode,
            record.order.id,
            item.garmentTypeCode,
            item.quantity,
            item.itemStatus,
            item.pricePaise,
            item.assignedStaffUserId,
            item.promisedDeliveryDate,
            item.notes,
            record.order.createdAt,
            record.order.createdAt,
          ),
        this.db
          .prepare(
            `INSERT INTO order_measurement_snapshots (
              id,
              order_item_id,
              source_measurement_version_id,
              values_json,
              override_json,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            item.snapshot.id,
            item.id,
            item.snapshot.sourceMeasurementVersionId,
            JSON.stringify(item.snapshot.values),
            item.snapshot.override
              ? JSON.stringify(item.snapshot.override)
              : null,
            record.order.createdAt,
          ),
      ]),
      ...(record.initialPayment
        ? [paymentStatement(this.db, record.initialPayment)]
        : []),
      receiptUpsertStatement(this.db, record.receipt),
      auditStatement(this.db, record.audit),
      ...record.outbox.map((outbox) => outboxStatement(this.db, outbox)),
      ...searchStatements(this.db, record.search),
    ]);

    return orderSummarySchema.parse({
      orderId: record.order.id,
      orderCode: record.order.orderCode,
      contactId: record.order.contactId,
      customerProfileId: record.order.customerProfileId,
      currentStatus: record.order.currentStatus,
      itemCount: record.items.length,
      subtotalPaise: record.order.subtotalPaise,
      discountPaise: record.order.discountPaise,
      finalTotalPaise: record.order.finalTotalPaise,
      balanceDuePaise: record.order.balanceDuePaise,
      receiptId: record.receipt.id,
      outboxEventIds: record.outbox.map((outbox) => outbox.id),
    });
  }

  async findOrderPaymentState(orderId: string) {
    const order = await this.db
      .prepare(
        `SELECT
          o.id AS orderId,
          o.order_code AS orderCode,
          o.contact_id AS contactId,
          o.customer_profile_id AS customerProfileId,
          o.final_total_paise AS finalTotalPaise,
          o.balance_due_paise AS balanceDuePaise,
          r.id AS receiptId,
          r.receipt_code AS receiptCode
        FROM orders o
        LEFT JOIN receipts r ON r.order_id = o.id
        WHERE o.id = ?
        LIMIT 1`,
      )
      .bind(orderId)
      .first<OrderStateRow>();

    if (!order) {
      return null;
    }

    const payments = await this.db
      .prepare(
        `SELECT
          id,
          payment_code AS paymentCode,
          amount_paise AS amountPaise,
          mode,
          kind,
          reason
        FROM payments
        WHERE order_id = ?
        ORDER BY recorded_at ASC`,
      )
      .bind(orderId)
      .all<PaymentRow>();

    return {
      ...order,
      payments: payments.results,
    } satisfies OrderPaymentState;
  }

  async recordPayment(record: PaymentRecordBundle): Promise<PaymentSummary> {
    await this.db.batch([
      paymentStatement(this.db, record.payment),
      receiptUpsertStatement(this.db, record.receipt),
      this.db
        .prepare(
          `UPDATE orders
          SET balance_due_paise = ?,
              updated_at = ?
          WHERE id = ?`,
        )
        .bind(
          record.balanceDuePaise,
          record.receipt.updatedAt,
          record.payment.orderId,
        ),
      auditStatement(this.db, record.audit),
      ...record.outbox.map((outbox) => outboxStatement(this.db, outbox)),
      ...searchStatements(this.db, [record.search]),
    ]);

    return paymentSummarySchema.parse({
      paymentId: record.payment.id,
      paymentCode: record.payment.paymentCode,
      orderId: record.payment.orderId,
      amountPaise: record.payment.amountPaise,
      mode: record.payment.mode,
      kind: record.payment.kind,
      balanceDuePaise: record.balanceDuePaise,
      receiptId: record.receipt.id,
      outboxEventIds: record.outbox.map((outbox) => outbox.id),
    });
  }

  async search(input: {
    query: string;
    limit: number;
  }): Promise<SearchResultRecord[]> {
    const normalized = normalizeSearchText(input.query);
    if (!normalized) {
      return [];
    }

    const ftsQuery = normalized
      .split(" ")
      .filter(Boolean)
      .map((token) => `${token}*`)
      .join(" ");
    const result = await this.db
      .prepare(
        `SELECT
          sd.entity_type AS entityType,
          sd.entity_id AS entityId,
          sd.title AS title,
          sd.subtitle AS subtitle,
          sd.payload_json AS payloadJson
        FROM search_docs_fts f
        INNER JOIN search_docs sd ON sd.entity_id = f.entity_id
        WHERE search_docs_fts MATCH ?
        ORDER BY rank
        LIMIT ?`,
      )
      .bind(ftsQuery, input.limit)
      .all<SearchRow>();

    return result.results.map((row) => ({
      entityType: row.entityType,
      entityId: row.entityId,
      title: row.title,
      subtitle: row.subtitle,
      payload: parseJsonRecord(row.payloadJson),
    }));
  }
}

const measurementProfileSelect = `SELECT
  mp.id AS id,
  mp.customer_profile_id AS customerProfileId,
  mp.garment_type_code AS garmentTypeCode,
  mp.display_name AS displayName,
  mp.current_version_id AS currentVersionId,
  mv.version_no AS currentVersionNo
FROM measurement_profiles mp
LEFT JOIN measurement_versions mv ON mv.id = mp.current_version_id`;

function parseContactProfileRows(
  rows: ContactProfileRow[],
): ContactProfileSummary {
  const first = rows[0];
  if (!first) {
    throw new Error("Contact rows cannot be empty.");
  }

  return contactProfileSummarySchema.parse({
    contactId: first.contactId,
    primaryMobileE164: first.primaryMobileE164,
    primaryMobileNational: first.primaryMobileNational,
    whatsappMobileE164: first.whatsappMobileE164,
    whatsappOptIn: first.whatsappOptIn === 1,
    profiles: rows
      .filter((row) => row.profileId)
      .map((row) => ({
        id: row.profileId,
        customerCode: row.customerCode,
        fullName: row.fullName,
        relationLabel: row.relationLabel,
        genderContext: row.genderContext,
      })),
  });
}

function parseMeasurementVersionRow(
  row: MeasurementVersionRow,
): MeasurementVersionRecord {
  return {
    id: row.id,
    measurementProfileId: row.measurementProfileId,
    customerProfileId: row.customerProfileId,
    garmentTypeCode: row.garmentTypeCode,
    versionNo: row.versionNo,
    values: parseMeasurementValues(row.valuesJson),
    unit: row.unit,
  };
}

function auditStatement(
  db: D1Database,
  audit: DomainAuditRecord,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_logs (
        id,
        actor_type,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        reason,
        before_json,
        after_json,
        request_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      audit.id,
      audit.actorType,
      audit.actorUserId,
      audit.action,
      audit.entityType,
      audit.entityId,
      audit.reason,
      audit.beforeJson,
      audit.afterJson,
      audit.requestId,
      audit.createdAt,
    );
}

function paymentStatement(
  db: D1Database,
  payment: PaymentCreateRecord,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO payments (
        id,
        payment_code,
        order_id,
        amount_paise,
        mode,
        kind,
        reference,
        reason,
        recorded_by_user_id,
        recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      payment.id,
      payment.paymentCode,
      payment.orderId,
      payment.amountPaise,
      payment.mode,
      payment.kind,
      payment.reference,
      payment.reason,
      payment.recordedByUserId,
      payment.recordedAt,
    );
}

function receiptUpsertStatement(
  db: D1Database,
  receipt: ReceiptUpsertRecord,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO receipts (
        id,
        receipt_code,
        order_id,
        status,
        paid_paise,
        balance_due_paise,
        issued_by_user_id,
        issued_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET
        status = excluded.status,
        paid_paise = excluded.paid_paise,
        balance_due_paise = excluded.balance_due_paise,
        issued_by_user_id = excluded.issued_by_user_id,
        issued_at = excluded.issued_at,
        updated_at = excluded.updated_at`,
    )
    .bind(
      receipt.id,
      receipt.receiptCode,
      receipt.orderId,
      receipt.status,
      receipt.paidPaise,
      receipt.balanceDuePaise,
      receipt.issuedByUserId,
      receipt.issuedAt,
      receipt.updatedAt,
      receipt.updatedAt,
    );
}

function outboxStatement(
  db: D1Database,
  outbox: DomainOutboxRecord,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO outbox_events (
        id,
        event_type,
        aggregate_type,
        aggregate_id,
        idempotency_key,
        payload_json,
        status,
        created_at,
        processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NULL)`,
    )
    .bind(
      outbox.id,
      outbox.eventType,
      outbox.aggregateType,
      outbox.aggregateId,
      outbox.idempotencyKey,
      JSON.stringify(outbox.payload),
      outbox.createdAt,
    );
}

function searchStatements(
  db: D1Database,
  search: SearchProjectionRecord[],
): D1PreparedStatement[] {
  return search.flatMap((item) => [
    db
      .prepare(
        `INSERT INTO search_docs (
          id,
          entity_type,
          entity_id,
          title,
          subtitle,
          search_text,
          payload_json,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(entity_type, entity_id) DO UPDATE SET
          title = excluded.title,
          subtitle = excluded.subtitle,
          search_text = excluded.search_text,
          payload_json = excluded.payload_json,
          updated_at = excluded.updated_at`,
      )
      .bind(
        item.id,
        item.entityType,
        item.entityId,
        item.title,
        item.subtitle,
        item.searchText,
        JSON.stringify(item.payload),
        item.updatedAt,
      ),
    db
      .prepare("DELETE FROM search_docs_fts WHERE entity_id = ?")
      .bind(item.entityId),
    db
      .prepare(
        `INSERT INTO search_docs_fts (
          entity_id,
          title,
          subtitle,
          search_text
        ) VALUES (?, ?, ?, ?)`,
      )
      .bind(item.entityId, item.title, item.subtitle, item.searchText),
  ]);
}

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function parseMeasurementValues(
  value: string,
): Record<string, string | number | boolean | null> {
  const parsed = parseJsonRecord(value);
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const item = entry[1];
        return (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean" ||
          item === null
        );
      },
    ),
  );
}
