import { Bell, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "./components/ui/Button";
import { DriverManagement } from "./components/drivers/DriverManagement";
import { FinancialReports } from "./components/reports/FinancialReports";
import { VehicleRegistry } from "./components/vehicles/VehicleRegistry";

type View = "vehicles" | "drivers" | "reports";

export const App = () => {
  const [view, setView] = useState<View>("vehicles");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">TransitOps</p>
          <h1 className="mt-2 text-xl font-semibold">Fleet & Compliance</h1>
        </div>
        <nav className="space-y-1">
          <button
            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
              view === "vehicles" ? "bg-panel text-white" : "text-slate-300 hover:bg-panel hover:text-white"
            }`}
            onClick={() => setView("vehicles")}
            type="button"
          >
            Vehicles
          </button>
          <button
            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
              view === "drivers" ? "bg-panel text-white" : "text-slate-300 hover:bg-panel hover:text-white"
            }`}
            onClick={() => setView("drivers")}
            type="button"
          >
            Drivers
          </button>
          <button
            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
              view === "reports" ? "bg-panel text-white" : "text-slate-300 hover:bg-panel hover:text-white"
            }`}
            onClick={() => setView("reports")}
            type="button"
          >
            Reports
          </button>
          {["Maintenance", "Safety Officer"].map((item) => (
            <span
              className="block rounded-md px-3 py-2 text-sm text-slate-500"
              key={item}
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button aria-label="Open navigation" size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex rounded-md border border-border bg-surface p-1">
              {[
                ["vehicles", "Vehicles"],
                ["drivers", "Drivers"],
                ["reports", "Reports"],
              ].map(([value, label]) => (
                <button
                  className={`h-8 rounded px-3 text-sm transition ${
                    view === value ? "bg-panel text-white" : "text-muted hover:text-white"
                  }`}
                  key={value}
                  onClick={() => setView(value as View)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell className="h-5 w-5" />
          </Button>
        </header>

        {view === "vehicles" ? (
          <VehicleRegistry />
        ) : view === "drivers" ? (
          <DriverManagement />
        ) : (
          <FinancialReports />
        )}
      </main>
    </div>
  );
};
