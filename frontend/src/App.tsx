import { Bell, CarFront, Menu, ShieldCheck, Wrench } from "lucide-react";

import { Button } from "./components/ui/Button";
import { StatusBadge } from "./components/ui/StatusBadge";

const phaseCards = [
  {
    title: "Vehicle Registry",
    description: "CRUD, available-pool endpoint, status-safe edits.",
    icon: CarFront,
    status: "Phase 3",
  },
  {
    title: "Driver Management",
    description: "License validation, availability rules, safety data.",
    icon: ShieldCheck,
    status: "Phase 5",
  },
  {
    title: "Maintenance",
    description: "Open and close workflows with Mongo transactions.",
    icon: Wrench,
    status: "Phase 7",
  },
];

export const App = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">TransitOps</p>
          <h1 className="mt-2 text-xl font-semibold">Fleet & Compliance</h1>
        </div>
        <nav className="space-y-1">
          {["Overview", "Vehicles", "Drivers", "Maintenance", "Safety Officer"].map((item) => (
            <a
              className="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-panel hover:text-white"
              href="#"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button aria-label="Open navigation" size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted">Phase 1 foundation</p>
              <h2 className="text-base font-semibold">Person A workspace</h2>
            </div>
          </div>
          <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell className="h-5 w-5" />
          </Button>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5 shadow-glow">
              <p className="text-sm text-muted">Vehicles in scope</p>
              <p className="mt-3 text-3xl font-semibold">15+</p>
              <StatusBadge status="Available" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm text-muted">Drivers in scope</p>
              <p className="mt-3 text-3xl font-semibold">15+</p>
              <StatusBadge status="On Trip" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm text-muted">Maintenance rules</p>
              <p className="mt-3 text-3xl font-semibold">2</p>
              <StatusBadge status="In Shop" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm text-muted">Safety queue</p>
              <p className="mt-3 text-3xl font-semibold">Ready</p>
              <StatusBadge status="Suspended" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {phaseCards.map((card) => (
              <article className="rounded-lg border border-border bg-panel p-5" key={card.title}>
                <div className="mb-4 flex items-center justify-between">
                  <card.icon className="h-5 w-5 text-primary" />
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted">
                    {card.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-surface p-5">
            <p className="text-sm font-medium text-primary">Database foundation</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Updated plan applied: PostgreSQL with Prisma Client, real foreign keys, enum-backed
              statuses, and SQL transactions for maintenance workflows.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
