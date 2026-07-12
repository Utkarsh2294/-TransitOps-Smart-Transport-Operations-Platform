import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export const roles = [
  "fleet_manager",
  "driver",
  "safety_officer",
  "financial_analyst",
] as const;

export type Role = (typeof roles)[number];

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
};

type JwtPayload = AuthUser & jwt.JwtPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "auth", "Authentication is required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch {
    return next(new ApiError(401, "auth", "Invalid or expired token"));
  }
};

export const requireRoles =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "auth", "Authentication is required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "role", "You do not have permission to perform this action"));
    }

    return next();
  };

