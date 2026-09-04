import Link from "next/link";
import { getAllClientViews } from "@/lib/data";
import { ClientsDirectory, type ClientSummary } from "@/components/admin/ClientsDirectory";
import { money, compactDate } from "@/lib/format";

export default async function ClientsPage() {
  const views = await getAllClientViews();

  const clients: ClientSummary[] = views.map((v) => {
    const cur = v.computation?.current;
    return {
      id: v.client.id,
      name: v.client.name,
      company: v.client.company,
      email: v.client.email,
      archived: v.client.archived,
      health: v.health,
      hasRetainer: !!v.computation,
      allotment: cur?.allotment ?? 0,
      used: cur?.usedFromFresh ?? 0,
      overage: cur?.overageThisPeriod ?? 0,
      rollover: cur?.rollover.available ?? 0,
      expiryLabel: cur && cur.rollover.available > 0 ? `exp ${compactDate(cur.rollover.nextExpiry)}` : null,
      outstanding: money(v.outstanding),
      hasOutstanding: v.outstanding > 0,
    };
  });

  return (
    <div className="rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1.5 text-[15px] text-muted">Everyone on a retainer, searchable.</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          <span className="text-base leading-none">+</span> Add client
        </Link>
      </div>

      <ClientsDirectory clients={clients} />
    </div>
  );
}
