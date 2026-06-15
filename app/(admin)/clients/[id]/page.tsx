import { notFound } from "next/navigation";
import { getClientView, getClientMembers } from "@/lib/data";
import { ClientDetail } from "@/components/client/ClientDetail";

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [view, members] = await Promise.all([getClientView(id), getClientMembers(id)]);
  if (!view) notFound();
  return <ClientDetail view={view} readOnly={false} members={members} />;
}
