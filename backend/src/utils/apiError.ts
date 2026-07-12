export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

