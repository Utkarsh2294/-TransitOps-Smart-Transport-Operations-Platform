import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../middleware/auth.js";
import { ApiError } from "../utils/apiError.js";

export const generateToken = (user: AuthUser): string =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, "email", "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "password", "Invalid email or password");
  }

  const authUser: AuthUser = {
    id: String(user.id),
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const token = generateToken(authUser);

  return { token, user: authUser };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "fleet_manager" | "driver" | "safety_officer" | "financial_analyst",
) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ApiError(409, "email", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  const authUser: AuthUser = {
    id: String(user.id),
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const token = generateToken(authUser);

  return { token, user: authUser };
};
