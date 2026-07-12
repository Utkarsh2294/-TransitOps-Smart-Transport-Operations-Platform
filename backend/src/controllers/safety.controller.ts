import type { Request, Response } from "express";

import { getComplianceAlerts } from "../services/safety.service.js";

export const getComplianceAlertsController = async (_req: Request, res: Response) => {
  res.json({ data: await getComplianceAlerts() });
};
