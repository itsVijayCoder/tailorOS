import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import type {
  MeasurementVersionSummary,
  OrderSummary,
} from "@tailoros/schemas";

import { tenantPost } from "@/features/core-modules/tenant-api";

type OrderPayload = {
  advanceRupees?: string;
  contactId?: string;
  customerProfileId?: string;
  fitNotes?: string;
  garmentTypeCode?: string;
  measurementUnit?: string;
  measurementValues?: Record<string, unknown>;
  notes?: string;
  priceRupees?: string;
  promisedDeliveryDate?: string;
  quantity?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as OrderPayload;
    const advancePaise = toPaise(optional(body.advanceRupees));
    const contactId = required(body.contactId);
    const customerProfileId = required(body.customerProfileId);
    const garmentTypeCode = required(body.garmentTypeCode);
    const measurementValues = requiredMeasurementValues(body.measurementValues);
    const measurementUnit = body.measurementUnit === "cm" ? "cm" : "inch";
    const itemNotes = optional(body.notes) ?? optional(body.fitNotes);
    const measurementResult = await tenantPost<{
      measurement: MeasurementVersionSummary;
    }>(
      "/measurements",
      {
        capturedByUserId: "usr_measure_01",
        customerProfileId,
        displayName: `${garmentTypeCode} measurements`,
        fitNotes: optional(body.fitNotes),
        garmentTypeCode,
        reason: "Order intake measurement capture",
        unit: measurementUnit,
        values: measurementValues,
      },
      { measurement: emptyMeasurement() },
    );

    if (measurementResult.error) {
      return NextResponse.json(
        {
          data: { order: emptyOrder() },
          error: measurementResult.error,
          source: measurementResult.source,
        },
        { status: 400 },
      );
    }

    const result = await tenantPost<{ order: OrderSummary }>(
      "/orders",
      {
        ...(advancePaise > 0
          ? {
              advancePayment: {
                amountPaise: advancePaise,
                mode: "cash",
                recordedByUserId: "usr_cashier_01",
              },
            }
          : {}),
        contactId,
        createdByUserId: "usr_counter_01",
        customerProfileId,
        currentStatus: "measurement_taken",
        discountPaise: 0,
        items: [
          {
            garmentTypeCode,
            measurementVersionId:
              measurementResult.data.measurement.measurementVersionId,
            notes: itemNotes,
            pricePaise: toPaise(required(body.priceRupees)),
            promisedDeliveryDate: optional(body.promisedDeliveryDate),
            quantity: Number(body.quantity ?? 1),
          },
        ],
        notes: optional(body.notes),
        promisedDeliveryDate: optional(body.promisedDeliveryDate),
      },
      { order: emptyOrder() },
    );

    if (!result.error) {
      revalidatePath("/shop/orders");
      revalidatePath("/shop/production");
      revalidatePath("/shop/payments");
      revalidatePath("/shop");
    }

    return NextResponse.json(result, { status: result.error ? 400 : 201 });
  } catch (error) {
    return NextResponse.json(
      {
        data: { order: emptyOrder() },
        error:
          error instanceof Error ? error.message : "Order creation failed.",
        source: "offline",
      },
      { status: 400 },
    );
  }
}

function required(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Required field is missing.");
  return text;
}

function optional(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function toPaise(value: string | undefined) {
  const rupees = Number(value ?? 0);

  if (!Number.isFinite(rupees)) {
    throw new Error("Amount must be numeric.");
  }

  return Math.round(rupees * 100);
}

function requiredMeasurementValues(value: Record<string, unknown> | undefined) {
  const entries = Object.entries(value ?? {})
    .map(
      ([key, rawValue]) =>
        [key.trim(), normalizeMeasurementValue(rawValue)] as const,
    )
    .filter(([key, rawValue]) => key && rawValue !== "");

  if (entries.length === 0) {
    throw new Error("At least one measurement value is required.");
  }

  return Object.fromEntries(entries);
}

function normalizeMeasurementValue(value: unknown) {
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  const text = String(value ?? "").trim();
  if (!text) return "";

  const numeric = Number(text);
  return Number.isFinite(numeric) && /^-?\d+(?:\.\d+)?$/.test(text)
    ? numeric
    : text;
}

function emptyOrder(): OrderSummary {
  return {
    balanceDuePaise: 0,
    contactId: "",
    currentStatus: "booked",
    customerProfileId: "",
    discountPaise: 0,
    finalTotalPaise: 0,
    itemCount: 0,
    orderCode: "",
    orderId: "",
    outboxEventIds: [],
    receiptId: null,
    subtotalPaise: 0,
  };
}

function emptyMeasurement(): MeasurementVersionSummary {
  return {
    capturedAt: new Date(0).toISOString(),
    customerProfileId: "",
    garmentTypeCode: "alteration",
    measurementProfileId: "",
    measurementVersionId: "",
    unit: "inch",
    values: {},
    versionNo: 1,
  };
}
