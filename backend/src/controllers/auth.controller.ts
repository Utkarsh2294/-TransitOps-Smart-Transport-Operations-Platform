import type { Request, Response } from "express";
import { z } from "zod";

import { loginUser, registerUser } from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["fleet_manager", "driver", "safety_officer", "financial_analyst"]),
});

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginUser(email, password);
  res.json(result);
};

export const registerController = async (req: Request, res: Response) => {
  const { name, email, password, role } = registerSchema.parse(req.body);
  const result = await registerUser(name, email, password, role);
  res.status(201).json(result);
};
