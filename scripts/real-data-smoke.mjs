#!/usr/bin/env node

const apiBase =
  process.env.TAILOROS_API_BASE_URL ??
  "http://127.0.0.1:8788/v1/tenant/sri-raja-tailors";
const sessionToken =
  process.env.TAILOROS_SESSION_TOKEN ?? "pilot_owner_session_token_dev_2026";
const requestSeed = `${Date.now()}`.slice(-9);
const primaryMobile = `9${requestSeed}`;

const headers = {
  authorization: `Bearer ${sessionToken}`,
  "content-type": "application/json",
};

const state = {
  contactId: "",
  customerProfileId: "",
  measurementVersionId: "",
  orderId: "",
};

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  console.log(`Smoke base: ${apiBase}`);
  console.log(`Primary mobile: ${primaryMobile}`);

  const contact = await postJson("/contacts", "req_smoke_contact", {
    primaryMobile,
    whatsappOptIn: true,
    createdByUserId: "usr_counter_01",
    profiles: [
      { fullName: "Smoke Meena Ravi", relationLabel: "self" },
      { fullName: "Smoke Ravi Kumar", relationLabel: "spouse" },
    ],
    notes: "Created by real-data smoke.",
  });
  state.contactId = contact.data.contact.contactId;
  state.customerProfileId = contact.data.contact.profiles[0].id;
  assert(
    contact.data.contact.profiles.length === 2,
    "Expected family profiles.",
  );

  const duplicate = await rawJson("/contacts", "req_smoke_duplicate", {
    primaryMobile: `0${primaryMobile}`,
    whatsappOptIn: false,
    createdByUserId: "usr_counter_01",
    profiles: [{ fullName: "Duplicate Smoke" }],
  });
  assert(duplicate.status === 409, "Duplicate mobile variant should conflict.");

  const firstMeasurement = await postJson(
    "/measurements",
    "req_smoke_measurement_v1",
    {
      customerProfileId: state.customerProfileId,
      garmentTypeCode: "blouse",
      displayName: "Blouse",
      values: { chest: 36, waist: 31, shoulder: 14.5, sleeve: 11 },
      unit: "inch",
      fitNotes: "Regular fit",
      reason: "Initial smoke capture",
      capturedByUserId: "usr_measure_01",
    },
  );
  state.measurementVersionId =
    firstMeasurement.data.measurement.measurementVersionId;

  const order = await postJson("/orders", "req_smoke_order", {
    contactId: state.contactId,
    customerProfileId: state.customerProfileId,
    currentStatus: "booked",
    orderDate: "2026-07-06",
    trialDate: "2026-07-10",
    promisedDeliveryDate: "2026-07-14",
    discountPaise: 0,
    createdByUserId: "usr_counter_01",
    items: [
      {
        garmentTypeCode: "blouse",
        quantity: 1,
        pricePaise: 150000,
        measurementVersionId: state.measurementVersionId,
        assignedStaffUserId: "usr_tailor_01",
        promisedDeliveryDate: "2026-07-14",
      },
    ],
    advancePayment: {
      amountPaise: 50000,
      mode: "upi",
      reference: "UPI-SMOKE-001",
      recordedByUserId: "usr_cashier_01",
    },
  });
  state.orderId = order.data.order.orderId;
  assert(
    order.data.order.balanceDuePaise === 100000,
    "Unexpected balance due.",
  );

  await postJson("/measurements", "req_smoke_measurement_v2", {
    customerProfileId: state.customerProfileId,
    garmentTypeCode: "blouse",
    displayName: "Blouse",
    values: { chest: 38, waist: 32, shoulder: 14.5, sleeve: 11 },
    unit: "inch",
    fitNotes: "Looser fit",
    reason: "Smoke v2 after order snapshot",
    capturedByUserId: "usr_measure_01",
  });

  const orderDetail = await getJson(
    `/orders/${state.orderId}`,
    "req_smoke_order_detail",
  );
  const item = orderDetail.data.order.items[0];
  assert(
    item.sourceMeasurementVersionId === state.measurementVersionId,
    "Order item should preserve the v1 measurement snapshot.",
  );
  assert(item.measurementValues.chest === 36, "Order snapshot chest changed.");

  const overAdvance = await rawJson("/orders", "req_smoke_over_advance", {
    contactId: state.contactId,
    customerProfileId: state.customerProfileId,
    currentStatus: "booked",
    discountPaise: 0,
    createdByUserId: "usr_counter_01",
    items: [
      {
        garmentTypeCode: "alteration",
        quantity: 1,
        pricePaise: 50000,
        allowWithoutMeasurementReason: "Simple smoke alteration",
      },
    ],
    advancePayment: {
      amountPaise: 60000,
      mode: "cash",
      recordedByUserId: "usr_cashier_01",
    },
  });
  assert(overAdvance.status === 400, "Advance over total should be rejected.");

  const correctionWithoutReason = await rawJson(
    `/orders/${state.orderId}/payments`,
    "req_smoke_correction_without_reason",
    {
      amountPaise: -1000,
      mode: "adjustment",
      kind: "correction",
      recordedByUserId: "usr_owner_01",
    },
  );
  assert(
    correctionWithoutReason.status === 400,
    "Correction without reason should fail validation.",
  );

  const payment = await postJson(
    `/orders/${state.orderId}/payments`,
    "req_smoke_balance",
    {
      amountPaise: 100000,
      mode: "cash",
      kind: "balance",
      recordedByUserId: "usr_cashier_01",
    },
  );
  assert(payment.data.payment.balanceDuePaise === 0, "Receipt should be paid.");

  const report = await getJson(
    "/reports/today?date=2026-07-06",
    "req_smoke_report",
  );
  assert(
    report.data.report.activeOrderCount >= 1,
    "Report did not read orders.",
  );

  const search = await getJson(
    `/search?q=${encodeURIComponent(primaryMobile)}&limit=10`,
    "req_smoke_search",
  );
  assert(search.data.results.length > 0, "Search did not return smoke rows.");

  console.log("Real-data smoke passed.");
  console.log(
    JSON.stringify(
      {
        contactId: state.contactId,
        customerProfileId: state.customerProfileId,
        measurementVersionId: state.measurementVersionId,
        orderId: state.orderId,
      },
      null,
      2,
    ),
  );
}

async function getJson(path, requestId) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      authorization: headers.authorization,
      "x-request-id": requestId,
    },
  });
  return assertOk(response);
}

async function postJson(path, requestId, body) {
  const response = await fetch(`${apiBase}${path}`, {
    body: JSON.stringify(body),
    headers: { ...headers, "x-request-id": requestId },
    method: "POST",
  });
  return assertOk(response);
}

async function rawJson(path, requestId, body) {
  const response = await fetch(`${apiBase}${path}`, {
    body: JSON.stringify(body),
    headers: { ...headers, "x-request-id": requestId },
    method: "POST",
  });
  return {
    body: await response.json().catch(() => null),
    status: response.status,
  };
}

async function assertOk(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    throw new Error(
      `Request failed ${response.status}: ${JSON.stringify(body, null, 2)}`,
    );
  }

  return body;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
