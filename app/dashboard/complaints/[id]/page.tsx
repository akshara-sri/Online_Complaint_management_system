import { ComplaintDetail } from '@/components/shared/complaint-detail';

export default function UserComplaintDetailPage({ params }: { params: { id: string } }) {
  return <ComplaintDetail complaintId={params.id} backHref="/dashboard/complaints" />;
}
