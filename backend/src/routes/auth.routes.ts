import { Router } from "express";

import { loginController, registerController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginController));
authRouter.post("/register", asyncHandler(registerController));
