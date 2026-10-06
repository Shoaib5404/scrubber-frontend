export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly title?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function networkError(cause?: unknown): ApiClientError {
  return new ApiClientError(
    cause instanceof Error ? cause.message : 'Network request failed',
  );
}
