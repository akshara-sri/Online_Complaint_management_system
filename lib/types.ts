export type UserRole = 'user' | 'admin';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'reopened';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export const COMPLAINT_CATEGORIES = [
  'Infrastructure',
  'Electricity',
  'Water Supply',
  'Sanitation',
  'Internet and Network',
  'Hostel',
  'Academic',
  'Harassment or Safety',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  department: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to: string | null;
  resolution_details: string | null;
  reopen_reason: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ComplaintWithMeta extends Complaint {
  user?: Pick<Profile, 'id' | 'full_name' | 'email'>;
  assignee?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface ComplaintHistory {
  id: string;
  complaint_id: string;
  changed_by: string | null;
  previous_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  remarks: string | null;
  created_at: string;
  changer?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ComplaintAttachment {
  id: string;
  complaint_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export const STATUS_META: Record<
  ComplaintStatus,
  { label: string; color: string; badgeClass: string; dotClass: string }
> = {
  submitted: {
    label: 'Submitted',
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  under_review: {
    label: 'Under Review',
    color: '#2563eb',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    color: '#f59e0b',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolved',
    color: '#16a34a',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    color: '#dc2626',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  reopened: {
    label: 'Reopened',
    color: '#9333ea',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
    dotClass: 'bg-violet-500',
  },
};

export const PRIORITY_META: Record<
  ComplaintPriority,
  { label: string; badgeClass: string }
> = {
  low: { label: 'Low', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Medium', badgeClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  high: { label: 'High', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: {
    label: 'Critical',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
  },
};

export const STATUS_VALUES: ComplaintStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
  'rejected',
  'reopened',
];

export const PRIORITY_VALUES: ComplaintPriority[] = ['low', 'medium', 'high', 'critical'];
