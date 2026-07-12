import type { Request, Response } from "express";

import {
  getFleetDashboardReport,
  getVehicleCostReport,
  getVehicleCostReportCsv,
  getCompliancePdf,
  getFuelAnomalies,
  getFinancialBrief,
  getBudgetStatus,
  getTripEfficiencyRankings,
  saveSnapshot,
  getSnapshots
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

export const getFuelAnomaliesController = async (_req: Request, res: Response) => {
  const data = await getFuelAnomalies();
  res.json({ data });
};

export const getFinancialBriefController = async (_req: Request, res: Response) => {
  const data = await getFinancialBrief();
  res.json({ data });
};

export const getBudgetStatusController = async (_req: Request, res: Response) => {
  const data = await getBudgetStatus();
  res.json({ data });
};

export const getTripEfficiencyRankingsController = async (_req: Request, res: Response) => {
  const data = await getTripEfficiencyRankings();
  res.json({ data });
};

export const saveSnapshotController = async (_req: Request, res: Response) => {
  const data = await saveSnapshot();
  res.json({ data });
};

export const getSnapshotsController = async (_req: Request, res: Response) => {
  const data = await getSnapshots();
  res.json({ data });
};

