import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "route", `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return res.status(400).json({
      field: issue?.path.join(".") || "request",
      message: issue?.message || "Invalid request",
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      field: error.field,
      message: error.message,
    });
  }

  console.error(error);
  return res.status(500).json({
    field: "server",
    message:
      env.NODE_ENV === "production"
        ? "Something went wrong"
        : error instanceof Error
          ? error.message
          : "Unknown server error",
  });
};

