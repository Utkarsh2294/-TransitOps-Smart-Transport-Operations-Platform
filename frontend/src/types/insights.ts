export type FleetInsightAction = {
  label: string;
  detail: string;
  severity: "info" | "warning" | "danger";
};

export type FleetInsightResponse = {
  source: "ai" | "rules-only";
  briefing: string | null;
  actions: FleetInsightAction[];
};

export type FleetInsightApiResponse = {
  data: FleetInsightResponse;
};

