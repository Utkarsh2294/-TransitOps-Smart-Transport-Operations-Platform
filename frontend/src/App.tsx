import {
  BarChart3,
  Bell,
  CarFront,
  Command,
  Gauge,
  Fuel,
  LogOut,
  Menu,
  Moon,
  Route,
  Search,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoginPage } from "./components/auth/LoginPage";
import { Button } from "./components/ui/Button";
import { DriverHomeView } from "./components/dashboard/DriverHomeView";
import { FleetManagerDashboard } from "./components/dashboard/FleetManagerDashboard";
import { DriverManagement } from "./components/drivers/DriverManagement";
import { FuelExpenseManagement } from "./components/finance/FuelExpenseManagement";
import { FinancialReports } from "./components/reports/FinancialReports";
import { SafetyOfficerDashboard } from "./components/safety/SafetyOfficerDashboard";
import { TripManagement } from "./components/trips/TripManagement";
import { VehicleRegistry } from "./components/vehicles/VehicleRegistry";
import { isAuthenticated, getUser, logout } from "./lib/auth";
import type { AuthUser } from "./lib/auth";

type View = "dashboard" | "vehicles" | "drivers" | "trips" | "finance" | "safety" | "reports";

const ROLE_LABELS: Record<string, string> = {
  fleet_manager: "Fleet Manager",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

type NavItem = { value: View; label: string; icon: typeof Gauge };

const ALL_NAV_ITEMS: NavItem[] = [
  { value: "dashboard", label: "Dashboard", icon: Gauge },
  { value: "vehicles", label: "Vehicles", icon: CarFront },
  { value: "drivers", label: "Drivers", icon: ShieldCheck },
  { value: "trips", label: "Trips", icon: Route },
  { value: "finance", label: "Fuel & Expenses", icon: Fuel },
  { value: "safety", label: "Safety Officer", icon: Wrench },
  { value: "reports", label: "Reports", icon: BarChart3 },
];

/** Each role sees only the tabs relevant to their responsibilities */
const ROLE_NAV: Record<string, View[]> = {
  fleet_manager: ["dashboard", "vehicles", "drivers", "trips", "finance", "safety", "reports"],
  driver: ["trips"],
  safety_officer: ["safety", "vehicles", "drivers"],
  financial_analyst: ["reports", "finance", "vehicles"],
};

const ROLE_DEFAULT_VIEW: Record<string, View> = {
  fleet_manager: "dashboard",
  driver: "trips",
  safety_officer: "safety",
  financial_analyst: "reports",
};

export const App = () => {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState<AuthUser | null>(getUser());
  const [view, setView] = useState<View>(ROLE_DEFAULT_VIEW[getUser()?.role ?? "fleet_manager"] ?? "dashboard");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleLogin = (loggedInUser: AuthUser) => {
    setAuthed(true);
    setUser(loggedInUser);
    setView(ROLE_DEFAULT_VIEW[loggedInUser.role] ?? "dashboard");
  };

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setUser(null);
  };

  const navItems = useMemo(() => {
    const allowedViews = ROLE_NAV[user?.role ?? "fleet_manager"] ?? ALL_NAV_ITEMS.map((i) => i.value);
    return ALL_NAV_ITEMS.filter((item) => allowedViews.includes(item.value));
  }, [user?.role]);

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isDriver = user?.role === "driver";

  const renderView = () => {
    if (isDriver) {
      return <DriverHomeView driverName={user?.name ?? "Driver"} />;
    }
    switch (view) {
      case "dashboard":
        return <FleetManagerDashboard />;
      case "vehicles":
        return <VehicleRegistry />;
      case "drivers":
        return <DriverManagement />;
      case "trips":
        return <TripManagement />;
      case "finance":
        return <FuelExpenseManagement />;
      case "safety":
        return <SafetyOfficerDashboard />;
      case "reports":
        return <FinancialReports />;
      default:
        return <FleetManagerDashboard />;
    }
  };

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

        {/* User info at bottom of sidebar */}
        {user && (
          <div className="absolute bottom-5 left-4 right-4">
            <div className="rounded-lg border border-border bg-panel p-3">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="mt-0.5 text-xs text-muted truncate">{user.email}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-primary">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <button
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition hover:bg-surface hover:text-danger"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="lg:ml-72">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button aria-label="Open navigation" className="hidden md:inline-flex" size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
            {!isDriver && (
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
            )}
            {isDriver && (
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">My Trips</span>
              </div>
            )}
          </div>
          {!isDriver && (
            <div className="hidden min-w-0 flex-1 items-center justify-center px-6 md:flex">
              <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-lg border border-border bg-raised px-3 text-sm text-muted shadow-sm">
                <Search className="h-4 w-4" />
                <span className="truncate">Search vehicles, drivers, licenses...</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs">
                  <Command className="h-3 w-3" /> K
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-raised px-3 py-1.5 sm:flex lg:hidden">
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            )}
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
            <Button
              aria-label="Logout"
              className="lg:hidden"
              onClick={handleLogout}
              size="icon"
              type="button"
              variant="outline"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  );
};
