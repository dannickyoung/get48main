import { getMockViews } from "@/lib/mock";
import { DashboardView } from "@/components/DashboardView";

export default function PreviewDashboard() {
  const views = getMockViews();
  return <DashboardView views={views} hrefBase="/preview/clients" addHref="/preview" preview />;
}
