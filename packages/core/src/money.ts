export type CurrencyCode = "INR";

export type Money = Readonly<{
  currency: CurrencyCode;
  paise: number;
}>;

export function moneyFromRupees(input: string, currency: CurrencyCode = "INR") {
  const trimmed = input.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(
      "Money must be a positive rupee amount with up to 2 decimals.",
    );
  }

  const [rupees = "0", paise = ""] = trimmed.split(".");
  return {
    currency,
    paise: Number(rupees) * 100 + Number(paise.padEnd(2, "0")),
  } satisfies Money;
}

export function addMoney(values: Money[]): Money {
  return values.reduce<Money>(
    (total, value) => {
      assertSameCurrency(total, value);
      return { currency: total.currency, paise: total.paise + value.paise };
    },
    { currency: "INR", paise: 0 },
  );
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  const paise = left.paise - right.paise;
  if (paise < 0) {
    throw new Error("Money subtraction cannot produce a negative value.");
  }

  return { currency: left.currency, paise };
}

function assertSameCurrency(left: Money, right: Money) {
  if (left.currency !== right.currency) {
    throw new Error("Money values must use the same currency.");
  }
}
