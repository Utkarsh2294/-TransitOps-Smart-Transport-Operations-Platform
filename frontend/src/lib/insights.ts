import { apiRequest } from "./api";
import type { FleetInsightApiResponse } from "../types/insights";

export const getFleetInsights = () => apiRequest<FleetInsightApiResponse>("/insights/fleet");

