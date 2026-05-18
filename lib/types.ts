export type RiskLevel = "Green" | "Yellow" | "Orange" | "Red";
export type AssignmentStatus = "active" | "inactive";
export type ExceptionStatus = "open" | "in_review" | "resolved";
export type ReportStatus = "draft" | "submitted" | "review_ready" | "approved";

export type Business = {
  id: string;
  legalName: string;
  sector: string;
  onboardingProgress: number;
  assessmentComplete: boolean;
  kpiSetupComplete: boolean;
  currentVeriScore: number;
  previousVeriScore: number;
  currentIcScore: number;
  previousIcScore: number;
  evidenceCompletion: number;
  lastActivityDaysAgo: number;
  integrityReportReady: boolean;
};

export type Analyst = {
  id: string;
  name: string;
  email: string;
};

export type AnalystAssignment = {
  id: string;
  analystId: string;
  businessId: string;
  status: AssignmentStatus;
};

export type ControlException = {
  id: string;
  businessId: string;
  title: string;
  riskLevel: RiskLevel;
  status: ExceptionStatus;
  daysOpen: number;
};

export type DepartmentReport = {
  id: string;
  businessId: string;
  department: "sales" | "finance" | "procurement" | "operations" | "hr";
  status: ReportStatus;
  value: number;
  evidenceCount: number;
};

export type AnalystNote = {
  id: string;
  businessId: string;
  analystId: string;
  noteType: "internal_note" | "clarification_request" | "review_ready";
  body: string;
  visibility: "internal" | "business_visible";
  createdAt: string;
};

export type CeoResponse = {
  id: string;
  businessId: string;
  responseType: "clarification_response" | "exception_resolution";
  body: string;
  linkedEntityType: "analyst_note" | "control_exception";
  linkedEntityId: string;
  createdAt: string;
};

export type InstitutionAccess = {
  id: string;
  businessId: string;
  institutionName: string;
  institutionEmail: string;
  status: "active" | "revoked";
  createdAt: string;
};

export type Department = {
  id: string;
  businessId: string;
  name: string;
  departmentType: "sales" | "finance" | "procurement" | "operations" | "hr";
  createdAt: string;
};

export type KpiTarget = {
  id: string;
  businessId: string;
  name: string;
  targetValue: number;
  unit: string;
  period: "monthly" | "quarterly" | "annual";
  createdAt: string;
};

export type AssessmentResult = {
  id: string;
  businessId: string;
  veriscore: number;
  version: string;
  createdAt: string;
};

export type StaffInvitation = {
  id: string;
  businessId: string;
  departmentId: string;
  email: string;
  role: "sales_officer" | "finance_officer" | "procurement_officer" | "operations_officer" | "hr_admin";
  status: "pending" | "accepted" | "revoked";
  invitationToken: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type BusinessUser = {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  departmentId: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

export type IcScoreResult = {
  id: string;
  businessId: string;
  score: number;
  version: string;
  createdAt: string;
};

export type EvidenceFile = {
  id: string;
  businessId: string;
  reportId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  storagePath: string | null;
  fileSize: number;
  evidenceLevel: 0 | 1 | 2 | 3;
  verificationStatus: "pending" | "verified" | "rejected";
  signedUrl?: string | null;
  createdAt: string;
};

export type AnalystWorkload = {
  analyst: Analyst;
  assignedCount: number;
  capacity: number;
  availableSlots: number;
  utilization: number;
  overloaded: boolean;
};

export type BusinessReadiness = {
  business: Business;
  openHighRiskExceptions: number;
  missingEvidence: boolean;
  decliningIcScore: boolean;
  decliningVeriScore: boolean;
  inactive: boolean;
  needsIntervention: boolean;
};
