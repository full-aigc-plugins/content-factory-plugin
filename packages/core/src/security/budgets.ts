import { randomUUID } from "node:crypto";

export type BudgetReservation =
  | { status: "reserved"; reservationId: string }
  | { status: "blocked"; reason: "budget-insufficient" | "budget-usage-unknown" };

function money(value: number): number {
  return Number(value.toFixed(12));
}

export class RequestBudget {
  readonly #limit: number;
  readonly #currency: string;
  readonly #reservations = new Map<string, number>();
  #used = 0;
  #unknownCharges = 0;

  constructor(input: { limit: number; currency: string }) {
    if (!Number.isFinite(input.limit) || input.limit < 0 || input.currency.trim() === "") {
      throw new Error("budget requires a non-negative limit and currency");
    }
    this.#limit = input.limit;
    this.#currency = input.currency;
  }

  reserve(maximumCost: number): BudgetReservation {
    if (this.#unknownCharges > 0) {
      return { status: "blocked", reason: "budget-usage-unknown" };
    }
    const reserved = [...this.#reservations.values()]
      .reduce((total, value) => total + value, 0);
    if (!Number.isFinite(maximumCost) || maximumCost < 0
        || money(this.#limit - this.#used - reserved) < maximumCost) {
      return { status: "blocked", reason: "budget-insufficient" };
    }
    const reservationId = randomUUID();
    this.#reservations.set(reservationId, maximumCost);
    return { status: "reserved", reservationId };
  }

  settle(input: {
    reservationId: string;
    knownCost: number;
    unknownCharge: boolean;
  }): void {
    if (!this.#reservations.delete(input.reservationId)) {
      throw new Error("budget reservation does not exist");
    }
    if (!Number.isFinite(input.knownCost) || input.knownCost < 0) {
      throw new Error("known cost must be non-negative");
    }
    this.#used = money(this.#used + input.knownCost);
    if (input.unknownCharge) this.#unknownCharges += 1;
  }

  snapshot(): {
    limit: number;
    currency: string;
    used: number;
    reserved: number;
    available: number | null;
    availableKnown: boolean;
    unknownCharges: number;
  } {
    const reserved = money([...this.#reservations.values()]
      .reduce((total, value) => total + value, 0));
    const availableKnown = this.#unknownCharges === 0;
    return {
      limit: this.#limit,
      currency: this.#currency,
      used: this.#used,
      reserved,
      available: availableKnown ? money(this.#limit - this.#used - reserved) : null,
      availableKnown,
      unknownCharges: this.#unknownCharges
    };
  }
}
