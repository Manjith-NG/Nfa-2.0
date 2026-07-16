import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getRequestDetailData } from "@/lib/services/request-detail-service";
import { RequestDetailClient } from "@/components/requests/request-detail-client";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const data = await getRequestDetailData(user, id);
  if (!data) notFound();

  return <RequestDetailClient id={id} initialData={data} viewerRole={user.roleCode} />;
}
