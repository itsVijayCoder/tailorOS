"use server";

import { revalidatePath } from "next/cache";

import type { CoreFormActionState } from "./action-state";
import { tenantPost } from "./tenant-api";

export async function createCustomerFormAction(
  _prevState: CoreFormActionState,
  formData: FormData,
): Promise<CoreFormActionState> {
  try {
    await createCustomerAction(formData);
    return {
      message: "Customer family contact created.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Customer creation failed.",
      status: "error",
    };
  }
}

export async function createCustomerAction(formData: FormData): Promise<void> {
  const profileNames = formData
    .getAll("profileName")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const result = await tenantPost(
    "/contacts",
    {
      createdByUserId: "usr_counter_01",
      notes: optionalString(formData.get("notes")),
      primaryMobile: requiredString(formData.get("primaryMobile")),
      profiles: profileNames.map((fullName, index) => ({
        fullName,
        relationLabel: index === 0 ? "self" : "family",
      })),
      whatsappOptIn: formData.get("whatsappOptIn") === "on",
    },
    { contact: null },
  );

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/shop/customers");
  revalidatePath("/shop");
}

export async function createStaffFormAction(
  _prevState: CoreFormActionState,
  formData: FormData,
): Promise<CoreFormActionState> {
  try {
    await createStaffAction(formData);
    return {
      message: "Employee profile created.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Employee creation failed.",
      status: "error",
    };
  }
}

export async function createStaffAction(formData: FormData): Promise<void> {
  const result = await tenantPost(
    "/staff",
    {
      displayName: requiredString(formData.get("displayName")),
      email: optionalString(formData.get("email")),
      mobileE164: optionalString(formData.get("mobileE164")),
      role: requiredString(formData.get("role")),
      status: formData.get("status") === "invited" ? "invited" : "active",
    },
    { staff: null },
  );

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/shop/settings");
}

export async function createMeasurementAction(
  formData: FormData,
): Promise<void> {
  const result = await tenantPost(
    "/measurements",
    {
      capturedByUserId: "usr_measure_01",
      customerProfileId: requiredString(formData.get("customerProfileId")),
      displayName: requiredString(formData.get("displayName")),
      fitNotes: optionalString(formData.get("fitNotes")),
      garmentTypeCode: requiredString(formData.get("garmentTypeCode")),
      reason: requiredString(formData.get("reason")),
      unit: formData.get("unit") === "cm" ? "cm" : "inch",
      values: parseMeasurementValues(requiredString(formData.get("values"))),
    },
    { measurement: null },
  );

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/shop/measurements");
  revalidatePath("/shop/customers");
}

export async function createOrderAction(formData: FormData): Promise<void> {
  const advancePaise = toPaise(optionalString(formData.get("advanceRupees")));
  const result = await tenantPost(
    "/orders",
    {
      advancePayment:
        advancePaise > 0
          ? {
              amountPaise: advancePaise,
              mode: "cash",
              recordedByUserId: "usr_cashier_01",
            }
          : undefined,
      contactId: requiredString(formData.get("contactId")),
      createdByUserId: "usr_counter_01",
      customerProfileId: requiredString(formData.get("customerProfileId")),
      currentStatus: "booked",
      discountPaise: 0,
      items: [
        {
          allowWithoutMeasurementReason:
            optionalString(formData.get("simpleServiceReason")) ??
            "Simple service without measurement",
          garmentTypeCode: requiredString(formData.get("garmentTypeCode")),
          pricePaise: toPaise(requiredString(formData.get("priceRupees"))),
          promisedDeliveryDate: optionalString(
            formData.get("promisedDeliveryDate"),
          ),
          quantity: Number(formData.get("quantity") ?? 1),
        },
      ],
      promisedDeliveryDate: optionalString(
        formData.get("promisedDeliveryDate"),
      ),
    },
    { order: null },
  );

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/shop/orders");
  revalidatePath("/shop/production");
  revalidatePath("/shop/payments");
  revalidatePath("/shop");
}

export async function recordPaymentAction(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "balance");
  const result = await tenantPost(
    `/orders/${requiredString(formData.get("orderId"))}/payments`,
    {
      amountPaise: toPaise(requiredString(formData.get("amountRupees"))),
      kind,
      mode: String(formData.get("mode") ?? "cash"),
      reason: optionalString(formData.get("reason")),
      recordedByUserId: "usr_cashier_01",
    },
    { payment: null },
  );

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/shop/payments");
  revalidatePath("/shop/orders");
  revalidatePath("/shop");
}

function requiredString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error("Required form field is missing.");
  }

  return text;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

function toPaise(value: string | undefined) {
  const rupees = Number(value ?? 0);

  if (!Number.isFinite(rupees)) {
    throw new Error("Amount must be numeric.");
  }

  return Math.round(rupees * 100);
}

function parseMeasurementValues(value: string) {
  return Object.fromEntries(
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [rawKey, rawValue] = part.split("=");
        const key = rawKey?.trim();
        const textValue = rawValue?.trim();

        if (!key || !textValue) {
          throw new Error("Measurements must use key=value pairs.");
        }

        const numericValue = Number(textValue);
        return [key, Number.isFinite(numericValue) ? numericValue : textValue];
      }),
  );
}
