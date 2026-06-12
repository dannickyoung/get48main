"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, NavArrowRight } from "iconoir-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { EmptyState } from "@/components/ui/EmptyState";
import type { HealthStatus } from "@/lib/retainer/assemble";

export type ClientSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  archived: boolean;
  health: HealthStatus;
  hasRetainer: boolean;
  allotment: number;
  used: number;
  overage: number;
  rollover: number;
  expiryLabel: string | null;
  outstanding: string;
  hasOutstanding: boolean;
};

export function ClientsDirectory({ clients }: { clients: ClientSummary[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");

  const archivedCount = clients.filter((c) => c.archived).length;
  const term = q.trim().toLowerCase();
  const list = clients
    .filter((c) => (tab === "archived" ? c.archived : !c.archived))
    .filter(
      (c) =>
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.company ?? "").toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-faint">
            <Search width={17} height={17} strokeWidth={1.6} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-lg bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
          />
        </div>
        {archivedCount > 0 && (
          <div className="flex rounded-lg bg-surface p-1 ring-1 ring-border">
            {(["active", "archived"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  tab === t ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        term ? (
          <EmptyState title="No matches" description={`No clients match “${q}”.`} />
        ) : (
          <EmptyState
            title={tab === "archived" ? "No archived clients" : "No clients yet"}
            description={
              tab === "archived"
                ? "Archived clients will appear here."
                : "Add your first retainer client to begin tracking."
            }
            actionHref={tab === "active" ? "/clients/new" : undefined}
            actionLabel={tab === "active" ? "Add a client" : undefined}
          />
        )
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className="group flex flex-col gap-3 rounded-lg bg-surface p-4 ring-1 ring-border transition hover:bg-surface-2 hover:ring-border-strong sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_16px] sm:items-center sm:gap-x-8 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="truncate font-display text-[17px] font-semibold tracking-tight">{c.name}</div>
                  <div className="truncate text-xs text-faint">{c.company || c.email}</div>
                </div>
                <div className="min-w-0">
                  {c.hasRetainer ? (
                    <>
                      <div className="mb-1.5 text-xs font-medium text-muted tnum">
                        {c.used}/{c.allotment} this month
                      </div>
                      <UsageMeter allotment={c.allotment} used={c.used} variant="bar" size="sm" />
                    </>
                  ) : (
                    <span className="text-xs text-faint">No retainer</span>
                  )}
                </div>
                <div className="min-w-0 text-sm">
                  {c.rollover > 0 ? (
                    <>
                      <div className="font-display font-semibold tnum text-accent">{c.rollover} rolling</div>
                      <div className="text-xs text-faint tnum">{c.expiryLabel}</div>
                    </>
                  ) : c.overage > 0 ? (
                    <>
                      <div className="font-display font-semibold tnum text-warn">+{c.overage} over</div>
                      <div className="text-xs text-faint">above allotment</div>
                    </>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </div>
                <div className="min-w-0">
                  <StatusPill health={c.health} />
                </div>
                <span className="hidden text-faint transition group-hover:translate-x-0.5 group-hover:text-foreground sm:block">
                  <NavArrowRight width={16} height={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
