import {
  BarChart3,
  Bell,
  CarFront,
  Command,
  Fuel,
  Menu,
  Moon,
  Route,
  Search,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "./components/ui/Button";
import { DriverManagement } from "./components/drivers/DriverManagement";
import { FuelExpenseManagement } from "./components/finance/FuelExpenseManagement";
import { FinancialReports } from "./components/reports/FinancialReports";
import { SafetyOfficerDashboard } from "./components/safety/SafetyOfficerDashboard";
import { TripManagement } from "./components/trips/TripManagement";
import { VehicleRegistry } from "./components/vehicles/VehicleRegistry";

type View = "vehicles" | "drivers" | "trips" | "finance" | "safety" | "reports";

export const App = () => {
  const [view, setView] = useState<View>("vehicles");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const navItems = [
    { value: "vehicles" as const, label: "Vehicles", icon: CarFront },
    { value: "drivers" as const, label: "Drivers", icon: ShieldCheck },
    { value: "trips" as const, label: "Trips", icon: Route },
    { value: "finance" as const, label: "Fuel & Expenses", icon: Fuel },
    { value: "safety" as const, label: "Safety Officer", icon: Wrench },
    { value: "reports" as const, label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-surface px-4 py-5 backdrop-blur lg:block">
        <div className="mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background shadow-card">
            T
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">TransitOps</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Operations</h1>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <button
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                view === item.value
                  ? "bg-panel text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted hover:bg-panel hover:text-foreground"
              }`}
              key={item.value}
              onClick={() => setView(item.value)}
              type="button"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:ml-72">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button aria-label="Open navigation" className="hidden md:inline-flex" size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex rounded-lg border border-border bg-raised p-1 shadow-sm">
              {navItems.map((item) => (
                <button
                  aria-label={item.label}
                  className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                    view === item.value ? "bg-panel text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                  key={item.value}
                  onClick={() => setView(item.value)}
                  type="button"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-center px-6 md:flex">
            <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-lg border border-border bg-raised px-3 text-sm text-muted shadow-sm">
              <Search className="h-4 w-4" />
              <span className="truncate">Search vehicles, drivers, licenses...</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs">
                <Command className="h-3 w-3" /> K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Toggle theme"
              onClick={() => setIsDark((current) => !current)}
              size="icon"
              type="button"
              variant="outline"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button aria-label="Notifications" className="hidden sm:inline-flex" size="icon" variant="outline">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {view === "vehicles" ? <VehicleRegistry /> : null}
        {view === "drivers" ? <DriverManagement /> : null}
        {view === "trips" ? <TripManagement /> : null}
        {view === "finance" ? <FuelExpenseManagement /> : null}
        {view === "safety" ? <SafetyOfficerDashboard /> : null}
        {view === "reports" ? <FinancialReports /> : null}
      </main>
    </div>
  );
};
