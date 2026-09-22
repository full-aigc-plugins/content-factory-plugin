export type DeliveryAccount = {
  alias: string;
  credentialRef: string;
  expectedRemoteAccountId: string;
  deliveryMethod: "api-draft" | "local-export";
};

export function defineDeliveryAccount(input: DeliveryAccount): DeliveryAccount {
  if (input.alias.trim() === ""
      || input.credentialRef.trim() === ""
      || input.expectedRemoteAccountId.trim() === "") {
    throw new Error("delivery account requires alias, credential reference, and remote identity");
  }
  return { ...input };
}
