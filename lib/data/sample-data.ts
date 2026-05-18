import type {
  Analyst,
  AnalystAssignment,
  AnalystNote,
  Business,
  CeoResponse,
  ControlException,
  Department,
  DepartmentReport,
  KpiTarget,
  AssessmentResult,
  BusinessUser,
  StaffInvitation,
  IcScoreResult,
  EvidenceFile,
  InstitutionAccess
} from "@/lib/types";

export const businesses: Business[] = [
  {
    id: "biz_001",
    legalName: "Adenike Foods Ltd",
    sector: "Food processing",
    onboardingProgress: 86,
    assessmentComplete: true,
    kpiSetupComplete: true,
    currentVeriScore: 78,
    previousVeriScore: 74,
    currentIcScore: 71,
    previousIcScore: 69,
    evidenceCompletion: 82,
    lastActivityDaysAgo: 1,
    integrityReportReady: true
  },
  {
    id: "biz_002",
    legalName: "Northline Supplies",
    sector: "Procurement",
    onboardingProgress: 64,
    assessmentComplete: true,
    kpiSetupComplete: false,
    currentVeriScore: 66,
    previousVeriScore: 70,
    currentIcScore: 58,
    previousIcScore: 67,
    evidenceCompletion: 49,
    lastActivityDaysAgo: 9,
    integrityReportReady: false
  },
  {
    id: "biz_003",
    legalName: "MetroCare Clinics",
    sector: "Healthcare",
    onboardingProgress: 92,
    assessmentComplete: true,
    kpiSetupComplete: true,
    currentVeriScore: 83,
    previousVeriScore: 81,
    currentIcScore: 80,
    previousIcScore: 76,
    evidenceCompletion: 91,
    lastActivityDaysAgo: 0,
    integrityReportReady: true
  },
  {
    id: "biz_004",
    legalName: "Zuma Retail Partners",
    sector: "Retail",
    onboardingProgress: 38,
    assessmentComplete: false,
    kpiSetupComplete: false,
    currentVeriScore: 42,
    previousVeriScore: 42,
    currentIcScore: 46,
    previousIcScore: 50,
    evidenceCompletion: 28,
    lastActivityDaysAgo: 16,
    integrityReportReady: false
  },
  {
    id: "biz_005",
    legalName: "Bridgefield Logistics",
    sector: "Logistics",
    onboardingProgress: 22,
    assessmentComplete: false,
    kpiSetupComplete: false,
    currentVeriScore: 35,
    previousVeriScore: 35,
    currentIcScore: 40,
    previousIcScore: 40,
    evidenceCompletion: 18,
    lastActivityDaysAgo: 5,
    integrityReportReady: false
  }
];

export const analysts: Analyst[] = [
  { id: "usr_ana_001", name: "Mira Okonkwo", email: "mira@fulscann.com" },
  { id: "usr_ana_002", name: "Tade Bello", email: "tade@fulscann.com" }
];

export const analystAssignments: AnalystAssignment[] = [
  { id: "asg_001", analystId: "usr_ana_001", businessId: "biz_001", status: "active" },
  { id: "asg_002", analystId: "usr_ana_001", businessId: "biz_002", status: "active" },
  { id: "asg_003", analystId: "usr_ana_001", businessId: "biz_004", status: "active" },
  { id: "asg_004", analystId: "usr_ana_002", businessId: "biz_003", status: "active" }
];

export const controlExceptions: ControlException[] = [
  {
    id: "exc_001",
    businessId: "biz_002",
    title: "Sales-finance mismatch",
    riskLevel: "Orange",
    status: "open",
    daysOpen: 4
  },
  {
    id: "exc_002",
    businessId: "biz_004",
    title: "Missing expense evidence",
    riskLevel: "Red",
    status: "open",
    daysOpen: 11
  },
  {
    id: "exc_003",
    businessId: "biz_001",
    title: "Procurement approval gap",
    riskLevel: "Yellow",
    status: "in_review",
    daysOpen: 2
  }
];

export const departmentReports: DepartmentReport[] = [
  { id: "rep_001", businessId: "biz_001", department: "sales", status: "review_ready", value: 2400000, evidenceCount: 5 },
  { id: "rep_002", businessId: "biz_001", department: "finance", status: "submitted", value: 2300000, evidenceCount: 4 },
  { id: "rep_003", businessId: "biz_002", department: "sales", status: "submitted", value: 1900000, evidenceCount: 2 },
  { id: "rep_004", businessId: "biz_002", department: "finance", status: "draft", value: 1200000, evidenceCount: 0 },
  { id: "rep_005", businessId: "biz_003", department: "operations", status: "approved", value: 880000, evidenceCount: 6 }
];

export const analystNotes: AnalystNote[] = [
  {
    id: "note_001",
    businessId: "biz_001",
    analystId: "usr_ana_001",
    noteType: "clarification_request",
    body: "Please clarify the procurement approval gap before the Integrity Report is shared.",
    visibility: "business_visible",
    createdAt: "2026-05-18T07:00:00.000Z"
  },
  {
    id: "note_002",
    businessId: "biz_002",
    analystId: "usr_ana_001",
    noteType: "clarification_request",
    body: "Finance inflow is lower than reported sales. Add supporting evidence or explain the timing difference.",
    visibility: "business_visible",
    createdAt: "2026-05-18T07:30:00.000Z"
  }
];

export const ceoResponses: CeoResponse[] = [];

export const institutionAccess: InstitutionAccess[] = [
  {
    id: "access_001",
    businessId: "biz_001",
    institutionName: "TrustBank Credit Desk",
    institutionEmail: "credit@trustbank.example",
    status: "active",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export const departments: Department[] = [
  {
    id: "dept_001",
    businessId: "biz_001",
    name: "Sales",
    departmentType: "sales",
    createdAt: "2026-05-18T08:00:00.000Z"
  },
  {
    id: "dept_002",
    businessId: "biz_001",
    name: "Finance",
    departmentType: "finance",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export const kpiTargets: KpiTarget[] = [
  {
    id: "kpi_001",
    businessId: "biz_001",
    name: "Sales-to-Finance Match Rate",
    targetValue: 95,
    unit: "%",
    period: "monthly",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export const assessmentResults: AssessmentResult[] = [
  {
    id: "veri_001",
    businessId: "biz_001",
    veriscore: 78,
    version: "v1.0",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export const staffInvitations: StaffInvitation[] = [
  {
    id: "invite_001",
    businessId: "biz_001",
    departmentId: "dept_001",
    email: "sales@adenikefoods.example",
    role: "sales_officer",
    status: "pending",
    invitationToken: "demo-sales-invite",
    acceptedAt: null,
    createdAt: "2026-05-18T08:30:00.000Z"
  }
];

export const businessUsers: BusinessUser[] = [
  {
    id: "bu_001",
    businessId: "biz_001",
    userId: "usr_ceo_001",
    role: "ceo",
    departmentId: null,
    status: "active",
    createdAt: "2026-05-18T08:00:00.000Z"
  },
  {
    id: "bu_002",
    businessId: "biz_001",
    userId: "usr_staff_001",
    role: "sales_officer",
    departmentId: "dept_001",
    status: "active",
    createdAt: "2026-05-18T08:45:00.000Z"
  }
];

export const icScoreResults: IcScoreResult[] = [
  {
    id: "ic_001",
    businessId: "biz_001",
    score: 71,
    version: "v1.0",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

export const evidenceFiles: EvidenceFile[] = [
  {
    id: "ev_001",
    businessId: "biz_001",
    reportId: "rep_001",
    uploadedBy: "usr_staff_001",
    fileName: "sales-invoices-may.pdf",
    fileType: "invoice",
    storagePath: "biz_001/rep_001/sales-invoices-may.pdf",
    fileSize: 128000,
    evidenceLevel: 1,
    verificationStatus: "pending",
    signedUrl: null,
    createdAt: "2026-05-18T08:45:00.000Z"
  },
  {
    id: "ev_002",
    businessId: "biz_001",
    reportId: "rep_002",
    uploadedBy: "usr_staff_002",
    fileName: "bank-inflow-may.pdf",
    fileType: "bank_statement",
    storagePath: "biz_001/rep_002/bank-inflow-may.pdf",
    fileSize: 256000,
    evidenceLevel: 2,
    verificationStatus: "pending",
    signedUrl: null,
    createdAt: "2026-05-18T08:50:00.000Z"
  }
];
