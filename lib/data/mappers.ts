import type {
  Analyst,
  AnalystAssignment,
  AnalystNote,
  AnalystEscalation,
  Business,
  CeoResponse,
  ControlException,
  Department,
  DepartmentReport,
  KpiTarget,
  BusinessKpi,
  AssessmentResult,
  BusinessUser,
  StaffInvitation,
  IcScoreResult,
  EvidenceFile,
  InstitutionAccess,
  AuditEvent
} from "@/lib/types";

type BusinessRow = {
  id: string;
  legal_name: string;
  sector: string;
  onboarding_progress: number;
  assessment_complete?: boolean | null;
  kpi_setup_complete?: boolean | null;
  current_veriscore: number;
  previous_veriscore?: number | null;
  current_ic_score: number;
  previous_ic_score?: number | null;
  evidence_completion: number;
  last_activity_at?: string | null;
  integrity_report_ready?: boolean | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
};

type AssignmentRow = {
  id: string;
  analyst_user_id: string;
  business_id: string;
  status: "active" | "inactive";
};

type ExceptionRow = {
  id: string;
  business_id: string;
  title: string;
  risk_level: "Green" | "Yellow" | "Orange" | "Red";
  status: "open" | "in_review" | "resolved";
  created_at: string;
};

type DepartmentReportRow = {
  id: string;
  business_id: string;
  department: "sales" | "finance" | "procurement" | "operations" | "hr";
  kpi_key?: string | null;
  status: "draft" | "submitted" | "review_ready" | "approved";
  value: number;
  evidence_count: number;
};

type AnalystNoteRow = {
  id: string;
  business_id: string;
  analyst_user_id: string;
  note_type: AnalystNote["noteType"];
  body: string;
  visibility: AnalystNote["visibility"];
  created_at: string;
};

type AnalystEscalationRow = {
  id: string;
  business_id: string;
  analyst_user_id: string;
  escalated_to: string;
  risk_level: AnalystEscalation["riskLevel"];
  reason: string;
  status: AnalystEscalation["status"];
  created_at: string;
};

type CeoResponseRow = {
  id: string;
  business_id: string;
  response_type: CeoResponse["responseType"];
  body: string;
  linked_entity_type: CeoResponse["linkedEntityType"];
  linked_entity_id: string;
  created_at: string;
};

type InstitutionAccessRow = {
  id: string;
  business_id: string;
  institution_name: string;
  institution_email: string;
  status: InstitutionAccess["status"];
  created_at: string;
};

type AuditEventRow = {
  id: string;
  business_id: string | null;
  actor_user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type DepartmentRow = {
  id: string;
  business_id: string;
  name: string;
  department_type: Department["departmentType"];
  created_at: string;
};

type KpiTargetRow = {
  id: string;
  business_id: string;
  name: string;
  target_value: number;
  unit: string;
  period: KpiTarget["period"];
  created_at: string;
};

type BusinessKpiRow = {
  id: string;
  business_id: string;
  department_id: string | null;
  kpi_key: string;
  name: string;
  description: string | null;
  measurement_type: BusinessKpi["measurementType"];
  unit: string | null;
  target_value: number | null;
  default_frequency: BusinessKpi["defaultFrequency"];
  evidence_requirements: unknown;
  ic_rule_links: unknown;
  score_factor_links: unknown;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type AssessmentResultRow = {
  id: string;
  business_id: string;
  veriscore: number;
  version: string;
  created_at: string;
};

type StaffInvitationRow = {
  id: string;
  business_id: string;
  department_id: string;
  email: string;
  role: StaffInvitation["role"];
  status: StaffInvitation["status"];
  invitation_token: string;
  accepted_at: string | null;
  created_at: string;
};

type BusinessUserRow = {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  department_id: string | null;
  status: BusinessUser["status"];
  created_at: string;
};

type IcScoreResultRow = {
  id: string;
  business_id: string;
  score: number;
  version: string;
  created_at: string;
};

type EvidenceFileRow = {
  id: string;
  business_id: string;
  report_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  storage_path: string | null;
  file_size: number;
  evidence_level: EvidenceFile["evidenceLevel"];
  verification_status: EvidenceFile["verificationStatus"];
  created_at: string;
};

export function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    legalName: row.legal_name,
    sector: row.sector,
    onboardingProgress: row.onboarding_progress,
    assessmentComplete: Boolean(row.assessment_complete),
    kpiSetupComplete: Boolean(row.kpi_setup_complete),
    currentVeriScore: row.current_veriscore,
    previousVeriScore: row.previous_veriscore ?? row.current_veriscore,
    currentIcScore: row.current_ic_score,
    previousIcScore: row.previous_ic_score ?? row.current_ic_score,
    evidenceCompletion: row.evidence_completion,
    lastActivityDaysAgo: getDaysAgo(row.last_activity_at),
    integrityReportReady: Boolean(row.integrity_report_ready)
  };
}

export function mapAnalyst(row: ProfileRow): Analyst {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email
  };
}

export function mapAssignment(row: AssignmentRow): AnalystAssignment {
  return {
    id: row.id,
    analystId: row.analyst_user_id,
    businessId: row.business_id,
    status: row.status
  };
}

export function mapControlException(row: ExceptionRow): ControlException {
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    riskLevel: row.risk_level,
    status: row.status,
    daysOpen: getDaysAgo(row.created_at)
  };
}

export function mapDepartmentReport(row: DepartmentReportRow): DepartmentReport {
  return {
    id: row.id,
    businessId: row.business_id,
    department: row.department,
    kpiKey: row.kpi_key ?? null,
    status: row.status,
    value: row.value,
    evidenceCount: row.evidence_count
  };
}

export function mapAnalystNote(row: AnalystNoteRow): AnalystNote {
  return {
    id: row.id,
    businessId: row.business_id,
    analystId: row.analyst_user_id,
    noteType: row.note_type,
    body: row.body,
    visibility: row.visibility,
    createdAt: row.created_at
  };
}

export function mapAnalystEscalation(row: AnalystEscalationRow): AnalystEscalation {
  return {
    id: row.id,
    businessId: row.business_id,
    analystId: row.analyst_user_id,
    escalatedTo: row.escalated_to,
    riskLevel: row.risk_level,
    reason: row.reason,
    status: row.status,
    daysOpen: getDaysAgo(row.created_at)
  };
}

export function mapCeoResponse(row: CeoResponseRow): CeoResponse {
  return {
    id: row.id,
    businessId: row.business_id,
    responseType: row.response_type,
    body: row.body,
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    createdAt: row.created_at
  };
}

export function mapInstitutionAccess(row: InstitutionAccessRow): InstitutionAccess {
  return {
    id: row.id,
    businessId: row.business_id,
    institutionName: row.institution_name,
    institutionEmail: row.institution_email,
    status: row.status,
    createdAt: row.created_at
  };
}

export function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    businessId: row.business_id,
    actorUserId: row.actor_user_id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at
  };
}

export function mapDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    departmentType: row.department_type,
    createdAt: row.created_at
  };
}

export function mapKpiTarget(row: KpiTargetRow): KpiTarget {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    targetValue: Number(row.target_value),
    unit: row.unit,
    period: row.period,
    createdAt: row.created_at
  };
}

export function mapBusinessKpi(row: BusinessKpiRow): BusinessKpi {
  return {
    id: row.id,
    businessId: row.business_id,
    departmentId: row.department_id,
    kpiKey: row.kpi_key,
    name: row.name,
    description: row.description,
    measurementType: row.measurement_type,
    unit: row.unit,
    targetValue: row.target_value === null ? null : Number(row.target_value),
    defaultFrequency: row.default_frequency,
    evidenceRequirements: toStringArray(row.evidence_requirements),
    icRuleLinks: toStringArray(row.ic_rule_links),
    scoreFactorLinks: toStringArray(row.score_factor_links),
    isDefault: row.is_default,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAssessmentResult(row: AssessmentResultRow): AssessmentResult {
  return {
    id: row.id,
    businessId: row.business_id,
    veriscore: row.veriscore,
    version: row.version,
    createdAt: row.created_at
  };
}

export function mapStaffInvitation(row: StaffInvitationRow): StaffInvitation {
  return {
    id: row.id,
    businessId: row.business_id,
    departmentId: row.department_id,
    email: row.email,
    role: row.role,
    status: row.status,
    invitationToken: row.invitation_token,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
}

export function mapBusinessUser(row: BusinessUserRow): BusinessUser {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    departmentId: row.department_id,
    status: row.status,
    createdAt: row.created_at
  };
}

export function mapIcScoreResult(row: IcScoreResultRow): IcScoreResult {
  return {
    id: row.id,
    businessId: row.business_id,
    score: row.score,
    version: row.version,
    createdAt: row.created_at
  };
}

export function mapEvidenceFile(row: EvidenceFileRow): EvidenceFile {
  return {
    id: row.id,
    businessId: row.business_id,
    reportId: row.report_id,
    uploadedBy: row.uploaded_by,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: Number(row.file_size),
    evidenceLevel: row.evidence_level,
    verificationStatus: row.verification_status,
    signedUrl: null,
    createdAt: row.created_at
  };
}

function getDaysAgo(value?: string | null) {
  if (!value) {
    return 0;
  }

  const then = new Date(value).getTime();
  const now = Date.now();

  if (Number.isNaN(then)) {
    return 0;
  }

  return Math.max(Math.floor((now - then) / 86_400_000), 0);
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
