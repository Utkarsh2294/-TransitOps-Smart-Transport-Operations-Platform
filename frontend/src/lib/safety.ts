import { apiRequest, apiUrl, demoToken } from "./api";

export type ComplianceAlert = { type: "license_expiring" | "license_expired" | "doc_expiring" | "doc_expired" | "maintenance_overdue" | "driver_suspended"; severity: "high" | "medium" | "low"; entityType: "driver" | "vehicle"; entityId: number; entityLabel: string; detail: string; dueDate?: string };
export const getComplianceAlerts = () => apiRequest<{ data: ComplianceAlert[] }>("/safety/alerts");
export const downloadCompliancePdf = async () => {
  const response = await fetch(apiUrl("/reports/compliance-pdf"), { headers: demoToken ? { Authorization: `Bearer ${demoToken}` } : {} });
  if (!response.ok) throw await response.json();
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a"); link.href = url; link.download = "transitops-compliance-report.pdf"; link.click(); URL.revokeObjectURL(url);
};
