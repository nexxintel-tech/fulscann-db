import { describe, expect, it } from "vitest";
import { runBusinessIcAutomation, runSalesFinanceAutomation } from "@/lib/ic-engine/automation";
import type { DepartmentReport, EvidenceFile } from "@/lib/types";

const baseReports: DepartmentReport[] = [
  {
    id: "sales_1",
    businessId: "biz_1",
    department: "sales",
    status: "submitted",
    value: 2_000_000,
    evidenceCount: 3
  },
  {
    id: "finance_1",
    businessId: "biz_1",
    department: "finance",
    status: "submitted",
    value: 1_200_000,
    evidenceCount: 2
  }
];

const baseEvidence: EvidenceFile[] = [
  {
    id: "ev_sales",
    businessId: "biz_1",
    reportId: "sales_1",
    uploadedBy: "user_1",
    fileName: "sales-invoices.pdf",
    fileType: "invoice",
    storagePath: "biz_1/sales_1/sales-invoices.pdf",
    fileSize: 100,
    evidenceLevel: 2,
    verificationStatus: "pending",
    signedUrl: null,
    createdAt: "2026-05-18T00:00:00.000Z"
  },
  {
    id: "ev_finance",
    businessId: "biz_1",
    reportId: "finance_1",
    uploadedBy: "user_1",
    fileName: "bank-statement.pdf",
    fileType: "bank_statement",
    storagePath: "biz_1/finance_1/bank-statement.pdf",
    fileSize: 100,
    evidenceLevel: 2,
    verificationStatus: "pending",
    signedUrl: null,
    createdAt: "2026-05-18T00:00:00.000Z"
  }
];

describe("IC automation", () => {
  it("creates a high-risk sales-finance mismatch result", () => {
    const result = runSalesFinanceAutomation({
      reports: baseReports,
      existingExceptions: [],
      evidenceCompletion: 70
    });

    expect(result?.shouldCreateException).toBe(true);
    expect(result?.exception?.title).toBe("Sales-finance mismatch");
    expect(result?.exception?.riskLevel).toBe("Red");
    expect(result?.icScore).toBeLessThan(70);
  });

  it("does not create a duplicate open mismatch exception", () => {
    const result = runSalesFinanceAutomation({
      reports: baseReports,
      existingExceptions: [
        {
          id: "exc_1",
          businessId: "biz_1",
          title: "Sales-finance mismatch",
          riskLevel: "Red",
          status: "open",
          daysOpen: 1
        }
      ],
      evidenceCompletion: 70
    });

    expect(result?.shouldCreateException).toBe(false);
    expect(result?.exception?.title).toBe("Sales-finance mismatch");
  });

  it("waits until both sales and finance reports exist", () => {
    const result = runSalesFinanceAutomation({
      reports: [baseReports[0]],
      existingExceptions: [],
      evidenceCompletion: 70
    });

    expect(result).toBeNull();
  });

  it("uses evidence levels when evidence files are provided", () => {
    const result = runSalesFinanceAutomation({
      reports: [
        { ...baseReports[0], value: 1_000_000 },
        { ...baseReports[1], value: 980_000 }
      ],
      existingExceptions: [],
      evidenceCompletion: 90,
      evidenceFiles: [
        {
          id: "ev_low",
          businessId: "biz_1",
          reportId: "sales_1",
          uploadedBy: "user_1",
          fileName: "claim.txt",
          fileType: "claim",
          storagePath: "biz_1/sales_1/claim.txt",
          fileSize: 8,
          evidenceLevel: 0,
          verificationStatus: "pending",
          signedUrl: null,
          createdAt: "2026-05-18T00:00:00.000Z"
        }
      ]
    });

    expect(result?.matched).toBe(true);
    expect(result?.icScore).toBeLessThan(80);
  });

  it("runs a business-level IC automation with rule results and exception candidates", () => {
    const result = runBusinessIcAutomation({
      reports: [
        ...baseReports,
        {
          id: "procurement_1",
          businessId: "biz_1",
          department: "procurement",
          status: "submitted",
          value: 500_000,
          evidenceCount: 0
        }
      ],
      existingExceptions: [],
      evidenceCompletion: 70,
      evidenceFiles: baseEvidence
    });

    expect(result.checks.length).toBeGreaterThan(4);
    expect(result.newExceptionCandidates.map((exception) => exception.title)).toContain("Sales-finance mismatch");
    expect(result.newExceptionCandidates.map((exception) => exception.title)).toContain("Procurement evidence missing");
    expect(result.newExceptionCandidates.map((exception) => exception.title)).toContain("Procurement approval gap");
    expect(result.icScore).toBeLessThan(75);
  });

  it("does not return duplicate open exception candidates", () => {
    const result = runBusinessIcAutomation({
      reports: baseReports,
      existingExceptions: [
        {
          id: "exc_1",
          businessId: "biz_1",
          title: "Sales-finance mismatch",
          riskLevel: "Red",
          status: "open",
          daysOpen: 1
        }
      ],
      evidenceCompletion: 70,
      evidenceFiles: baseEvidence
    });

    expect(result.exceptionCandidates.map((exception) => exception.title)).toContain("Sales-finance mismatch");
    expect(result.newExceptionCandidates.map((exception) => exception.title)).not.toContain("Sales-finance mismatch");
  });
});
