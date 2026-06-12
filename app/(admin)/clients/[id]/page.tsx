import { notFound } from "next/navigation";
import { getClientView } from "@/lib/data";
import { ClientDetail } from "@/components/client/ClientDetail";

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await getClientView(id);
  if (!view) notFound();
  return <ClientDetail view={view} readOnly={false} />;
}
