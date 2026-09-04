import { notFound } from "next/navigation";
import { getMockView } from "@/lib/mock";
import { ClientDetail } from "@/components/client/ClientDetail";

export default async function PreviewClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = getMockView(id);
  if (!view) notFound();
  // readOnly so the preview never tries to call live server actions.
  return <ClientDetail view={view} readOnly backHref="/preview" />;
}
