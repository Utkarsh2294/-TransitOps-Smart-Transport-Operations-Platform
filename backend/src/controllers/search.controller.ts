import type { Request, Response } from "express";
import { z } from "zod";

import { searchTransitOps } from "../services/search.service.js";

const querySchema = z.object({ q: z.string().trim().min(1, "Search query is required").max(100) });
export const searchController = async (req: Request, res: Response) => {
  const { q } = querySchema.parse(req.query);
  res.json({ data: await searchTransitOps(q) });
};
