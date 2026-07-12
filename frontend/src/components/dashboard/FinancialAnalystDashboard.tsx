import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, DollarSign, Fuel, Activity } from "lucide-react";
import { apiRequest } from "../../lib/api";

type FinancialBrief = {
  topCostVehicles: Array<{ vehicleId: number; regNumber: string; totalOperationalCost: number }>;
  fuelAnomaliesCount: number;
  overBudgetVehiclesCount: number;
};

type FuelAnomaly = {
  vehicleId: number;
  regNumber: string;
  tripId: number;
  date: string;
  actualEfficiency: number;
  expectedEfficiency: number;
  deviationPercent: number;
};

type BudgetStatus = {
  vehicleId: number;
  regNumber: string;
  monthlyBudget: number;
  spentMTD: number;
  projectedMonthEnd: number;
};

export const FinancialAnalystDashboard = () => {
  const [brief, setBrief] = useState<FinancialBrief | null>(null);
  const [anomalies, setAnomalies] = useState<FuelAnomaly[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);

  useEffect(() => {
    Promise.all([
      apiRequest<any>("/reports/financial-brief"),
      apiRequest<any>("/reports/fuel-anomalies"),
      apiRequest<any>("/reports/budget-status"),
    ]).then(([briefRes, anomaliesRes, budgetsRes]) => {
      setBrief(briefRes.data);
      setAnomalies(anomaliesRes.data);
      setBudgets(budgetsRes.data);
    });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
      </div>

      <div className="bento-grid">
        {/* Today's Brief (2x2) */}
        <div className="bento-tile tile-2x2 bg-surface shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="text-accent h-5 w-5" /> Today's Brief
            </h2>
            <p className="text-sm text-muted">Snapshot of critical financial metrics.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-raised border border-border">
              <p className="text-sm text-muted font-medium mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" /> Over-Budget
              </p>
              <p className="text-3xl font-bold text-danger">{brief?.overBudgetVehiclesCount ?? 0}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-raised border border-border">
              <p className="text-sm text-muted font-medium mb-1 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-warning" /> Fuel Anomalies
              </p>
              <p className="text-3xl font-bold text-warning">{brief?.fuelAnomaliesCount ?? 0}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2">Top Cost Vehicles</h3>
            <div className="space-y-2">
              {brief?.topCostVehicles.map(v => (
                <div key={v.vehicleId} className="flex justify-between items-center text-sm bg-background p-2 rounded-lg">
                  <span className="font-medium">{v.regNumber}</span>
                  <span className="text-muted">${v.totalOperationalCost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fuel Efficiency Watch (1x2) */}
        <div className="bento-tile tile-1x2 bg-surface shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Fuel className="text-warning h-5 w-5" /> Fuel Watch
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-2">
            {anomalies.length === 0 ? (
              <p className="text-sm text-muted text-center mt-4">No anomalies detected.</p>
            ) : (
              anomalies.map(a => (
                <div key={a.tripId} className="p-3 rounded-lg bg-raised border border-border">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">{a.regNumber}</span>
                    <span className="text-xs font-medium text-danger px-2 py-0.5 rounded-full bg-danger/10">-{a.deviationPercent}%</span>
                  </div>
                  <p className="text-xs text-muted">
                    {a.actualEfficiency} km/L vs avg {a.expectedEfficiency}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budget Watch (1x2) */}
        <div className="bento-tile tile-1x2 bg-surface shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <DollarSign className="text-success h-5 w-5" /> Budget Watch
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-2">
            {budgets.slice(0, 5).map(b => {
              const pct = (b.spentMTD / b.monthlyBudget) * 100;
              const isDanger = pct > 100;
              const isWarning = pct > 85 && !isDanger;
              return (
                <div key={b.vehicleId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{b.regNumber}</span>
                    <span className={isDanger ? "text-danger" : isWarning ? "text-warning" : "text-success"}>
                      ${b.spentMTD.toLocaleString()} / ${b.monthlyBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isDanger ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted text-right">Proj: ${b.projectedMonthEnd.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
