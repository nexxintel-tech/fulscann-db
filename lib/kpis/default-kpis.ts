import type { BusinessKpi, Department } from "@/lib/types";

export type DefaultBusinessKpi = {
  key: string;
  name: string;
  description: string;
  departmentSlug: Department["departmentType"];
  measurementType: "currency" | "percentage";
  unit: "NGN" | "%";
  defaultFrequency: "monthly" | "quarterly" | "annual";
  evidenceRequirements: string[];
  icRuleLinks: string[];
  scoreFactorLinks: string[];
  isDefault: true;
  isActive: true;
};

export const DEFAULT_SALES_KPIS: DefaultBusinessKpi[] = [
  {
    key: "monthly_sales_value",
    name: "Monthly Sales Value",
    description: "Total reported sales for the period.",
    departmentSlug: "sales",
    measurementType: "currency",
    unit: "NGN",
    defaultFrequency: "monthly",
    evidenceRequirements: ["sales report", "invoices", "customer/order records"],
    icRuleLinks: ["sales_report_present", "sales_evidence_quality"],
    scoreFactorLinks: ["reporting_completeness", "evidence_quality"],
    isDefault: true,
    isActive: true
  },
  {
    key: "sales_target_achievement",
    name: "Sales Target Achievement",
    description: "Actual sales compared with the CEO sales target.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["CEO sales target", "sales report"],
    icRuleLinks: ["sales_report_present"],
    scoreFactorLinks: ["performance_alignment"],
    isDefault: true,
    isActive: true
  },
  {
    key: "invoice_completion_rate",
    name: "Invoice Completion Rate",
    description: "Sales records supported by valid invoices.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["uploaded invoices"],
    icRuleLinks: ["sales_evidence_quality", "invoice_evidence_required"],
    scoreFactorLinks: ["evidence_quality"],
    isDefault: true,
    isActive: true
  },
  {
    key: "sales_to_finance_match_rate",
    name: "Sales-to-Finance Match Rate",
    description: "Sales confirmed by finance inflow.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["sales report", "invoices", "finance inflow report", "bank/payment evidence"],
    icRuleLinks: ["sales_finance_mismatch"],
    scoreFactorLinks: ["financial_alignment", "cross_department_consistency"],
    isDefault: true,
    isActive: true
  },
  {
    key: "sales_to_inventory_match_rate",
    name: "Sales-to-Inventory Match Rate",
    description: "Sales supported by stock or service delivery evidence.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["invoices", "inventory movement record", "delivery/service completion evidence"],
    icRuleLinks: ["inventory_evidence_validation"],
    scoreFactorLinks: ["operational_consistency", "evidence_quality"],
    isDefault: true,
    isActive: true
  },
  {
    key: "customer_traceability_rate",
    name: "Customer Traceability Rate",
    description: "Sales linked to identifiable customers.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["customer name/code", "order reference", "invoice/customer record"],
    icRuleLinks: ["sales_record_traceability"],
    scoreFactorLinks: ["documentation_quality"],
    isDefault: true,
    isActive: true
  },
  {
    key: "revenue_collection_rate",
    name: "Revenue Collection Rate",
    description: "Paid sales compared with total sales.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["payment receipts", "finance inflow confirmation", "bank/payment records"],
    icRuleLinks: ["sales_finance_mismatch", "finance_inflow_confirmation"],
    scoreFactorLinks: ["financial_alignment"],
    isDefault: true,
    isActive: true
  },
  {
    key: "outstanding_receivables",
    name: "Outstanding Receivables",
    description: "Sales not yet paid.",
    departmentSlug: "sales",
    measurementType: "currency",
    unit: "NGN",
    defaultFrequency: "monthly",
    evidenceRequirements: ["unpaid invoice list", "customer receivable records"],
    icRuleLinks: ["receivables_monitoring"],
    scoreFactorLinks: ["financial_discipline"],
    isDefault: true,
    isActive: true
  },
  {
    key: "sales_exception_rate",
    name: "Sales Exception Rate",
    description: "Sales records flagged by IC.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["IC exception records linked to sales"],
    icRuleLinks: ["sales_exception_count"],
    scoreFactorLinks: ["anomaly_rate", "control_exception_behavior"],
    isDefault: true,
    isActive: true
  },
  {
    key: "repeat_customer_rate",
    name: "Repeat Customer Rate",
    description: "Repeat customers within the reporting period.",
    departmentSlug: "sales",
    measurementType: "percentage",
    unit: "%",
    defaultFrequency: "monthly",
    evidenceRequirements: ["customer records", "repeat sales history"],
    icRuleLinks: ["customer_traceability_check"],
    scoreFactorLinks: ["customer_consistency"],
    isDefault: true,
    isActive: true
  }
];

export function getDefaultKpisForDepartment(departmentSlug: Department["departmentType"]) {
  if (departmentSlug === "sales") {
    return DEFAULT_SALES_KPIS;
  }

  return [];
}

export function getDefaultKpiByKey(kpiKey: string) {
  return DEFAULT_SALES_KPIS.find((kpi) => kpi.key === kpiKey) ?? null;
}

export function getSelectableDefaultKpis(input: {
  departmentSlug: Department["departmentType"];
  existingKpiKeys: Iterable<string>;
}) {
  const existingKpiKeys = new Set(input.existingKpiKeys);

  return getDefaultKpisForDepartment(input.departmentSlug).filter((kpi) => !existingKpiKeys.has(kpi.key));
}

export function buildDefaultBusinessKpis(input: {
  businessId: string;
  departmentId: string;
  departmentSlug: Department["departmentType"];
  createdBy?: string | null;
}) {
  return getDefaultKpisForDepartment(input.departmentSlug).map((kpi) => ({
    business_id: input.businessId,
    department_id: input.departmentId,
    kpi_key: kpi.key,
    name: kpi.name,
    description: kpi.description,
    measurement_type: kpi.measurementType,
    unit: kpi.unit,
    default_frequency: kpi.defaultFrequency,
    evidence_requirements: kpi.evidenceRequirements,
    ic_rule_links: kpi.icRuleLinks,
    score_factor_links: kpi.scoreFactorLinks,
    is_default: kpi.isDefault,
    is_active: kpi.isActive,
    created_by: input.createdBy ?? null
  }));
}

export function getMissingDefaultBusinessKpis(input: {
  existingKpis: BusinessKpi[];
  businessId: string;
  departmentId: string;
  departmentSlug: Department["departmentType"];
}) {
  const existingKeys = new Set(
    input.existingKpis
      .filter((kpi) => kpi.businessId === input.businessId && kpi.departmentId === input.departmentId)
      .map((kpi) => kpi.kpiKey)
  );

  return getDefaultKpisForDepartment(input.departmentSlug).filter((kpi) => !existingKeys.has(kpi.key));
}
