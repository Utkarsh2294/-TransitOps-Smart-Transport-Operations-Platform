import type { Request, Response } from "express";

import {
  getFleetDashboardReport,
  getVehicleCostReport,
  getVehicleCostReportCsv,
  getCompliancePdf,
} from "../services/reports.service.js";

export const getFleetDashboardReportController = async (_req: Request, res: Response) => {
  const report = await getFleetDashboardReport();
  res.json({ data: report });
};

export const getVehicleCostReportController = async (_req: Request, res: Response) => {
  const report = await getVehicleCostReport();
  res.json({ data: report });
};

export const exportVehicleCostReportController = async (_req: Request, res: Response) => {
  const csv = await getVehicleCostReportCsv();

  res.header("Content-Type", "text/csv");
  res.attachment("vehicle-cost-report.csv");
  res.send(csv);
};

export const exportCompliancePdfController = async (_req: Request, res: Response) => {
  const pdf = await getCompliancePdf();
  res.header("Content-Type", "application/pdf");
  res.attachment("transitops-compliance-report.pdf");
  res.send(pdf);
};

