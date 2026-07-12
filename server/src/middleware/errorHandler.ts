import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Invalid request payload.",
      issues: error.flatten()
    });
  }

  return res.status(500).json({ message: "Unexpected server error." });
};

