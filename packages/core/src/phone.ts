export type NormalizedIndianMobile = Readonly<{
  countryCode: "91";
  nationalNumber: string;
  e164: string;
}>;

export function normalizeIndianMobile(input: string): NormalizedIndianMobile {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("0091")) {
    digits = digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }

  return {
    countryCode: "91",
    nationalNumber: digits,
    e164: `+91${digits}`,
  };
}
