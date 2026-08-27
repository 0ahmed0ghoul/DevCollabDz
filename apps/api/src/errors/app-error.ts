export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "UNAUTHORIZED";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;

  constructor(
    message: string,
    statusCode: number,
    code: AppErrorCode,
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
      super(
        message,
        404,
        "NOT_FOUND",
      );
    }
  }  

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(
      message,
      403,
      "FORBIDDEN",
    );
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(
      message,
      409,
      "CONFLICT",
    );
  }
}