import { env } from "../config/env.js";
import { getFleetDashboardReport, getVehicleCostReport } from "./reports.service.js";

type FleetAttentionItem = {
  label: string;
  detail: string;
  severity: "info" | "warning" | "danger";
};

export type FleetInsightResponse = {
  source: "ai" | "rules-only";
  briefing: string | null;
  actions: FleetAttentionItem[];
};

const round = (value: number, precision = 1) => Number(value.toFixed(precision));

const buildRulesOnlyInsight = async (): Promise<FleetInsightResponse> => {
  const [dashboard, vehicleCosts] = await Promise.all([
    getFleetDashboardReport(),
    getVehicleCostReport(),
  ]);

  const topCostVehicles = [...vehicleCosts]
    .sort((left, right) => right.totalOperationalCost - left.totalOperationalCost)
    .slice(0, 3);

  const inShopVehicles = vehicleCosts.filter((vehicle) => vehicle.status === "In_Shop").slice(0, 3);
  const lowEfficiencyVehicles = vehicleCosts
    .filter((vehicle) => vehicle.fuelEfficiencyKmPerLiter !== null)
    .sort((left, right) => (left.fuelEfficiencyKmPerLiter ?? 0) - (right.fuelEfficiencyKmPerLiter ?? 0))
    .slice(0, 3);

  const actions: FleetAttentionItem[] = [
    ...inShopVehicles.map((vehicle) => ({
      label: vehicle.regNumber,
      detail: `In shop with ${round(vehicle.totalOperationalCost)} total operational cost.`,
      severity: "warning" as const,
    })),
    ...topCostVehicles.map((vehicle) => ({
      label: vehicle.regNumber,
      detail: `Top spend vehicle at ${round(vehicle.totalOperationalCost)} total cost.`,
      severity: "danger" as const,
    })),
    ...lowEfficiencyVehicles.map((vehicle) => ({
      label: vehicle.regNumber,
      detail: `Low efficiency at ${vehicle.fuelEfficiencyKmPerLiter?.toFixed(1) ?? "N/A"} km/L.`,
      severity: "info" as const,
    })),
  ].slice(0, 5);

  const briefingParts = [
    `Fleet utilization is ${dashboard.kpis.fleetUtilizationPercent}%.`,
    `${dashboard.kpis.maintenanceVehicles} vehicles are in shop and ${dashboard.kpis.pendingTrips} trips are still in draft.`,
    `Operational cost is ${round(dashboard.analytics.totalOperationalCost, 0)} with ${dashboard.analytics.fuelEfficiencyKmPerLiter?.toFixed(1) ?? "N/A"} km/L fuel efficiency.`,
  ];

  return {
    source: "rules-only",
    briefing: briefingParts.join(" "),
    actions,
  };
};

const callOpenAiBriefing = async (briefingPayload: FleetInsightResponse) => {
  if (!env.OPENAI_API_KEY) {
    return briefingPayload;
  }

  const prompt = [
    "You are a fleet operations analyst.",
    "Write a short 3-sentence briefing for a fleet manager.",
    "Only use the provided JSON facts. Do not invent numbers.",
    `Facts: ${JSON.stringify(briefingPayload)}`,
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: prompt,
    }),
  });

  if (!response.ok) {
    return briefingPayload;
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  const briefing =
    data.output_text ??
    data.output?.flatMap((entry) => entry.content ?? []).map((content) => content.text ?? "").join("").trim() ??
    briefingPayload.briefing;

  return {
    ...briefingPayload,
    source: "ai" as const,
    briefing: briefing || briefingPayload.briefing,
  };
};

export const getFleetInsights = async (): Promise<FleetInsightResponse> => {
  const rulesOnly = await buildRulesOnlyInsight();
  return callOpenAiBriefing(rulesOnly);
};
