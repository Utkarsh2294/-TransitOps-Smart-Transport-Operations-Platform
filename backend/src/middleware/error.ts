import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
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

  if (error instanceof MulterError) {
    return res.status(400).json({
      field: "file",
      message: error.code === "LIMIT_FILE_SIZE" ? "File must be smaller than 5 MB" : error.message,
    });
  }

  if (error instanceof Error && error.message.includes("Only PDF, JPG, and PNG")) {
    return res.status(400).json({
      field: "file",
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
