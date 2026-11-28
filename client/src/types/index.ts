export type UserRole = 'Citizen' | 'Authority' | 'Admin';
export type AuthorityLevel = 'Junior' | 'Senior' | 'HOD';
export type DutyStatus = 'On Duty' | 'Off Duty' | 'On Leave' | 'Busy';

export interface RoleSummary {
  _id: string;
  name: string;
  slug: string;
  scope: UserRole;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  isActive?: boolean;
  assignedCount?: number;
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  anonymousId?: string;
  pastAnonymousIds?: string[];
  role: UserRole;
  authorityLevel?: AuthorityLevel;
  department?: string;
  dutyStatus?: DutyStatus;
  isAuthorityAdmin?: boolean;
  customRole?: RoleSummary | string | null;
  permissions?: string[];
  isActive?: boolean;
  lastSeenAt?: string;
  points?: number;
  badges?: string[];
  strikes?: number;
  isBanned?: boolean;
  banUntil?: string | null;
  restrictedFeatures?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintReply {
  authorityName: string;
  content: string;
  createdAt?: string;
}

export interface MergedReportEntry {
  reportedBy?: string;
  description: string;
  imageUrls?: string[];
  distanceMeters?: number;
  similarityScore?: number;
  mergedAt?: string;
}

export interface Complaint {
  _id: string;
  reportedBy?: string;
  category: string;
  description: string;
  originalDescription?: string;
  originalLanguage?: string;
  status: string;
  priority?: string;
  escalationLevel?: AuthorityLevel;
  supportCount?: number;
  reportCount?: number;
  coReporters?: string[];
  mergedReports?: MergedReportEntry[];
  upvotes?: number;
  isSupported?: boolean;
  upvotedBy?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  resolutionImages?: string[];
  resolutionFeedback?: {
    status?: 'Pending' | 'Accepted' | 'Rejected';
    comment?: string;
    updatedAt?: string;
  };
  location?: {
    type?: string;
    coordinates: [number, number];
  };
  address?: {
    line1?: string;
    line2?: string;
    ward?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    fullAddress?: string;
  };
  assignedTo?: {
    _id?: string;
    name?: string;
    department?: string;
    authorityLevel?: AuthorityLevel;
  } | null;
  officialReplies?: ComplaintReply[];
  expectedCompletionDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  sender?: {
    name?: string;
    avatar?: string;
    role?: string;
  };
}

export interface Petition {
  _id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  status: 'Active' | 'Rejected' | 'Escalated';
  targetSignatures: number;
  upvoteCount: number;
  hasUpvoted: boolean;
  creator?: {
    _id?: string;
    displayName?: string;
    anonymousId?: string;
  };
  createdAt: string;
}
