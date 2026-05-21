import type { ControlException, DepartmentReport, EvidenceFile } from "@/lib/types";

export type IcWorkbenchScenarioId = "balanced" | "mismatch" | "procurement_gap" | "missing_finance";

export type IcWorkbenchScenario = {
  id: IcWorkbenchScenarioId;
  name: string;
  description: string;
  reports: DepartmentReport[];
  evidenceFiles: EvidenceFile[];
  existingExceptions: ControlException[];
  evidenceCompletion: number;
};

const baseDate = "2026-05-18T00:00:00.000Z";

export const IC_WORKBENCH_SCENARIOS: IcWorkbenchScenario[] = [
  {
    id: "balanced",
    name: "Balanced controls",
    description: "Sales and finance align, evidence is adequate, and procurement approval is evidenced.",
    reports: [
      report("sales_1", "sales", 1_000_000, 3),
      report("finance_1", "finance", 980_000, 2),
      report("procurement_1", "procurement", 250_000, 1)
    ],
    evidenceFiles: [
      evidence("ev_sales", "sales_1", "invoice", 2),
      evidence("ev_finance", "finance_1", "bank_statement", 2),
      evidence("ev_procurement", "procurement_1", "approval_memo", 2)
    ],
    existingExceptions: [],
    evidenceCompletion: 85
  },
  {
    id: "mismatch",
    name: "Sales-finance mismatch",
    description: "Sales substantially exceeds finance inflow and should produce a high-risk exception.",
    reports: [
      report("sales_1", "sales", 2_000_000, 2),
      report("finance_1", "finance", 1_200_000, 1)
    ],
    evidenceFiles: [
      evidence("ev_sales", "sales_1", "invoice", 1),
      evidence("ev_finance", "finance_1", "bank_statement", 2)
    ],
    existingExceptions: [],
    evidenceCompletion: 60
  },
  {
    id: "procurement_gap",
    name: "Procurement approval gap",
    description: "Procurement activity exists without approval evidence.",
    reports: [
      report("sales_1", "sales", 1_000_000, 2),
      report("finance_1", "finance", 960_000, 2),
      report("procurement_1", "procurement", 500_000, 0)
    ],
    evidenceFiles: [
      evidence("ev_sales", "sales_1", "invoice", 2),
      evidence("ev_finance", "finance_1", "bank_statement", 2)
    ],
    existingExceptions: [],
    evidenceCompletion: 62
  },
  {
    id: "missing_finance",
    name: "Missing finance report",
    description: "Sales is present but finance reporting is missing, weakening readiness.",
    reports: [report("sales_1", "sales", 1_000_000, 1)],
    evidenceFiles: [evidence("ev_sales", "sales_1", "invoice", 1)],
    existingExceptions: [],
    evidenceCompletion: 35
  }
];

export function getIcWorkbenchScenario(id: string | undefined) {
  return IC_WORKBENCH_SCENARIOS.find((scenario) => scenario.id === id) ?? IC_WORKBENCH_SCENARIOS[1];
}

function report(
  id: string,
  department: DepartmentReport["department"],
  value: number,
  evidenceCount: number
): DepartmentReport {
  return {
    id,
    businessId: "biz_demo",
    department,
    status: "submitted",
    value,
    evidenceCount
  };
}

function evidence(id: string, reportId: string, fileType: string, evidenceLevel: EvidenceFile["evidenceLevel"]): EvidenceFile {
  return {
    id,
    businessId: "biz_demo",
    reportId,
    uploadedBy: "usr_demo",
    fileName: `${fileType}.pdf`,
    fileType,
    storagePath: `biz_demo/${reportId}/${fileType}.pdf`,
    fileSize: 100,
    evidenceLevel,
    verificationStatus: "pending",
    signedUrl: null,
    createdAt: baseDate
  };
}
