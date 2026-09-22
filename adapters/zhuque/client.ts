export type SecretProvider = {
  resolve(credentialRef: string): Promise<string | null>;
};

export type DetectorTransport = {
  send(input: {
    requestId: string;
    textBytes: Uint8Array;
    secret: string;
  }): Promise<{
    httpStatus: number;
    rawBody: Uint8Array;
  }>;
};

export type DetectorExchange =
  | {
    status: "blocked";
    reason: "credential-unavailable";
  }
  | {
    status: "received";
    httpStatus: number;
    rawBody: Uint8Array;
  };

export type AiContentDetectorClient = {
  submit(input: {
    requestId: string;
    textBytes: Uint8Array;
    credentialRef: string;
  }): Promise<DetectorExchange>;
};

export function createAiContentDetectorClient(input: {
  secretProvider: SecretProvider;
  transport: DetectorTransport;
}): AiContentDetectorClient {
  return {
    async submit(request): Promise<DetectorExchange> {
      const secret = await input.secretProvider.resolve(request.credentialRef);
      if (typeof secret !== "string" || secret.length === 0) {
        return { status: "blocked", reason: "credential-unavailable" };
      }
      const response = await input.transport.send({
        requestId: request.requestId,
        textBytes: request.textBytes,
        secret
      });
      return {
        status: "received",
        httpStatus: response.httpStatus,
        rawBody: response.rawBody
      };
    }
  };
}
