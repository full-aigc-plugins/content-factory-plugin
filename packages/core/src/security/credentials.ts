export type SecretSource = {
  resolve(credentialRef: string): Promise<string | null>;
};

export type ResolvedSecret =
  | {
    status: "resolved";
    source: "system" | "environment";
    secret: string;
  }
  | {
    status: "unavailable";
  };

export class LayeredSecretProvider {
  readonly #system: SecretSource;
  readonly #environment: SecretSource;

  constructor(input: { system: SecretSource; environment: SecretSource }) {
    this.#system = input.system;
    this.#environment = input.environment;
  }

  async resolve(credentialRef: string): Promise<ResolvedSecret> {
    const systemSecret = await this.#system.resolve(credentialRef);
    if (typeof systemSecret === "string" && systemSecret.length > 0) {
      return { status: "resolved", source: "system", secret: systemSecret };
    }
    const environmentSecret = await this.#environment.resolve(credentialRef);
    if (typeof environmentSecret === "string" && environmentSecret.length > 0) {
      return { status: "resolved", source: "environment", secret: environmentSecret };
    }
    return { status: "unavailable" };
  }
}
