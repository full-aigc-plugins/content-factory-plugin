export type ErrorShape = {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
};

export class ContentFactoryError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(shape: ErrorShape) {
    super(shape.message);
    this.name = "ContentFactoryError";
    this.code = shape.code;
    this.retryable = shape.retryable;
    this.details = shape.details;
  }

  toJSON(): ErrorShape {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.details ? { details: this.details } : {})
    };
  }
}
