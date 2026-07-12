import type { Request, Response } from "express";

import { getFleetInsights } from "../services/insights.service.js";

export const getFleetInsightsController = async (_req: Request, res: Response) => {
  const insights = await getFleetInsights();
  res.json({ data: insights });
};
